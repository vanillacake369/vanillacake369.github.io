---
description: "스프링은 서블릿 컨테이너와 함께 동작한다."
date: 2026-02-25
tags: [java]
lang: ko
draft: false
---

# Why(What For?) 🤷‍♂️

> 필터에 따른 검증 처리, 그리고 검증에 따른 예외처리, 이후 시큐리티 처리 등등에 대한 과정들을 깊게 공부하고 싶어졌다.

# What(What should I know?) 👇

## Flow of Spring

스프링은 서블릿 컨테이너와 함께 동작한다.

- Servlet Container
- Spring Container

![](/images/notion/af4190f5e0756ee3.png)

## Filter / Interceptor / Exception

> 더 깊은 공부는 차차 공부해보자.

- Filter
- Interceptor
- AOP

![](/images/notion/c9bb0df82da022ea.png)

### Filter Chain

[https://sasca37.tistory.com/290](https://sasca37.tistory.com/290)
Spring Context 내부에 도달하기 전인 WAS에 들어가는 시점에 로직을 처리한다.

![](/images/notion/1b101edb30de4048.png)

## Filter vs Interceptor

> Filter vs Interceptor

## Custom Exception

> To be continued…

## DTOs

### What is it?

- transferring data between layers,
- such as between controllers and services, or between services and repositories.
- They can help in structuring the data to be presented or consumed by different parts of the application.

### If there’s various types of requests, is it should be various types of DTOs??

Yes.

Even more, app will eventually grow and changes.

Version.

Different Entry Point,
Different End Point.

So you have to form appropriate DTO for each use case.

### Auto Mapping :: DTO ↔ Entitiy

지금 나한테는 돼지 목에 진주목걸이와 같으므로 나~~중에 필요할 때 공부하자.

알아는 두자고, 굉장히 좋은 컨벤션인 것 같으니.
[https://jp1020.tistory.com/entry/Custom-Mapper-with-MapStruct](https://jp1020.tistory.com/entry/Custom-Mapper-with-MapStruct)
Two ways to do it

- ModelMapper : Auto Mapping
- Custom Mapper

> [https://www.baeldung.com/spring-data-partial-update](https://www.baeldung.com/spring-data-partial-update)에서 아래와 같이 짜면 save() 이전에 엔티티와 자동으로 merge를 한다는데 아무리 찾아봐도 이렇게 하는 방법은 나오지 않는다.

## DTO Validation ( + 2 ways of Test Code on validation )

[https://tecoble.techcourse.co.kr/post/2020-09-20-validation-in-spring-boot/](https://tecoble.techcourse.co.kr/post/2020-09-20-validation-in-spring-boot/)
이건 그냥,,,내 공부의 영역을 벗어났다고 생각이 든다,,,
다만!

Post Request를 직접 생성해서 아래 두 가지 방법에 따라 Validation Annotation이 작동하는지 테스트한다는 포인트에서 흥미로웠다!

- Controller Test 에서 흐름 검증
- ValidatorFactory 사용

## `@RequestBody` vs `@RequestParam` vs `@PathVariables`

[https://velog.io/@dongscholes/JavaSpringBoot-RequestParam-vs-PathVariable-쓰임새-사용법-차이점](https://velog.io/@dongscholes/JavaSpringBoot-RequestParam-vs-PathVariable-%EC%93%B0%EC%9E%84%EC%83%88-%EC%82%AC%EC%9A%A9%EB%B2%95-%EC%B0%A8%EC%9D%B4%EC%A0%90)
[https://stackoverflow.com/questions/28039709/what-is-difference-between-requestbody-and-requestparam](https://stackoverflow.com/questions/28039709/what-is-difference-between-requestbody-and-requestparam)
[https://cbw1030.tistory.com/57](https://cbw1030.tistory.com/57)

- RequestBody : HTTP Request Body → 객체
- RequestParam : 쿼리스트링
- PathVariables : URI Path값

1.

RequestBody : HTTP Request Body → 객체 2.

RequestParam : 쿼리스트링 3.

PathVariables : URI Path값

## How to encode/decode password (+PasswordEncoder)

추가로 RequestDTO에서 암호화역할까지 하게되면(PasswordEncoder를 주입받아서), 아래와 같은 여러 부작용이 발생하므로 서비스 단에서 처리해주는 것이 best practice인 것 같다.

- Repository를 통해 검증에 대한 부작용
- DTO의 주 역할인 데이터 전송 이외 역할이 추가되는 부작용

## How to hide a entity’s field(password) in response

Three way to do it

- Use Filter
- Use Interceptor
- Use `@JsonIgnore` on Entity’s field

[https://medium.com/sjk5766/spring-interceptor에서-response-수정하기-5b6ea3a5a270](https://medium.com/sjk5766/spring-interceptor%EC%97%90%EC%84%9C-response-%EC%88%98%EC%A0%95%ED%95%98%EA%B8%B0-5b6ea3a5a270)
[https://medium.com/sjk5766/spring-filter에서-response-수정하기-7de6da9836f5](https://medium.com/sjk5766/spring-filter%EC%97%90%EC%84%9C-response-%EC%88%98%EC%A0%95%ED%95%98%EA%B8%B0-7de6da9836f5)

- If you want to globally exclude a field from serialization for all instances of a DTO, using Jackson annotations (**`@JsonIgnore`**) might be a simple and effective choice.

```java
public class UserDTO {
    private String username;
    @JsonIgnore
    private String password;
    // getters and setters
}
```

- If you need fine-grained control over modifying the response, such as conditionally excluding fields based on runtime conditions, a filter could be a suitable option.

```java
public class PasswordFilter implements Filter {
    // filter methods
}
```

- If you want to perform modifications within the Spring MVC context and leverage Spring's MVC features, an interceptor might be more appropriate.

```java
public class PasswordInterceptor extends HandlerInterceptorAdapter {
    // interceptor methods
}
```

# How(So How?) ✍️
