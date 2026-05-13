---
title: "스레드,synchronized 사용 가이드라인(feat. 자바성능튜닝이야기)"
description: "동기화를 처리하려면 서로 다른 스레드의 작업으로 인해 간섭받는 행위를 임계영역으로써 지정해주면 된다."
date: 2024-04-22
tags: [java]
category: uncategorized
lang: ko
draft: false
---

# 스레드 처리

- WAS를 기동하면 서버에 자바 프로세스가 하나 생성됨
- 하나의 프로세스에는 여러 개의 스레드가 생성됨
- 스레드 구현은 Thread 클래스 extend 과 Runnable 인터페이스 implments 가 있음

## 스레드 관련 메서드

- sleep() : 명시된 시간만큼 대기
- wait() : 명시된 시간만큼 대기 -> 아무 매개변수 없다면 notify() 호출 될 때까지 대기함
- join() : 명시된 시간만큼 죽기를 기다림
- interrupt() : 스레드를 바로 죽임
- notify() : 객체의 모니터와 관련된 단일 스레드 깨움
- notifyAll() : 객체의 모니터와 관련된 모든 스레드를 깨움
- isAlive() : 해당 스레드가 살아있는지 확인

## 스레드 관련 클래스

> 동시성 제어 방법과 그에 따른 유틸리티 클래스들은 아래를 참고해보자.

- Lock
- Executors
- Concurrent 컬렉션
- Atomic 변수

> 이외에도 불변 객체를 사용하면 동시성 이슈에서 자유로워진다는 것도 알아두면 좋다.

# Synchronization

> 동기화란?

## 임계영역 처리 (Critical Section)

동기화를 처리하려면 서로 다른 스레드의 작업으로 인해 간섭받는 행위를 임계영역으로써 지정해주면 된다.
임계영역으로 지정하는 방법은 다음과 같다.

- wait() / notify()
- synchronized 처리

## wait() / notify()

- 동일 자원에 대해 

### wait() / notify() 의 문제점

- 기아 문제
- 경쟁상태

## synchronized 처리

- 언제 synchronized 를 처리할까?
- 임계 영역은 한 번에 한 쓰레드만 사용할 수 있기 때문에 최소화해서 사용해야한다.

## synchronized 동작과정 in JVM

> 이에 대해서 Monitor 라는 개념이 선행되어야한다. Monitor 라는 플래그 값을 통해 쓰레드 관리를 하기 때문이다.

### Monitor 란?

스레드가 mutual exclusion 과 cooperation 을 해결할 수 있게하는 매커니즘 프로세스를 말한다.
다음 세 가지 기능을 지원한다.

- 오직 한 스레드만 상호배제된 임계영역에 진입 ( mutually exclusive access to a critical code section )
- 특정 조건에 따라 monitor 에서 돌아가고 있는 thread 는 block 될 수 있음
- 대기상태의 스레드들에게 notify 가능

### synchronized 와 monitor 의 관계

wait set 과 entry set 이라는 개념을 사용하는데,
entry set 에 있는 스레드를 JVM 스케줄러가 선택하여 monitor 를 획득한다. 
이 때 JVM 스케줄러는 스레드 선택 시, priority-based scheduling algorithm 를 사용하며, 동일한 priority 라면 FIFO 를 기반으로 선택한다.
monitor를 획득한 스레드는 공유 자원에 대한 로직을 처리한다.
로직처리완료한 스레드는 다시 wait set 으로 들어가 대기상태에 있는다.

요컨대, synchronized 를 사용하게 되면 아래와 같은 수순으로 monitor 를 획득하고 푼다.

- entering the monitor (entry set)
- acquiring the monitor
- owning the monitor
- releasing the monitor
- exiting the monitor. (wait set)

## 실제로 synchronized 를 잘 안 쓰는 이유 ?

- 여러 JVM 들을 걸쳐 지원하지 않는다. 따라서 여러 서버에 대해 sync 처리 시, `synchronized` 적용은 좋은 옵션이 아니다.
- Spring AOP 에 의한 트랜잭션 Proxy 와 어울리지 않는다.

# Reference

---

[https://velog.io/@chanyoung1998/자바-동기화-이해하기](https://velog.io/@chanyoung1998/자바-동기화-이해하기)
[https://velog.io/@jummi10/Concurrency-Control](https://velog.io/@jummi10/Concurrency-Control)
[https://mangkyu.tistory.com/259](https://mangkyu.tistory.com/259)
[https://channel.io/ko/blog/distributedlock_2022_backend](https://channel.io/ko/blog/distributedlock_2022_backend)
[https://www.baeldung.com/java-synchronized](https://www.baeldung.com/java-synchronized)
[https://www.baeldung.com/cs/monitor](https://www.baeldung.com/cs/monitor)
[https://www.baeldung.com/cs/monitor](https://www.baeldung.com/cs/monitor)
[https://velog.io/@balparang/Transactional과-synchronized를-같이-사용할-때의-문제점](https://velog.io/@balparang/Transactional과-synchronized를-같이-사용할-때의-문제점)
