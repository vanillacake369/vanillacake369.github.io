---
description: "주문 로직 수정 중 Detached Entity Passed to Persist 에러를 만났다. MERGE 대신 PERSIST를 선택한 이유, 둘의 동작 차이와 각각의 적합한 사용 시점을 정리한다."
date: 2024-02-04
tags: [journal, spring-boot]
lang: ko
draft: false
---

# Intro (Business Context)

주문에 대한 로직 수정 중, `Detached Entity Passed to Persist`를 만나보았다. 우리의 엔티티에 대해서 돌아보게 되었고, 그러던 중 우리가 왜 MERGE 대신 PERSIST 를 사용하게 되었는지 기억이 안 났다.

```java
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "tb_order")
@Getter
@DynamicUpdate
@DynamicInsert
public class Order extends BaseEntity {
	,,,

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, cascade = CascadeType.PERSIST)
    private User buyer;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, cascade = CascadeType.PERSIST)
    private User seller;
}
```

어떤 차이점이 있을까??

# PERSIST VS MERGE 🔀

![](/images/velog/62f462b8e9acb99e.webp)

> <span style="color: YellowGreen"> **3줄 요약**
> \*\*1.

연관엔티티들이 하나의 트랜잭션 내에 있고 연관관계에 대해서 새로운 레코드 저장을 한다 => PERSIST 2.

Detached Entity 이거나 연관관계에 대해서 수정을 해야한다 => MERGE 3.

동일한 엔티티에 대해 여러 엔티티가 PERSIST를 사용하고 있다면, 삭제를 의도하더라도 PERSIST가 걸려있기에 삭제가 되지 않는다.\*\*

> <span style="color: YellowGreen"> \*\*3-line summary

1. related entities are in one transaction and a new record is to be saved for the relationship => PERSIST
2. it is a Detached Entity or the relationship needs to be modified => MERGE
3.

If multiple entities are using PERSIST for the same entity, even if you want to delete it, it will not be deleted because PERSIST is in place.\*\*

## PERSIST 📌

### Intention

The persist method is <span style="color: YellowGreen"> intended to add a new entity instance to the persistence context</span>, i.e. transitioning an instance from a transient to persistent state.

```java
Person person = new Person();
person.setName("John");
session.persist(person);
```

What happens after we call the persist method?

The person object has transitioned from a transient to persistent state. The object is in the persistence context now, but not yet saved to the database. The generation of INSERT statements will occur only upon committing the transaction, or flushing or closing the session.

### Features

- <span style="color: YellowGreen">Notice that the persist method has a void return type.</span> It operates on the passed object "in place," changing its state. The person variable references the actual persisted object.

- if an instance is <span style="color: YellowGreen"> already persistent, then this call has no effect for this particular instance **_(but it still cascades to its relations with cascade=PERSIST or cascade=ALL)._** </span>
- if an instance is <span style="color: YellowGreen"> detached, we'll get an exception, </span> either upon calling this method, or upon committing or flushing the session.

### When to use

**Use PERSIST when you are certain that the entity is transient and you want to persist it as a new record in the database.**
**Using PERSIST on an already managed entity will result in an exception.**

## MERGE 🔄

### Intention

The main intention of the merge method is <span style="color: YellowGreen"> to update a persistent entity instance with new field values from a detached entity instance. </span>

For updates, we need to get a persistent entity instance from a persistence context and update its fields with new values from this detached instance.

So the merge method does exactly that:

- <span style="color: YellowGreen"> finds an entity instance by id </span> taken from the passed object (either an existing entity instance from the persistence context is retrieved, or a new instance loaded from the database)
- <span style="color: YellowGreen"> copies fields from the passed object to this instance
- <span style="color: YellowGreen"> returns a newly updated instance

```java
Person person = new Person();
person.setName("John");
session.save(person);

session.evict(person);
person.setName("Mary");

Person mergedPerson = (Person) session.merge(person);
```

### Features

- <span style="color: YellowGreen"> Note that the merge method returns an object. </span> It's the merged Person object we loaded into the persistence context and updated, not the person object that we passed as an argument. <span style="color: YellowGreen"> They're two different objects, and we usually need to discard the person object.</span>
- if the entity is <span style="color: YellowGreen"> detached, it copies upon an existing persistent entity.</span>
- if the entity is <span style="color: YellowGreen"> transient, it copies upon a newly created persistent entity.
  **_this operation cascades for all relations with cascade=MERGE or cascade=ALL mapping._** </span>
- if the entity is <span style="color: YellowGreen"> persistent, then this method call doesn't have an effect on it (**_but the cascading still takes place)._** </span>

### When to use

**Use MERGE when you have a detached entity that you want to reattach to the current persistence context.**
**MERGE will copy the state of the detached entity to a managed entity (either an existing managed entity or a new one if none exists) and return the managed entity.**

# So Why did we use `PERSIST`?? 🤔

우리가 PERSIST 를 사용하게 된 이유는 간단하다. Order 에 대한 User는 수정/삭제될 일이 거의 없기 때문이다. 이 때, 다음 의문점이 들 수 있다. 하나씩 짚어보도록 하자.

### 1.

Order 를 취소하고 싶다면 삭제처리를 해야하지 않나??

맞다. Order 를 취소하고 싶다면 삭제처리를 해야한다. 다만 우리는 Soft Delete 를 지원하고 있으므로, Order 데이터 자체를 삭제하지 않는다. soft delete 플래그를 변경해줌으로써 Soft Delete 처리를 하기 때문에 User의 연관관계와는 무관한 삭제처리를 한다.

### 2.

User에 대한 PERSIST를 사용하게 되면 다른 엔티티에서 User를 PERSIST로 걸게 되는 경우 삭제가 불가능하지 않나?

앞서 강조했듯이, User 데이터에 대한 삭제처리를 하지 않아 해당 부분은 걱정할 필요가 없게 되었다.

### 3.

PERSIST 를 사용하게 되었을 때의 이점은??

이는 명확하다.

**MERGE 가 상대적으로 성능이 떨어지기 때문이다.** **앞서 봤듯이, MERGE는 모든 필드값들을 복사하여 새로운 인스턴스를 생성해낸다.** **정말 업데이트의 목적을 위한 전략인 것이다.**

하지만 우리는 User를 새로 추가할 뿐, 수정할 일이 없다.
(주문건에 대해서 판매자와 구매자를 변경할 일이 없기 때문)

따라서 우리의 비즈니스 컨텍스트에는 부합하지 않는다.

# Reference 📚

[Hibernate: save, persist, update, merge, saveOrUpdate](https://www.baeldung.com/hibernate-save-persist-update-merge-saveorupdate)
[[jpa] CascadeType.PERSIST를 함부로 사용하면 안되는 이유](https://joont92.github.io/jpa/CascadeType-PERSIST%EB%A5%BC-%ED%95%A8%EB%B6%80%EB%A1%9C-%EC%82%AC%EC%9A%A9%ED%95%98%EB%A9%B4-%EC%95%88%EB%90%98%EB%8A%94-%EC%9D%B4%EC%9C%A0/)

[^1]: `CascadeType.PERSIST`는 부모 엔티티를 persist할 때 연관된 자식 엔티티도 함께 persist한다. 반면 `CascadeType.MERGE`는 부모를 merge할 때 자식도 함께 merge한다.
[^2]: Detached 상태란 영속성 컨텍스트에서 분리된 상태다. 세션이 닫히거나 `evict()`를 호출하면 엔티티는 Detached 상태가 된다.
[^3]: `CascadeType.ALL`은 PERSIST, MERGE, REMOVE, REFRESH, DETACH 모두를 포함한다. 연관관계 전체 생명주기를 부모에게 위임할 때 사용한다.
[^4]: MERGE 는 내부적으로 SELECT 쿼리를 먼저 실행하여 기존 엔티티를 불러온 뒤 필드를 복사한다. 불필요한 MERGE는 이 SELECT 비용을 매 트랜잭션마다 발생시킨다.
[^5]: Soft Delete 패턴에서는 `deleted_at` 또는 `is_deleted` 플래그로 논리 삭제를 처리한다. 물리적 DELETE가 없으므로 PERSIST cascade의 삭제 방지 부작용을 걱정할 필요가 없다.
