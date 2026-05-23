---
description: "Spring Boot에서 도메인 이벤트를 발행하는 세 가지 방법 — EventPublisher 직접 호출, @DomainEvents 어노테이션, AbstractAggregateRoot 상속 — 을 비교하고 실제 적용 예시를 정리한다."
tags: [journal]
lang: ko
draft: false
---

# Episode 📜

도메인 주도 개발(Domain Driven Design)에서는 애그리거트와 도메인 이벤트라는 개념이 존재한다.[^5]

> 본 글에서는 애그리거트와 도메인이벤트에 대해 다루고 있지 않으나 아래에서 간략한 설명을 하겠다.
>
> 1. 애그리게이트는 하나의 단위로 함께 작동하는 관련 객체 그룹이다. 이러한 개체는 수명 주기에 따라 묶여 있으므로 함께 생성, 업데이트 및 삭제된다. 집계는 개체 그룹 내에서 일관성을 보장한다.
>
> 2. 애그리거트 루트는 애그리거트 내 개체 간의 상호 작용을 관리하는 주요 개체다. 다른 개체는 집계 외부에서 직접 액세스할 수 없으며 집계 루트를 거쳐야 한다.
>
> [Whats an aggregate-root : Stackoverflow](https://stackoverflow.com/questions/1958621/whats-an-aggregate-root)
> ![](/images/velog/4d6c657f3b70b21b.png)
>
> 3. 도메인 이벤트는 비즈니스에 중요한 도메인에서 발생한 어떤 일을 나타낸다. 이를 통해 시스템의 여러 부분이 상태 변화에 대응할 수 있다. 이벤트를 발행함으로써 어떤 서비스나 컴포넌트가 이를 처리할지 알 필요가 없다. 단지 이벤트에 대한 구독자(=이벤트핸들러)를 추가/수정하면 되므로, 핵심 로직을 수정하지 않고도 시스템 동작을 쉽게 확장 및 수정할 수 있다.
>
> [An In-Depth Understanding of Aggregation in Domain-Driven Design : AlibabaCloud](https://www.alibabacloud.com/blog/an-in-depth-understanding-of-aggregation-in-domain-driven-design_598034)
> ![](/images/velog/06208b601fdfa353.png)
> [Domain events: Design and implementation : Microsoft](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-events-design-implementation)
> ![](/images/velog/1e4c681c1c6285ba.png)

스프링부트에서는 이러한 개념에 대한 적극 지원 중에 있다. 그렇다면 어떻게 이를 처리하고 있을까?

# About 💁‍♂️

## EventPublisher 🔔

1. Service Layer

```java
@Service
public class DomainService {

    // ...
    @Transactional
    public void serviceDomainOperation(long entityId) {
        repository.findById(entityId)
            .ifPresent(entity -> {
                entity.domainOperation();
                repository.save(entity);
                eventPublisher.publishEvent(new DomainEvent());
            });
    }
}
```

2. Aggregate Layer

```java
@Entity
class Aggregate {
    // ...
    void domainOperation() {
        // some business logic
        if (eventPublisher != null) {
            eventPublisher.publishEvent(new DomainEvent());
        }
    }
}
```

위와 같이 Spring에서 지원하는 EventPublisher를 통해 **직접 발행**할 수 있다. 첫 번째는 핵심 비즈니스 로직 레이어에서 처리하는 것이고, 두 번째는 애그리거트 내부에서 처리하도록 하는 것이다.

## `@DomainEvents` & `@AfterDomainEventsPublication` 📌

```java
@Entity
public class Aggregate2 {
    @Transient
    private final Collection<DomainEvent> domainEvents;
    @Id
    @GeneratedValue
    private long id;

    public Aggregate2() {
        domainEvents = new ArrayList<>();
    }

    @AfterDomainEventPublication
    public void clearEvents() {
        domainEvents.clear();
    }

    public void domainOperation() {
        // some domain operation
        domainEvents.add(new DomainEvent());
    }

    @DomainEvents
    public Collection<DomainEvent> events() {
        return domainEvents;
    }

}
```

앞서 애그리거트 내에서 이벤트 발행하는 것을 보았다. Spring은 EventPublisher 대신 어노테이션으로 이를 지원할 수 있게 해준다.[^1] 해당 엔티티가 레포지토리에 save될 때마다 Spring Data를 통해 `@DomainEvents`가 붙은 메서드를 호출하게 된다. 이 메서드를 통해 반환된 이벤트 컬렉션들은 `ApplicationEventPublisher`에 전달되어 publish 처리된다.

DomainEvent가 발행되고 `@AfterDomainEventsPublication`이 붙은 메서드가 호출된다. 해당 메서드의 목적은 이벤트 컬렉션을 제거하여 중복 발행되지 않도록 하기 위함이다. 따라서 `@AfterDomainEventPublication`를 반드시 처리해주도록 주의해야 한다.

## `AbstractAggregateRoot<>` 🏗️

```java
@Entity
public class Aggregate3 extends AbstractAggregateRoot<Aggregate3> {
    // ...
    public void domainOperation() {
        // some domain operation
        registerEvent(new DomainEvent());
    }
}
```

Spring은 한 발짝 더 나아가 위와 같이 상속받아 처리할 수 있게끔 Base Class를 만들어두었다.[^2] `registerEvent(새로운 이벤트 객체);`를 통해 이벤트를 발행할 수 있다. 내부적으로는 `@DomainEvents`와 `@AfterDomainEventsPublication`을 활용 중인 걸 볼 수 있다.

![](/images/velog/e7438881fd4235bf.png)

# Apply 🧑‍💻

필자는 세 번째 방법을 선택했다. 애그리거트가 라이프사이클을 관리하다보니 이벤트 발행 또한 애그리거트의 역할이라고 생각했고, 도메인 로직과 이벤트 발행 로직을 한 번에 처리하여 코드가 간결해진다는 장점이 있기 때문이다(물론 세 가지 방법 중 무엇을 선택해도 크게 문제되지 않는다).

```java
@Entity
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "hama_test_domain")
public class TestDomainEntity extends AbstractAggregateRoot<TestDomainEntity> {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "test_idx", updatable = false)
    private Long testIdx;

    public void domainOperation() {
        System.out.println("Domain Operation Completed");
        registerEvent(new TestEvent());
    }
}

```

```java
@Value
@Getter
@JsonSerialize
@JsonDeserialize
@AllArgsConstructor(staticName = "of")
@NoArgsConstructor(access = AccessLevel.PUBLIC, force = true)
public class TestEvent {

    RouteRequestDto routeRequestDto;
    MonoSink<String> resultSink;

}

```

```java
@Slf4j
@Component
@RequiredArgsConstructor
public class TestDomainEventListener {

    @EventListener
    public void handleEvent(TestEvent testEvent) {
        System.out.println("TestEvent has activated : " + testEvent);
    }
}

```

위와 같이 DomainEntity, Event, Listener를 생성해주었고, UnitTest와 IntegrationTest를 통해 실제 동작되는지 검증해주었다.

Unit Test

```java
@SpringBootTest
class TestDomainEntityJpaRepoTest {

    @Autowired
    private TestDomainEntityJpaRepo repo;

    @MockBean
    private TestDomainEventListener testDomainEventListener;

    @AfterEach
    void tearDown() {
        repo.deleteAll();
    }

    @Test
    @DisplayName("테스트도메인 저장 이후 이벤트 발행에 성공합니다.")
    void 테스트도메인저장이후_이벤트발행_성공() {
        // GIVEN
        TestDomainEntity domainEntity = new TestDomainEntity();

        // WHEN
        domainEntity.domainOperation();
        repo.save(domainEntity);

        // THEN
        verify(testDomainEventListener, times(1)).handleEvent(any(TestEvent.class));
    }
}
```

Integration Test

```java
@SpringBootTest
class TestDomainEntityJpaRepoIntegrationTest {

    @Autowired
    private TestDomainEntityJpaRepo repo;

    @Autowired
    private TestDomainEventListener testDomainEventListener;

    @AfterEach
    void tearDown() {
        repo.deleteAll();
    }

    @Test
    @DisplayName("테스트도메인 저장 이후 이벤트 발행에 성공합니다.")
    void 테스트도메인저장이후_이벤트발행_성공() {
        // GIVEN
        TestDomainEntity domainEntity = new TestDomainEntity();

        // WHEN
        domainEntity.domainOperation();
        repo.save(domainEntity);

        // THEN
    }
}
```

![](/images/velog/5254d33d22210a8a.png)

잘 동작하는 것을 볼 수 있었다.

# Note that,,, ⚠️

트랜잭션 커밋이 성공된 이후에 이벤트 처리가 되는 것을 보장하고 싶다면 `@TransactionalEventListener`를 흔히들 사용할 것이다.[^10] 하지만 `@TransactionalEventListener` 사용 시 근본적인 문제 또한 해결해주어야 한다.

[스프링 이벤트 기능을 사용할 때의 고려할 점](https://findstar.pe.kr/2022/09/17/points-to-consider-when-using-the-Spring-Events-feature/)

```
/**
* Invoked after transaction commit. Can perform further operations right
* <i>after</i> the main transaction has <i>successfully</i> committed.
* <p>Can e.g. commit further operations that are supposed to follow on a successful
* commit of the main transaction, like confirmation messages or emails.
* <p><b>NOTE:</b> The transaction will have been committed already, but the
* transactional resources might still be active and accessible. As a consequence,
* any data access code triggered at this point will still "participate" in the
* original transaction, allowing to perform some cleanup (with no commit following
* anymore!), unless it explicitly declares that it needs to run in a separate
* transaction. Hence: <b>Use {@code PROPAGATION_REQUIRES_NEW} for any
* transactional operation that is called from here.</b>
* @throws RuntimeException in case of errors; will be <b>propagated to the caller</b>
* (note: do not throw TransactionException subclasses here!)
**/

```

> 이전의 이벤트를 publish하는 코드에서 트랜잭션이 이미 커밋되었기 때문에 `AFTER_COMMIT` 이후에 새로운 트랜잭션을 수행하면 해당 데이터소스 상에서는 트랜잭션을 커밋하지 않는다는 것이다. 따라서 `@Transactional` 어노테이션을 적용한 코드에서 `PROPAGATION_REQUIRES_NEW` 옵션을 지정하지 않는다면 이벤트 리스너에서 트랜잭션에 의존한 로직을 실행했을 경우 이 트랜잭션은 커밋되지 않는다.

아래와 같은 방법이 있으니 참고하길 바란다.

[@TransactionalEventListener 사용 시 주의점](https://dkswnkk.tistory.com/754)

> 1. TransactionPhase.BEFORE_COMMIT으로 변경
>
> 이벤트 리스너가 트랜잭션 커밋 전에 호출되도록 설정한다.
>
> ```java
> @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
> public void onExampleEvent(ValueChangeEvent valueChangeEvent) {
>     beforeValueChangeService.changeBeforeValue(valueChangeEvent.beforeValue());
> }
> ```
>
> 다만 BEFORE_COMMIT으로 설정하면 이벤트가 기존 트랜잭션 내에서 실행되므로, 이벤트 처리 로직이 실패하면 메인 트랜잭션도 롤백될 수 있으니 이 점을 고려하면 좋다.
>
> 2. 별도의 트랜잭션 시작
>
> 이벤트 리스너에서 호출하는 메서드에서 `Propagation.REQUIRES_NEW`를 통해 새로운 트랜잭션을 시작한다.
>
> ```java
> @Service
> @RequiredArgsConstructor
> public class BeforeValueChangeService {
>     private final ExampleRepository exampleRepository;
>
>     // 새로운 트랜잭션 시작
>     @Transactional(propagation = Propagation.REQUIRES_NEW)
>     public void changeBeforeValue(String value) {
>         Example example = exampleRepository.find(1L);
>
>         example.updateBeforeValue(value);  // 이제 동작함
>     }
> }
> ```
>
> 이 경우에는 새로운 트랜잭션을 시작하면 메인 트랜잭션과 독립적으로 동작하게 되므로 메인 트랜잭션이 롤백되더라도 새로운 트랜잭션에서의 변경 사항은 유지되기에 이 점을 고려해야 한다. 즉 이벤트 로직의 실패가 메인 트랜잭션에 영향을 미치지 않는다. 또한 이 시간 동안 2개의 데이터베이스 커넥션이 활성화된다. *(위 예시 코드에서는 발행한 쪽 트랜잭션(CurrentValueChangeService), 수신한 쪽 트랜잭션(BeforeValueChangeService))*
>
> 3. 비동기로 수행
>
> 이벤트 리스너를 비동기로 수행하여 메인 트랜잭션과 독립적으로 동작하도록 한다. 이 경우에는 메인 트랜잭션의 성능에 영향을 주지 않고, 별도의 스레드에서 비동기적으로 실행되므로 메인 트랜잭션의 완료를 기다리지 않는다. 다만 스레드가 달라져 예외처리나 트랜잭션 관리 등 고려해야 할 게 많아지는데, 이전에 작성한 [스프링에서 @Async를 사용할 때 주의점](https://dkswnkk.tistory.com/706) 글이 있으니 참고하면 좋을 것 같다.
>
> ```java
> @Async
> @TransactionalEventListener
> public void onExampleEvent(ValueChangeEvent valueChangeEvent) {
>    beforeValueChangeService.changeBeforeValue(valueChangeEvent.beforeValue());
> }
> ```

[^1]: DDD Aggregates and @DomainEvents : Baeldung <https://www.baeldung.com/spring-data-ddd>

[^2]: AbstractAggregateRoot example : github <https://github.com/eugenp/tutorials/blob/master/persistence-modules/spring-data-jpa-annotations/src/main/java/com/baeldung/boot/ddd/event/Aggregate2.java>

[^5]: Whats an aggregate-root : Stackoverflow <https://stackoverflow.com/questions/1958621/whats-an-aggregate-root>

[^10]: 스프링 이벤트 기능을 사용할 때의 고려할 점 <https://findstar.pe.kr/2022/09/17/points-to-consider-when-using-the-Spring-Events-feature/>
