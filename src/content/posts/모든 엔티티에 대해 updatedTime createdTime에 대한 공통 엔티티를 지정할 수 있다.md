---
title: "모든 엔티티에 대해 updatedTime, createdTime에 대한 공통 엔티티를 지정할 수 있다?"
description: ""
date: 2024-01-30
tags: [Java]
category: uncategorized
lang: ko
draft: false
---

# 어떻게 함??

---

[https://velog.io/@vpdls1511/Spring에서-BaseEntity작성하기](https://velog.io/@vpdls1511/Spring에서-BaseEntity작성하기)

베이스 엔티티를 만들어주고, 모든 엔티티가 이를 상속받으면 된다.

`Base Entity`

```java
@Getter
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public class BaseEntity {
    @CreatedDate
    private LocalDateTime createdDateTime;

    @LastModifiedDate
    private LocalDateTime modifiedDateTime;
}
```

`상속받는 Entity`

```java
@Entity
public class Order extends BaseEntity {
,,,
}
```

# 사용 개념

---

- `@`**`MappedSuperclass`**

Entity클래스는 Entity클래스끼리만 상속 가능
Entity클래스에서 일반 클래스를 상속받기 위해서는 `@`**`MappedSuperclass`**을 작성

- @EntityListeners

JPA Entity에 이벤트가 발생할 때 콜백을 처리하고 코드를 실행
즉, 개발자가 엔티티의 속성값을 어떤 곳에서 수정,삭제,변경하게 되는 경우, 콜백을 처리한다.

<details>
<summary>각 이벤트 별로 어노테이션이 존재한다.</summary>

**@PrePersist**
: Persist(insert)메서드가 호출되기 전에 실행되는 메서드
**@PreUpdate**
: merge메서드가 호출되기 전에 실행되는 메서드
**@PreRemove**
: Delete메서드가 호출되기 전에 실행되는 메서드
**@PostPersist**
: Persist(insert)메서드가 호출된 이후에 실행되는 메서드
**@PostUpdate**
: merge메서드가 호출된 후에 실행되는 메서드
**@PostRemove**
: Delete메서드가 호출된 후에 실행되는 메서드
**@PostLoad**
: Select조회가 일어난 직후에 실행되는 메서드
</details>

모든 엔티티에 대해 각 이벤트 별로 메서드를 지정하는 것은 매우 번거로운 일이다.
이러한 번거로움을 처리한 게 `@EntityListeners` 어노테이션이다.
@EntityListeners를 통해 해당 Listener class를 호출하여 사용하면 코드의 가독성이 증가하고 코드의 중복도 크게 줄일 수 있다.

[https://velog.io/@seongwon97/Spring-Boot-Entity-Listener](https://velog.io/@seongwon97/Spring-Boot-Entity-Listener)
[https://wave1994.tistory.com/161](https://wave1994.tistory.com/161)

- AuditingEntityListener

JPA에서는 `Audit`이라는 기능을 제공하고 있습니다. Audit은 `감시하다, 감사하다`라는 뜻으로 Spring Data JPA에서 시간에 대해서 자동으로 값을 넣어주는 기능입니다. 도메인을 영속성 컨텍스트에 저장하거나 조회를 수행한 후에 update를 하는 경우 매번 시간 데이터를 입력하여 주어야 하는데, audit을 이용하면 자동으로 시간을 매핑하여 데이터베이스의 테이블에 넣어주게 됩니다.

[https://webcoding-start.tistory.com/53](https://webcoding-start.tistory.com/53)
