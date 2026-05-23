---
description: "Mockito의 @Mock·@MockBean 차이부터 MockitoExtension과 SpringExtension 선택 기준까지 Mock 테스트 핵심을 정리했다."
tags: [java]
lang: ko
draft: false
---

# About Mock Test

# Inject Mock 💉

[https://velog.io/@yyong3519/Mockito](https://velog.io/@yyong3519/Mockito)

# `@Mock` vs `@MockBean` 🆚

> 세 줄 요약

- Mock
- MockBean

[https://www.baeldung.com/java-spring-mockito-mock-mockbean](https://www.baeldung.com/java-spring-mockito-mock-mockbean)

# `@ExtendWith(MockitoExtension.`_`class`_`)` vs `@ExtendWith(SpringExtension.class)` ⚙️

> 세 줄 요약

**When involving Spring**:
If you want to use Spring test framework features in your tests like for example `@MockBean`, then you have to use `@ExtendWith(SpringExtension.class)`.

It replaces the deprecated JUnit4 `@RunWith(SpringJUnit4ClassRunner.class)`. **When NOT involving Spring**: If you just want to involve Mockito and don't have to involve Spring, for example, when you just want to use the `@Mock` / `@InjectMocks` annotations, then you want to use `@ExtendWith(MockitoExtension.class)`, as it doesn't load in a bunch of unneeded Spring stuff.

It replaces the deprecated JUnit4 `@RunWith(MockitoJUnitRunner.class)`. **To answer your question**: Yes you can just use `@ExtendWith(SpringExtension.class)`, but if you're not involving Spring test framework features in your tests, then you probably want to just use `@ExtendWith(MockitoExtension.class)`.

[https://stackoverflow.com/questions/60308578/what-is-the-difference-between-extendwithspringextension-class-and-extendwit](https://stackoverflow.com/questions/60308578/what-is-the-difference-between-extendwithspringextension-class-and-extendwit)
[https://www.baeldung.com/junit-springrunner-vs-mockitojunitrunner](https://www.baeldung.com/junit-springrunner-vs-mockitojunitrunner)

# **@DataJpaTest** 🗄️

[https://jiminidaddy.github.io/dev/2021/05/20/dev-spring-단위테스트-Repository/](https://jiminidaddy.github.io/dev/2021/05/20/dev-spring-단위테스트-Repository/)

# Don't mock instance having dependecy of `@Configuration` ⚠️

> 세 줄 요약

[https://stackoverflow.com/questions/61762024/mock-messagesource-always-returns-null-for-getmessage-in-junit-test](https://stackoverflow.com/questions/61762024/mock-messagesource-always-returns-null-for-getmessage-in-junit-test)

When you create a bean for **`MessageSource`** using a **`@Configuration`** class, and you want to test a component that uses **`MessageSource`**, it's generally a good practice to use the real bean instead of a mock.

This ensures that you are testing the actual behavior of the code when interacting with the real **`MessageSource`** implementation.

> 아래 코드는 MessageSource Bean를 만들어주는 Configuration에서의 의존성 주입을 사용한 MessageSource 테스트코드

```java
@Configuration
public class TestConfig {

    @Bean
    public MessageSource messageSource() {
        ResourceBundleMessageSource messageSource = new ResourceBundleMessageSource();
        messageSource.setBasename("messages"); // Set the basename for your YAML file
        return messageSource;
    }
}

@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = TestConfig.class)
class YourTestClass {

    @Autowired
    private MessageSource messageSource;

    @Autowired
    private YourComponentUsingMessageSource yourComponent;

    @Test
    void yourTestMethod() {
        // Your test logic here
    }
}
```

# Test yml 따로 설정하기 📄

[https://stay-hungry.tistory.com/17](https://stay-hungry.tistory.com/17)

# ContextConfiguration은 조심해서 사용해주자. 🔧

> 만약 Test에 관련된 Config나 Bean들을 주입해주고자 할 때 사용하자.

```java
@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = {MessageConfiguration.class, ErrorCaseResolver.class})
class ErrorCaseResolverTest {

	@Autowired
	MessageSource messageSource;
	// MessageConfiguration에 의해서 생성되는 Bean
	@Autowired
	ErrorCaseResolver errorCaseResolver;
	// Component이므로 위에서 @ContextConfiguration에 꼭 추가해주어야함
}
```

[https://tlatmsrud.tistory.com/36](https://tlatmsrud.tistory.com/36)

[^1]: Mockito @Mock vs @MockBean. <https://www.baeldung.com/java-spring-mockito-mock-mockbean>

[^2]: MockitoExtension vs SpringExtension. <https://stackoverflow.com/questions/60308578/what-is-the-difference-between-extendwithspringextension-class-and-extendwit>

[^3]: JUnit SpringRunner vs MockitoJUnitRunner. <https://www.baeldung.com/junit-springrunner-vs-mockitojunitrunner>

[^4]: @DataJpaTest 단위 테스트 Repository. <https://jiminidaddy.github.io/dev/2021/05/20/dev-spring-단위테스트-Repository/>

[^5]: ContextConfiguration 사용법. <https://tlatmsrud.tistory.com/36>
