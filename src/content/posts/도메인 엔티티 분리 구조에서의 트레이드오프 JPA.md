---
title: "도메인 엔티티 분리 구조에서의 트레이드오프 : JPA"
description: "도메인과 엔티티를 분리했을 때 JPA 에서의 트레이드오프는 무엇이 있을까?"
date: 2025-06-01
tags: []
category: uncategorized
lang: ko
draft: false
---

![](/images/velog/763f1c6b49bfe746.png)


# Why? 왜 배움?

---

최근에 사내에 코드 아키텍처를 새로 도입하였다.

해당 아키텍쳐에서는 도메인과 영속성 계층 클래스를 분리해서 사용하게끔 되어있다.

이 구조의 특징 중 하나는 분산 시스템과 코드 간의 의존성을 분리할 수 있다는 것이다.

이 덕분에 분산 시스템과 로직을 분리할 수 있게된다.

이것이 장점이자 단점이 될 수 있다는 것인데, 바로 계층 간의 컨텍스트 분리가 일어난다는 것이다.

특히 `JPA 에서는 영속성 컨텍스트가 분리될 수 있는 거 아니야?` 라는 합리적인 의심을 할 수 있게 된다.

이러한 의심을 해소하고자 아래 내용들을 공부해보았다.

# What? 뭘 배움?

---

## JPA 의 엔티티 저장

Jpa 의 save() 는 새로운 객체인지 아닌지를 판별하여 — isNew() == true 인지 — 영속화를 처리한다.

만약 새로운 객체라면 persist 를 통해 비영속 상태를 영속 상태로 만들고

만약 기존 준영속 객체라면 merge 를 통해 준영속 상태를 영속 상태로 만든다.

```java
@Repository
@Transactional(readOnly = true)
public class SimpleJpaRepository<T, ID> implements JpaRepositoryImplementation<T, ID> {
    @Transactional
    @Override
    public <S extends T> S save(S entity) {

        Assert.notNull(entity, "Entity must not be null.");

        if (entityInformation.isNew(entity)) {
            em.persist(entity);
            return entity;
        } else {
            return em.merge(entity);
        }
    }
}
```

그렇다면 isNew() 는 어떤 흐름으로 처리될까?

## JPA 는 어떻게 새로운 객체인지 아닌지 구분할 수 있을까?

> 
> ☝
> 
> **TL;DR;**
> 
> 요컨데 JPA 에서는 새로운 객체 판별을 아래와 같이 처리할 수 있다.
> 
> 본인의 상황에 따라 (엔티티 생성/수정 전략) 알맞게 사용하자
> 
> 1. **Version-Property와 Id-Property 검사 (디폴트값)**:
>     - Version-property가 있는지 검사
>     - 만약 Version-property가 있고 그 값이 null이라면, 해당 엔티티는 새로운 것으로 간주
>     - 만약 Version-property가 없다면, 엔티티의 식별자(Id-property)를 검사하여 그 값이 null이면 새로운 엔티티로 간주하고, 그렇지 않으면 기존 엔티티로 간주
> 2. **Persistable 인터페이스 구현**:
>     - 엔티티가 `Persistable` 인터페이스를 구현
>     - Spring Data JPA는 엔티티가 새로운지 아닌지 감지하는 작업을 `isNew(…)` 메서드에 위임
> 3. **EntityInformation 구현**:
>     - `EntityInformation` 추상화를 사용자 정의
>     - `JpaRepositoryFactory`의 서브 클래스를 생성하고 `getEntityInformation(…)` 메서드를 오버라이드하는 방식으로 구현 가능
>     - 커스텀한 `JpaRepositoryFactory`를 Spring 빈으로 등록
>     - 이 방법은 일반적으로 거의 사용되지 않음

먼저 `entityInformation.isNew(entity)` 에서의 `entityInformation` 가 무슨 클래스인지를 살펴보아야한다.

EntityInformation 는 SimpleJpaRepository 가 생성될 때 주입되는데, 이 때 도메인 엔티티의 상태에 따라 다른 구현체가 주입된다.

아래 두 가지 케이스로 나뉘어 처리되는 것을 알 수 있다.

![](/images/velog/8f23c81554c96b57.png)

```java
if (Persistable.class.isAssignableFrom(domainClass)) {
	return new JpaPersistableEntityInformation(domainClass, metamodel, persistenceUnitUtil);
} else {
	return new JpaMetamodelEntityInformation(domainClass, metamodel, persistenceUnitUtil);
}
```

Persistable 는 무엇이고 그에 대한 구현여부를 왜 따지는 걸까?

Persistable 은 새로운 객체인지를 판별하는 isNew() 를 override 할 수 있도록 도와주는 Wrapper Interface 이다.

따라서 아래와 같이 경우의 수가 나뉘어지는 것이다.

- 도메인 엔티티가 Persistable 를 구현 O
    - JpaPersistableEntityInformation 의 isNew() 호출
- 도메인 엔티티가 Persistable 를 구현 X
    - JpaMetamodelEntityInformation 의 isNew() 호출

그렇다면 각각의 클래스는 isNew() 를 어떻게 구현하고 있을까?

![](/images/velog/20f0dcd1759b59c0.png)

### JpaPersistableEntityInformation

- Persistable 의 추상클래스 구현체(AbstractPersistable) 에게 위임
    - id 가 null O → 새로운 객체
    - id 가 null X → 이미 있는 객체

```java
/**
 * Extension of {@link JpaMetamodelEntityInformation} that consideres methods of {@link Persistable} to lookup the id.
 *
 * @author Oliver Gierke
 * @author Christoph Strobl
 * @author Mark Paluch
 */
public class JpaPersistableEntityInformation<T extends Persistable<ID>, ID>
		extends JpaMetamodelEntityInformation<T, ID> {
	,,,
	@Override
	public boolean isNew(T entity) {
		return entity.isNew();
	}
}

/**
 * Abstract base class for entities. Allows parameterization of id type, chooses auto-generation and implements
 * {@link #equals(Object)} and {@link #hashCode()} based on that id.
 *
 * @author Oliver Gierke
 * @author Thomas Darimont
 * @author Mark Paluch
 * @author Greg Turnquist
 * @author Ngoc Nhan
 * @param <PK> the type of the identifier.
 */
@MappedSuperclass
public abstract class AbstractPersistable<PK extends Serializable> implements Persistable<PK> {

	@Id @GeneratedValue private @Nullable PK id;

	@Nullable
	@Override
	public PK getId() {
		return id;
	}

	/**
	 * Sets the id of the entity.
	 *
	 * @param id the id to set
	 */
	protected void setId(@Nullable PK id) {
		this.id = id;
	}

	/**
	 * Must be {@link Transient} in order to ensure that no JPA provider complains because of a missing setter.
	 *
	 * @see org.springframework.data.domain.Persistable#isNew()
	 */
	@Transient // DATAJPA-622
	@Override
	public boolean isNew() {
		return null == getId();
	}
}
```

### JpaMetamodelEntityInformation

1. 버저닝 필드에 대한 검증을 시도한다.
    - 만약 Version-property가 있고 그 값이 null이라면, 해당 엔티티는 새로운 것으로 간주
    - 만약 Version-property가 없다면, 엔티티의 식별자(Id-property)를 검사하여 그 값이 null이면 새로운 엔티티로 간주하고, 그렇지 않으면 기존 엔티티로 간주
2. 만약 버저닝에서 검증이 성공했다면 super.isNew() 를 호출하여 `AbstractEntityInformation` 클래스의 isNew() 를 호출한다.
    
    `AbstractEntityInformation.isNew()` 는 아래와 같은 케이스에 따라 새로운 객체인지를 판단한다.
    
    - `Id`의 타입이 `Object` 타입이고 `null` → 새로운 객체 !
    - `Id`의 타입이 `Primitive` 타입이고 `0` → 새로운 객체 !
    
    <span style="color:grey">// `Id` 의 타입이 `Primitive` 가 아니라면 예외 발생.</span>
    

```java
/**
 * Implementation of {@link org.springframework.data.repository.core.EntityInformation} that uses JPA {@link Metamodel}
 * to find the domain class' id field.
 *
 * @author Oliver Gierke
 * @author Thomas Darimont
 * @author Christoph Strobl
 * @author Mark Paluch
 * @author Jens Schauder
 * @author Greg Turnquist
 */
public class JpaMetamodelEntityInformation<T, ID> extends JpaEntityInformationSupport<T, ID> {

	private final Optional<SingularAttribute<? super T, ?>> versionAttribute;
	,,,
	
	@Override
	public boolean isNew(T entity) {

		if (versionAttribute.isEmpty()
				|| versionAttribute.map(Attribute::getJavaType).map(Class::isPrimitive).orElse(false)) {
			return super.isNew(entity);
		}

		BeanWrapper wrapper = new DirectFieldAccessFallbackBeanWrapper(entity);

		return versionAttribute.map(it -> wrapper.getPropertyValue(it.getName()) == null).orElse(true);
	}
}

/**
 * Base class for implementations of {@link EntityInformation}. Considers an entity to be new whenever
 * {@link #getId(Object)} returns {@literal null} or the identifier is a {@link Class#isPrimitive() Java primitive} and
 * {@link #getId(Object)} returns zero.
 *
 * @author Oliver Gierke
 * @author Nick Williams
 * @author Mark Paluch
 * @author Johannes Englmeier
 */
public abstract class AbstractEntityInformation<T, ID> implements EntityInformation<T, ID> {

	,,,

	@Override
	public boolean isNew(T entity) {

		ID id = getId(entity);
		Class<ID> idType = getIdType();

		if (!idType.isPrimitive()) {
			return id == null;
		}

		if (id instanceof Number n) {
			return n.longValue() == 0L;
		}

		throw new IllegalArgumentException(String.format("Unsupported primitive id type %s", idType));
	}
}
```

## 어떻게 merge() 가 처리되는가?

> ☝
> 
> TL;DR;
> 
> `EntityManager` 의 `merge()` 는 Event-Driven 구조를 통해 아래와 같이 처리된다.
> 
> 1. 세션 검증 및 MergeEvent 발행
> 2. 중복 병합 방지
> 3. 식별자를 통해 영속성 컨텍스트 내 존재 여부 검증
> 4. 영속상태에 따라 영속화 진행

새로운 객체가 아니라면 비영속, 준영속 상태의 객체를 영속 상태로 처리하기 위해 

EntityManager 의 merge() 를 호출한다.

이 때 EntityManager 의 자식 인터페이스인 Session 을 호출하게 되고, 

그에 대한 구현체 SessionImpl 이 호출된다.

```java
public interface Session extends SharedSessionContract, EntityManager {

	/**
	 * Copy the state of the given object onto the persistent object with the same
	 * identifier. If there is no persistent instance currently associated with
	 * the session, it will be loaded. Return the persistent instance. If the
	 * given instance is unsaved, save a copy and return it as a newly persistent
	 * instance. The given instance does not become associated with the session.
	 * This operation cascades to associated instances if the association is mapped
	 * with {@link jakarta.persistence.CascadeType#MERGE}.
	 *
	 * @param object a detached instance with state to be copied
	 *
	 * @return an updated persistent instance
	 */
	<T> T merge(T object);
}
```

```java

public class SessionImpl
		extends AbstractSharedSessionContract
		implements Serializable, SharedSessionContractImplementor, JdbcSessionOwner, SessionImplementor, EventSource,
				TransactionCoordinatorBuilder.Options, WrapperOptions, LoadAccessContext {
				
	,,,
	@Override @SuppressWarnings("unchecked")
	public <T> T merge(T object) throws HibernateException {
		checkOpen();
		return (T) fireMerge( new MergeEvent( null, object, this ));
	}
}
```


### 세션 검증 및 MergeEvent 발행 ( SessionImpl.merge() )

SessionImpl 클래스에서는 세션이 열려있는지 확인하고, MergeEvent 를 발행한다.

```java
@Override @SuppressWarnings("unchecked")
public <T> T merge(T object) throws HibernateException {
	checkOpen();
	return (T) fireMerge( new MergeEvent( null, object, this ));
}

private Object fireMerge(MergeEvent event) {
	try {
		checkTransactionSynchStatus();
		checkNoUnresolvedActionsBeforeOperation();
		fastSessionServices.eventListenerGroup_MERGE
				.fireEventOnEachListener( event, MergeEventListener::onMerge );
		checkNoUnresolvedActionsAfterOperation();
	}
	catch ( ObjectDeletedException sse ) {
		throw getExceptionConverter().convert( new IllegalArgumentException( sse ) );
	}
	catch ( MappingException e ) {
		throw getExceptionConverter().convert( new IllegalArgumentException( e.getMessage(), e ) );
	}
	catch ( RuntimeException e ) {
		//including HibernateException
		throw getExceptionConverter().convert( e );
	}

	return event.getResult();
}
```

### MergeEvent 수신 ( DefaultMergeEventListener.onMerge() )

프록시 체크 (onMerge 단계)

- Hibernate 프록시인지, 바이트코드 향상(Enhancement)으로 인한 프록시인지 판정
- 초기화되지 않은 경우, 간단히 `session.load()`로 실제 엔티티를 로드해서 반환
- 초기화된 경우, 프록시 내부의 실제 엔티티를 꺼내 `doMerge()`로 넘김

```java
	/**
	 * Handle the given merge event.
	 *
	 * @param event The merge event to be handled.
	 *
	 */
	@Override
	public void onMerge(MergeEvent event, MergeContext copiedAlready) throws HibernateException {
		final Object original = event.getOriginal();
		// NOTE : `original` is the value being merged
		if ( original != null ) {
			final EventSource source = event.getSession();
			final LazyInitializer lazyInitializer = HibernateProxy.extractLazyInitializer( original );
			if ( lazyInitializer != null ) {
				if ( lazyInitializer.isUninitialized() ) {
					LOG.trace( "Ignoring uninitialized proxy" );
					event.setResult( source.load( lazyInitializer.getEntityName(), lazyInitializer.getInternalIdentifier() ) );
				}
				else {
					doMerge( event, copiedAlready, lazyInitializer.getImplementation() );
				}
			}
			else if ( isPersistentAttributeInterceptable( original ) ) {
				final PersistentAttributeInterceptor interceptor = asPersistentAttributeInterceptable( original ).$$_hibernate_getInterceptor();
				if ( interceptor instanceof EnhancementAsProxyLazinessInterceptor ) {
					final EnhancementAsProxyLazinessInterceptor proxyInterceptor = (EnhancementAsProxyLazinessInterceptor) interceptor;
					LOG.trace( "Ignoring uninitialized enhanced-proxy" );
					event.setResult( source.load( proxyInterceptor.getEntityName(), proxyInterceptor.getIdentifier() ) );
				}
				else {
					doMerge( event, copiedAlready, original );
				}
			}
			else {
				doMerge( event, copiedAlready, original );
			}
		}
	}
```

### 중복 병합 방지  ( DefaultMergeEventListener.doMerge() )

- 이미 병합 처리 중인 엔티티인지 검사
- 캐시에만 존재하고 아직 병합 플래그가 설정되지 않았다면 플래그 설정
- `event.setEntity()` 후 실제 병합 로직(`merge()`) 호출

```java
	private void doMerge(MergeEvent event, MergeContext copiedAlready, Object entity) {
		if ( copiedAlready.containsKey( entity ) && copiedAlready.isOperatedOn( entity ) ) {
			LOG.trace( "Already in merge process" );
			event.setResult( entity );
		}
		else {
			if ( copiedAlready.containsKey( entity ) ) {
				LOG.trace( "Already in copyCache; setting in merge process" );
				copiedAlready.setOperatedOn( entity, true );
			}
			event.setEntity( entity );
			merge( event, copiedAlready, entity );
		}
	}
```

### 식별자를 통해 영 속속성 검증 및 영속 상태에 따라 영속화 진행 ( DefaultMergeEventListener.merge() )

- 영속성 컨텍스트에서 해당 엔티티를 관리 중인지 검사하기 위해 `EntityEntry`를 가져옴
- 식별자를 통해 “영속성 컨텍스트 내 존재 여부”를 판단
    - 없으면: 새로 식별자를 획득하고, 동일 식별자를 가진 관리 객체가 있는지 확인하여 DETACHED/TRANSIENT 판정
    - 있으면: 이미 `PERSISTENT` 상태로 판정
- `getEntityState(...)` 결과(DETACHED, TRANSIENT, PERSISTENT, DELETED)에 따라 각기 다른 처리 메서드로 분기
    - `DETACHED` → 기존 DB 레코드와 비교해 “값 복사” 후 새로운 관리 엔티티로 등록
    - `TRANSIENT` → 단순히 `persist()` 호출
    - `PERSISTENT` → 이미 세션에 있으므로 특별한 동기화 없이 반환
    - `DELETED` → 삭제 예약 해제 및 DETACHED 로직 혹은 예외 처리

```java
	private void merge(MergeEvent event, MergeContext copiedAlready, Object entity) {
		final EventSource source = event.getSession();
		// Check the persistence context for an entry relating to this
		// entity to be merged...
		final PersistenceContext persistenceContext = source.getPersistenceContextInternal();
		EntityEntry entry = persistenceContext.getEntry( entity );
		final EntityState entityState;
		final Object copiedId;
		final Object originalId;
		if ( entry == null ) {
			final EntityPersister persister = source.getEntityPersister( event.getEntityName(), entity );
			originalId = persister.getIdentifier( entity, copiedAlready );
			if ( originalId != null ) {
				final EntityKey entityKey;
				if ( persister.getIdentifierType() instanceof ComponentType ) {
					/*
					this is needed in case of composite id containing an association with a generated identifier, in such a case
					generating the EntityKey will cause a NPE when trying to get the hashcode of the null id
					 */
					copiedId = copyCompositeTypeId(
							originalId,
							(ComponentType) persister.getIdentifierType(),
							source,
							copiedAlready
					);
					entityKey = source.generateEntityKey( copiedId, persister );
				}
				else {
					copiedId = null;
					entityKey = source.generateEntityKey( originalId, persister );
				}
				final Object managedEntity = persistenceContext.getEntity( entityKey );
				entry = persistenceContext.getEntry( managedEntity );
				if ( entry != null ) {
					// we have a special case of a detached entity from the
					// perspective of the merge operation. Specifically, we have
					// an incoming entity instance which has a corresponding
					// entry in the current persistence context, but registered
					// under a different entity instance
					entityState = EntityState.DETACHED;
				}
				else {
					entityState = getEntityState( entity, event.getEntityName(), entry, source, false );
				}
			}
			else {
				copiedId = null;
				entityState = getEntityState( entity, event.getEntityName(), entry, source, false );
			}
		}
		else {
			copiedId = null;
			originalId = null;
			entityState = getEntityState( entity, event.getEntityName(), entry, source, false );
		}

		switch ( entityState ) {
			case DETACHED:
				entityIsDetached( event, copiedId, originalId, copiedAlready );
				break;
			case TRANSIENT:
				entityIsTransient( event, copiedId != null ? copiedId : originalId, copiedAlready );
				break;
			case PERSISTENT:
				entityIsPersistent( event, copiedAlready );
				break;
			default: //DELETED
				if ( persistenceContext.getEntry( entity ) == null ) {
					assert persistenceContext.containsDeletedUnloadedEntityKey(
							source.generateEntityKey(
									source.getEntityPersister( event.getEntityName(), entity )
											.getIdentifier( entity, event.getSession() ),
									source.getEntityPersister( event.getEntityName(), entity )
							)
					);
					source.getActionQueue().unScheduleUnloadedDeletion( entity );
					entityIsDetached(event, copiedId, originalId, copiedAlready);
					break;
				}
				throw new ObjectDeletedException(
						"deleted instance passed to merge",
						null,
						EventUtil.getLoggableName( event.getEntityName(), entity)
				);
		}
	}
```

여기까지 save() 호출 시 발생하는 과정에 대해 다뤄보았다.

이제 실제로 어떤 점이 내 코드 구조에 있어서 문제가 되는지를 살펴보자.

## DETACHED 상태는 SELECT 가 한 번 나간다

준영속 상태인 친구는 영속 컨텍스트에 캐싱되어있는 객체를 가져온다.

하지만 비영속 상태, DETACHED 되었을 때는 어떻게 할까?

아래와 같이 처리하게 된다.

- 먼저 영속성 컨텍스트(1차 캐시)를 조회
- 캐시에 없으면 SELECT를 실행
- SELECT 결과가 없을 땐 stale/transient 여부를 판정하여 예외 혹은 새로 저장 처리

실제로 아래와 같이 처리된다.

- 분리된(detached) 엔티티가 병합 요청을 받으면
    - `originalId`와 `copiedId`(필요 시)를 구해서, DB 조회에 사용할 수 있는 “복사된 식별자(clonedIdentifier)”를 준비
- DB에서 동일 ID의 엔티티가 존재하는지 확인(`source.get(…)`)
    - 존재하지 않으면
        - 해당 객체가 실제로 DB에 저장된 적이 있는지(`isTransient`)를 검사
        - 이미 DB에 있다가 삭제된 경우 → `StaleObjectStateException` 예외
        - 아예 새로운 객체(transient)라면 → `entityIsTransient` 호출하여 새로 저장
    - 존재하면(result != null)
        - “분리된 엔티티 → 세션에서 로드된 엔티티” 매핑을 `copyCache` 에 기록
        - 연관 엔티티를 cascade 처리하여 미리 병합
        - 실제 속성 값을 “세션 관리 대상 엔티티(result)”에 복사
        - 복사된 엔티티를 더티(Dirty) 상태로 표시
        - `event.setResult(result)`로 병합 결과 반환

```java
switch ( entityState ) {
		case DETACHED:
			entityIsDetached( event, copiedId, originalId, copiedAlready );
			break;
		,,,
}
```

```java
protected void entityIsDetached(MergeEvent event, Object copiedId, Object originalId, MergeContext copyCache) {
		LOG.trace( "Merging detached instance" );

		final Object entity = event.getEntity();
		final EventSource source = event.getSession();
		final EntityPersister persister = source.getEntityPersister( event.getEntityName(), entity );
		final String entityName = persister.getEntityName();
		if ( originalId == null ) {
			originalId = persister.getIdentifier( entity, source );
		}
		final Object clonedIdentifier;
		if ( copiedId == null ) {
			clonedIdentifier = persister.getIdentifierType().deepCopy( originalId, event.getFactory() );
		}
		else {
			clonedIdentifier = copiedId;
		}
		final Object id = getDetachedEntityId( event, originalId, persister );
		// we must clone embedded composite identifiers, or we will get back the same instance that we pass in
		// apply the special MERGE fetch profile and perform the resolution (Session#get)
		final Object result = source.getLoadQueryInfluencers().fromInternalFetchProfile(
				CascadingFetchProfile.MERGE,
				() -> source.get( entityName, clonedIdentifier )
		);

		if ( result == null ) {
			LOG.trace( "Detached instance not found in database" );
			// we got here because we assumed that an instance
			// with an assigned id and no version was detached,
			// when it was really transient (or deleted)
			final Boolean knownTransient = persister.isTransient( entity, source );
			if ( knownTransient == Boolean.FALSE ) {
				// we know for sure it's detached (generated id
				// or a version property), and so the instance
				// must have been deleted by another transaction
				throw new StaleObjectStateException( entityName, id );
			}
			else {
				// we know for sure it's transient, or we just
				// don't have information (assigned id and no
				// version property) so keep assuming transient
				entityIsTransient( event, clonedIdentifier, copyCache );
			}
		}
		else {
			// before cascade!
			copyCache.put( entity, result, true );
			final Object target = targetEntity( event, entity, persister, id, result );
			// cascade first, so that all unsaved objects get their
			// copy created before we actually copy
			cascadeOnMerge( source, persister, entity, copyCache );
			copyValues( persister, entity, target, source, copyCache );
			//copyValues works by reflection, so explicitly mark the entity instance dirty
			markInterceptorDirty( entity, target );
			event.setResult( result );
		}
	}
```

## 도메인과 엔티티 분리 구조에서는 무조건 DETACHED 상태이다.

필자가 구성한 코드 아키텍쳐에서는 아래와 같이 처리된다.

![](/images/velog/176fcd55943b2825.png)

이 과정 중 데이터 수정을 하려면 조회 과정과 저장 과정은 아래와 같이 처리되어야 한다.

- 조회 : UserDao → User

- 값 변환 : User

- 저장 : User → UserDao

이 각각의 과정 중에 User, UserDao 변환에 따라 객체가 생성된다.

**이 때 id 가 이미 있으므로 isNew() 는 통과된다.**

**하지만 merge() 를 호출하게 되고, 영속성 컨텍스트에 데이터가 없으므로** 

**결과적으로 SELECT 쿼리가 부가적으로 호출되게 된다.**

실제로 아래와 같이 데이터 변경 유스케이스에 대한 테스트코드를 실행하게 되면 

UPDATE 쿼리를 수행하기 위해 SELECT → UPDATE 가 처리되는 것을 볼 수 있다.

```java
@SpringBootTest
class UserInfraImplTest {

    @BeforeEach
    void setUp() {
        userInfra.save(
            User.builder()
                .balance(new Money(BigDecimal.valueOf(100L)))
                .build()
        );
    }

    @Autowired
    private UserInfraImpl userInfra;

    @Test
    @DisplayName("merge")
    void merge() {
        // GIVEN
        List<User> users = userInfra.findUsers();

        // WHEN
        User user = users.get(0);
        user.changeName("changedName");

        // THEN
        userInfra.save(user);
    }

}
```

![](/images/velog/0141d82fb11ccb8d.png)

## 어떻게 하면 merge() 에 따른 SELECT 호출을 피할 수 있을까?

~~미안하지만 해당 구조에서는 피할 수 없다.

~~DETACHED 상태인데 Dirty Checking 을 쓸 수가 없고, 무조건 save()/merge() 를 통해 영속화를 해주어야 한다.~~

~~**따라서 SELECT 가 호출되는 건 아키텍처 트레이드오프로 받아들이기로 하였다.**~~

~~만약 피할 수 있는 방법을 알게 된다면 해당 포스트에 더 이어서 적도록 하겠다.~~

엔티티 별로 interface 를 통해 isUpdated flag 를 구현하도록하고, 만약 isUpdated 가 true 인 경우에는 UPDATE 쿼리가 나가도록 하면 되지 않을까?

DynamicUpdate 를 활용하던, 모든 컬럼에 대한 UPDATE 를 그대로 처리하던지 둘 중 선택해서 말이다

# Reference

---

https://howisitgo1ng.tistory.com/entry/JPA-JPA%EA%B0%80-Entity%EB%A5%BC-%ED%8C%90%EB%B3%84%ED%95%98%EB%8A%94-%EB%B0%A9%EB%B2%95%EA%B3%BC-save%EC%9D%98-%EB%B9%84%EB%B0%80entityInformationisNewentity

https://docs.spring.io/spring-data/jpa/reference/jpa/entity-persistence.html

https://velog.io/@yglee8048/JPA-Persistable

https://ttl-blog.tistory.com/852

https://bjwan-career.tistory.com/221

https://devs0n.tistory.com/113
