---
description: "운영 중 슬로우 쿼리를 놓치고 있다면? Hibernate LOG_QUERIES_SLOWER_THAN_MS 설정부터 Sentry EventProcessor 기반 자동 감지·알림 파이프라인까지 한 번에 정리한다."
tags: [journal]
lang: ko
draft: false
---

# Why?

운영 환경에서 어떤 쿼리가 느린지 실시간으로 파악하기는 쉽지 않다. 데이터베이스 쿼리 성능은 애플리케이션 전체 성능에 직접적인 영향을 미치지만, 정작 현장에서는 다음과 같은 요청이 반복된다.

- "어제 갑자기 API 응답이 느려졌는데 원인을 모르겠어요"
- "특정 시간대에만 느려지는 쿼리가 있는 것 같은데 찾기 어려워요"
- "슬로우 쿼리 로그는 있지만 알림이 안 와서 놓치고 있어요"

로그가 있어도 알림이 없으면 결국 사후에야 문제를 인지하게 된다. 따라서 본 포스트에서는 다음 두 가지를 다룬다.

- 슬로우 쿼리를 로그 상으로 확인하는 법 (Hibernate 설정)
- 슬로우 쿼리를 자동으로 감지하고 알림을 받는 방법 (Sentry / Grafana)

# What?

## Hibernate 상에서 슬로우 쿼리를 감지하는 이유 🔍

`spring.jpa.properties.hibernate.session.events.log.LOG_QUERIES_SLOWER_THAN_MS` 옵션[^5]을 설정하면 임계값보다 느린 쿼리를 `org.hibernate.SQL_SLOW` 로거로 자동 출력한다. 별도 AOP나 인터셉터 없이 Hibernate 내부에서 측정하므로 오버헤드가 거의 없다.

아래는 전체 설정 예시이다.

```yaml
# Hibernate 6.6 JPA 설정 (로컬 환경)
# 참고: https://docs.hibernate.org/orm/6.6/userguide/html_single/Hibernate_User_Guide.html
spring:
  datasource:
    hikari:
      leak-detection-threshold: 2000 # 커넥션 누수 감지 임계값 (2초 넘게 반환 안 되면 스택트레이스 출력)
      maximum-pool-size: 20 # 최대 커넥션 풀 크기 (기본 10에서 임시 상향, DB가 감당 가능할 때만)
      connection-timeout: 30000 # 커넥션 대기 시간 (30초)
  jpa:
    hibernate:
      ddl-auto: none # DDL 자동생성 정책 (none: 스키마 자동생성 비활성화)
    show-sql: false # SQL 쿼리 콘솔 출력 여부
    open-in-view: false # OSIV(Open Session In View) 사용 여부 (false 권장)
    properties:
      hibernate:
        default_batch_fetch_size: 1000 # 배치 페칭 기본 크기 (N+1 문제 해결, 최적화 옵션)
        generate_statistics: false # JPA/Hibernate 통계 수집 여부 (성능 모니터링용)
        jdbc:
          time_zone: Asia/Seoul # JDBC 타임존 설정
          batch_size: 1000 # JDBC 배치 크기 (bulk insert/update 시 사용)
        order_inserts: true # INSERT 문 정렬 (배치 효율성 향상)
        order_updates: true # UPDATE 문 정렬 (배치 효율성 향상)
        globally_quoted_identifiers: true # 모든 식별자 인용 처리 (예약어 사용 가능)
        format_sql: true # SQL문 포맷팅하여 출력 (가독성 향상)
        highlight_sql: true # SQL문에 색상 부여 (콘솔 가독성 향상)
        dialect: org.hibernate.dialect.PostgreSQLDialect # PostgreSQL 방언 설정
        # 슬로우 쿼리 설정 (Hibernate 6.6+)
        # 참고: https://docs.hibernate.org/orm/6.6/javadocs/org/hibernate/cfg/JdbcSettings.html#LOG_QUERIES_SLOWER_THAN_MS
        session:
          events:
            log:
              LOG_QUERIES_SLOWER_THAN_MS: ${SLOW_QUERY_LIMIT:1} # 슬로우 쿼리 로깅 임계값 (밀리초 단위)

# p6spy 설정
decorator:
  datasource:
    p6spy:
      enable-logging: true

# 로깅 설정
# 참고: https://docs.hibernate.org/orm/6.6/userguide/html_single/Hibernate_User_Guide.html#logging
logging:
  level:
    root: INFO # 루트 로거 레벨
    com.restApi.restApiSpringBootApp: DEBUG # 애플리케이션 로그
    org.springframework: WARN # Spring Framework 로그
    org.springframework.web: DEBUG # Spring MVC 웹 요청/응답 로그
    # Hibernate 로깅 설정
    org.hibernate.cfg: DEBUG # Hibernate 설정 로딩 로그
    org.hibernate.SQL: DEBUG # SQL 쿼리 실행 로그
    org.hibernate.SQL_SLOW: INFO # 슬로우 쿼리 로그 (필수!)
    org.hibernate.stat: DEBUG # JPA/Hibernate 통계 로그 (쿼리 실행 횟수, 캐시 히트율 등)
    org.hibernate.orm.jdbc.bind: TRACE # JDBC 파라미터 바인딩 값 로깅 (보안 주의)
```

아래 테스트코드를 실행해보면 슬로우 쿼리가 로그에 찍히는 것을 확인할 수 있다.

```java
// 지도 상 모든 영상 조회 (PostGIS 사용)

@Test
@DisplayName("지도 상 모든 영상 조회")
void 지도상모든영상조회() {
    // GIVEN
    ContentOnMapSearchReq req = ContentOnMapSearchReq.builder()
        // 서울 시청 위경도
        .userLatitude(BigDecimal.valueOf(37.5666))
        .userLongitude(BigDecimal.valueOf(126.9782))
        // 반경 50 미터
        .mapRadius(BigDecimal.valueOf(50))
        // 카테고리 조회는 없음
        .ccIdxes(null)
        .build();

    // WHEN
    ListResult<ContentOnMapSearchResp> contentsOnMap = contentUseCase.getContentsOnMap(req);

    // THEN
    assertNotNull(contentsOnMap);
    assertFalse(contentsOnMap.getList().isEmpty());
}
```

```bash
05:47:06.084 [main] DEBUG org.hibernate.SQL -
    select
        ce1_0."co_idx",
        ce1_0."ad_idx",
        ce1_0."co_approval_status",
        ...
    from
        "hama_content" ce1_0
    left join
        "hama_content_by_category" cbce1_0
            on cbce1_0."co_idx"=ce1_0."co_idx"
    left join
        "hama_content_category" cce1_0
            on cbce1_0."cc_idx"=cce1_0."cc_idx"
    where
        ce1_0."co_approval_status"=?
        and ce1_0."is_visible"=?
        and st_dwithin(st_transform(ce1_0."co_point", ?), st_transform(?, ?), ?)=?
05:47:06.088 [main] TRACE org.hibernate.orm.jdbc.bind - binding parameter (1:VARCHAR) <- [APPROVED]
05:47:06.088 [main] TRACE org.hibernate.orm.jdbc.bind - binding parameter (2:VARCHAR) <- [YES]
05:47:06.088 [main] TRACE org.hibernate.orm.jdbc.bind - binding parameter (3:INTEGER) <- [3857]
05:47:06.090 [main] TRACE org.hibernate.orm.jdbc.bind - binding parameter (4:GEOMETRY) <- [POINT (126.9782 37.5666)]
05:47:06.289 [main] TRACE org.hibernate.orm.jdbc.bind - binding parameter (5:INTEGER) <- [3857]
05:47:06.289 [main] TRACE org.hibernate.orm.jdbc.bind - binding parameter (6:DOUBLE) <- [50.0]
05:47:06.289 [main] TRACE org.hibernate.orm.jdbc.bind - binding parameter (7:BOOLEAN) <- [true]
# 슬로우 쿼리 시간과 그에 해당하는 쿼리를 보여준다.
05:47:06.356 [main] INFO  org.hibernate.SQL_SLOW - Slow query took 65 milliseconds [select ce1_0."co_idx",...from "hama_content" ce1_0 ... where ce1_0."co_approval_status"=? and ce1_0."is_visible"=? and st_dwithin(...)=?]
05:47:06.402 [main] DEBUG org.hibernate.SQL -
    select
        ae1_0."ad_idx",
        ae1_0."ad_id",
        ae1_0."ad_password",
        ae1_0."created_at",
        ae1_0."updated_at"
    from
        "hama_admin" ae1_0
    where
        ae1_0."ad_idx"=?
05:47:06.402 [main] TRACE org.hibernate.orm.jdbc.bind - binding parameter (1:BIGINT) <- [1]
# 슬로우 쿼리 시간과 그에 해당하는 쿼리를 보여준다.
05:47:06.455 [main] INFO  org.hibernate.SQL_SLOW - Slow query took 53 milliseconds [select ae1_0."ad_idx",ae1_0."ad_id",ae1_0."ad_password",ae1_0."created_at",ae1_0."updated_at" from "hama_admin" ae1_0 where ae1_0."ad_idx"=?]
```

이제 각각의 옵션이 어떤 역할을 수행하는지 살펴보자.

## 1. DataSource 설정 (HikariCP) 🏊

HikariCP는 Spring Boot의 기본 커넥션 풀로, 고성능과 낮은 오버헤드가 특징이다.[^6]

```yaml
spring:
  datasource:
    hikari:
      leak-detection-threshold: 2000 # 커넥션 누수 감지 임계값 (2초 넘게 반환 안 되면 스택트레이스 출력)
      maximum-pool-size: 20 # 최대 커넥션 풀 크기
      connection-timeout: 30000 # 커넥션 대기 시간 (30초)
```

| 속성 | 기본값 | 설명 | 참고 문서 |
| --- | --- | --- | --- |
| `leak-detection-threshold` | 0 (비활성) | 커넥션 누수 감지 임계값(ms). 설정 시간 내 반환되지 않으면 스택트레이스 출력. 권장: 2000ms | [HikariCP GitHub][^6] |
| `maximum-pool-size` | 10 | 최대 커넥션 풀 크기. DB 서버 용량과 동시 요청 수를 고려하여 설정 | [HikariCP GitHub][^6] |
| `connection-timeout` | 30000 | 커넥션 획득 대기 시간(ms). 초과 시 SQLException 발생 | [HikariCP GitHub][^6] |

## 2. JPA 핵심 설정 ⚙️

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: none # DDL 자동생성 정책 (none: 스키마 자동생성 비활성화)
    show-sql: false # SQL 쿼리 콘솔 출력 여부
    open-in-view: false # OSIV(Open Session In View) 사용 여부 (false 권장)
```

| 속성 | 기본값 | 설명 | 참고 문서 |
| --- | --- | --- | --- |
| `ddl-auto` | none | DDL 자동 생성 정책. `none`/`validate`/`update`/`create`/`create-drop`. **운영환경은 none 필수** | [Spring Boot Docs](https://docs.spring.io/spring-boot/docs/current/reference/html/howto.html#howto.data-initialization) |
| `show-sql` | false | SQL 콘솔 출력. `org.hibernate.SQL` 로거와 중복되므로 **false 권장** | [Spring Boot Docs](https://docs.spring.io/spring-boot/docs/current/reference/html/application-properties.html#application-properties.data.spring.jpa.show-sql) |
| `open-in-view` | true | OSIV 패턴. **false 권장** (성능 이슈, 트랜잭션 범위 명확화) | [Spring Boot Docs](https://docs.spring.io/spring-boot/docs/current/reference/html/application-properties.html#application-properties.data.spring.jpa.open-in-view) |

## 3. Hibernate 속성 설정 🔧

```yaml
spring:
  jpa:
    properties:
      hibernate:
        default_batch_fetch_size: 1000 # 배치 페칭 기본 크기 (N+1 문제 해결)
        generate_statistics: false # JPA/Hibernate 통계 수집 여부 (성능 모니터링용)
        jdbc:
          time_zone: Asia/Seoul # JDBC 타임존 설정
          batch_size: 1000 # JDBC 배치 크기 (bulk insert/update 시 사용)
        order_inserts: true # INSERT 문 정렬 (배치 효율성 향상)
        order_updates: true # UPDATE 문 정렬 (배치 효율성 향상)
        globally_quoted_identifiers: true # 모든 식별자 인용 처리 (예약어 사용 가능)
        format_sql: true # SQL문 포맷팅하여 출력 (가독성 향상)
        highlight_sql: true # SQL문에 색상 부여 (콘솔 가독성 향상)
        dialect: org.hibernate.dialect.PostgreSQLDialect # PostgreSQL 방언 설정
        session:
          events:
            log:
              LOG_QUERIES_SLOWER_THAN_MS: ${SLOW_QUERY_LIMIT:1} # 슬로우 쿼리 로깅 임계값 (밀리초 단위)
```

> **3.1 배치 처리 및 성능 최적화**

| 속성 | 권장값 | 설명 | 참고 문서 |
| --- | --- | --- | --- |
| `default_batch_fetch_size` | 100~1000 | IN 절 배치 페칭 크기. **N+1 문제 해결의 핵심 옵션** | [Hibernate User Guide - Fetching](https://docs.hibernate.org/orm/6.6/userguide/html_single/Hibernate_User_Guide.html#fetching-batch) |
| `jdbc.batch_size` | 100~1000 | JDBC 배치 크기. Bulk INSERT/UPDATE 시 성능 향상 | [Hibernate User Guide - Batching](https://docs.hibernate.org/orm/6.6/userguide/html_single/Hibernate_User_Guide.html#batch) |
| `order_inserts` | true | INSERT 문 정렬. 같은 테이블 INSERT를 그룹화하여 배치 효율 향상 | [Hibernate User Guide - Batching](https://docs.hibernate.org/orm/6.6/userguide/html_single/Hibernate_User_Guide.html#batch) |
| `order_updates` | true | UPDATE 문 정렬. 같은 테이블 UPDATE를 그룹화하여 배치 효율 향상 | [Hibernate User Guide - Batching](https://docs.hibernate.org/orm/6.6/userguide/html_single/Hibernate_User_Guide.html#batch) |

> **3.2 SQL 출력 및 디버깅**

| 속성 | 권장값 | 설명 | 참고 문서 |
| --- | --- | --- | --- |
| `format_sql` | true | SQL 포맷팅 출력. 가독성 향상을 위해 줄바꿈/들여쓰기 적용 | [Hibernate User Guide - Logging](https://docs.hibernate.org/orm/6.6/userguide/html_single/Hibernate_User_Guide.html#settings-format_sql) |
| `highlight_sql` | true | SQL 하이라이트. 콘솔에서 키워드에 색상 부여 | [Hibernate User Guide - Logging](https://docs.hibernate.org/orm/6.6/userguide/html_single/Hibernate_User_Guide.html#settings-highlight_sql) |
| `generate_statistics` | true | 통계 수집 활성화. **슬로우 쿼리 감지에 필수!** | [Hibernate User Guide - Statistics](https://docs.hibernate.org/orm/6.6/userguide/html_single/Hibernate_User_Guide.html#statistics) |

> **3.3 슬로우 쿼리 설정 (Hibernate 6.6+)**

| 속성 | 설명 | 참고 문서 |
| --- | --- | --- |
| `hibernate.session.events.log.LOG_QUERIES_SLOWER_THAN_MS` | 슬로우 쿼리 임계값(ms). 설정값 초과 시 로그 출력 | [Hibernate JavaDoc - JdbcSettings][^5] |

> **3.4 기타 설정**

| 속성 | 권장값 | 설명 | 참고 문서 |
| --- | --- | --- | --- |
| `jdbc.time_zone` | Asia/Seoul | JDBC 타임존. DB와 애플리케이션 간 시간 동기화 | [Hibernate User Guide - Time Zone](https://docs.hibernate.org/orm/6.6/userguide/html_single/Hibernate_User_Guide.html#mapping-basic-datetime-timezone) |
| `globally_quoted_identifiers` | true | 모든 식별자 인용 처리. SQL 예약어를 컬럼명으로 사용 가능 | [Hibernate User Guide - Identifiers](https://docs.hibernate.org/orm/6.6/userguide/html_single/Hibernate_User_Guide.html#naming-strategies) |
| `dialect` | 자동감지 | DB 방언. **Hibernate 6.x부터 자동 감지되므로 명시 불필요** | [Hibernate User Guide - Dialect](https://docs.hibernate.org/orm/6.6/userguide/html_single/Hibernate_User_Guide.html#database-dialect) |

## 4. 로깅 설정 📋

Hibernate 6.x에서는 로거 패키지명이 변경되었다. 버전에 맞는 로거명을 사용하지 않으면 슬로우 쿼리 로그가 출력되지 않으니 주의가 필요하다.[^3]

```yaml
# 로깅 설정
# 참고: https://docs.hibernate.org/orm/6.6/userguide/html_single/Hibernate_User_Guide.html#logging
logging:
  level:
    root: INFO                                # 루트 로거 레벨
    com.restApi.restApiSpringBootApp: DEBUG   # 애플리케이션 로그
    org.springframework: WARN                 # Spring Framework 로그
    org.springframework.web: DEBUG            # Spring MVC 웹 요청/응답 로그
    # Hibernate 로깅 설정
    org.hibernate.cfg: DEBUG                  # Hibernate 설정 로딩 로그
    org.hibernate.SQL: DEBUG                  # SQL 쿼리 실행 로그
    org.hibernate.SQL_SLOW: INFO              # 슬로우 쿼리 로그 (필수!)
    org.hibernate.stat: DEBUG                 # JPA/Hibernate 통계 로그 (쿼리 실행 횟수, 캐시 히트율 등)
    org.hibernate.orm.jdbc.bind: TRACE        # JDBC 파라미터 바인딩 값 로깅 (보안 주의)
```

| 로거 | 레벨 | 출력 내용 | 참고 문서 |
| --- | --- | --- | --- |
| `org.hibernate.SQL` | DEBUG | 실행되는 SQL 쿼리 (포맷팅/하이라이트 적용) | [Hibernate User Guide - Logging][^3] |
| `org.hibernate.orm.jdbc.bind` | TRACE | PreparedStatement 파라미터 바인딩 값 | [Hibernate User Guide - Logging][^3] |
| `org.hibernate.stat` | DEBUG | 쿼리 통계 및 **슬로우 쿼리 정보** (`time: Xms`) | [Hibernate User Guide - Statistics](https://docs.hibernate.org/orm/6.6/userguide/html_single/Hibernate_User_Guide.html#statistics) |
| `org.hibernate.engine.internal.StatisticalLoggingSessionEventListener` | OFF | Session Metrics 로그 비활성화 (너무 많이 출력됨) | - |

## 5. 주요 주의사항 ⚠️

### SQL 중복 출력 방지

`show-sql: true`와 `org.hibernate.SQL: DEBUG`를 동시에 사용하면 SQL이 두 번 출력된다. 둘 중 하나만 설정해서 쓰는 것을 권장한다.

| 설정 | 출력 형태 | format_sql 적용 | highlight_sql 적용 |
| --- | --- | --- | --- |
| `show-sql: true` | `[Hibernate] select...` | X | X |
| `org.hibernate.SQL: DEBUG` | `DEBUG org.hibernate.SQL - select...` | O | O |

### Hibernate 6.x 변경사항

본인이 사용하는 Hibernate 버전에 따라 syntax를 맞춰서 설정한다.

| 항목 | Hibernate 5.x | Hibernate 6.x |
| --- | --- | --- |
| Dialect 설정 | 명시 필요 | 자동 감지 (명시 시 경고) |
| 슬로우 쿼리 로거 | `org.hibernate.SQL_SLOW` | `org.hibernate.stat` |
| 바인딩 로거 | `org.hibernate.type` | `org.hibernate.orm.jdbc.bind` |

## 슬로우쿼리 자동감지 & 알림이 필요한 이유 🚨

Hibernate의 `LOG_QUERIES_SLOWER_THAN_MS` 옵션으로 슬로우 쿼리 로그를 남길 수 있지만, 로그만으로는 부족하다. 우리에게 필요한 건 **즉각적인 알림**과 **체계적인 추적**이다. 자동으로 감지하고 사내 개발팀에 알림을 보내는 파이프라인 구성이 필요하다.

방법은 두 가지가 있다.

- Sentry SDK 사용
- Prometheus와 Grafana Alert Rule 사용

하나씩 살펴보도록 하자.

## 센트리를 통해 슬로우쿼리를 감지하는 방법 🛡️

Sentry의 `EventProcessor`에 대한 커스텀 구현체를 만들어 모든 DB 쿼리를 검사하고, 임계값을 초과하면 자동으로 Sentry 이벤트를 생성하도록 한다.[^10]

![](/images/velog/ad361b8a2e8f95c7.png)

다만 선행조건이 있다. **`sentry-jdbc` 없이는 이 솔루션이 작동하지 않는다.** `sentry-jdbc`가 하는 일은 JDBC 레벨에서 모든 쿼리를 가로채서 Sentry Span으로 변환하는 것이다. 이 Span이 있어야 우리의 EventProcessor가 검사할 대상이 생긴다.[^11]

![](/images/velog/ab3f59589645d47a.png)

![](/images/velog/e74a92ccdf17a2e4.png)

이제 원리와 과정을 살펴봤으니 어떻게 구성하는지를 알아보자.

### 1) sentry-jdbc 의존성 추가

```groovy
dependencies {
    implementation 'io.sentry:sentry-spring-boot-starter-jakarta:8.20.0'
    implementation 'io.sentry:sentry-jdbc:8.20.0'  // 필수!
}
```

### 2) application.yaml 설정

> `slow-query`의 threshold 값을 `monitoring.slow-query`를 바라보게끔 하였다. Hibernate 슬로우 쿼리 설정과 동일한 값으로 관리되도록 별도의 `monitoring.slow-query` 파일로 분리해두었기 때문이다. 그게 아니라면 `100`처럼 원하는 threshold 값으로 직접 설정해주면 된다.

```yaml
sentry:
  dsn: ${SENTRY_DSN}
  environment: ${SPRING_PROFILES_ACTIVE}
  traces-sample-rate: 1.0
  slow-query:
    threshold-ms: ${monitoring.slow-query.threshold-ms:100} # 슬로우 쿼리 임계값
    critical-threshold-ms: ${monitoring.slow-query.threshold-ms:100} # 크리티컬 쿼리 임계값
```

### 3) DataSource 설정

`sentry-jdbc`에서 span을 생성하는 `SentryJdbcEventListener`가 p6spy 기반이다.[^11] 공식 문서에서도 아래와 같이 명시하고 있다.

> Sentry JDBC integration provides the `SentryJdbcEventListener` for [P6Spy](https://github.com/p6spy/p6spy/) database activity interceptor, which creates a span for each JDBC statement executed over a proxied instance of `javax.sql.DataSource`.

따라서 아쉽게도 p6spy는 Sentry를 통한 슬로우 쿼리 감지의 필연조건이다.

```yaml
spring:
  datasource:
    url: jdbc:p6spy:postgresql://localhost:5432/mydb
    driver-class-name: com.p6spy.engine.spy.P6SpyDriver
```

### 4) EventProcessor 커스텀 구현체 구현

```java
package com.cubalto.justreet.global.config.sentry;

import io.sentry.EventProcessor;
import io.sentry.Hint;
import io.sentry.Sentry;
import io.sentry.SentryEvent;
import io.sentry.SentryLevel;
import io.sentry.protocol.SentrySpan;
import io.sentry.protocol.SentryTransaction;
import jakarta.validation.constraints.NotNull;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 느린 데이터베이스 쿼리를 감지하고 보고하기 위한 Sentry EventProcessor.
 * 데이터베이스 작업을 모니터링하고, 구성된 임계값을 초과하는 쿼리에 대해 별도의 Sentry 이벤트를 전송한다.
 */
@Slf4j
@Component
public class SentrySlowQueryEventProcessor implements EventProcessor {

    // 정규표현식 사전 컴파일 (성능 최적화)
    private static final Pattern STRING_LITERAL_PATTERN = Pattern.compile("'[^']*'");
    private static final Pattern NUMBER_PATTERN = Pattern.compile("\\d+");
    private static final Pattern WHITESPACE_PATTERN = Pattern.compile("\\s+");

    @Value("${sentry.slow-query.threshold-ms:1000}")
    private long slowQueryThresholdMs;

    @Value("${sentry.slow-query.critical-threshold-ms:3000}")
    private long criticalQueryThresholdMs;

    @Override
    public @NotNull SentryEvent process(
        @NotNull SentryEvent event,
        @NotNull Hint hint
    ) {
        // SentryEvent는 현재 처리하지 않음
        return event;
    }

    @Override
    public @NotNull SentryTransaction process(
        @NotNull SentryTransaction transaction,
        @NotNull Hint hint
    ) {
        log.info("SentryTransaction received: {}, spans count: {}",
            transaction.getTransaction(),
            transaction.getSpans().size());

        for (SentrySpan span : transaction.getSpans()) {
            String op = span.getOp();

            if (op != null && op.startsWith("db")) {
                Double durationMs = calculateDurationMs(span);

                if (durationMs != null && durationMs > slowQueryThresholdMs) {
                    log.warn(
                        "Slow query detected: {}ms - {} (transaction: {})",
                        durationMs.longValue(),
                        truncateQuery(span.getDescription(), 100),
                        transaction.getTransaction()
                    );

                    captureSlowQueryEvent(span, durationMs, transaction);
                }
            }
        }

        return transaction;
    }

    /**
     * 슬로우 쿼리를 별도의 Sentry 이벤트로 캡처
     *
     * @param span        데이터베이스 span
     * @param durationMs  쿼리 실행 시간 (밀리초)
     * @param transaction 상위 트랜잭션
     */
    private void captureSlowQueryEvent(
        SentrySpan span,
        Double durationMs,
        SentryTransaction transaction
    ) {
        // 레벨 결정
        SentryLevel level = durationMs > criticalQueryThresholdMs
            ? SentryLevel.ERROR
            : SentryLevel.WARNING;

        Sentry.withScope(scope -> {
            scope.setLevel(level);

            // 태그 설정
            scope.setTag("query.operation", span.getOp());
            scope.setTag("query.duration_ms", String.valueOf(durationMs.longValue()));
            scope.setTag("transaction.name", transaction.getTransaction());

            // 컨텍스트 설정
            // Note: HashMap 생성은 Sentry의 scope 격리 특성상 필요함 (Thread-safety)
            Map<String, Object> queryContext = new HashMap<>();
            queryContext.put("query", span.getDescription());
            queryContext.put("duration_ms", durationMs);
            queryContext.put("threshold_ms", slowQueryThresholdMs);
            queryContext.put("critical_threshold_ms", criticalQueryThresholdMs);
            queryContext.put("span_id", span.getSpanId().toString());
            queryContext.put("trace_id", span.getTraceId().toString());
            scope.setContexts("slow_query", queryContext);

            // fingerprint 설정 (동일 쿼리 그룹화)
            scope.setFingerprint(java.util.Arrays.asList(
                "slow-query",
                normalizeQuery(span.getDescription())
            ));

            // 메시지 캡처 (레벨을 동적으로 설정)
            Sentry.captureMessage(
                String.format("Slow DB Query: %dms - %s",
                    durationMs.longValue(),
                    truncateQuery(span.getDescription(), 100)),
                level
            );
        });
    }

    /**
     * span의 실행 시간을 밀리초 단위로 계산
     */
    private Double calculateDurationMs(SentrySpan span) {
        Double startTimestamp = span.getStartTimestamp();
        Double endTimestamp = span.getTimestamp();

        if (startTimestamp == null || endTimestamp == null) {
            return null;
        }
        return (endTimestamp - startTimestamp) * 1000;
    }

    /**
     * 쿼리 정규화 (fingerprint용).
     * 파라미터 값을 제거하여 동일 쿼리 패턴을 그룹화한다. 정규표현식은 static으로 사전 컴파일되어 성능이 최적화된다.
     */
    private String normalizeQuery(String query) {
        if (query == null) {
            return "unknown";
        }

        String normalized = STRING_LITERAL_PATTERN.matcher(query).replaceAll("?");
        normalized = NUMBER_PATTERN.matcher(normalized).replaceAll("?");
        normalized = WHITESPACE_PATTERN.matcher(normalized).replaceAll(" ");

        return normalized.trim();
    }

    /**
     * 쿼리 문자열을 지정된 길이로 자르기
     */
    private String truncateQuery(String query, int maxLength) {
        if (query == null) {
            return "N/A";
        }
        if (query.length() <= maxLength) {
            return query;
        }
        return query.substring(0, maxLength) + "...";
    }
}
```

구현의 핵심 로직은 두 가지다.

**임계값 이중 구조**: 실행시간이 `slowQueryThresholdMs`보다 느리면 슬로우 쿼리 이벤트를 발행하고, 이후 `criticalQueryThresholdMs`와 비교하여 심각도에 따라 `WARNING` 또는 `ERROR` 레벨로 구분한다.

```java
if (durationMs != null && durationMs > slowQueryThresholdMs) {
    captureSlowQueryEvent(span, durationMs, transaction);
}

// captureSlowQueryEvent 내부
SentryLevel level = durationMs > criticalQueryThresholdMs
    ? SentryLevel.ERROR
    : SentryLevel.WARNING;
```

**쿼리 정규화를 통한 이벤트 그룹화**: 같은 쿼리 패턴이 100번 발생하면 이벤트도 100번 생성된다. 이를 막기 위해 파라미터 값을 제거한 정규화 쿼리를 Sentry의 `fingerprint`에 적재하여 동일 이벤트로 그룹핑되도록 처리하였다.

```java
scope.setFingerprint(java.util.Arrays.asList(
    "slow-query",
    normalizeQuery(span.getDescription())
));
```

실제로 테스트해보면 아래와 같이 로그와 Sentry 대시보드에 찍히는 것을 볼 수 있다.

```bash
2025-11-28T08:01:54.629+09:00  INFO 75372 --- [nio-8080-exec-1] org.hibernate.SQL_SLOW                   : Slow query took 48 milliseconds [select ae1_0."ad_idx",ae1_0."ad_id",ae1_0."ad_password",ae1_0."created_at",ae1_0."updated_at" from "hama_admin" ae1_0 where ae1_0."ad_idx"=?]
2025-11-28T08:01:54.720+09:00  INFO 75372 --- [nio-8080-exec-1] .c.j.g.c.s.SentrySlowQueryEventProcessor : SentryTransaction received: GET /api/v1/content/maps, spans count: 2
2025-11-28T08:01:54.720+09:00  WARN 75372 --- [nio-8080-exec-1] .c.j.g.c.s.SentrySlowQueryEventProcessor : Slow query detected: 93ms - select ce1_0."co_idx",ce1_0."ad_idx",ce1_0."co_approval_status",ce1_0."co_balance_empty",ce1_0."co_d... (transaction: GET /api/v1/content/maps)
2025-11-28T08:01:54.726+09:00  WARN 75372 --- [nio-8080-exec-1] .c.j.g.c.s.SentrySlowQueryEventProcessor : Slow query detected: 48ms - select ae1_0."ad_idx",ae1_0."ad_id",ae1_0."ad_password",ae1_0."created_at",ae1_0."updated_at" from "... (transaction: GET /api/v1/content/maps)
```

## 그라파나를 통해 슬로우쿼리를 감지하는 방법 📊

Sentry를 통한 로깅은 Sentry에 너무 종속적이다. 아예 raw level로 DB에 직접 접근하여 데이터 정보를 긁어오는 방법이 필요할 때는 모니터링 툴을 사용할 수 있다. 해당 부분은 Hibernate/Sentry 기반인 본 포스트의 취지에서 벗어나므로 방법만 짧고 굵게 설명하고 넘기겠다.

### 1) MySQL Exporter 사용하기

Prometheus exporter를 통해 MySQL에 직접 접근하여 실행되는 쿼리들과 수행시간을 감시하고, threshold보다 높은 항목에 대해 Grafana alert rule을 선언하여 사내에 알림이 오게끔 하는 방법이다.[^8] 이렇게 구성하려면 MySQL에서 `slow_query_log` 값을 활성화해주어야 한다.[^9]

### 2) Loki에 대한 쿼리 처리

Loki 사용 시 로그와 수행시간이 남는다. 이에 대해 LogQL을 사용하여 해당 부분에 대한 alert rule을 생성할 수 있다.

```bash
# 1초 이상 걸린 쿼리 필터링
{app="postgresql"}
  | pattern `<_> LOG:  duration: <duration> ms  statement: <query>`
  | duration > 1000

# JSON 포맷 로그인 경우
{app="api-server"}
  | json
  | duration_ms > 1000
  | line_format "{{.query}} took {{.duration_ms}}ms"
```

# 결론

운영 환경에서 슬로우 쿼리는 놓치기 쉽다. Hibernate의 `LOG_QUERIES_SLOWER_THAN_MS` 설정으로 로그를 남기는 것이 첫 번째 단계이고, 여기에 Sentry `EventProcessor`를 더하면 임계값 초과 시 자동 알림과 쿼리 패턴별 그룹화까지 갖출 수 있다. 더 나아가 Grafana + Loki 조합으로 로그 기반 alert rule을 구성하면 특정 툴에 종속되지 않는 모니터링 파이프라인을 완성할 수 있다.

[^3]: <https://docs.hibernate.org/orm/6.6/userguide/html_single/>

[^4]: <https://docs.hibernate.org/orm/6.6/javadocs/>

[^5]: <https://docs.hibernate.org/orm/6.6/javadocs/org/hibernate/cfg/JdbcSettings.html#LOG_SLOW_QUERY:~:text=false-,LOG_SLOW_QUERY,-static%20final%C2%A0>

[^6]: <https://github.com/brettwooldridge/HikariCP#gear-configuration-knobs-baby>

[^7]: <https://medium.com/@AlexanderObregon/slow-query-detection-in-spring-boot-with-jpa-logging-ef6e51667d6a>

[^8]: <https://severalnines.com/blog/how-monitor-mysql-containers-prometheus-deployment-standalone-and-swarm-part-one/>

[^9]: <https://dev.mysql.com/doc/refman/8.4/en/slow-query-log.html>

[^10]: <https://docs.sentry.io/product/issues/issue-details/performance-issues/slow-db-queries/>

[^11]: <https://docs.sentry.io/platforms/java/guides/spring/tracing/instrumentation/jdbc/>

[^12]: <https://turso.tech/blog/trace-slow-queries-and-capture-sqlite-errors-with-sentry>
