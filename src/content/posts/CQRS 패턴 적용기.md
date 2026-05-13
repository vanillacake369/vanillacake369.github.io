---
title: "CQRS 패턴 적용기"
description: "우리 팀은 “단일장애지점 극복”이라는 대명목하에 CQRS 패턴을 적용하기로 했다."
date: 2024-01-28
tags: [java]
category: uncategorized
lang: ko
draft: false
---

# 왜 CQRS를 적용?? 🤷‍♂️

---

우리 팀은 “단일장애지점 극복”이라는 대명목하에 CQRS 패턴을 적용하기로 했다.
그렇다면 CQRS를 적용하면 어떤 부분에 있어 장단점이 있을까?

### CQRS 장점

- 코드 레벨
- 아키텍처 레벨

# 어떻게 하면 구현할 수 있을까?👇

---

## Aurora 사용 제한사항

Aurora를 쓰면 한 큐에 해결된다. 
(심지어 공식문서에서조차 Aurora 써줘잉하면서 현혹한다,,,역시 장사꾼들,,,)

![](/images/notion/b32e6f027c8598d5.png)

Aurora는 Cluster 내부에 Primary DB와 여러 Secondary DB들이 내장되어있다.

- Primary DB
- Secondary DB


하지만 결국 가장 큰 문제점에 다달렀다. 문제는 Aurora의 Cost이다.

![](/images/notion/3fc7be9078d2dd52.png)


위 그림과 같이 t3.medium 만, 그것도 하나의 노드만 사용한다는 가정하에, 계산기를 두들려도 한달에 15,16만원씩 뜯어간다.
Route53, EC2, ELB, ECR 등등 여러 영역들을 활용하고 있는 우리 팀 입장에서는 현실적으로 무리였다.
그래서 우리는 그나마 현실적인 방법을 사용하기로 하였다.

## AWS RDS 활용하기

### Multi-AZ & Read Replica

> Multi-AZ 란??

Multi-az 배포에서 mysql RDS는 자동으로 서로 다른 AZ(가용 영역)에 동기식 예비 복제본을 프로비저닝하고 유지하여 데이터 이중화를 제공합니다. (HA)

![](/images/notion/0c2734892f76b197.png)

1. 현재 Master db 인스턴스의 snapshot이 생성됩니다.
2. 생성된 snapshot을 이용하여 다른 AZ에 대기 인스턴스가 생성됩니다.
3. 기본 인스턴스와 Standby 인스턴스 간에 동기식으로 복제되어 데이터 중복성, snapshot 및 백업 중 I/O 중단 제거, 시스템 백업 중 지연 시간 급증을 최소화 합니다.

> Multi-AZ를 사용 시, 가장 좋은 점은 standby replica를 만들어주고, 장애복구(failover)를 지원해준다는 것이다.

Multi-AZ를 활성화 한 경우, DB 인스턴스에 중단이 발생하면 자동으로 다른 가용 영역에 있는 Standby replica(예비 복제본)으로 switch됩니다.
**장애 조치가 완료되는데 소요되는 시간은 기본 DB 인스턴스를 사용할 수 없게 된 시점의 데이터 베이스 활동 및 기타 조건에 따라 달라지지만, 대략적으로 60~120초 정도 소요됩니다.**


### Read Replica

> Read Replica 란??

AWS RDS에서는 Single RDS 에 대한 Read 전용 Replication DB를 제공해준다. (물론 유료지만 말이다)
AWS RDS의 Read Replica는 Primary DB를 복제한 Secondary DB로서, Read 작업만 수행가능한 인스턴스이다. 
Read Replica로의 Write 작업은 허용하지 않는다.
RDS에서 제공하는 Read Replica는 다음과 같은 특성을 갖는다.

- Read Replica를 최대 5개까지 추가할 수 있음
- 동일 AZ, Cross AZ, Cross Region 가능
- 비동기 방식의 Replication
- Read Replica를 Master DB로 변경할 수 있음(Promotion)

![](/images/notion/d0873158a8ebffdf.png)



### Read-Replica vs Multi-AZ :: 데이터 동기화 지원의 차이점

가장 큰 차이점은 바로 동기화 지원 방식이다.
Read-Replica 는 비동기식 데이터 동기화를 지원한다.
즉, 조금이라도 딜레이 발생하면 데이터 정합성이 깨져버린다.
반면, Multi-AZ 는 동기식 데이터 동기활르 지원한다.
따라서 실시간 데이터에 대한 서비싱을 처리하는 경우, Multi-AZ를 사용하는 것이 좋다.




### 현재 우리는 Read-Replica를 채택하였다.

> 현재는 RDS에서 제공해주는 Read-Replica를 사용하고 있다. 



## `@Transational(readOnly) `에 따라서 Secondary DB 적용하기

---

자 이제 인프라 상, Primary 와 Secondary 에 대한 세팅은 완료하였다.
이제 코드 레벨로 각 Command / Query 에 따라 데이터소스를 달리해주면 된다.
근데 어떻게 할까?
`@Transactional`의 `readOnly`값에 따라서 Primary와 Secondary를 매핑시켜줄 수 있게 하였다.
다음 단계를 천천히 밟아나가보자.

### application-prod.yml

```yaml
spring:
  profiles:
    active: prod
  # DATASOURCE
  datasource:
    hikari:
      primary:
        driver-class-name: com.mysql.cj.jdbc.Driver
        jdbc-url: jdbc:mysql://${DB_URL}/gream
        username: ${DB_ID}
        password: ${DB_PASSWORD}
      secondary:
        driver-class-name: com.mysql.cj.jdbc.Driver
        jdbc-url: jdbc:mysql://${DB_READ_ONLY_URL}/gream
        username: ${DB_ID}
        password: ${DB_PASSWORD}
  # JPA
  jpa:
    hibernate:
      ddl-auto: none
    properties:
      hibernate:
        auto_quote_keyword: true # 예약어 사용가능
        globally_quoted_identifiers: true # 예약어 사용가능
        show_sql: true # sql 로깅
        # generate_statistics: true # 쿼리수행 통계
        format_sql: true # SQL문 정렬하여 출력
        highlight_sql: true # SQL문 색 부여
```





## CQRS 패턴에서 Command 내에서 조회를 해야한다면 ??

---

### Service 레이어에서 CQRS를 나누자니, Command 코드 내부적으로 Query를 사용해야하는 일이 있었다

- 지금 기본적으로 service 레이어에서 cqs가 안 되어있는 이슈가 있음
- CQRS 패턴을 위해 Command, Query 에 따른 다른 DB 사용 시, 아래와 같은 이슈가 발생

### 해결은 간단했다. 기존 그대로 사용하면 되었다.

> 아래와 같은 접근으로 해결하기로 함

<details>
<summary>~~Service Layer 의 Command 와 Query를 나누기로 함 (은 무슨,,,)~~</summary>

- ~~Service Layer~~
- ~~Repository Layer~~
</details>

- 실험을 해보니 가장 상위 계층의 트랜잭션에 따라 전파되는 모양




- 반면 Class 레벨로 `@Transactional(readOnly=true)`을 단 Query Service 호출 시, Secondary DB에 접근하는 것을 볼 수 있었다.



# 🤔 너무 AWS에 의존적인 CQRS 구현 아닌가?

---
