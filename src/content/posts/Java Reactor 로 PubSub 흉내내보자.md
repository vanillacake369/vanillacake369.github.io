---
description: "FluxSink/MonoSink 기반 이벤트 발행을 통해 값 조회를 할 수 있다고?"
date: 2024-11-15
tags: [journal]
lang: ko
draft: false
---

# Before explanation,,, 👀

> ☝
>
> Java Reactor 에 대해 공부가 더 필요하지만 제가 알고 있는 수준에서 정리해보았습니다.
>
> 공식문서 참고하였으나 틀린 지식이 있을 수 있으니 유의해주시면 감사하겠습니다.

# Episode 📜

### 주어진 요구사항

> 전체 요구사항은 이보다 더 많지만 간략하게 정리하고자 한다.

- 사용자는 추천경로 목록 중 원하는 경로를 선택한다.
- 원하는 경로의 막차도착예정정보를 조회한다.
  - 각 구간의 이동수단에 따라 해당 수단의 막차도착예정정보를 조회한다.
- 막차도착예정정보에 따라 막차알림 이벤트를 발행한다.

### 설계

아래와 같이 역할에 따라 계층을 분리하였다.

- Facade Layer
  - `막차알림 파사드`
    - 경로 선택을 인자값으로 받는다.
    - 경로에 대해 `막차도착예정정보 조회 서비스` 를 호출한다.
    - `막차도착예정정보`에 따라 `막차알림 이벤트`를 발행한다.
- Service Layer
  - `막차도착예정정보 조회 서비스`
    - 경로의 각 구간을 파싱한다.
    - 각 구간 별로 막차도착예정정보 조회한다.
      - 버스인 경우 `버스 막차정보 조회 클라이언트` 를 호출한다.
      - 지하철인 경우 `지하철 막차정보 조회 클라이언트` 를 호출한다.
      - 기차인 경우 `기차 막차정보 조회 클라이언트` 를 호출한다.
      - ,,,
- Client Layer
  - `버스 막차정보 조회 클라이언트`
    - `버스 막차정보 API` 를 호출한다.
  - `지하철 막차정보 조회 클라이언트`
    - `지하철 막차정보 API` 를 호출한다.
  - `기차 막차정보 조회 클라이언트`
    - `기차 막차정보 API` 를 호출한다.

### 어라라,, 대중교통 도메인이 있네,,

위와 같은 설계대로라면 Client Layer 에서 각 대중교통 타입에 따라

대중교통 API 를 호출하는 로직들이 있어야 한다.

하지만 **대중교통 또한 도메인으로 묶여있었다.**

대중교통 정보를 영속화 & 캐싱하고 있었고, API 로 정보제공도 하고 있고, 여러 지자체 API 를 거치다보니 인터페이스화 되어있었다.

더군다나 사실 따지고 보면 대중교통도 도메인이 맞긴하다.

현재 컨벤션 상 아래 규칙으로 인해 **Client Layer 에서 대중교통 도메인을 호출할 수 없었다.**

- 하위 계층이 상위계층을 호출 할 수 없다.
- 오직 Facade 계층만이 다른 도메인 서비스를 사용할 수 있다.
  ~~→ 이것도 모놀리식 한정 개념이지,,, 마이크로서비스에서는 다른 규칙이 규정되어야 한다.~~

Facade 의미에 맞게 Facade 에서만 다른 도메인을 의존하도록 강제하였다.

그렇다면 어떻게 할 수 있을까,,,, 고민하던 찰나에 **이벤트 발행 & 채널 개념을 사용할 수 있지 않을까** 라고 생각들었고 이에 대해서 구현해보고자 찾아보았다.

### 이벤트 발행 & 채널이란 ??

도메인 모델, 포트 어댑터 패턴, 마이크로서비스,,,,

여러 설계안이 있을 것이다.

하지만 위 설계안 모두 도메인 기반 설계이다.

도메인 기반 설계에서는 도메인 간 이벤트 발행 및 큐잉이 필연적이라고 생각한다.

~~특히 마이크로서비스에서는,,,,~~

> 가장 대표적인 예시가 애그리거트 모델이다.
>
> 애그리거트 모델에서는 애그리거트 루트의 값이 변경됨에 따라
>
> 이벤트 발행하여 값이 변경되었음을 알린다.
>
> 이에 따라 구독자들을 이를 탐지하고 각 유스케이스에 따라 처리를 한다.
>
> ( 가령 `주문` 도메인에 대해 `환불 유스케이스` 처리한 경우
>
> `환불 이벤트` 발행을 하여 이에 관련된 `구독권한` 을 해지한다던가,,, )

그렇다면 도메인 간 정보를 주고 받고자 한다면 어떻게 해야할까?

Kafaka 나 Redis PUB/SUB 을 사용하는 경우가 있을 것이다.

Kafaka 나 Redis PUB/SUB 에서는 발행자와 구독자가 이벤트 발행과 채널(카프카에서는 브로커)을 통해 데이터를 주고 받는다.

하지만 Kafaka 나 Redis PUB/SUB 에 대해서는 아직 기술 성숙도가 낮았다.

이에 따라 스프링부트의 ApplicationEventPublisher 와 FluxSink 를 사용하여 구현해보았다.

# About 💁‍♂️

> ApplicationEventPublisher 에 대해서는 아래 링크를 참고해보세요.
>
> https://www.baeldung.com/spring-events

> Mono.create() & MonoSink 도 아래에서 설명할 FluxSink 와 비슷하게 처리됩니다.

아래 링크를 참고해보세요.

> https://kkoon9.tistory.com/156

## Flux 생성 방법에 따른 값 처리

Mono / Flux 생성 방법에 따라 처리방법을 조작하거나 결과값을 담아 보낼 수 있다.

해당 방법을 통해 Redis 채널 역할을 할 수 있다.

그 전에 결과값에 대해 제어할 수 있는 FluxSink 를 알아보자.

### [FluxSink](https://projectreactor.io/docs/core/release/api/reactor/core/publisher/FluxSink.html)

다운스트림 구독자를 래퍼 API로 감싸서 0 또는 1의 onError/onComplete가 뒤따르는 다음 신호를 원하는 개수만큼 방출할 수 있다.

- next() : 널이 아닌 요소를 방출하여 onNext 신호를 생성합니다. (Emit a non-null element, generating an [**`onNext`**](https://www.reactive-streams.org/reactive-streams-1.0.3-javadoc/org/reactivestreams/Subscriber.html?is-external=true#onNext-T-) signal.)
- complete() : 시퀀스를 성공적으로 종료하여 onComplete 신호를 생성합니다. (Terminate the sequence successfully, generating an onComplete signal.)
- ,,,,

### 비동기 및 멀티스레드 Flux 생성 → Flux.create()

create 를 사용하면 각 단계마다 값을 여러 개 생산하는 Flux 를 만들 수 있으며, 심지어 멀티스레드로도 가능하다.

이 메서드는 next, error, complete 메서드를 가지고 있는 FluxSink 를 노출하고 있다.

콜백에서 멀티스레드 기반 이벤트를 트리거할 수 있다.

```java
Flux.create(fluxSink -> {
	fluxSink.next(1);
	fluxSink.next(2);
	fluxSink.complete();
}).subscribe(...)
```

처럼 `create`를 사용하면 `Consumer` 내부에서

- 좀 더 커스텀하게 다음 시그널을 `next`로 내려줄지
- `complete` 완료 시그널을 줄 지
- `error` 에러 시그널을 줄 지 프로그래밍 적으로 결정할 수 있다.

### Flux.create() 주의점

1.

무한 파이프라인 ([참고](https://godekdls.github.io/Reactor%20Core/reactorcorefeatures/#:~:text=%EC%9E%88%EC%96%B4%20%EB%A7%A4%EC%9A%B0%20%EC%9C%A0%EC%9A%A9%ED%95%98%EB%8B%A4.-,create,-%EB%8A%94%20%EB%B9%84%EB%8F%99%EA%B8%B0%20API))

create 는 비동기 API와 함께 사용할 수 있다고 해서, 코드를 병렬화해 주거나 비동기로 만들어 주지는 않는다

람다 내에서 블로킹하면 교착 상태나 이와 유사한 부작용을 경험할 것이다.

람다에서 오랫동안 블로킹하고 있으면 ( sinke.next(t) 를 호출하는 무한 루프 등) 파이프라인이 잠겨 버릴 수 있다: 요청을 수행해야 할 스레드에서 루프를 실행하고 있기 때문에 요청을 수행할 수 없다.

이때는 subscribeOn(Scheduler, false) 메소드를 사용해라: create 는 requestOnSeparateThread = false 면 Scheduler 스레드를 사용하고, 기존 스레드에서 request 를 수행하기 때문에 데이터 흐름을 멈추지 않는다.

2.

Publisher 에 대한 배압관리 ([참고](https://javacan.tistory.com/entry/Reactor-Start-3-RS-create-stream))

Flux create 는 Subscriber가 요청한 개수보다 Publisher 가 더 많은 데이터를 방출할 수 있다.

```java
Flux<Integer> flux = Flux.create( (FluxSink<Integer> sink) -> {
		// Subscriber가 요청한 것보다 3개 더 발생
    sink.onRequest(request -> {
        for (int i = 1; i <= request + 3 ; i++) {
            sink.next(i);
        }
    });
});
```

이 코드는 Subscriber가 요청한 개수보다 3개 데이터를 더 발생한다.

이 경우 어떻게 될까?

기본적으로 Flux.create()로 생성한 Flux는 초과로 발생한 데이터를 버퍼에 보관한다.

버퍼에 보관된 데이터는 다음에 Subscriber가 데이터를 요청할 때 전달된다.

요청보다 발생한 데이터가 많을 때 선택할 수 있는 처리 방식은 다음과 같다.

- IGNORE : Subscriber의 요청 무시하고 발생(Subscriber의 큐가 다 차면 IllegalStateException 발생)
- ERROR : 익셉션(IllegalStateException) 발생
- DROP : Subscriber가 데이터를 받을 준비가 안 되어 있으면 데이터 발생 누락
- LATEST : 마지막 신호만 Subscriber에 전달
- BUFFER : 버퍼에 저장했다가 Subscriber 요청시 전달.

버퍼 제한이 없으므로 OutOfMemoryError 발생 가능

Flux.create()의 두 번째 인자로 처리 방식을 전달하면 된다.

```java
Flux.create(sink -> { ... }, FluxSink.OverflowStrategy.IGNORE);
```

3.

Subscriber 에 대한 배압관리 ([참고](<https://godekdls.github.io/Reactor%20Core/reactorcorefeatures/#441-synchronous-generate:~:text=%ED%8A%9C%EB%8B%9D%ED%95%A0%20%EC%88%98%20%EC%9E%88%EB%8B%A4.-,limitRate,-(N)%EC%9D%80>))

limitRate() 를 사용하여 다운스트림 요청을 분할 할 수 있다.

예를 들어, limitRate(10) 에 100 을 요청하게 되면 업스트림으로 10 요청을 최대 10 개 전파한다.

```java
fetchMetroLastDeparture(requestDto)
    .limitRate(10) // Request 10 items at a time
    .doOnNext(item -> {
        // process each item
    })
    .subscribe();

```

### 동기 Flux 생성 → Flux.generate()

create() 는 비동기 멀티스레드 Flux 를 생성하는 반면, 동기 Flux 를 생성하고자 한다면 generate() 를 사용해야한다.

- _Callable_ 함수는 generator 의 초기 상태를 설정한다. - 이 경우, 요소 *0*과 *1*이 있는 [Tuples](https://projectreactor.io/docs/core/release/api/reactor/util/function/Tuples.html) 이다.
- _BiFuntion_ 함수는 제너레이터로, [SynchronousSink](https://projectreactor.io/docs/core/release/api/reactor/core/publisher/SynchronousSink.html)를 소비한 다음 각 라운드에서 싱크의 _next_ 메서드와 현재 상태를 사용하여 아이템을 방출한다.

```java
Flux<String> flux = Flux.generate(
    () -> 0, // (1)
    (state, sink) -> {
      sink.next("3 x " + state + " = " + 3*state); // (2)
      if (state == 10) sink.complete(); // (3)
      return state + 1; // (4)
    });
```

위 Flux 의 동작과정은 아래와 같다.

1.

최초 상태로 0,1 을 제공한다. 2.

상태를 보고 방출할 데이터를 결정한다 (상태 값은 3의 곱셈표에서 행 번호를 의미한다고 볼 수 있다). 3.

언제 중단할지 결정할 때도 상태를 사용한다. 4.

다음 실행에서 사용할 새 상태 값을 반환한다 (시퀀스가 종료되지 않았다면).

https://velog.io/@redjen/Java-Reactive-Programming-4-Flux-%EC%83%9D%EC%84%B1

https://www.baeldung.com/flux-sequences-reactor

### 어떤 Flux 생성을 사용할까?

이 문제는 `어디서 Flux Stream 을 생성 하느냐` 에 달려있다.

본 설계에서의 Flux Stream 생성 위치는 이벤트 구독자이다.

다만 이벤트 구독자에는 `@Async`를 통해 스레드 풀을 부여하였다.

따라서 이에 걸맞는 `Flux.create()` 를 사용하였다.

\*\*~~여기서 설명은 안 했지만, Flux.push() 는 Async&Single-Thread Flux 를 생성하는데, Flux.create() 로 처리가능하므로 생략했다.~~

```java
@Slf4j
@Component
@RequiredArgsConstructor
public class MetroEventHandler {

    private final FetchMetroLastDepartureFacade fetchMetroLastDepartureFacade;

    @Async("LastTransportAlarmAsyncThreadPool")
    @Retryable(maxAttempts = 5, backoff = @Backoff(delay = 100))
    @EventListener
    public void handleFetchMetroLastDepartureEvent(FetchMetroLastDepartureEvent event) {
		    // Flux 파이프라인 생성
		    // Flux 파이프라인을 채널로 반환
    }
}

```

### 그럼 어떻게 FluxSink 로 이벤트 & 채널 개념을 구현할 수 있을까??

방법은 간단하다.

**Event 발행 시 FluxSink 를 Event 에 넘겨주고, 구독자는 FluxSink 에 값을 담는 것이다.**

즉, FluxSink 가 채널의 역할을 하게되는 것이다.

1.

FluxSink 를 Event 의 필드값으로 둔다. 2.

Event 를 발행한다. 3.

Event 구독자는 Flux<T> 스트림을 생성한다. 1.

여기서는 API 호출이 되겠다. 4.

Flux<T> 에 대해 next(),cancel(),complete() 시그널에 따라 처리한다.

각각 알아보자.

# Apply 🧑‍💻

### Event

우선 아래와 같이 FluxSink 를 Event 의 필드값으로 둔다.

```java
@Value
@Getter
@JsonSerialize
@JsonDeserialize
@AllArgsConstructor(staticName = "of")
@NoArgsConstructor(access = AccessLevel.PUBLIC, force = true)
public class FetchMetroLastDepartureEvent {

    MetroLastDepartureRequestDto requestDto;
    FluxSink<MetroLastDeparture> resultSink;
}
```

### EventPublisher (Client Layer)

Flux.create() 를 통해 Flux 생성, sink 를 Event 에 담는다.

이후 Event 를 발행한다.

```java
public interface FetchSubwayClient {

    Flux<MetroLastDeparture> fetchMetroLastDepartureOf(Leg leg);
}

```

```java
@Slf4j
@Component
@RequiredArgsConstructor
public class FetchSubwayClientImpl implements FetchSubwayClient {

    private final ApplicationEventPublisher applicationEventPublisher;
    private final MetroLastDepartureRequestMapper requestMapper;

    @Override
    public Flux<MetroLastDeparture> fetchMetroLastDepartureOf(Leg leg) {
        return Flux.<MetroLastDeparture>create(sink -> {
            MetroLastDepartureRequestDto requestDto = requestMapper.toRequest(leg);
            FetchMetroLastDepartureEvent event = FetchMetroLastDepartureEvent.of(requestDto, sink);
            applicationEventPublisher.publishEvent(event);
        });
    }
}

```

### EventListener

발행된 Event 를 탐지한 구독자는 Flux<T> 를 생성한다.

( 여기서는 Flux<MetroLastDeparture> 이 되겠다. )

생성한 Flux<T> 의 시그널에 따라 sink 를 제어한다.

만약 성공한다면 sink 에 대해 값이 전송된다.

```java
@Slf4j
@Component
@RequiredArgsConstructor
public class MetroEventHandler {

    private final FetchMetroLastDepartureFacade fetchMetroLastDepartureFacade;

    @Async("LastTransportAlarmAsyncThreadPool")
    @Retryable(maxAttempts = 5, backoff = @Backoff(delay = 100))
    @EventListener
    public void handleFetchMetroLastDepartureEvent(FetchMetroLastDepartureEvent event) {
        MetroLastDepartureRequestDto requestDto = event.getRequestDto();
        fetchMetroLastDepartureFacade
            .fetchMetroLastDeparture(requestDto)
            .doOnNext(event.getResultSink()::next)
            .doOnError(error -> event.getResultSink().error(error))
            .doOnComplete(event.getResultSink()::complete)
            .limitRate(10)
            .subscribe();
    }
}

```

### Facade Layer

Flux<T> 를 생성한다.

여기서는 서비스를 호출하여 API 호출을 하고,

비즈니스 로직을 처리했다. — filter() 나 take() 사용

```java
public interface FetchMetroLastDepartureFacade {

    Flux<MetroLastDeparture> fetchMetroLastDeparture(MetroLastDepartureRequestDto requestDto);
}

```

```java
@Slf4j
@Component
@RequiredArgsConstructor
public class FetchMetroLastDepartureFacadeImpl implements FetchMetroLastDepartureFacade {

    private final FetchMetroLastDeparture fetchMetroLastDeparture;

    @Override
    public Flux<MetroLastDeparture> fetchMetroLastDeparture(MetroLastDepartureRequestDto request) {
        return fetchMetroLastDeparture
            .fetchMetroLastDeparture(request)
            // 잘못된 역이름 조회결과 필터
            .filter(metroLastDeparture -> metroLastDeparture.stationNm().equalsIgnoreCase(request.subwayStationName()))
            // 페이지 사이즈만큼 가져오기
            .take(request.numOfRows());
    }
}

```

### Test

이제 잘 돌아가는지 실제로 테스트를 할 차례다.

파라미터 테스트를 통해 더미 인자값을 만들어주었다. — TMAP JSON 생성

```java
@SpringBootTest
//@CustomIntegrationTest
class FetchSubwayClientImplTest {

    // 구간 소요시간 = 1시간 (60초 * 60분)
    private final static int FIXED_SECTION_SECONDS = 60 * 60;
    // 더미데이터 생성 라이브러리
    private final static FixtureMonkey FIXTURE_MONKEY = FixtureMonkey.builder()
        .defaultNotNull(Boolean.TRUE)
        .objectIntrospector(ConstructorPropertiesArbitraryIntrospector.INSTANCE)
        .build();

    @Autowired
    private FetchSubwayClientImpl fetchSubwayClient;

    static Stream<Arguments> 종로역3호선생성() {

        List<Station> stations = List.of(
            new Station(
                0,
                "110321",
                "종로3가",
                "126.991825",
                "37.571708"
            ),
            new Station(
                1,
                "110322",
                "을지로3가",
                "126.992569",
                "37.566803"
            ),
            new Station(
                2,
                "110323",
                "충무로",
                "126.994439",
                "37.560953"
            )
        );
        Leg 종로3가 = FIXTURE_MONKEY
            .giveMeBuilder(Leg.class)
            .set(
                javaGetter(Leg::mode),
                Mode.SUBWAY
            )
            .set(
                javaGetter(Leg::type),
                3
            )
            .set(
                javaGetter(Leg::start),
                new Start(37.57170833333333, 126.991825, "종로3가")
            )
            .set(
                javaGetter(Leg::passStopList),
                FIXTURE_MONKEY.giveMeBuilder(PassStop.class).set(javaGetter(PassStop::stations), stations).sample()
            )
            .set(
                javaGetter(Leg::sectionTime),
                FIXED_SECTION_SECONDS
            )
            .sample();
        return Stream.of(
            Arguments.of(
                종로3가
            )
        );
    }

    @ParameterizedTest
    @DisplayName("이벤트 발행을 통해 지하철 막차 도착예정 정보 조회 시 성공합니다.")
    @MethodSource("종로역3호선생성")
    void 이벤트발행을통해_지하철막차도착예정정보_조회시_성공(Leg leg) {
        // GIVEN
        // WHEN
        Flux<MetroLastDeparture> metroLastDepartureFlux = fetchSubwayClient.fetchMetroLastDepartureOf(leg);

        // THEN
        StepVerifier.create(metroLastDepartureFlux)
            .thenConsumeWhile(metroLastDeparture -> {
                assertNotNull(metroLastDeparture);
                System.out.println("metroLastDeparture = " + metroLastDeparture);
                return true;
            })
            .verifyComplete();
    }

}
```

아래와 같이 성공하는 것을 볼 수 있다.

![](/images/velog/3051b285688fccee.png)

# Further Improvement ,,, 💡

이 모든 뻘짓이,,,

모놀리식 구조로 마이크로서비스 흉내를 내다보니 발행하는 일이라고 생각한다.

마이크로서비스 흉내를 낼 것이라면,,,

도메인 단위로 찢어내는 게 가장 현명하고 빠른 길이라고 생각한다.

그러나 분리했음에도 다양한 방법이 있을 것이다.

다음은 필자가 생각하기에 좋은 방법이라고 고려하는 것들이다.

- Kafka 사용
- [Redis Streams](https://dev.gmarket.com/113) : event 가 휘발되지 않아 놓친 event 를 처리할 수 있고, 병렬 처리가 가능하다.
- Redis Pub/Sub : replay 가 되지 않아 놓친 event 에 대해 재처리가 안 된다.
- 동일한 방법을 사용하되 스프링 멀티 모듈을 통해 분리한다.
