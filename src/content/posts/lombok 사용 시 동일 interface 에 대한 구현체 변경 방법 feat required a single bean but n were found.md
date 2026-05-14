---
description: "동일 인터페이스 구현체 매핑 방법 원리와 해결책에 대해 알아보자!"
date: 2025-03-02
tags: [journal]
lang: ko
draft: false
---

# Episode 📜

lombok 사용 도중 사내 팀원 중 한 분께서 구현체 매핑이 안 된다고 하였다.

코드 구조에 대한 구조를 알려달라고 말씀드렸고, 구조는 아래와 같았다.

![](/images/velog/be37d32a2c5b0414.png)

![](/images/velog/6499f4f85fea1e35.png)

이에 대해 원인과 해결책을 공유하면 좋을 것 같아 이렇게 포스트를 작성해본다.

# Reason 🤷‍♂️

Spring Bean 주입은 아래와 같은 원리로 돌아간다.

<span style="color:grey">[해당 포스트](https://tech.kakaopay.com/post/martin-dev-honey-tip-2/#6%EC%A4%84-%EC%9A%94%EC%95%BD) 에 잘 요약된 것을 가져와보았다. </span>

- @Bean 으로 bean을 생성하게 되면, method name이 bean name으로 생성된다.
- 같은 Type의 bean이 1개만 있다면, bean name과 관련없이 bean을 주입해준다.
- 같은 Type의 bean이 여러 개 있으면, @Qualifier가 없어도 bean name과 field name을 매칭해서 bean을 주입해준다.
- (!) @Primary가 있으면, bean name을 무시하고 Type 기반으로 Primary인 Bean을 주입한다.
- @Qualifier가 있으면, 무조건 bean name 기준으로 주입해준다. (없으면 오류가 발생한다)
- @Qualifier 어노테이션이 @Primary 어노테이션보다 우선하여 적용된다.

~~잘 모르겠다면 Spring Bean 의 Injection 방법에 대해 다시 알아보자.~~

위 케이스의 문제점은 Qualifier 가 한 곳에만 적용되어있다는 것이다.

즉, Qualifier 를 잘못 쓴 탓이다.

Qualifier 는 아래와 같이 쓰여한다.

```java
public class FooService {

    @Autowired
    @Qualifier("fooFormatter")
    private Formatter formatter;
}
```

```java
@Component
@Qualifier("fooFormatter")
public class FooFormatter implements Formatter {
    //...
}

@Component
@Qualifier("barFormatter")
public class BarFormatter implements Formatter {
    //...
}
```

이외에도 다르게 적용할 수 있는 방법을 소개하고자한다.

# Fix 🔧

### **방법 #1)  lombok.config 사용하여 Qualifier 와 RequiredArgsConstructor 가 함께 작동하도록 처리**

java/hama/cmb/rainbowtvjavaapi/lombok.config 을 통해 lombok 이 `@Qualifier` 를 처리하도록 추가해준다.

```yaml
# see https://projectlombok.org/features/constructor lombok.copyableAnnotations
lombok.copyableAnnotations += org.springframework.beans.factory.annotation.Qualifier
```

아래와 같이 코드 작성

![](/images/velog/815e3378819e3ff6.png)

### **방법 #2) @Resource 처리**

아래와 같이 코드 작성

![](/images/velog/b8a192c487f82852.png)

### 무엇을 선택??

1. @Resource 는 이름으로 주입하기에 클래스명이 바뀌면 의존관계가 틀어짐
2.

Constructor Injection 을 하지 않기에 위험함

    그럴 일은 없으나, 코드상에서 임의로 변경하게되면 추적이 어려움

|               | @Autowired                                                                                                                                                                                                                               | @Resource                            |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| 공통점        | 의존관계를 자동으로 주입하기 위한 설정                                                                                                                                                                                                   |                                      |
| 차이점1: 지원 | Spring Framework                                                                                                                                                                                                                         | Java                                 |
| 차이점2: 검색 | bean의 Type으로 검색하여 의존성 주입                                                                                                                                                                                                     | bean의 Name으로 검색하여 의존성 주입 |
| 옵션          | @Autowired는 **타입을 이용해서** 자동적으로 값을 설정하기때문에 해당 타입의 빈 객체가 존재하지 않거나 또는 2개이상 존재할 경우 빈객체를 생성할때 예외를 발생시킨다.이 경우를 대비하여  @Autowired(required=false) 옵션을 설정할 수 있다. |

해당 옵션을 설정하면 연결할 bean을 찾지 못해도 예외를 발생시키지 않는다. | name 속성을 이용하여 명시적으로 bean name을 줄 수 있다. |
| 단점 | type으로 검색하여 연결하기 때문에 같은 타입이 2개 이상 존재하는 경우, 예외가 발생한다.

 

~~아마 나라면 세 가지 방법 중 그냥 귀찮아서 lombok.config 를 건드려줄 것이다 😅~~

[^1]: Java - Lombok + Spring에서 @Qualifer 적용 이슈 <https://velog.io/@mertyn88/Lombok-Spring에서-Qualifer-적용-이슈>

[^2]: 롬복(lombok)에서 생성자 필드에 선언된 애노테이션을 복사적용하는 것 <https://gist.github.com/ihoneymon/8b62cabb2e985c4ebd29271b3e25181f>

[^3]: @NoArgsConstructor, @RequiredArgsConstructor, @AllArgsConstructor <https://projectlombok.org/features/constructor>

[^4]: @Autowired VS @Resource 그리고 @Qualifier <https://luceatluxvestra.tistory.com/18>
