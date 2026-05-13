---
title: "Self N:M 관계는 어떻게 설계/구현할까?"
description: "아래와 같은 상황이 있다고 해보자."
date: 2026-02-25
tags: [java]
category: uncategorized
lang: ko
draft: false
---

# Why(For What?)

---

아래와 같은 상황이 있다고 해보자.

> 회원 A,B,C는 회원 ㄱ,ㄴ,ㄷ 과 과팅을 하기로 하였다.

여기서 회원 간 n:m 관계를 이루어야 한다. 
다음을 알아보도록하자.

- **어떻게 설계하는 게 best practice일까?**
- **현재 Spring Boot에서 JPA를 사용한다면, 어떻게 구현해야할까?**
- **구현 시, 유의사항은 무엇일까?**

# What(What should I know?)

---

## 설계

---

일단은 두 가지 방법이 떠올랐다.
방법1. 회원PRIMARY키를 참조하는 외래키를 두기
⇒ 아래와 같이, 중복값이 생겨야만 n:m 관계를 형성할 수 있기 때문에, 애초에 안 될 뿐더러, 정규화에 어긋난다.
`member`

| member_id(PK) | … | matched_member_id(FK) |
| --- | --- | --- |
| 1 |  | 2,3,4 |
| 2 |  | 1,3 |


방법2. 중간조인테이블을 생성하기
`member`

| member_id(PK) | … |
| --- | --- |
| 1 |  |
| 2 |  |


`match_info`

| matched_boy | matched_girl |
| --- | --- |
| 1 | 2 |
| 1 | 3 |


## 그렇다면 JPA에서 구현은 어떻게 할까?

---

### N:M 관계 구현

JPA에서는 다대다 관계를 해결하는 방법으로 두 가지가 있다.

1. `@ManyToMany`를 걸어 다대다 관계를 resolve
2. 하나의 중간매핑테이블을 “직접 선언하여” 양쪽에 `@OneToMany`를 걸어 해결


아래 예제 코드를 살펴보자.


1. `@ManyToMany`를 걸어 다대다 관계를 resolve
2. 하나의 중간매핑테이블을 “직접 선언하여” 양쪽에 `@OneToMany`를 걸어 해결

### Self N:M Refer

1. `@ManyToMany` 사용
2. 중간 테이블 직접 생성하여 `@OneToMany`,`@ManyToOne`사용 

## 여기서 잠깐! reserved keyword로 컬럼,테이블 이름을 지으면 안 된다!

---

2번 방법인 중간 테이블 직접 선언을 통해 다대다 관계를 resolve하려고 하였다.
아래와 같이 구현했는데 꼬였다.
무엇이 문제였을까?
Match

```java
@Entity
@Getter
@Data
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "match")
public class Match {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JsonIgnore
    @JoinColumn(name="matcher_id")
    Client matcher;

    @ManyToOne
    @JsonIgnore
    @JoinColumn(name="matched_id")
    Client matched;
}
```

Client

```java
@Getter
@Entity
@Data
@Table(name="client")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Client {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String studentId;

    private String firstName;

    private String lastName;

    @OneToMany(mappedBy = "matcher")
    List<Match> matcherMatch;

    @OneToMany(mappedBy = "matched")
    List<Match> matchedMatch;
}
```


에러 코드

```java
Caused by: java.sql.SQLSyntaxErrorException: You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near 'match (id bigint not null auto_increment, primary key (id)) engine=MyISAM' at line 1
	at com.mysql.cj.jdbc.exceptions.SQLError.createSQLException(SQLError.java:120) ~[mysql-connector-j-8.0.31.jar:8.0.31]
```


정답은 바로,,,

> The reason for this is that "MATCH" is a reserved keyword in MySQL used for full-text search operations. Using reserved keywords as table names can lead to confusion and make your SQL queries more error-prone. 

~~덕분에 오전 내내 JPA 연관관계가 꼬인 건지 이팔저팔 하면서 구글링짓 했는데,,,,^^ 잘 풀려서 다행이다.~~

## 실제 프로덕션에 반영하기

---

<details>
<summary>혹시 몰라 원본 저장</summary>

`Client`

```java
package com.example.dateanu.domain.Client;

import com.example.dateanu.domain.Grade.Grade;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter // 쓰면 안 되는 건데,,, 일단은 두고 나중에 고치자!!
@Builder
@Entity
@NoArgsConstructor
@AllArgsConstructor
public class Client {
    @Id
    @GeneratedValue
    private Long id;

    private String studentId;

    private String firstName;
    
    private String lastName;

//    @ManyToOne(fetch = LAZY)
//    @JoinColumn(name="gender_id")
//    private Gender gender;

    private String email;

    private String password;

    /*private Major major;*/
    private String major;

    private int age;

    private Grade grade;

    private LocalDateTime clientCreatedTime;

//    /* JPA 공부 이후 구현 예정 :: */
//    @OneToMany(mappedBy = "matchedClient")
//    private List<Match> matches;
//
//    @OneToMany(mappedBy = "conversationClient")
//    private List<Conversation> conversations;
//
//    @OneToMany(mappedBy = "clientPhoto")
//    private List<ClientPhoto> photos;
//
//    @ManyToOne(fetch = LAZY)
//    @JoinColumn(name = "client_hobby")
//    private Hobby clientHobby;
}
```

`Match`

```java
//package com.example.dateanu.entity;
//
//import jakarta.annotation.Nullable;
//import jakarta.persistence.*;
//import lombok.Getter;
//import lombok.Setter;
//
//import java.time.LocalDateTime;
//
///**
// * 매칭정보 DTO
// *
// * id
// * name
// * memo
// * createDate
// */
//@Getter
//@Setter
//@Entity
//public class Match {
//    @Id // 기본키
//    @GeneratedValue
//    @Column(name = "match_id")
//    private Long id;
//
//    private LocalDateTime matchedTime;
//
////    @ManyToOne(fetch = FetchType.LAZY)
//    @ManyToOne
//    @JoinColumn(name="match_client_id",nullable = false)
//    private Client matchedClient;
//
//    private LocalDateTime timeJoined;
//
//    @Nullable
//    private LocalDateTime timeLeft;
//}
```
</details>

1. `@ManyToMany`를 걸어 다대다 관계를 resolve
2. `@OneToMany`, `@ManyToOne`사용해서 `@ManyToMany`resolve



> 둘 다 아주 성공적으로 돌아간다. 👍😊

## N:M 관계 구현 시, 주의사항

---

> **@ManyToMany는 사용하지 않는 것을 권장한다.**

위 내용을 어디서 줏어들은 기억이 있어, `@ManyToMany`는 최대한 사용하지 않아야하지 않았나 싶었는데, 
이 내용이 사실 김영한 님 강의 “[자바 ORM 표준 JPA 프로그래밍 - 기본편](https://www.inflearn.com/course/ORM-JPA-Basic/dashboard)” 에서 나온다.

# Reference 📖

---

- JPA에서 1:n,n:1,n:m 구현
- @ManyToMany는 사용하지 않는 것을 권장한다.
- 셀프 조인 예제
- 데이터베이스 개념적설계
- JPA 개념

# How(Give me an example)

---
