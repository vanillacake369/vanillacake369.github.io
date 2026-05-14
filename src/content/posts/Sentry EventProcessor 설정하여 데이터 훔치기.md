---
description: "sentry 는 scrubbing 설정을 조정하여 요청 시점의 헤더와 사용자 데이터를 볼 수 있다."
date: 2025-11-27
tags: [java, tools]
lang: ko
draft: false
---

# Why?

sentry 는 scrubbing 설정을 조정하여 요청 시점의 헤더와 사용자 데이터를 볼 수 있다.

허나 예전에 spring reactor 를 사용했을 때는 이게 안 되고 있어
직접 디스코드 방에 sdk 조작가능을 물어봤었는데 그 때의 경험을 적어남겨본다.

# What?

## 이슈

스프링 부트 애플리케이션에 센트리 자바 SDK를 사용하고 있습니다.
sendDefaultPii=true 로 설정해도 인증 헤더 값이 차단 목록([여기 참조](https://docs.sentry.io/platforms/java/data-management/data-collected/#http-headers[^1]))에 의해 필터링되는 것을 확인했습니다.

개발 단계에서 센트리가 요청 인증 헤더 — e.g.

JWT 토큰 — 를 맞춤 설정하여 표시하도록
HTTP 헤더의 차단 목록을 변경할 수 있는지 알고 싶습니다.

이를 위한 방법이나 해결책이 있을까요?

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

```

```java
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

,,,

```

> 해결책

> 💡 Even if you changed the behaviour in the SDK, it would be scrubbed by backend PII scrubbing rules (unless you disable those but then they would be disabled in prod as well, we don't recommend doing that).

Instead, you can create a custom `EventProcessor` which copies the header in the event context, like this:

위와 같이 조정하면 sdk 상에서 event processor 를 직접 돌려서 우리가 훔치고 싶은 데이터를 보여준다.

[^1]: https://docs.sentry.io/platforms/java/data-management/data-collected/#http-headers <https://docs.sentry.io/platforms/java/data-management/data-collected/#http-headers>
