---
title: "SecurityContext 에 사용자 엔티티를 들고 있어야 할까?"
description: "어떻게 SecurityContext 가 동작하고, 실제로 들고 있을 때의 성능은 어떤지 살펴보자."
date: 2025-03-02
tags: []
category: uncategorized
lang: ko
draft: false
---

# Episode 📜

---

> 돌고 돌아 SpringBoot 진영 항상 논쟁거리인 SecurityContext & Persistence 이다.
>
> 거의 정답은 정해져있다고 생각하는 바이지만, 언제나 그렇듯 개발에는 정답이 없다.
>
> 그러므로 관련 주제에 대해 딥다이브를 하게되었다면 면밀히 살펴보길 바란다.
>
> 만약 SpringContext 에 Persistence 를 처리하게끔 하기로했다면, 해당 포스트의 성능 섹션으로 넘어가라

사내 논의 중 SecurityContext 에 대해 두 가지 의견으로 나뉘었다.

1. SecurityContext 에 사용자 엔티티의 메타데이터만을 넣을 것인가 — meIdx, meName 등등

2. SecurityContext 에 사용자 엔티티 자체를 넣어둘 것인가

1번을 사용한다면 트랜잭션 시작과 함께 사용자를 영속화하기 위해 조회를 한 번 해야할 것이고,

2번을 사용한다면 FilterChain 에서 SecurityContext 에 사용자를 넣을 때 영속화를 유지해야할 것이다.

이와 관련하여 공부한 내용을 공유해보고자 한다.

# About 💁‍♂️

---

### Spring MVC 기본 라이프싸이클

![](/images/velog/b1c2037a87bd7227.png)

https://velog.io/@ldg031/Spring-MVC-Request-life-cycle

1. Filter
    - HTTP 요청과 응답을 수정하거나 요청에 대한 로깅, 보안검사, 문자 인코딩, 설정등을 수행
2. Dispatcher servlet
    - Handler mapping을 사용하여 요청된 URL과 일치하는 controller 조회
3. Controller
    - 요청을 수행할 컨트롤러는 비즈니스 로직을 처리
    - 필요한 데이터를 모델에 저장하며 뷰 이름을 리턴
    - RESTful API 형태의 개발에서는 Response DTO와 HTTP 응답 상태 코드를 리턴
4. View Resolver
    - 컨트롤러가 반환한 뷰 이름을 사용하여 View Resolver가 실제 뷰(View) 객체를 조회
    - View Resolver는 뷰 이름을 기반으로 실제 JSP, Thymeleaf, Freemarker 등의 뷰 템플릿 조회
5. View rendering
    - 찾아진 뷰는 모델에 저장된 데이터를 사용하여 클라이언트에게 보여줄 HTML을 생성

### Filter vs Interceptor

![](/images/velog/51200f706c1102d4.png)

https://dev-coco.tistory.com/173

https://escapefromcoding.tistory.com/352

- Filter
    - Spring Context 밖에서 작동 (톰캣, netty 와 같은 웹 컨테이너에서 동작)
    - 요청/응답에 대해 공통 가
- Interceptor
    - Spring Context 내에서 작동 (스프링 컨테이너에서 동작)
    - Controller 호출 이전 요청/응답 가공

### Spring Security 기본 동작과정

![](/images/velog/65b6ce34da327456.png)

https://tecoble.techcourse.co.kr/post/2020-09-20-entity-lifecycle-2/

- Spring Security는 Filter를 기반으로 동작
- DelegatingFilterProxy에서 사용자의 요청을 가로채 Spring Security의 기능들이 수행
- 모든 요청에 대해 보안이 적용되게끔 처리
- DelegatingFilterProxy에는 Security 기능들이 구현되어 있는 다양한 Security Filter가 존재
    - 일종의 FilterChain을 이루어 동작

![](/images/velog/5f4efd310ea36165.png)

https://jaykaybaek.tistory.com/27

- UserDetailsService 를 구현하여 Spring Security 인증과정에 필요한 사용자정보를 처리
    - Java Reactor 에서는 ReactiveUserDetailsService

### SecurityContext 의 사용자 저장 시 영속화를 유지하려면,,,?

결론부터 말하자면 그냥 사용하면 스프링의 OSIV 의 기본값으로 인해 에러가 발생한다.

이를 방지하기 위해 추가설정을 해줘야한다.

OSIV 까지 설명하면 너무 길어지니 아래 포스트들을 참고해보자. 

1. https://velog.io/@cooper25_dev/%EC%BD%94%EB%93%9C%EB%A1%9C-%EB%B3%B4%EB%8A%94-OSIV-Open-Session-In-View
2. https://brunch.co.kr/@anonymdevoo/58

요컨대 Spring Security 가 동작하는 Filter Chain 에서 처리한 사용자의 영속화가 

Filter 이후에 처리되는 Interceptor 기반의 OSIV 까지 전달이 되지 않는다는 것이다.

따라서 Filter-Interceptor-Controller 순으로 처리되는 스프링의 구조 상, 

Controller 에서 꺼낸 사용자는 영속화가 되지 않은 사용자이다.

즉 아래와 같이 처리된다.

- Filter Chain
    - Spring Security Filter - 영속 O User
- HandlerInterceptor
- OpenEntityManagerInViewInterceptor - 영속성 컨텍스트 시작
- Controller - 영속 X User
- Service - 트랜잭션 시작
- …

이를 위해 아래와 같이 OSIV 에 대한 Filter 를 구현하여 영속성을 Filter 단부터 유지하게 할 수 있다.

— 다행히 Spring 에서 OSIV Filter 구현을 할 수 있는 OpenEntityManagerInViewFilter 이라는 클래스를 지원 중이다.

- Filter Chain
    - OpenSessionInViewFilter - 영속성 컨텍스트 시작
    - Spring Security Filter - 영속 O User
- HandlerInterceptor
- OpenEntityManagerInViewInterceptor
- Controller
- Service - 트랜잭션 시작
- …

이에 대한 코드는 아래 결론 이후에 Apply 섹션을 참고해보자.

### 그래서 결론이 뭔데,,,

제대로 논하자면 OSIV 의 패턴과 동작과정을 다뤄야한다.

다만 우리의 관심사는 그게 아니다.

우리의 관심사는 

`영속화된 사용자 엔티티를 Spring Security Filter Chain 에서부터 가지고 있어도 되는가`이다.

즉, `OSIV 와 Filter 조작을 했을 때의 후폭풍이 있는가?` 이다.

따라서 이에 따른 장단점을 정리하면서 해당 포스트를 마치고자 한다.

> 💡
> 
> 장점
> 
> - 개발이 편하다.
>     - 영속화를 위한 추가 쿼리를 할 필요가 없다.
> - 컨트롤러에서도 비즈니스 로직을 작성할 수 있다.
>     - 트랜잭션이 컨트롤러까지도 이어지므로 ,,,
> - 간단한 CRUD 에 적합하다.

> 💡
> 
> 단점
> 
> - 외부 분산 서비스 호출 시 트랜잭션을 사용하면 안 된다.
>     - 외부 분산 서비스 처리될 때까지 Session 이 계속 열려 있기 때문이다.
>         
>         ```java
>         @Override
>         // @Transactional ❌
>         public Optional<User> findOne(String username) {
>             Optional<User> user = userRepository.findByUsername(username);
>             if (user.isPresent()) {
>                 // remote call
>             }
>         
>             return user;
>         }
>         ```
>         
> - EntityManager 가 닫히는 시점이 늦으므로 스레드 고갈이 발생할 수 있다.
> - Transactional Context 밖에서 동작 + Lazy Loading 으로 인해 예상치 못 한 N+1 문제가 발생할 수 있다.
> - Session 이 요청 라이프싸이클 전반적으로 존재하며, auto - commit 으로 인해 데이터베이스의 부하가 심해진다.
> - 레이어의 결합도가 높아진다.
>     - 모든 레이어가 DB 에 의존한다.

# Personally ,,, 🤔

---

가장 단점이라고 여겨지는 건 스레드 고갈과 데이터베이스의 과부하였다.

데이터베이스 스레드 풀인 HickariCP 와 Tomcat 의 요청에 대한 스레드 풀을 고려해보아야한다.

관련해서 아래 포스트들을 참고해보자.

https://www.baeldung.com/java-web-thread-pool-config

https://www.baeldung.com/hikaricp

기본조건이라고 가정하고, OSIV 를 켰을 때 얼만큼의 요청을 처리할 수 있는지 연산해보았다.

아래 컴퓨팅파워에서 다음과 같았다. (~~GPT 돌림 주의,,~~)

> 💡
> 
> 컴퓨팅파워
> 
> - 4GB 의 RAM
> - t2.medium
> 
> 메모리 사용
> 
> - JVM 힙: ~3GB(일부는 OS 및 비 힙 메모리를 위해 남겨둠).
> - 스프링 부트 프레임워크용 : ~500MB(프레임워크 클래스, 라이브러리 등).
> - 애플리케이션 로직 및 요청에 사용 가능: ~2.5GB
> 
> Tomcat 요청 가능수
> 
> - 각 요청
>     - ~2MB 라고 가정
> - 최대 동시 요청
>     - 2.5GB / 2MB ≈ 125개의 동시 요청.
> - 처리량 예상(초당 요청 수)
>     - 각 요청이 100ms(0.1초) 내에 완료된다고 가정
>     - 단일 스레드가 초당 10개의 요청을 처리 가능
> - 동시 스레드가 125개인 경우
>     - 초당 요청 10건/스레드 × 125개 스레드 = ~1,250건/초.
> 
> HickariCP 데이터베이스 스레드 부하
> 
> - maximumPoolSize 기본값인 10 인 경우
>     - 쿼리가 200ms 내에 완료된다고 가정
>     - 초당 5개의 요청 × 10개의 연결 = 초당 50개의 데이터베이스 연결 요청.

이에 따라 위 조건의 이하의 요구사항인 경우

Spring Security Filter Chain 에 사용자 엔티티를 넣고 맘 편히 쓰는 게 속 편할 것 같다.

 — 최근버전인 Spring 3.4.x OSIV 는 기본으로 켜져있다.

하지만 만약 위 조건 그 이상의 요구사항인 경우,

OSIV 를 무조건 끄고, Spring Security Filter Chain 에서는 사용자 메타데이터를 넣는 게

효율적인 방안 아닐까 싶다.

# Apply 🧑‍💻

---

아래는 OpenSessionInViewFilter 을 등록하는 코드이다.

만약 Filter 부터 영속화된 사용자를 유지하고 싶다면 아래 설정을 해주어야 한다.

```java
@Component
@Configuration
public class OpenEntityManagerConfig {
    @Bean
    public FilterRegistrationBean<OpenEntityManagerInViewFilter> openEntityManagerInViewFilter() {
        FilterRegistrationBean<OpenEntityManagerInViewFilter> filterFilterRegistrationBean = new FilterRegistrationBean<>();
        filterFilterRegistrationBean.setFilter(new OpenEntityManagerInViewFilter());
        filterFilterRegistrationBean.setOrder(Integer.MIN_VALUE); // 예시를 위해 최우선 순위로 Filter 등록
        return filterFilterRegistrationBean;
    }
}
```

# Reference 📚

---

> Spring MVC
> 

https://velog.io/@zooyeop/Spring-Dispatcher-ServletFilterInterceptor-1

https://escapefromcoding.tistory.com/352

> Spring Security
> 

https://jaykaybaek.tistory.com/27

> OSIV
> 

https://www.baeldung.com/spring-open-session-in-view

https://tecoble.techcourse.co.kr/post/2020-09-20-entity-lifecycle-2/

https://tecoble.techcourse.co.kr/post/2020-11-03-osiv_with_interceptor/

https://brunch.co.kr/@anonymdevoo/58

https://perfectacle.github.io/2021/05/24/entity-manager-lifecycle/

https://github.com/spring-projects/spring-boot/issues/7107

https://github.com/spring-projects/spring-boot/issues/42607

https://docs.spring.io/spring-boot/appendix/application-properties/index.html

https://stackoverflow.com/questions/30549489/what-is-this-spring-jpa-open-in-view-true-property-in-spring-boot

> Tomcat Thread Pool
> 

https://devoong2.tistory.com/entry/Tomcat-Tomcat-Thread-Pool-%EC%84%A4%EC%A0%95-%EC%A0%95%EB%A6%AC-%EB%B0%8F-%ED%85%8C%EC%8A%A4%ED%8A%B8

https://www.baeldung.com/java-web-thread-pool-config

> HikariCP
> 

https://www.baeldung.com/hikaricp

https://velog.io/@miot2j/Spring-DB%EC%BB%A4%EB%84%A5%EC%85%98%ED%92%80%EA%B3%BC-Hikari-CP-%EC%95%8C%EC%95%84%EB%B3%B4%EA%B8%B0
