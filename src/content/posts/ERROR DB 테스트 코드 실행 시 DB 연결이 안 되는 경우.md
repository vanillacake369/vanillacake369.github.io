---
description: "Spring Boot 앱을 실행한 채 테스트를 돌리면 H2 파일 DB에 lock이 걸린다. 원인과 3가지 해결 방법을 정리한다."
date: 2026-02-25
tags: [java]
lang: ko
draft: false
---

# 문제 상황

Spring Boot 레포지토리 테스트를 작성하고 실행했더니 아래 예외가 반복 발생했다.

```
Caused by: org.h2.mvstore.MVStoreException: The file is locked
```

애플리케이션을 실행한 상태에서 테스트를 추가로 실행하면, H2 파일 모드 DB가 이미 앱 프로세스에 의해 잠겨 있기 때문에 테스트 프로세스가 접근하지 못한다.

# 원인

H2의 **파일 모드**(`jdbc:h2:file:~/test` 또는 `jdbc:h2:~/test`)는 기본적으로 단일 프로세스 전용이다.
하나의 JVM이 DB 파일을 열면 MVStore 엔진이 파일에 lock을 건다.
다른 JVM(테스트 프로세스)이 같은 파일에 접근하려 하면 `The file is locked` 예외가 발생한다.

| 모드                    | URL 예시                          | 동시 접근          |
| ----------------------- | --------------------------------- | ------------------ |
| 파일 모드 (기본)        | `jdbc:h2:~/test`                  | 단일 프로세스만    |
| 파일 모드 + AUTO_SERVER | `jdbc:h2:~/test;AUTO_SERVER=TRUE` | 여러 프로세스 가능 |
| 인메모리 모드           | `jdbc:h2:mem:testdb`              | 같은 JVM 내에서만  |

# 해결 방법

## 방법 1: AUTO_SERVER=TRUE 추가

H2의 자동 혼합 모드를 활성화한다.
첫 번째 접속은 임베디드 모드로 동작하고, 이후 접속은 자동으로 TCP 서버를 통해 연결된다.

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:h2:~/test;AUTO_SERVER=TRUE
    username: sa
    driver-class-name: org.h2.Driver
```

앱과 테스트가 동일한 DB 파일을 공유해야 할 때 적합하다.

## 방법 2: 테스트 전용 인메모리 DB 사용 (권장)

테스트에서는 파일 DB를 쓸 이유가 거의 없다.
`src/test/resources/application.yml`에 인메모리 DB를 별도 설정한다.

```yaml
# src/test/resources/application.yml
spring:
  datasource:
    url: jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1
    username: sa
    driver-class-name: org.h2.Driver
```

`DB_CLOSE_DELAY=-1`은 마지막 커넥션이 닫혀도 DB를 유지하는 옵션이다.
테스트 간 데이터 격리가 필요하면 `@Transactional`과 함께 사용하면 각 테스트 후 롤백된다.

## 방법 3: 앱을 먼저 종료

근본적으로 앱과 테스트를 동시에 실행하지 않으면 된다.
IntelliJ에서 테스트 실행 전 실행 중인 앱 프로세스를 종료하면 lock 충돌이 발생하지 않는다.

# 정리

| 상황                               | 추천 방법              |
| ---------------------------------- | ---------------------- |
| 테스트에서 앱과 DB를 공유해야 한다 | `AUTO_SERVER=TRUE`     |
| 테스트 데이터가 앱과 독립이다      | 인메모리 DB (방법 2)   |
| 임시로 빠르게 해결하고 싶다        | 앱 종료 후 테스트 실행 |

대부분의 단위/통합 테스트에서는 **방법 2 (인메모리 DB)**가 가장 깔끔하다.
테스트마다 깨끗한 상태에서 시작할 수 있고, 파일 잠금 문제 자체가 발생하지 않는다.

[^1]: H2 AUTO_SERVER 모드 공식 문서. <https://www.h2database.com/html/features.html#auto_mixed_mode>

[^2]: H2 인메모리 DB 설정. <https://www.h2database.com/html/features.html#in_memory_databases>
