---
description: "Sentry 의 Event Processor 를 조작하여 Auth Header 를 감지하여 Sentry 에 넘길 수 있도록 조작해보자"
date: 2025-03-11
tags: [journal]
lang: ko
draft: false
---

# Episode 📜

사내에서 버그 모니터링 및 리포트 처리를 위해 Sentry 를 결제하여 사용 중에 있다.

에러 추적에 가장 중요한 값은 그 때 당시의 요청값이다.

어떤 헤더를 사용해서 인증했고, 어떤 요청값을 보냈는지를 알아야 해당 리포트를 보고 디버깅이 가능하니 말이다.

하지만 Sentry 의 Scrub & Denylist 와 같은 보안정책에 따라

Auth Header 가 보여지지 않도록 처리되고 있었다.

필자는 Sentry 의 Event Processor 를 조작하여 Auth Header 를 감지하여 Sentry 에 넘길 수 있도록 조작하고자 한다.

후에 언급할 내용이지만, 운영서버가 아닌 개발서버에서만 처리될 수 있도록 주의하자

# About 💁‍♂️

## 기본 세팅

들어가기 앞서 혹시나 따라할 사람들을 위해서 필자의 환경을 먼저 소개해보고자 한다.

필자는 스프링부트 3.1.4 버전을 사용 중이고, build.gradle 에 `implementation 'io.sentry:sentry-spring-boot-starter-jakarta:7.18.0'` 을 통해 의존성을 추가해주었다.

이후 아래와 같이 환경설정을 해주었다.

각 필드값에 대한 설명은 필요하지 않을 것 같아 [Sentry 의 문서](https://docs.sentry.io/platforms/java/guides/spring-boot/configuration/options/#core-options) 를 남긴다.

```java
// sentry-env.yaml for sentry env
sentry:
  dsn: ${SENTRY_DNS}
  environment: develop
  exception-resolver-order: -2147483647
  max-request-body-size: always
  send-default-pii: true
  traces-sample-rate: 1.0
  enable-external-configuration: true

// application.yaml for my spring boot app
spring:
  config:
    activate:
      on-profile: dev
    import: classpath:sentry/sentry-env.yaml

  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: ${JDBC_URL}
    username: ${DB_USER}
    password: ${DB_PW}
  jpa:
    hibernate:
      ddl-auto: none
    properties:
      hibernate.jdbc:
        time_zone: Asia/Seoul
      default_batch_fetch_size: 1000
    open-in-view: false
```

## 문제점 : Sentry Default Policy on HTTP Header

다른 SDK 는 어떤지 모르겠다만, Java SDK 에서는 기본적으로 HTTP Header 는 가려진다고 명시가 되어있다. ([참고](https://docs.sentry.io/platforms/java/data-management/data-collected/#http-headers))

> By default, the Sentry SDK doesn't send any HTTP headers.

Even when sending HTTP headers is enabled, we have a denylist in place, which filters out any headers that contain sensitive data.

> To start sending HTTP headers, set sendDefaultPii=true.

실제로 코드를 뜯어보면 아래와 같이 처리되고 있음을 알 수 있는데, `containsSensitiveHeader()` 메서드를 WebMVC FilterChain 이나 WebFlux FilterChain 쪽에서도 그대로 사용하고 있는 것을 볼 수 있었다.

```java

@ApiStatus.Internal
public final class HttpUtils {

  public static final String COOKIE_HEADER_NAME = "Cookie";

  private static final List<String> SENSITIVE_HEADERS =
      Arrays.asList(
          "X-FORWARDED-FOR",
          "AUTHORIZATION",
          "COOKIE",
          "SET-COOKIE",
          "X-API-KEY",
          "X-REAL-IP",
          "REMOTE-ADDR",
          "FORWARDED",
          "PROXY-AUTHORIZATION",
          "X-CSRF-TOKEN",
          "X-CSRFTOKEN",
          "X-XSRF-TOKEN");

  ,,,

  public static boolean containsSensitiveHeader(final @NotNull String header) {
    return SENSITIVE_HEADERS.contains(header.toUpperCase(Locale.ROOT));
  }
  ,,,

}
```

![](/images/velog/219e27bc1d226912.png)

## 해결방법1 : Pre-Define HTTP Header

디깅 도중 Sentry Doc AI 를 통해 -- 생각보다 잘 만들어져있다.

사내 도메인 기획에도 적용할 생각이다 -- [Attach HTTP headers to Sentry request #594](https://github.com/getsentry/sentry-java/issues/594) 를 찾게되었고, 해당 이슈에서 Header 값을 미리 지정하여 넘길 수 있다는 것을 알게 되었다.

![](/images/velog/dbf27caf0ca8c123.png)

다만 이것은 내가 원하는 실제 요청값이 아니었다.

따라서 다음 해결방법을 찾아보았다.

## 해결방법2 : Define Custom EventProcessor

서블릿 필터체인을 건드리게되면 모든 요청을 캡쳐해야만 하고, 이는 불필요한 리소스 낭비라고 생각했다.

이벤트 발행 구조로 처리를 할 수 있을까 싶었지만, 서블릿 값을 이벤트로 넘겨주더라도 센트리 SDK 조작이 필요해보였다.

도저히 방법이 없나 싶어 Discord 와 Github Issue 에 아래와 같이 문의를 남겼다.

![](/images/velog/9845175fd5d5215a.png)

이후 친절한 예시 코드와 함께 답변이 돌아왔다.

![](/images/velog/52e1198607b38c49.png)

방법은 바로 ***Sentry 에서 제공 중인 EventProcessor 를 구현해주는 것***이다.

EventProcessor 는 예외가 발생함에 따라 센트리 내에서 발행되는 이벤트 핸들러의 추상클래스이다.

이를 직접 구현하여 Sentry 값을 조작할 수 있다.

필자는 답변에 따라 아래와 같이 코드를 조작해주었다.

# Apply 🧑‍💻

```java
@Slf4j
@Configuration
@Profile("dev")
public class SentryConfig {

    @Bean
    EventProcessor eventProcessor() {
        return new SentryAuthHeaderCapturer();
    }

    public final class SentryAuthHeaderCapturer implements EventProcessor {

        public SentryAuthHeaderCapturer() {
        }

        @Override
        public @NotNull SentryEvent process(final @NotNull SentryEvent event, final @NotNull Hint hint) {
            processInternal(event);
            return event;
        }

        @Override
        public @NotNull SentryTransaction process(final @NotNull SentryTransaction transaction, final @NotNull Hint hint) {
            processInternal(transaction);
            return transaction;
        }

        @Override
        public @NotNull SentryReplayEvent process(final @NotNull SentryReplayEvent event, final @NotNull Hint hint) {
            processInternal(event);
            return event;
        }

        private void processInternal(final @NotNull SentryBaseEvent event) {
            RequestAttributes requestAttributes = RequestContextHolder.getRequestAttributes();
            if (requestAttributes instanceof ServletRequestAttributes) {
                HttpServletRequest request = ((ServletRequestAttributes) requestAttributes).getRequest();
                String auth = request.getHeaders(HttpHeaders.AUTHORIZATION).asIterator().next();
                HashMap<String, String> map = new HashMap<>();
                map.put("value", auth);
                event.getContexts().put("JWT", map);
                event.getContexts().forEach((s, object) -> {
                    System.out.println("s = " + s);
                    System.out.println("object = " + object);
                });
            }
        }
    }
}
```

다만 이렇게 하더라도 주의해야할 점이 바로 Data Scrubber 설정을 꺼야한다는 것이다.

아래와 같이 프로젝트 설정에 들어가서 두 옵션을 꺼주면 된다.

![](/images/velog/b532b097f2a9b574.png)

이러한 설정들을 통해 실제 JWT 토큰이 Sentry Issue 에 찍히는 것을 볼 수 있었다.

![](/images/velog/66f5d56e1e21e14c.png)

> 다시 강조하지만 운영서버에서는 절대로 해당 처리를 하면 안 된다.
>
> 운영서버 브랜치에서 코드를 지우던지, 필자와 같이 프로파일 설정을 처리하게끔 하여
>
> 실제 사용자의 개인정보 유출을 막자

# To Be Discussed 👀

Sentry 쓰고 있는 입장에서 변명을 좀 하자면,, 사실 별로 쓰고 싶지도 권장하고 싶지도 않다.

그저 도입이 편하다는 이유로 API 설계를 Sentry 측에 공개하고, Sentry 정책을 자세히 살펴야한다는 게 납득이 되지 않기 때문이다.

그럼에도 Sentry 를 쓰게된 계기는 아래와 같다.

- 초기에는 직접 만들 생각이었다.
  - Errbit 을 셀프 호스팅하거나
  - 모니터링 서버 & 에러 전용 파이프라인 구축, Go 기반 에러 모니터링 서버 생성하거나
- 하지만 팀 내에서 모니터링 서버 도입을 꺼려했다.
  - 지원해줄 돈도 시간도 없다는 입장이였다.
  - 설득을 하고자 했으나 모니터링 영역은 설득에는 시간이 필요한 부분이었다.
  - 유지보수를 하게 되었을 때 비로소 제대로된 효과를 발휘하기 때문이다.
  - 납득을 못 하는 건 아니다.

시장성과 제품 출시시점은 반비례하니,,

- ROI 에 따라 결국 Sentry 를 도입하게 되었다.

필자와 같은 상황이 아니라면 모니터링 파이프라인 재구성을 고려해보는 게 어떨까?

# Reference 📚

[HTTP Headers :: Sentry Java SDK](https://docs.sentry.io/platforms/java/data-management/data-collected/#http-headers)

[Attach HTTP headers to Sentry request #594](https://github.com/getsentry/sentry-java/issues/594)

[Registering Custom Event Processor](https://docs.sentry.io/platforms/java/guides/spring-boot/advanced-usage/#registering-custom-event-processor)

[EventProcessor](https://github.com/getsentry/sentry-java/blob/7074d0b5b54d5478d6d12b6a744af3e9736b014f/sentry/src/main/java/io/sentry/EventProcessor.java#L10)

[Why am I seeing "[Filtered]" in my event data?](https://sentry.zendesk.com/hc/en-us/articles/24501815773595-Why-am-I-seeing-Filtered-in-my-event-data)

[Server-Side Data Scrubbing](https://docs.sentry.io/security-legal-pii/scrubbing/server-side-scrubbing/)
