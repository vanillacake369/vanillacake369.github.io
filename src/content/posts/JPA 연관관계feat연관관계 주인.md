---
description: "JPA에서는 **두 객체 연관관계 중 하나를 정해서 테이블의 외래키를 관리**"
date: 2026-02-25
tags: [java]
lang: ko
draft: false
---

# Why(What For?) 🤷‍♂️

> 테이블은 곧 엔티티이다.

# What(What should I know?) 👇

## 연관관계의 주인

- 연관관계 주인이란??

JPA에서는 **두 객체 연관관계 중 하나를 정해서 테이블의 외래키를 관리**
\*\*연관관계의 주인만이 데이터베이스 연관관계와 매핑되고 외래 키를 관리(등록, 수정, 삭제)할 수 있습니다.

반면에 주인이 아닌 쪽은 읽기만 할 수 있습니다.\*\*
어떤 연관관계를 주인으로 정할지는 `mappedBy` 속성을 사용하면 됩니다.

> 데이터베이스 테이블의 다대일, 일대다 관계에서는 항상 **다** 쪽이 외래 키를 가집니다.

다 쪽인 `@ManyToOne`은 항상 연관관계의 주인이 되므로 `mappedBy`를 설정할 수 없습니다.

따라서 `@ManyToOne`에는 `mappedBy` 속성이 없습니다.

- 주인은 `mappedBy` 속성을 사용하지 않는다.
- 주인이 아니면 mappedBy 속성을 사용해서 속성의 값으로 연관관계의 주인을 지정해야 한다.

<details>
<summary>예시</summary>

![](/images/notion/29b10ca3d87d8cf9.png)

```java
class Member {

	 @ManyToOne
	 @JoinColumn(name = "TEAM_ID")
	 private Team team;
	 // ...
}
```

```java
class Team {

  @OneToMany(mappedBy = "team")
  private List<Member> members = new ArrayList<>();
  // ...
}
```

</details>

[https://velog.io/@conatuseus/연관관계-매핑-기초-2-양방향-연관관계와-연관관계의-주인](https://velog.io/@conatuseus/연관관계-매핑-기초-2-양방향-연관관계와-연관관계의-주인)

## m:n 관계를 1:n, n:1로 resolve

- 중간테이블 용 엔티티 생성
- @ManyToMany 를 @ManyToOne 과 @OneToMany 를 활용하여 resolve

가령 아래와 같은 예가 있다고 하자.ㅏ

> 여러 멤버 ⇒ 여러 상품을 주문

```java
@Entity
public class Member {
	// 연결 테이블(MEMBER_PRODUCT)쪽이 외래키를 갖고있기 때문에, 연결 테이블이 연관관계의 주인이다.
    @OneToMany(mappedBy = "member")
    private List<MemberProduct> memberProducts = new ArrayList<>();
}
```

[https://velog.io/@yuseogi0218/JPA-다대다-연관관계](https://velog.io/@yuseogi0218/JPA-다대다-연관관계)

## m:n관계를 1:n으로 resolve

1.

JPA 레포지토리를 통해 client 생성할 때 다른 테이블의 외래키에 매핑되어있는 값들이 자동으로 입력되는 건가??

# How(How to apply to code?) ✍️
