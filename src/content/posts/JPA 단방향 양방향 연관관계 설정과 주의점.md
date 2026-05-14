---
description: "1. 연관관계의 주인은 외래키가 있는 곳 2. 연관관계 주인 설정의 기준은 외래키 관리를 해야하는 엔티티"
date: 2026-02-25
tags: [java]
lang: ko
draft: false
---

# Why(What For?) 🤷‍♂️

# What(What should I know?) 👇

## 연관관계 주인 설정

1.

연관관계의 주인은 외래키가 있는 곳 2.

연관관계 주인 설정의 기준은 외래키 관리를 해야하는 엔티티

## 양방향

### 양방향 vs 단방향 결정 기준

1.

비즈니스 요구사항에 따라, 본인 테이블을 사용하여 다른 테이블을 역참조를 할 필요가 없다면

### 양방향 연관관계 편의메서드 구현 & 주의사항

```java
// User와 Comment가 서로서로 참조하므로 양방향 관계 ✅
// Comment가 User에 대한 외래키 참조하므로 "주인"
@Entity
public class User {
    @OneToMany(targetEntity = Comment.class, mappedBy = "user")
    List<Comment> comments;
}

@Entity
public class Comment {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
}
```

- 양방향 관계에 있는 다른 엔티티를 set 메서드 구현
- 주의사항

## Favor 다대일 양방향 over 일대다 단방향

### 일대다 단방향

- 본인을 매핑한 외부테이블에서 본인에 대한 외래키값을 관리한다.

### 왜 안 좋냐고?

- 본인을 수정/삭제 하는 경우에, 본인을 외래키로 참조하는 외부테이블에 대한 추가 관리가 필요하다.
- 다른 테이블에서 본인에 대한 외래키를 관리하기에 JPA에서 UPDATE SQL을 추가로 실행한다.

### 반면 다대일 양방향에서는,,,

- 다대일의 경우, 연관관계의 주인이 정해진다.
- 즉, 연관관계 편의메소드를 통해 외래키값에 대한 관리(저장)을 할 수 있다.
- 따라서 일대다 단방향의 외래키 관리 이슈와 같은 문제가 발생하지 않는다.

[https://github.com/HomoEfficio/dev-tips/blob/master/JPA%20일대다%20단방향%20매핑%20잘못%20사용하면%20벌어지는%20일.md](https://github.com/HomoEfficio/dev-tips/blob/master/JPA%20%EC%9D%BC%EB%8C%80%EB%8B%A4%20%EB%8B%A8%EB%B0%A9%ED%96%A5%20%EB%A7%A4%ED%95%91%20%EC%9E%98%EB%AA%BB%20%EC%82%AC%EC%9A%A9%ED%95%98%EB%A9%B4%20%EB%B2%8C%EC%96%B4%EC%A7%80%EB%8A%94%20%EC%9D%BC.md)

[https://dublin-java.tistory.com/51](https://dublin-java.tistory.com/51)

# Q&A Session

1.

토끼책 질문 2.

양방향 연관관계 편의메서드를 요구사항에 다른 요청에 따라 한 쪽 도메인에서 update,remove를 정의해주었다.

이렇게 하는 게 맞나?? 3.

Test 코드 시, yml 은 어떻게 보호하나?? 4.

단방향 연관관계에서는 역참조를 할 수가 없다.

그럼 어떻게 상대방 엔티티를 찾아오는가?? 5.

다른 도메인에 대한 검증 :: 서비스 주입 vs 레포지토리 주입

# How(How to apply to code?) ✍️
