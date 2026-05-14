---
title: "@Repository vs @Component"
description: "둘 다 DI를 위한 어노테이션이지만 쓰임새와 역할이 다르다."
date: 2026-02-25
tags: [java]
lang: ko
draft: false
---

## 무엇을 공부하였는가 🤔


### @Component vs @Repository.

둘의 공통점/차이점??

둘 다 DI를 위한 어노테이션이지만 쓰임새와 역할이 다르다.
@Component는 인터페이스의 구현체 혹은 지정한 클래스에 대해 DI를 하기 위해 
싱글톤 패턴의 빈을 컨테이너에 등록해달라고 스프링에게 note해주기 위한 용도이다.

반면 @Repository은 특수한 @Component의 일종이다.

이는 data acccess와 data access operations에 대한 클래스들을 위해 특수하게 degsigned 된 것이다.
@Repository를 `JpaRepository`를 상속한 DTO에 대한 인터페이스에 적용하면, Spring은 이에 대한 `JpaRepository` 빈 인스턴스를 생성한다.

## 어떻게 쓰는가 ☝️


1.

DTO 생성
2.

DTO 에 대한 Repository 인터페이스 생성 :: `JpaRepository`

`Client`

```java
@Getter
@Setter
@Entity
public class Client {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String email;

    private String password;

    private LocalDateTime clientCreatedTime;

    @OneToMany(mappedBy = "matchedClient", cascade = CascadeType.REMOVE)
    private Set<Match> matches;
}
```

`ClientRepository`

```java
@Repository
public interface ClientRepository extends JpaRepository<Client,Long> {

}
```

> 에..?

필드에 `@Autowired`가 적용가능한가??

가능하다.

이를 필드 주입이라 한다.

하지만 사용하지 않도록 권고하고 있다.

의존성 주입을 하는 방법은 필드 주입  이외에 크게 4가지가 있다.

Constructor Injection / Setter Injection / Field Injection / Method Injection
모르겠다면 의존성 주입 방법을 모르는 것이니 이곳을 참고하자.
[https://bangu4.tistory.com/297](https://bangu4.tistory.com/297)

## 왜 쓰는가 ❓


엔티티에 대한 레포지토리 인스턴스를 컨테이너에서 생성/관리

## 레퍼런스 🔍
