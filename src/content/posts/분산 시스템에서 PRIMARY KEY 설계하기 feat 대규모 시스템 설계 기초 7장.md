---
description: "왜 분산 시스템에 대해 PRIMARY KEY 값 설계를 따로 고려해야할까??"
date: 2024-03-10
tags: [journal]
lang: ko
draft: false
---

# Intro : 왜 분산 시스템에 대해 ID 설계를 고려해야할까?

왜 분산 시스템에 대해 PRIMARY KEY 값 설계를 따로 고려해야할까??

관계형 데이터베이스의 auto_increment 속성을 사용하면 안되나?

그러기에는 쉽지 않다.

왜냐하면 아래 특성을 고려해야하기 때문이다.

- 여러 DBMS에 데이터가 분산 가능한가?

- 유일성을 보장할 수 있는가?

- 발급날짜에 따른 정렬이 가능한가?

- 발급수/ms 에 대한 효율성을 극대화할 수 있는가?

요컨대 대규모 시스템 설계 기초 7장 에서는 "초당 10,000개의 ID를 만들 수 있어야 한다." 라는 조건을 요구사항으로써 제시하였다.

- 요구되는 비트수만큼의 ID 값을 발급가능한가?

요컨대 대규모 시스템 설계 기초 7장 에서는 "64비트로 구성" 이라는 조건을 요구사항으로써 제시하였다.

# 대안 1) Multi Master Replication

데이터베이스의 auto_increment 기능을 활용하는 것이다.

Multi Master 를 통해 가용성과 일관성을 극대화한다.

### 특징

- 1만큼 증가시켜 얻는 것이 아닌 데이터베이스의 수 k 만큼 증가시킨다.

- 겹치지 않고 초당 생산 가능 ID 수를 늘릴 수 있다.

### 단점

- 여러 데이터 센터에 걸쳐 규모를 늘리기 어렵다.

- 시간 흐름에 맞추어 커지도록 보장할 수 없다.
  - 가령, 데이터베이스 A, B가 있을 때, A에서만 100개의 ID가 만들어졌다.

그 다음 B에서 처음으로 ID를 생성했다.

그럼 A의 100번째 ID와 B의 첫 번째 ID의 대소관계로 시간의 흐름을 파악할 수 있을까?

없다.

A가 더 큰데, B가 더 최신의 ID이기 때문이다.

- 서버를 추가하거나 삭제하면 제대로 동작하지 못할 수 있다.

ID 값이 K만큼 증가하게 되는데 K가 동적으로 변하면 일관적인 ID 값을 보장하지 못 하게 되기 때문이다.

# 대안 2) UUID 활용

서버의 UUID 를 활용하여 ID를 발급한다.

여기서 UUID 란 컴퓨터 시스템에 저장되는 정보를 유일하기 식별하기 위한 128비트 수이다.

### 특징

- UUID 를 통해 ID 발급은 매우 단순하다.

- 중복확률이 매우 낮다.

중복 UUID 1개 발생확률 50%에 대한 요구되는 조건은 "100년 간 초당 10억개의 UUID 발급" 이다.

- 각 서버가 알아서 만드는 것이므로 각 서버 간 간섭이 없다.

- 따라서 규모 확장도 쉽다.

### 단점

- 기본적으로 128비트로 구성된다.

따라서 특정 비트 수에 대한 제한사항이 발생하게된다.

- 숫자가 아닌 값이 포함될 수 있으며, 시간 순으로 정렬할 수 없다.

# 대안 3) 티켓 서버

![](/images/velog/6737950d01981428.png)

auto_increment 를 지원하는 데이터베이스 서버를 중앙 집중형으로 하나만 사용하는 것이다.

즉, "ID 발급 서버를 독립적으로 분리하자" 는 코어 아이디어를 차용한 것이다.

### 특징

- 오직 숫자로만 이루어진 ID를 쉽게 만들 수 있다.

- 구현하기 쉽고, 중소 규모 애플리케이션에 적합하다.

- 다만 양이 많아지면 관리할 수 없는 정도로 테이블이 커질 수 있다.

### 단점

- SPoF를 제공할 수 있다.

단일 티켓서버 사용 시, 티켓서버가 죽을 수 있다는 것이다.

- 이를 막기 위해 2개의 티켓 서버를 사용할 수 있다.

다만 이를 동기화하는 것은 성능적으로 문제가 될 수 있다.

- 이 또한 해결하기 위해 auto_increment 에 offset을 두고 증가시킬 수 있다.

- 하지만 결국 offset 값 또한 동적으로 변경될 수 없으므로 제한사항이 발생한다.

다중 마스터 복제와 동일한 제한사항을 가지게 된다.

# 대안 4) 트위터 스노플레이크 (Twitter snowflake)

![](/images/velog/757c78d438f1828a.png)

- Sign: 1 bit 할당

- Timestamp: 41 bit 할당.

기원시각 이후로 몇 millisecond가 경과했는지 나타내는 값

- Datacenter id: 5 bit 할당.

데이터 센터의 아이디. 5비트이므로 32개의 데이터센터 지원 가능.

- Server id: 5 bit 할당.

서버의 아이디. 5비트이므로 32개의 서버 지원 가능.

- sequence: 12bit 할당.

각 서버에서는 ID 생성시마다 해당 sequence 1씩 증가. 1 millisecond마다 0으로 초기화

위와 같은 파라미터들을 사용하여 다음과 같은 이점들을 챙긴다.

- workerId(ServerId) 와 sequence 를 통해 발급에 대한 분산이 가능하다.

- 발급날짜에 따른 정렬이 가능하다.

- sequence 를 통해 발급수/ms 에 대한 효율성을 극대화 가능케 한다.

Java 에 대한 소스코드는 [여기](https://github.com/beyondfengyu/SnowFlake)에서 확인가능하다.

위키백과에 따르면 Snowflake 는 디스코드와 인스타그램에서 활용되고 있다고 한다.

> Snowflake IDs, or snowflakes, are a form of unique identifier used in distributed computing.

The format was created by Twitter and is used for the IDs of tweets.

The format has been adopted by other companies, including Discord, and Instagram, which uses a modified version.

# 대안 5) KSUID 라이브러리 (UUID 발급)

UUID 발급 라이브러리인데 아래와 같은 이점을 챙길 수 있다고 나와있다.

- Naturally ordered by generation time

- Collision-free, coordination-free, dependency-free

- Highly portable representations

소스코드 또한 오픈되어있다.

[링크](https://github.com/segmentio/ksuid)
