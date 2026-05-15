---
description: "외부 분산 서비스를 비동기로 처리하다 보면 스레드 풀 설정을 피할 수 없다. corePoolSize 공식부터 queueCapacity의 함정까지, 직접 테스트하며 최적값을 찾아본 과정을 정리한다."
date: 2024-02-23
tags: [journal]
lang: ko
draft: false
---

# Intro — 비동기 처리가 낳은 설정 고민 🤔

현재 프로젝트에서 외부 분산 서비스를 다룰 때 비동기 이벤트식 처리로 해결하고 있다. 비동기로 전환하자마자 바로 맞닥뜨린 문제는 스레드 풀 설정이었다. 올바른 설정값을 찾으면 극강의 효율을 챙길 수 있지만, 잘못 잡으면 오히려 성능이 떨어진다.

여기서 두 가지 의문이 생겼다. 우리는 과연 스레드를 제대로 이해하고 쓰는 것인가? 스레드 풀의 기본 설정값은 어떤 공식에 따라 잡아야 할까?

# TL;DR 🗺️

> **1. Thread Pool의 동작 순서:** corePoolSize만큼 스레드를 실행하다가 → Work Queue에 task를 대기시키고 → queue가 가득 차면 비로소 maxPoolSize까지 스레드를 늘린다.

> **2. corePoolSize는 `CPU 코어수 × CPU 사용률 × (1 + Wait time / Service time)` 공식으로 계산한다.**

> **3. DB Connection Pool Size는 `(cpu 개수 × 2) + effective_spindle_count` 공식을 쓴다.**

> **4. queueCapacity와 maxPoolSize는 기본값(Integer.MAX_VALUE)을 그대로 두는 것이 성능상 유리하다. 사용자 요청 수를 예측할 수 없기 때문이기도 하다.**

# Thread와 Process — 무엇이 다른가 🧵

프로세스는 실행 중인 프로그램의 인스턴스로, 자신만의 메모리를 갖고 아래 상태 중 하나에 놓인다.[^1]

![](/images/velog/6cf8726700efd03c.png)

- NEW: 프로세스가 생성 중이다.
- READY: 프로세서 할당을 기다리는 대기 상태이다.
- RUNNING: 현재 CPU에서 실행 중이다.
- WAITING: 특정 이벤트 발생을 기다리는 중이다.
- TERMINATED: 실행이 완료되었다.

![](/images/velog/0f83609bfbc1bcea.png)

스레드는 프로세스의 subset으로, 하나의 작업 단위에 하나 이상이 할당된다. data segment, code segment, 파일 등 공통 자원은 공유하지만, 각 스레드마다 레지스터·스택·카운터는 독립적으로 할당된다. user level thread / kernel level thread 등 더 세부적인 내용은 별도 자료를 참고하자.[^2]

# Thread Pool이 필요한 이유 🏊

**스레드 자체가 리소스**이기 때문이다. 요청마다 스레드를 무차별 생성하면 CPU 코어를 낭비하게 되고, 이는 성능 저하로 직결된다. 그래서 "스레드를 미리 만들어 두고 재사용하자" 는 취지에서 스레드 풀을 정의한다.

스레드 풀의 동작 방식은 간단하다. 먼저 병렬 작업 형태로 동시 코드를 작성하고, 이를 스레드 풀 인스턴스에 제출하면, 인스턴스가 재사용 가능한 여러 스레드를 제어하며 실행한다.[^3]

# Thread Pool 환경설정이 왜 중요한가 ⚙️

스레드 풀 환경설정의 핵심은 **메모리 낭비를 하지 않기 위한 파인 튜닝**이다. 풀 안에 너무 많은 스레드를 선점하면 코어와 메모리를 비효율적으로 점유하게 되므로, 서비스 특성에 맞는 적정값을 계산해 설정해야 한다.

# Thread Pool의 구조와 작동 방식 📐

## ThreadPoolExecutor 옵션 이해

Java에서 Thread Pool은 `ThreadPoolExecutor`[^4]로 관리한다. 내부에는 두 개의 저장 공간이 있다. 하나는 **Thread Pool**(스레드를 제어하는 공간)이고, 다른 하나는 **Work Queue**(요청 대기를 위한 큐)이다.

주요 옵션은 다음과 같다.

1. **corePoolSize** — ThreadPoolExecutor가 동시에 수행하는 기본 스레드 수
2. **maximumPoolSize** — 수행 가능한 최대 스레드 수
3. **keepAliveTime** — corePoolSize 초과 스레드를 유지하다가 제거하기 전 대기 시간
4. **TimeUnit** — keepAliveTime의 시간 단위(초, 밀리초 등)
5. **workQueue** — 실행 가능한 스레드가 없을 때 요청을 대기시키는 큐

이 옵션에 따라 동작 순서는 다음과 같다.

1. 스레드 풀 생성 시 corePoolSize만큼 코어 스레드를 만든다.
2. 새 작업이 들어오면, 모든 코어 스레드가 사용 중이고 큐도 가득 찼을 때만 maximumPoolSize까지 스레드 수를 늘린다.
3. 현재 스레드 수가 corePoolSize를 초과한 경우, keepAliveTime보다 오래 idle 상태인 초과 스레드는 제거된다.

![](/images/velog/4b766ed8f1cddce6.png)

## 작업 제출 방식 — execute vs submit

`execute()`는 예외 발생 시 해당 스레드를 종료하고 새 스레드로 교체하며, 처리 결과를 반환하지 않는다. `submit()`은 예외가 발생해도 스레드를 재사용하고, 처리 결과를 `Future<?>`로 반환한다. 따라서 스레드 풀 사용 시에는 `submit()`이 더 바람직하다.[^5]

## corePoolSize, maxPoolSize, queueCapacity의 관계

Oracle JavaDoc[^4]에 따르면, `execute()` 또는 `submit()`으로 새 Runnable을 제출했을 때 처리 흐름은 다음과 같다.

1. workQueue에 스레드를 대기시킨다.
2. 현재 수행 중인 스레드가 끝나면, workQueue에서 대기 중인 스레드를 Thread Pool로 옮긴다.
3. Thread Pool의 스레드가 corePoolSize만큼 실행된다.
4. corePoolSize만큼 실행 중이라면 추가 요청은 Queue에 쌓는다.
5. Queue가 가득 차면 그제서야 maxPoolSize 옵션이 적용된다.

- **corePoolSize보다 적은 스레드가 수행 중인 경우** — 새 스레드를 생성해 즉시 실행한다.
- **corePoolSize 초과, maxPoolSize 미만인 경우** — Queue가 가득 차지 않았다면 Queue에 넣고, Queue가 가득 찼다면 maxPoolSize까지 스레드를 늘려 실행한다.

![](/images/velog/885e709b9bdc9238.png)

## 기본 설정값의 의미

Spring의 `ThreadPoolTaskExecutor` 기본값은 corePoolSize=1, maxPoolSize=Integer.MAX_VALUE, queueCapacity=Integer.MAX_VALUE, keepAliveSeconds=60이다.[^6]

![](/images/velog/0cdcfa3d2ad1b39c.png)

corePoolSize=1이므로 하나의 스레드만 활성 상태로 시작한다. queueCapacity와 maxPoolSize를 사실상 무제한으로 설정함으로써, queue가 절대 가득 차지 않아 추가 스레드가 생성되지 않는다. 아래처럼 설정값을 바꾸면 동작이 달라진다.

```java
corePoolSize=3
maxPoolSize=5
queueCapacity=200
```

1. 처음 3개의 스레드(작업)가 스레드 풀에서 실행된다.
2. 이후 queue가 200까지 쌓일 때까지 스레드 풀의 스레드를 재사용한다(새 스레드 생성 없음).
3. queue가 꽉 차면 thread pool이 maxPoolSize인 5까지 늘어난다.
4. 이제 5개의 스레드가 동시에 실행된다.

![](/images/velog/4f14d3fe016a6f87.png)

## Saturation Policies — 모두 꽉 찼을 때

Core Thread 전부 사용 중, Work Queue 만석, Thread Pool이 maxPoolSize에 도달한 경우, 이후 제출된 task는 설정된 `RejectedExecutionHandler`에 따라 거부된다.[^7]

- **AbortPolicy** (기본) — `RejectedExecutionException` 발생
- **CallerRunsPolicy** — 요청을 호출한 main thread에서 직접 실행
- **DiscardPolicy** — 거부된 task를 조용히 버린다(예외 없음)
- **DiscardOldestPolicy** — 가장 오래된 미처리 요청을 삭제하고 재시도(데이터 유실 가능)

```java
ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy()); // 기본은 AbortPolicy
```

# cachedThreadPool이 답이 아닌 이유 🚫

"요청마다 스레드를 만들어 최대한 빨리 응답하면 효율적이지 않을까?"라는 의문은 자연스럽다. Java는 이미 `cachedThreadPool`로 그 개념을 구현해 두었다.[^8]

```java
public static ExecutorService newCachedThreadPool() {
    return new ThreadPoolExecutor(0, Integer.MAX_VALUE, 60L, TimeUnit.SECONDS,
      new SynchronousQueue<Runnable>());
}
```

corePoolSize=0, maximumPoolSize=무제한, queue는 `SynchronousQueue`를 사용한다. `SynchronousQueue`는 서로 다른 스레드가 동일 작업에 접근하면 하나를 대기시키는 방식으로 동작한다. 새 task가 들어오면 적합한 스레드가 있으면 부여하고, 없으면 새 스레드를 생성한다. idle 상태로 1분이 지난 스레드는 자동 제거된다.

### cachedThreadPool의 결정적 단점

I/O task처럼 실행 시간을 예측할 수 없는 작업이 몰리면 대기열이 밀리고, cachedThreadPool은 새 스레드를 무제한으로 생성한다. 결국 엄청난 CPU 컨텍스트 스위칭이 발생한다. **cachedThreadPool은 합리적인 양의 짧은 실행 시간 작업에만 적합하다.** 이러한 이유로 백엔드 서비스에서는 fixed thread pool을 지향한다.

# I/O Intensive Task에 맞는 Thread Pool 크기 계산법 🔢

## CPU vs I/O 태스크 구분

**CPU-Intensive Tasks**는 복잡한 계산이나 시뮬레이션처럼 CPU 속도에 의해 제한되는 작업이다(인코딩, ML 추론, 컴파일 등). **I/O-Intensive Tasks**는 디스크 읽기/쓰기, 네트워크 API 호출, DB 쿼리처럼 I/O 장치 속도에 의해 제한되는 작업이다. 일반적인 백엔드 서비스는 대부분 I/O Intensive에 해당한다.

## corePoolSize 공식

```python
Number of threads = Number of Available Cores × Target CPU utilization × (1 + Wait time / Service time)
```

- **Number of Available Cores** — `Runtime.getRuntime().availableProcessors()`로 확인한다.
- **Target CPU utilization** — 목표 CPU 사용률(0.0~1.0). 너무 높으면 응답 불가, 너무 낮으면 리소스 낭비다.
- **Wait time** — I/O 완료 대기에 소요되는 시간(네트워크 응답, DB 쿼리 등).
- **Service time** — 실제 계산에 소요되는 시간.
- **Blocking coefficient(Wait time / Service time)** — 대기 비율이 높을수록 더 많은 스레드가 필요하다.[^9]

예시: 4코어, CPU 사용률 20%, Blocking coefficient 0.4인 경우

```python
Number of threads = 4 × 0.2 × (1 + 0.4) = 1.12 → 약 1~2개
```

서비스 특성별 팁: 처리량이 일정하다면 corePoolSize=maximumPoolSize로 고정하고 Queue를 넉넉하게 잡는다. 처리량이 시간대별로 변동한다면 corePoolSize와 maximumPoolSize를 다르게 설정하고 Queue 크기를 작게 잡아 추가 스레드 생성이 원활하게 되도록 한다.[^10]

## DB Connection Pool Size도 함께 고려해야 한다

스레드 풀과 궤를 같이하는 DB Connection Pool Size도 별도로 설정해야 한다. HikariCP의 기본값은 10이다.

```python
connections = (core_count × 2) + effective_spindle_count
```

**core_count × 2를 하는 이유:** 클라우드 환경에서 core_count는 논리 CPU 수와 같다. CPU 속도가 Disk I/O보다 월등히 빠르기 때문에, 스레드가 Disk 작업으로 블로킹된 시간에 다른 스레드의 작업을 처리할 여유가 생긴다. HikariCP는 이 여유 정도를 계수 2로 표현한다.[^11]

**effective_spindle_count:** 하드 디스크 하나는 spindle 하나를 가지며, spindle 수는 DB 서버가 처리할 수 있는 동시 I/O 요청 수를 의미한다. 디스크 16개라면 동시 I/O 16개가 가능하다(RAID 구성에 따라 달라질 수 있다).

# 실제 테스트로 최적값을 검증한 결과 🧪

프로젝트에서 분산 서비스에 대한 비동기 처리를 위해 Thread Pool Config를 조정하며 성능을 직접 측정했다.

**결론: corePoolSize는 공식값을 적용하되, queueCapacity와 maxPoolSize는 기본값(Integer.MAX_VALUE)을 그대로 두는 것이 가장 좋은 성능을 보였다.**

## 기본 AsyncConfig 세팅

```java
@EnableAsync
@Configuration
@Slf4j
@RequiredArgsConstructor
public class AsyncConfig implements AsyncConfigurer {

    private final GlobalAsyncExceptionHandler globalAsyncExceptionHandler;

    @Override
    @Bean(name = "tossPaymentsExecutor")
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setThreadNamePrefix("custom-async-tosspay");
        executor.initialize();
        return executor;
    }

    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return globalAsyncExceptionHandler;
    }
}
```

테스트 서비스는 결제 이벤트를 10,000번 비동기 호출하도록 작성했다.

```java
@SpringBootTest
@Disabled
@ActiveProfiles("test")
public class AsyncTest {

    @Autowired
    private AsyncService asyncService;

    @Test
    @DisplayName("AsyncConfig 설정값에 따른 성능 개선치를 측정합니다.")
    public void AsyncConfig_설정에따른효율_측정() {
        long startTime = System.currentTimeMillis();

        int callCount = 10000;
        for (int i = 0; i < callCount; i++) {
            asyncService.doSomethingAsync();
        }

        long endTime = System.currentTimeMillis();
        System.out.println("Total time taken: " + (endTime - startTime) + " milliseconds");

        int numOfCores = Runtime.getRuntime().availableProcessors();
        float targetCpuUtilization = 0.3f;
        float blockingCoefficient = 0.1f;
        int corePoolSize = (int) (numOfCores * targetCpuUtilization * (1 + blockingCoefficient));
        System.out.println("corePoolSize = " + corePoolSize);
    }
}
```

기본 세팅(`corePoolSize=1, maxPoolSize=Integer.MAX_VALUE, queueCapacity=Integer.MAX_VALUE`) 결과다.

![](/images/velog/98c8e00b2c69d374.png)

## corePoolSize 공식 적용 — 성능 변화는 미미했다

CPU 사용률 30%(DB Connection Pool과 I/O Task를 함께 고려한 값), Blocking coefficient 0.1을 적용해 corePoolSize를 계산했다.

```java
// CPU 코어수 × CPU 사용률 × (1 + I/O입력시간대기효율)
@Override
@Bean(name = "tossPaymentsExecutor")
public Executor getAsyncExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    int numOfCores = Runtime.getRuntime().availableProcessors();
    float targetCpuUtilization = 0.3f;
    float blockingCoefficient = 0.1f;
    int corePoolSize = (int) (numOfCores * targetCpuUtilization * (1 + blockingCoefficient));
    executor.setCorePoolSize(corePoolSize);
    executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
    executor.setThreadNamePrefix("custom-async-tosspay");
    executor.initialize();
    return executor;
}
```

![](/images/velog/948a64453d4b9bbb.png)

사실 기본 설정과 큰 차이가 없었다.

## queueCapacity를 고정값으로 바꾸면 오히려 느려진다

```java
executor.setCorePoolSize(corePoolSize);
executor.setMaxPoolSize(Integer.MAX_VALUE);
executor.setQueueCapacity(1000); // bounded queue 적용
executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
```

![](/images/velog/9b022eb8cb2a49e1.png)

결과는 오히려 성능이 저하되었다. queueCapacity 1000을 넘어가면 maximumPoolSize까지 스레드가 늘어나 "더 빠르지 않을까"라고 생각하기 쉽지만, 실제로는 그렇지 않다.

![](/images/velog/f386758d408a6fde.png)

![](/images/velog/e869750db9b77faf.png)

unbounded queue가 압도적으로 빠른 이유는 다음과 같다.

- **unbounded queue 사용 시 빠른 이유**: corePoolSize를 초과해도 새 스레드를 생성하지 않고 메모리에 올려두고 처리하기 때문이다.
- **bounded queue 사용 시 느린 이유**: 비싼 스레드 생성 비용을 지불하며 많은 스레드를 만들어 처리하기 때문에 시간이 오래 걸린다.

**따라서 queueCapacity와 maxPoolSize는 건드리지 말고 기본값을 유지하자.**

# 비동기 예외를 어떻게 잡을 것인가 🛡️

`@ControllerAdvice`는 동기적 예외만 캐치할 수 있다. 비동기 메서드에서 발생한 예외는 캐치하지 못한다.[^12] `Future` 반환 타입이라면 `Future.get()`에서 예외를 던지지만, `void` 반환 타입이라면 calling thread에 예외가 전파되지 않는다.[^13]

이를 위해 Spring은 `AsyncUncaughtExceptionHandler` 인터페이스를 제공한다. 별도 helper class로 분리하고, 예외 발생 시 해당 클래스에 위임하는 방식이 일반적이다.

```java
@Slf4j
@Component
public class GlobalAsyncExceptionHandler implements AsyncUncaughtExceptionHandler {

    @Override
    public void handleUncaughtException(Throwable ex, Method method, Object... params) {
        log.error("[ASYNC-ERROR] method: {} exception: {}", method.getName(), ex);
    }
}
```

```java
@Configuration
@AllArgsConstructor
public class AsyncConfiguration implements AsyncConfigurer {

    private final GlobalAsyncExceptionHandler globalAsyncExceptionHandler;

    @Override
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        int numOfCores = Runtime.getRuntime().availableProcessors();
        float targetCpuUtilization = 0.3f;
        float blockingCoefficient = 0.1f;
        int corePoolSize = (int) (numOfCores * targetCpuUtilization * (1 + blockingCoefficient));
        executor.setCorePoolSize(corePoolSize);
        executor.setQueueCapacity(Integer.MAX_VALUE);
        executor.setMaxPoolSize(Integer.MAX_VALUE);
        executor.setThreadNamePrefix("custom-async-tosspay");
        executor.initialize();
        return executor;
    }

    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return globalAsyncExceptionHandler;
    }
}
```

# 결론 — 스레드 풀 설정의 세 가지 원칙 ✅

직접 테스트와 문서를 통해 얻은 결론을 세 가지로 정리한다.

첫째, **corePoolSize는 공식(`코어수 × CPU사용률 × (1 + Blocking coefficient)`)으로 계산**한다. 애플리케이션의 I/O 비율과 목표 CPU 사용률을 고려해 적정값을 구하자.

둘째, **queueCapacity와 maxPoolSize는 기본값(Integer.MAX_VALUE)을 유지**한다. 고정값을 지정하면 값비싼 스레드 생성 비용이 발생하고 오히려 성능이 저하된다.

셋째, **비동기 예외는 반드시 `AsyncUncaughtExceptionHandler`로 별도 처리**한다. `@ControllerAdvice`는 비동기 예외를 잡지 못하므로, void 반환 비동기 메서드의 예외가 조용히 사라지는 상황을 막아야 한다.

[^1]: Process vs Thread — JavaPoint <https://www.javatpoint.com/process-vs-thread>

[^2]: Difference Between Process and Thread — JavaPoint <https://www.javatpoint.com/process-vs-thread#:~:text=Thread-,A%20process%20is%20an%20instance%20of%20a%20program%20that%20is,are%20interdependent%20and%20share%20memory.>

[^3]: Introduction to Thread Pools in Java — Baeldung <https://www.baeldung.com/thread-pool-java-and-guava>

[^4]: ThreadPoolExecutor JavaDoc — Oracle <https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ThreadPoolExecutor.html>

[^5]: Java 에서 스레드 풀(Thread Pool) 을 사용해 보자 — 우아한테크 <https://tecoble.techcourse.co.kr/post/2021-09-18-java-thread-pool/>

[^6]: Configure the Spring ThreadPoolTaskExecutor — codingtim <https://codingtim.github.io/spring-threadpooltaskexecutor/>

[^7]: rejectedexecutionhandler — Baeldung <https://www.baeldung.com/java-rejectedexecutionhandler>

[^8]: cached vs fixed thread pool — Baeldung <https://www.baeldung.com/java-executors-cached-fixed-threadpool>

[^9]: How to Determine Java Thread Pool Size — dip-mazumder <https://dip-mazumder.medium.com/how-to-determine-java-thread-pool-size-a-comprehensive-guide-4f73a4758273>

[^10]: ThreadPoolExecutor 동작 방식 및 주의 사항 — NaverBlog <https://blog.naver.com/bumsukoh/222175557879>

[^11]: 내가 만든 서비스는 얼마나 많은 사용자가 이용할 수 있을까? — DB Connection Pool편 <https://hyuntaeknote.tistory.com/12>

[^12]: Async will not call by ControllerAdvice for global exception — StackOverflow <https://stackoverflow.com/questions/61885358/async-will-not-call-by-controlleradvice-for-global-exception>

[^13]: Spring @Async exception handling — Baeldung <https://www.baeldung.com/spring-async#exception-handling>

[^14]: ThreadPoolExecutor에 대한 오해와 진실 — leeyh0216 <https://leeyh0216.github.io/posts/truth_of_threadpoolexecutor/>

[^15]: RejectExecutionHandler reject policy — deep-dive-dev <https://deep-dive-dev.tistory.com/11>

[^16]: Spring ThreadPoolExecutor reject policy 설정 — codemanager <https://codemanager.tistory.com/5>

[^17]: spring boot async exception handling — velog <https://velog.io/@stella6767/spring-boot-async-exception-handling>
