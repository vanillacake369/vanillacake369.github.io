---
description: "shutdown 시 비동기 프로세스가 interrupt 되는 원인이 무엇이며 어떻게 이를 해결할 수 있을까?"
date: 2025-03-02
tags: [journal]
lang: ko
draft: false
---

![](/images/velog/98a76edb97bb3139.png)

# Episode 📜

스케줄러를 통해 이메일 전송을 비동기적으로 처리하는 로직이 있었다. 아래와 같이 작성되었다.

1. 이메일 전송 대상자 자료구조를 입력값으로 받음
2. 이메일 전송 대상자들에 대해 이메일 전송 이벤트를 publish
3. 이메일 전송 이벤트들에 대해 listen, 비동기적으로 aws ses 호출

```java
@Slf4j
@Component
@RequiredArgsConstructor
public class AutoMailEventPublisher {

  private final ApplicationEventPublisher eventPublisher;

  public void publishAutoMailSendEventOf(Map<AutoMailTargetAggregate, List<Workbook>> eachExcelDataMap) {
    // 각 AutoMailTargetAggregate 에 대해 이메일 이벤트 호출
    log.warn("Publishing AutoMailSendEvent for email: {}",
        eachExcelDataMap.keySet()
            .stream()
            .map(autoMailAggregate -> autoMailAggregate.getAdmin().getAdmEmail())
            .toList());
    eachExcelDataMap.keySet().forEach(autoMailAggregate ->
        eventPublisher.publishEvent(
            AutoMailSendEvent.of(autoMailAggregate.getAdmin().getAdmEmail(), eachExcelDataMap.get(autoMailAggregate))));
  }
}
```

```java
@Slf4j
@Component
@RequiredArgsConstructor
public class AutoMailEventListener {

  private final static String TODAY = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
  private final static String MAIL_TITLE = "[오토메일링] " + TODAY + "일자 결과 보내드립니다.";
  private final static String FILE_NAME = TODAY + "일자 " + "오토메일링 결과.xlsx";
  private final static String MAIL_BODY = "오토메일링 결과";

  private final AutoMailSendHandlerV1 autoMailSendHandlerV1;

  /**
   * 이메일 전송 처리
   *
   * @param event 이메일 전송 이벤트
   * @apiNote @{@link AutoMailEventPublisher} 에서 publishAutoMailSendEventOf() 을 통해 호출
   */
  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  @Async
  public void handleAutoMailSendEvent(AutoMailSendEvent event) {
    String admEmail = event.getAdmEmail();
    List<Workbook> workbooks = event.getWorkbooks();

    try {
      log.warn("AutoMailSendEvent received");
      autoMailSendHandlerV1.sendEmail(MAIL_TITLE, MAIL_BODY, admEmail, FILE_NAME, workbooks););
    } catch (Exception e) {
      log.error("Failed to send email", e);
    }
  }
}
```

하지만 아래와 같은 에러가 발생하였다.

![](/images/velog/ddb4faa34fe2d12a.png)

![](/images/velog/98a76edb97bb3139.png)

신기하게도 `@Async` 를 풀고 Sync 로 처리하면 성공한다. 그렇다면 과연 무엇이 문제였을까?

# Reason 🤷‍♂️

우리는 두 번째 사진에 주목해봐야한다.

![](/images/velog/98a76edb97bb3139.png)

이 에러를 보면 무엇인가로 인해 `InterruptedException` 이 발생했다는 것을 알 수 있다. 가장 근본원인은 Thread 간 `Interrupt`가 발생했다는 것이다.

이에 대해서 아래에 대해 살펴봐야 한다.

에러 발생 상황 이해하기

- Executors, ExecutorService, ThreadPoolExecutor 는 어떻게 동작하는가?
- Thread 는 어떻게 동작하는가?
- InterruptedException 이란 무엇인가?
  - 어떤 경우에 Thread 간 `Interrupt` 가 발생하는가?
- `@Async` 는 어떻게 동작하는가?

에러 유발 케이스 분석하기

- ThreadPoolExecutor 로 인해 `InterruptedException` 발생케이스는 없는가?
- AWS SDK 로 인해 `InterruptedException` 발생케이스는 없는가?
- Retry 로 인해 `InterruptedException` 발생케이스는 없는가?

## 에러 발생 상황 이해하기 🔍

### Executors, ExecutorService, ThreadPoolExecutor 는 어떻게 동작하는가?

![](/images/velog/65be78a9d830f667.png)

***Executor*** 인터페이스에는 실행을 위해 ***Runnable*** 인스턴스를 execute 하는 단일 execute 메서드를 가지고 있다.

```java
Executor executor = Executors.newSingleThreadExecutor();
executor.execute(() -> System.out.println("Hello World"));
```

ExecutorService 인터페이스에는 작업을 제어하고 서비스 종료를 관리하는 많은 메서드가 포함되어 있다. 이 인터페이스를 사용하면 실행을 위해 작업을 submit하고 반환된 Future 인스턴스를 사용하여 작업을 제어할 수도 있다.

```java
ExecutorService executorService = Executors.newFixedThreadPool(10);
Future<String> future = executorService.submit(() -> "Hello World");
// some operations
String result = future.get();

```

Executor, ExecutorService 는 로우 레벨 인스턴스이다. 실질적으로 우리가 사용할 때는 이들을 상위에서 한 번 감싼 *ThreadPoolExecutor* 를 사용하게된다.

그렇다면 *ThreadPoolExecutor* 의 역할은 무엇일까? *ThreadPoolExecutor* 는 fine tuning 을 위해 파라미터와 설정메서드들을 갖춘 스레드 풀 구현체이다.

여기서 주요 구성 매개변수는 **_corePoolSize_**, **_maximumPoolSize_** 및 **_keepAliveTime_** 이다.

풀은 항상 유지되는 고정된 수의 코어 스레드로 구성된다. 또한 더 이상 필요하지 않을 때 생성되었다가 종료될 수 있는 추가스레드들 또한 포함될 수 있다. 이 때 이 추가스레드들을 조정하기 위해 위 세 가지 변수가 주로 사용된다. (추가로 다른 설정도 처리될 수 있다)

**_corePoolSize_** 는 풀에 유지될 코어 스레드의 수이다. **_maximumPoolSize_** 는 풀이 커질 수 있는 코어 스레드 최대제한수이다.

코어 스레드가 늘어나는 조건은 아래와 같다.

1. 만약 새 작업이 들어올 때
2. 모든 코어 스레드가 사용 중이고
3. internal queue 가 가득 차면

thread pool은 **_maximumPoolSize_** 까지 커질 수 있다.

keepAliveTime 는 (*corePoolSize*를 초과하여 인스턴스화된) 초과 스레드가 유휴 상태로 존재하도록 허용되는 시간 간격이다. 기본적으로 *ThreadPoolExecutor*는 non-core 스레드만 제거 대상으로 고려한다. 코어 스레드에도 동일한 제거 정책을 적용하려면 [_allowCoreThreadTimeOut(true)_](<https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html#allowCoreThreadTimeOut(boolean)>) 메서드를 사용할 수 있다.

이외에도 스레드가 가득찼을 때의 정책, 스레드 생성 정책 등등을 설정할 수 있다.

```java
ThreadPoolExecutor executor =
  (ThreadPoolExecutor) Executors.newFixedThreadPool(2);
executor.submit(() -> {
    Thread.sleep(1000);
    return null;
});
executor.submit(() -> {
    Thread.sleep(1000);
    return null;
});
executor.submit(() -> {
    Thread.sleep(1000);
    return null;
});

assertEquals(2, executor.getPoolSize());
assertEquals(1, executor.getQueue().size());
```

[Introduction to Thread Pools in Java | Baeldung](https://www.baeldung.com/thread-pool-java-and-guava)

### Thread 동작 원리

![](/images/velog/dc924cff8b403c9e.png)

우리가 새 스레드를 생성하게되면 해당 스레드는 _NEW_ 상태가 된다. 프로그램이 _start()_ 메서드를 사용하여 스레드를 시작할 때까지 이 상태가 유지된다.

스레드에서 _start()_ 메서드를 호출하면 스레드는 _RUNNABLE_ 상태가 된다. 이 상태의 스레드는 실행 중이거나 실행할 준비가 된 상태이다.

\** 스레드가 monitor lock 을 기다리다가 다른 스레드에 의해 lock 된 code 에 액세스하려고 하면 *BLOCKED\* 상태가 된다. 바로 이 상태의 스레드들에게 execution 을 submit 하는 것이다.

스레드는 _wait()_ 메서드 호출과 같은 다양한 이벤트에 의해 _WAITING_ 상태가 될 수 있다. 이 상태에서는 스레드가 다른 스레드의 신호를 기다리고 있다.

스레드가 실행을 완료하거나 비정상적으로 종료되면 _TERMINATED_ 상태가 된다. 스레드는 중단될 수 있으며, 스레드가 중단되면 _InterruptedException_ 이 발생하게 된다.

### **그렇다면 InterruptedException 은 무엇이고 왜 발생하는가?**

스레드가 대기 중이거나(waiting), 절전 중이거나(sleeping), 다른 방식으로 점유 중인 상태에서 스레드가 중단되면(occupied) InterruptedException이 발생한다. 즉, 일부 코드가 스레드에서 interrupt() 메서드를 호출한 경우이다.

이 exception 은 checked exception 이며, Java의 많은 blocking operation에서 이 예외가 발생할 수 있다.

[How to Handle InterruptedException in Java | Baeldung](https://www.baeldung.com/java-interrupted-exception)

### `@Async` 는 어떻게 동작하는가?

`@Async` 는 Executor 에 대한 커스텀 설정이 없다면 `SimpleAsyncTaskExecuter` 를 통해 처리한다. `SimpleAsyncTaskExecuter` 는 스레드풀과 같이 일정량의 스레드들을 관리 & 재사용하지 않는다. `SimpleAsyncTaskExecuter` 는 요청마다 스레드를 생성하고 이에 따라 컨텍스트 스위칭이 발생한다. 즉, 스레드 생성비용과 유지비용이 발생한다.

하지만 만약 `TaskExecutor` 를 빈으로 등록해놨다면 `@Async`처리 시 `Spring Context` 를 통해 `TaskExecutor` 이 등록되어있는지를 조회, 해당 `TaskExecutor` 를 사용한다.

이에 따라 나는 아래와 같이 직접 `ThreadPoolTaskExecutor` 를 통해 `ThreadPoolExecutor` 설정을 해주었다.

\*\* `ThreadPoolTaskExecutor` 은 Java 의 `ThreadPoolExecutor` 설정을 쉽게하기 위한 Spring 에서 제공하는 Utils Class 라고 보면 된다.

```java
@Configuration
@EnableAsync
public class AsyncConfig {

  @Bean("EmailAsyncThreadPool")
  public TaskExecutor threadPoolTaskExecutor() {
		ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setThreadNamePrefix("EmailAsync-");
    executor.setThreadGroupName("EmailAsyncExecutor");
    executor.setCorePoolSize(16);
    executor.setMaxPoolSize(64);
    ,,,
    executor.initialize();
    return executor;
  }

  @Bean
  public AsyncUncaughtExceptionHandler asyncUncaughtExceptionHandler() {
    return new CustomAsyncExceptionHandler();
  }

  public static class CustomAsyncExceptionHandler implements AsyncUncaughtExceptionHandler {

    @Override
    public void handleUncaughtException(Throwable throwable, Method method, Object... obj) {
      System.out.println("Exception message : " + throwable.getMessage());
      System.out.println("Method name : " + method.getName());
      for (Object param : obj) {
        System.out.println("Parameter value : " + param);
      }
    }
  }
}
```

## 에러 유발 케이스 분석하기 🧪

### ThreadPoolExecutor 로 인해 `InterruptedException` 발생케이스는 없는가?

**있다.** 이것이 바로 이 에러의 핵심 원인이었다. (aws sdk 도 retry 도 문제가 아니였다)

정확히 말하자면 아래와 같은 순서로 발생하였다.

1. Spring Context 의 생명주기로 인해 빈들이 destory() 되는 과정에서
2. ThreadPoolExecutor 에 대한 destory() 가 호출됨에 따라 shutdown() 이 호출되었고
3. 이 shutdown() 에 의해 진행 중이던 스레드들에 대해 interruption 이 발생한 것이다.

즉 Spring Context 로 인한 shutdown() 호출이 문제였다. Spring Context 의 생명주기 처리과정부터 하나하나 자세히 살펴보자.

### Spring Context 에 의한 Bean destory()

Spring Context 는 아래 순서로 빈들을 초기화하고 제거한다.

[스프링 빈 생명주기(Bean Lifecycle) 메서드와 실행 순서](https://madplay.github.io/post/spring-bean-lifecycle-methods)

[Customizing the Nature of a Bean :: Spring Framework](https://docs.spring.io/spring-framework/reference/core/beans/factory-nature.html#beans-factory-lifecycle-disposablebean)

```java
postConstruct
afterPropertiesSet
initTaengPonent
preDestroy
destroy
destoryTaengPonent
```

### shutdown()

스프링 앱 종료 명령이 떨어지면 ThreadPoolTaskExecutor 클래스도 종료를 위해 ExecutorConfigurationSupport 클래스에 정의된 [shutdown](<https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/scheduling/concurrent/ExecutorConfigurationSupport.html#shutdown()>) 메서드가 호출된다.

좀 더 정확하게는, ExecutorConfigurationSupport 추상 클래스가 Bean LifeCycle Callback 중 하나인 DisposableBean을 구현하고 있고 [destroy()](<https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/scheduling/concurrent/ExecutorConfigurationSupport.html#destroy()>) 메서드가 호출되면서, destory 메서드 안에 있는 shutdown 메서드가 호출되는 구조이다.

\*\* destory() 는 `SpringBean` 메서드로 `ThreadPoolExecutor Bean` 자체를 죽임

\*\* shutdown() 은 `ThreadPoolTaskExecutor` 메서드로 submitted tasks 들을 shutdown 함

![](/images/velog/0da5b916538fa240.png)

이에 따라 ThreadPoolExecutor 의 shutdown() 이 호출되는데 새로운 task 를 받지 않고 이전에 submit 된 task 들을 종료처리한다. 하지만 아래를 볼 수 있듯이 task 들의 종료를 기다려주지 않고 종료처리를 한다. 즉 현재 작업 중인 스레드들을 강제로 interrupt 하여 terminated 상태로 몰아넣는 것이다.

![](/images/velog/1e64046512e7c729.png)

이 프로세스를 그림으로 정리하자면 아래 그림과 같이 정리될 수 있을 것이다.

1. Async 를 통해 ThreadPoolExecutor 조회
2. Bean으로 등록한 ThreadPoolExecutor 주입됨
3. ThreadPoolExecutor 에 의해 각 task 들을 execute
4. Spring Server 종료 or Junit 메서드 종료에 의한 Spring Context 종료, destroy() 호출
5. destroy() 호출됨에 따라 shutdown() 호출
6. 아직 끝나지 않은 execution 으로 인해 InterruptedException 발생

![](/images/velog/768ce63e71124b81.png)

이제 원인 파악이 완료되었다. **그렇다면 어떻게 execution 의 성공을 보장하면서 shutdown() 을 처리할 수 있을까?**

# Fix 🔧

**결론부터 말하자면 waitForTasksToCompleteOnShutdown , awaitTerminationSeconds 을 처리하면 된다.**

ThreadPoolTaskExecutor 빈이 destroy될 때 shutdown 처리되게 되는데, 기본적으로는 작업을 더 이상받지 않고, 만약 실행 중인 작업이 있다면 중지시키게(interrupt) 된다.

만약 작업이 끝날 때까지 대기하게 하고 싶다면, 다음 설정값으로 조정할 수 있다.

- waitForTasksToCompleteOnShutdown : shutdown 시 대기할지 여부 true/false, 기본값 false.
- awaitTerminationSeconds : 대기할 경우 대기할 초

이에 따라 나는 아래와 같이 처리해주었다.

```java
@Configuration
@EnableAsync
public class AsyncConfig {

  @Bean("EmailAsyncThreadPool")
  public TaskExecutor threadPoolTaskExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setThreadNamePrefix("EmailAsync-");
    executor.setThreadGroupName("EmailAsyncExecutor");
    executor.setCorePoolSize(16);
    executor.setMaxPoolSize(64);
    executor.setQueueCapacity(32);
    executor.setKeepAliveSeconds(60);
    executor.setAwaitTerminationSeconds(10);
    executor.setWaitForTasksToCompleteOnShutdown(true);
    executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
    executor.initialize();
    return executor;
  }
}
```

바로 성공하는 모습을 볼 수 있었다!!

![](/images/velog/794c0e9e887f3198.png)

~~사실 이 분의 포스트를 참고하여 해결을 하였다.

그런데 이 분의 설명이 기가 막히고 코가 막히다.~~

~~더 깊이 알고싶다면 꼭 참고해보자.~~

[ThreadPoolTaskExecutor의 waitForTasksToCompleteOnShutdown 속성 알아보기](https://sungjk.github.io/2023/05/22/spring-boot-graceful-shutdown.html)

[^2]: Amazon SES API v2 examples using SDK for Java 2.x - AWS SDK for Java 2.x <https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/java_sesv2_code_examples.html>

[^3]: AWS SES (Simple Email Service) Spring Boot 프로젝트에서 사용하기 <https://jojoldu.tistory.com/246>

[^5]: Use asynchronous programming - AWS SDK for Java 2.x <https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/asynchronous.html>

[^6]: Spring AWS SES 삽질기 <https://leoheo.github.io/AWS-SES/>

[^8]: How to Handle InterruptedException in Java | Baeldung <https://www.baeldung.com/java-interrupted-exception>

[^10]: Introduction to Thread Pools in Java | Baeldung <https://www.baeldung.com/thread-pool-java-and-guava>

[^11]: What are `corePoolSize` and `maxPoolSize` in thread pool configuration?

When is `maxPoolSize` used? <https://medium.com/@raksmeykoung_19675/what-are-corepoolsize-and-maxpoolsize-in-thread-pool-configuration-when-is-maxpoolsize-used-65a84258fea6>
[^12]: ThreadPoolTaskExecutor corePoolSize vs. maxPoolSize | Baeldung <https://www.baeldung.com/java-threadpooltaskexecutor-core-vs-max-poolsize>
[^13]: Introduction to Thread Pools in Java | Baeldung <https://www.baeldung.com/thread-pool-java-and-guava>
[^14]: A Guide to the Java ExecutorService | Baeldung <https://www.baeldung.com/java-executor-service-tutorial>
[^15]: ThreadPoolExecutor - Java Thread Pool Example | DigitalOcean <https://www.digitalocean.com/community/tutorials/threadpoolexecutor-java-thread-pool-example-executorservice>
[^16]: ThreadPoolExecutor (Java Platform SE 8 ) <https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ThreadPoolExecutor.html>
[^17]: ExecutorService Internal Working in Java <https://medium.com/codex/executorservice-internal-working-in-java-7b286882f54e>
[^19]: Thread Pool Sizing Guidelines <https://documentation.agilepoint.com/9010/admin/sizingThreadPoolSizingGuidelines.html>
[^21]: [Spring] @Async로 비동기 처리하기 <https://velog.io/@think2wice/Spring-Async-Thread-Pool에-대하여-Async>
[^23]: What are the defaults in Spring @Async? <https://stackoverflow.com/questions/57988341/what-are-the-defaults-in-spring-async>
[^25]: 스프링 빈 생명주기(Bean Lifecycle) 메서드와 실행 순서 <https://madplay.github.io/post/spring-bean-lifecycle-methods>
[^26]: Customizing the Nature of a Bean :: Spring Framework <https://docs.spring.io/spring-framework/reference/core/beans/factory-nature.html#beans-factory-lifecycle-disposablebean>
[^28]: 스프링 @Async를 통한 비동기 처리 및 설정값 <https://sheerheart.tistory.com/entry/스프링-Async를-통한-비동기-처리-및-설정값>
[^29]: ExecutorService - Waiting for Threads to Finish | Baeldung <https://www.baeldung.com/java-executor-wait-for-threads>
[^30]: ThreadPoolTaskExecutor의 waitForTasksToCompleteOnShutdown 속성 알아보기 <https://sungjk.github.io/2023/05/22/spring-boot-graceful-shutdown.html>
