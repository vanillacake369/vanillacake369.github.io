---
title: "JPA가 정상 동작하는데 테이블을 생성하지 않는 이슈 해결"
description: "Spring Boot + JPA 환경에서 ddl-auto 설정이 제대로 동작하지 않아 테이블이 생성되지 않는 원인과 해결 방법을 정리한다."
date: 2026-02-25
tags: [java]
lang: ko
draft: false
---

# 문제 상황

Spring Boot + JPA 프로젝트에서 엔티티를 정의하고 애플리케이션을 실행했지만, DB에 테이블이 자동 생성되지 않았다.
JPA 자체는 정상 동작하는 것처럼 보였고, 에러 로그도 없었다.

# 원인

JPA의 자동 DDL 생성이 동작하려면 세 가지 설정이 모두 올바르게 맞아야 한다.

| 설정 | 역할 | 기본값 |
|---|---|---|
| `spring.jpa.hibernate.ddl-auto` | 스키마 생성 전략 | `none` (운영 DB) / `create-drop` (임베디드 DB) |
| `spring.jpa.generate-ddl` | DDL 생성 활성화 여부 | `false` |
| `spring.jpa.database-platform` | Hibernate Dialect 지정 | 자동 감지 |

문제는 세 곳에서 발생할 수 있다.

## 1. ddl-auto가 none이거나 누락

`ddl-auto`를 명시하지 않으면, 외부 DB(MySQL, PostgreSQL 등) 연결 시 기본값이 `none`이 되어 테이블을 생성하지 않는다.
임베디드 DB(H2)를 사용할 때만 기본값이 `create-drop`이다.

## 2. Dialect 자동 감지 실패

`database-platform`을 지정하지 않으면 Hibernate가 JDBC 연결 정보로 Dialect를 자동 감지한다.
드라이버 설정이 잘못되었거나 DB 버전이 맞지 않으면 감지에 실패하여 DDL 생성이 건너뛰어질 수 있다.

## 3. generate-ddl이 false

`generate-ddl`이 `false`이면 `ddl-auto` 설정과 무관하게 DDL 생성이 비활성화된다.

# 해결 방법

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: create    # 시작 시 기존 테이블 DROP 후 재생성
    database-platform: org.hibernate.dialect.MySQLDialect
    generate-ddl: true     # DDL 생성 활성화
    show-sql: true         # 생성되는 SQL 확인용
    properties:
      hibernate:
        format_sql: true   # SQL 포맷팅
```

위 설정을 적용한 후 테이블이 정상 생성되었다.

# ddl-auto 옵션 정리

| 값 | 동작 | 적합한 환경 |
|---|---|---|
| `none` | 아무것도 하지 않음 | 운영 |
| `validate` | 엔티티와 테이블 매핑 검증만 | 운영/스테이징 |
| `update` | 변경된 엔티티에 맞춰 ALTER | 개발 |
| `create` | 시작 시 DROP → CREATE | 개발/테스트 |
| `create-drop` | 시작 시 CREATE, 종료 시 DROP | 테스트 |

운영 환경에서는 `none` 또는 `validate`를 사용해야 한다.
`create`나 `update`를 운영에 사용하면 데이터 유실이나 의도치 않은 스키마 변경이 발생할 수 있다.

개발 환경에서 테이블이 생성되지 않을 때는 다음 순서로 확인한다.

1. `ddl-auto`가 `create` 또는 `update`로 설정되어 있는가
2. `generate-ddl`이 `true`인가
3. `database-platform`이 실제 DB에 맞는 Dialect인가
4. `show-sql: true`로 DDL SQL이 출력되는지 확인

[^1]: Spring Boot JPA 설정 공식 문서. <https://docs.spring.io/spring-boot/docs/current/reference/html/data.html#data.sql.jpa-and-spring-data>
[^2]: Hibernate ddl-auto 옵션 설명. <https://docs.jboss.org/hibernate/orm/6.4/userguide/html_single/Hibernate_User_Guide.html#configurations-hbmddl>
