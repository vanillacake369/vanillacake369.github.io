---
title: "Port , Adapter 패턴을 통한 레이어드 아키텍처 개선하기"
description: "Ports & Adapters 패턴을 통해 DIP 를 강제하여 핵심 로직 명세 레이어를 강조시키자!"
date: 2024-09-02
tags: [journal]
lang: ko
draft: false
---

> 본 글은 [Ports & Adapters architecture on example](https://wkrzywiec.medium.com/ports-adapters-architecture-on-example-19cab9e93be7) 을 요약하고 제 입맛대로 정리한 내용입니다.

해당 포스트에서 자세한 설명과 Github 까지 제공 중이니 참고바랍니다.

# Port & Adapter 패턴이란??


아래는 Port & Adapter 패턴을 적용한 예시이다.

![](/images/velog/3f81e092a3bd1229.png)

각각의 package 는 다음과 같은 역할을 구성한다.

- application - 외부 세계가 애플리케이션과 상호작용하는 방식을 정의하며, 애플리케이션 코어로 가는 게이트웨이
    - REST API 일 수도 있고, 메시지 서비스(예: Kafka, RabbitMQ 등), 명령줄 클라이언트 또는 다른 종류일 수도 있다.
- core - 애플리케이션의 비즈니스 로직이 여기에 있다.
    - 분석가나 비전문가도 이해할 수 있도록 평이한 언어로 작성하는 것이 목표.
    - 그 안에는 비즈니스 담당자가 쉽게 이해할 수 있는 도메인별 언어를 사용.
    - 어떤 Java 프레임워크(예: Spring, Jakarta EE, Quarkus, Micronaut)에도 구애받지 않아야 한다.
    - 코어는 애플리케이션의 핵심이며 로직을 캡슐화하는 부분.
- infra - 외부 시스템과의 통신 구현
    - 대부분의 애플리케이션은 비즈니스 로직을 포함할 뿐만 아니라 일반적으로 데이터베이스, 큐, sFTP 서버, 기타 애플리케이션 등과 같은 외부 시스템도 사용
    - 이 부분에서는 이러한 통신이 어떻게 구현될지 처리한다. (핵심적으로 필요한 것만 처리한다.)
    - 예를 들어 DB 의 data 를 persist 처리하기 위해 Hibernate, 일반 Jdbc, jOOQ 또는 원하는 프레임워크와 같은 여러 가지 접근 방식을 사용할 수 있다.

그렇다면 ports 안의 Facade 는 무슨 역할이고 Adapter 는 무슨 역할일까??

Controller 부터 코드를 살펴보자.

![](/images/velog/885112d6a7425046.png)

보다 싶이 구현체가 아닌 AddNewUser 라는 인터페이스를 통해 처리하고 있다.

그렇다면 AddNewUser 의 구현체는 무엇일까?

![](/images/velog/5ee361ffd2486c23.png)

![](/images/velog/bfbf853cb9fdc51a.png)

UserFacade 는 AddNewUser 의 구현체인 걸 볼 수 있다.

여기서 UserFacade 는 핵심 로직인 새로운 User 생성하는 로직을 처리하고 있다.

또한 UserDatabase 를 의존하고 있는 것을 볼 수 있다.

그렇다면 UserDatabase 는 어떤 컴포넌트일까?

![](/images/velog/1e4f8600f8768ee9.png)

![](/images/velog/fa3bf14d62fd0222.png)

![](/images/velog/d1d6c8aad7db4c95.png)

UserDatabase 는 인터페이스로서 유저 저장이라는 act 를 처리하고 있다.

이 act 에 대한 구현체로서 UserDatabaseAdapter 가  그 역할을 한다.

UserDatabaseAdapter 는 [*Spring CrudRepository*](https://docs.spring.io/spring-data/commons/docs/current/api/org/springframework/data/repository/CrudRepository.html)  을 통해 User 를 저장하는 역할을 수행한다.

# 이렇게 구성하면 무엇이 좋을까?

그렇다면 왜 이렇게 구성했을까??

그냥 UserFacade 에서 UserRepository 을 호출하여 저장 처리를 하면 안 되는 걸까?

결론부터 말하자면 영속성 계층에 의존하게 되어 Behavior Driven Development 를 하기가 어렵게 된다.

영속성 계층을 기반으로 비즈니스 계층을 구성하게 되면 결국 영속성 계층이 변경됨에 따라 비즈니스 계층 또한 변경되게 된다.

(*[문제점 1 : 데이터베이스 주도 설계를 유도한다.](https://blog.naver.com/fbfbf1/222762059059) 를 참고해보자.*)

또한 현대의 애플리케이션의 로직은 복잡해도 너무 복잡하다.

주문이라는 유스케이스만 봐도 그렇다.

유저의 주문에 따라 유저를 조회해야하고, 상품번호에 따라 상품들을 조회하고,

결제방법에 따라 결제 API 를 처리하고, 상품재고를 줄이고, 배송을 처리하고,

,,,

이러한 복잡한 유스케이스에 따라 계층식 아키텍처는 

"비즈니스 로직"이라는 명목 하에 비즈니스 계층이 중구난방으로 늘어나게 된다.

도메인을 아무리 잘개 쪼개어도, 하나의 유스케이스에 대해 여러 계층이 발현되게 된다.

즉 아래와 같이 말이다.

```java
├─order
│  ├─controller
│  │  ├─NewOrderController
│  ├─workflow
│  │  ├─NewOrderWorkFlow
│  ├─facade
│  │  ├─OrderMemberFacade
│  │  ├─NewOrderFacade
│  │  ├─OrderProductFacade
│  │  ├─OrderDeliveryFacade
│  ├─service
│  │  ├─NewOrderService
│  │  ├─NewOrderServiceImpl implements NewOrderService
│  │  ├─OrderProductService
│  │  ├─OrderProductServiceImpl implements OrderProductService
│  ├─persistence
│  │  ├─NewOrderRepository <I>
│  │  ├─NewOrderRepositoryImpl implements NewOrderRepository 
│  │  ├─MySQL JPA
│  │  ├─OrderProductRepository <I>
│  │  ├─OrderProductRepositoryImpl implements OrderProductRepository 
│  │  └─Mongo JPA
```

또한 단일 DB 를 사용하거나 탈 모놀리식을 지향하게됨에 따라

외부시스템과의 의존성도 높아지게 되었다.

외부 API, 메세지 큐, 외부 컴포넌트 등등 말이다.

더군다나 영속성 또한 외부시스템이다.

이 외부시스템 간 의존성을 낮추고, 최대한 비즈니스 로직만을 갇혀두게 만들어 

변경사항에 대한 영향도를 낮추어야 한다.

따라서 아래와 같은 철학이 탄생하게 되었다.

**비즈니스 계층은 비즈니스만 처리해야하고, 외부 시스템에 대해서는 몰라야한다.**

이를 위해 아래와 같은 application / core / infrastructure 구조의 개념이 도출되었다.

핵심 개념 자체는 간단하다.

Core 는 application 에 대해서도, infrastructure 알면 안 된다.

아니 Core 는 외부세상에 대해 아무것도 알면 안 된다!

![](/images/velog/37f3cdb4f7eb24ef.png)

ort 와 Adapter 개념을 통해 Core 와 Application, Infrastructure 간의 결합도를 낮추도록 처리한다.

아니, Application , Core , Infrastructure  도 복잡한데 Port 와 Adapter 는 또 무엇이란 말인가?

용어에 속지 마라.

그저 Interface 와 Implement 일뿐이니까!!

Port, Adapter 모두 Interface 이다.

Port 는 Application 과 Core, 혹은 Core 와 Infrastructure  간의 Interface 이다.

Adapter 는 이러한 Port 에 대한 Implement 이다.

이러한 Interface 와 Implement 를 통해 의존성을 낮추는 것이 Port, Adapter 의 목적이다.

# Port

![](/images/velog/071e5f53434c5e46.webp)

- 포트는 코어가 외부와 맺는 모든 상호작용을 정의
- 두 가지 그룹으로 나눠질 수 있는데 각각 **incoming** (primary) 과 **outgoing** (secondary) 으로 나눠질 수 있다.
- **incoming** (primary)는 비즈니스 코어와 상호 작용하는 방법(코어에서 사용할 수 있는 명령어)을 처리한다.
    
    ![](/images/velog/b65766a550c8ea42.png)
    
- **outgoing** (secondary)는 코어가 외부 세계와 대화하는 데 처리된다.
    
    ![](/images/velog/75f6931e80d5baa3.png)
    
- 위와 같이 구성된 incoming, outgoing 을 통해 core 는 아래 로직을 수행한다.
    
    ![](/images/velog/a93c230f21351039.png)

위와 같이 Port는 우리가 하고자 하는 일에 대한 정의일 뿐이다.

어떻게 구현되고 어떤 외부시스템을 의존하고 있는지에 대해서는 말하지 않는다.

# Adapter

위에서 봤듯이 Port 는 우리가 하고자 하는 일의 정의, 즉 Act 들의 Group 이다.

그렇다면 이 Port 에 대해 어떻게 누가 구현을 담당하는가?

**이렇게 정의한 Port 에 대해 구현을 바로 어댑터가 담당한다.**

예를 들어 여기에서는 애플리케이션의 비즈니스 핵심인 `BorrowingFacade.java` 클래스 내부에 `ReserveBook` 포트가 구현되어 있다.

![](/images/velog/87d3c8d88040fb6d.png)

![](/images/velog/6f0a478431d7e683.png)

![](/images/velog/9f84f315b0250b17.png)

여기서 무슨 일이 일어나고 있는지, 비즈니스 로직이 어떻게 처리되는지 파악하기가 쉽다.

즉 각각의 도메인의 도메인 로직을 호출, 조립하여

하나의 유스케이스 처리를 위한 로직 처리를 하고 있다.

하지만 위의 메서드에는 Interface 만이 사용되고 있다.

즉, 두 개의 outgoing ports 인 *database* & *eventPublisher 가 사용 중이다.*

**이 Interface에 대해 구현체가 필요하다.

이 구현체를 Adapter 라고 한다.**

이러한 Adapter 를 사용하여 각기 다른 방법 — JDBC 를 사용하거나, MongoDB 를 사용하거나 — 으로 구현체를 구현할 수 있다.

![](/images/velog/5495022414be46ed.png)

![](/images/velog/d63a068e747af85f.png)

하나의 Port 에 대해 여러 Adapter 를 사용함으로써 

최종적으로 우리가 원하는 시스템에 맞추어 구색, 처리할 수 있게 할 수 있다.

아래와 같이 말이다!

![](/images/velog/68bceb053c946237.png)

여기서의 핵심은 Interface(Port) 와 Implement(Adapter) 를 강제하여 

외부세상과 비즈니스 로직을 떨어뜨리는 것이다.

즉 DIP 를 사용하여 핵심 로직 명세 레이어를 강조시키는 것이다.

Core 는 비즈니스 로직만 명세할 뿐이다!

Core 는 DB 가 어떤 것이 쓰이는지, 누가 본인을 호출하는지 이러한 구현체나 세부정보에 대해 아무것도 모른다.

이것이 바로 Port 와 Adapter 패턴의 지향점이다.

[^1]: Ports & Adapters architecture on example <https://wkrzywiec.medium.com/ports-adapters-architecture-on-example-19cab9e93be7>
[^2]: GitHub - wkrzywiec/library-hexagonal: An example application written in Hexagonal (Ports and Adapter) architecture <https://github.com/wkrzywiec/library-hexagonal/tree/master>
[^3]: Hexagonal Architecture/Ports And Adapters: Clarifying Key Concepts Using Go <https://dev.to/buarki/hexagonal-architectureports-and-adapters-clarifying-key-concepts-using-go-14oo>
[^4]: 지속 가능한 소프트웨어 설계 패턴: 포트와 어댑터 아키텍처 적용하기 <https://engineering.linecorp.com/ko/blog/port-and-adapter-architecture>
