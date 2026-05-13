---
title: "Mono.defer() 기반 캐시 처리기"
description: "대중적인 Cache-Aside 와 Mono.defer() 을 통해 캐시를 처리해보자"
date: 2025-03-02
tags: []
category: uncategorized
lang: ko
draft: false
---

![](/images/velog/d01b6c157706ce8f.png)


# Episode 📜

---

> 💡
> 
> 요구사항
> 
> - 대중교통 추천경로 조회한다.
> - 데이터는 10분 단위로 캐싱되어야 한다.
> - 사용자는 100,000 목표로 한다.
> - 배와 비행기에 대한 결과는 제외한다.
> - 사용자의 성향에 따라 경로 정렬을 지원한다.

이를 구현하기 위해 WebFlux 를 사용하여 아래와 같이 처리하였다.

- Cache 조회
    - Hit 인 경우 캐시데이터 반환
    - Miss 인 경우 추천경로 조회
    - 추천경로 캐시 저장
- 사용자 성향에 따라 정렬
- 배와 비행기 결과 제거

아래는 이와 관련된 코드이다.

```java
private Mono<? extends FetchRouteResponse> fetchRoute(Member member, FetchRouteRequestDto request) {
    // Cache Hit -> 추천경로 캐시 반환
    return queryRouteCache.getRouteJsonFromCache(request)
        // Cache Miss -> 추천경로 API 호출 이후 캐시 저장
        .switchIfEmpty(fetchAndCacheRoute(request))
        // 정렬옵션에 따른 정렬
        .flatMap(routeResponse -> sortRoute.sortRouteResponse(routeResponse, request.routeSortOption(), member))
        // 배 혹은 비행기 조회된 결과 제외
        .map(fetchRouteResponse -> filterRoute.excludePlaneOrFerry(fetchRouteResponse, Mode.AIRPLANE, Mode.FERRY));
}

,,,

private Mono<FetchRouteResponse> fetchAndCacheRoute(FetchRouteRequestDto request) {

    log.info("TMAP API 요청 !!!");

    // 추천경로 조회 (TMAP)
    return fetchRoute.getRouteResponse(request)
        // 추천경로 캐시 저장
        .flatMap(routeResponse -> commandRouteCache
            .saveRouteToCache(request, routeResponse)
            .thenReturn(routeResponse));
}
```

위와 같이 구현한 뒤 테스트를 통해 

API 호출없이 캐싱된 데이터를 조회하는지 확인해보았다.

하지만 슬프게도 ,,, 캐싱된 데이터가 가져와지지 않고, API 가 호출되는 것을 볼 수 있었다

![](/images/velog/ff0fbd36f87e026f.png)

왜 호출이 되었을까?

이는 내가 Hot Publisher 로 데이터를 생성해냈기 때문이다.

# Reason 🤷‍♂️

---

### Hot Publisher

Hot Publisher는 subscriber의 호출과 별도로 element를 발행하는 publisher로 볼 수 있다.

따라서 구독자가 없어도 element는 발행할 수 있으며, **발행 주도권은 publisher**에게 있다.

- Subscription의 타이밍과 상관없이 데이터를 생성하는 Publisher를 Hot Publisher라고 한다.
- Subscriber는 Hot Publisher가 생성한 데이터의 일부 또는 전체를 수신할 수 있다.
- Hot Publisher는 데이터 생성 및 전달에 대한 제어권을 가지며, 여러 Subscriber가 같은 데이터를 수신할 수 있다.
- 대표적인 연산자로는 `just()` 가 있다.
- `just` 를 Cold Publisher로 변환하려면 `defer()` 를 사용한다.

```rust
Sinks.Many<String> hotSource = Sinks.unsafe().many().multicast().directBestEffort();

Flux<String> hotFlux = hotSource.asFlux().map(String::toUpperCase);

hotFlux.subscribe(d -> System.out.println("Subscriber 1 to Hot Source: "+d));

hotSource.emitNext("blue", FAIL_FAST);
hotSource.tryEmitNext("green").orThrow();

hotFlux.subscribe(d -> System.out.println("Subscriber 2 to Hot Source: "+d));

hotSource.emitNext("orange", FAIL_FAST);
hotSource.emitNext("purple", FAIL_FAST);
hotSource.emitComplete(FAIL_FAST);
```

```
Subscriber 1 to Hot Source: BLUE
Subscriber 1 to Hot Source: GREEN
Subscriber 1 to Hot Source: ORANGE
Subscriber 2 to Hot Source: ORANGE
Subscriber 1 to Hot Source: PURPLE
Subscriber 2 to Hot Source: PURPLE
```

### Cold Publisher

- Subscription이 이루어지기 전까지 데이터를 생성하지 않는 Publisher를 Cold Publisher라고 한다.
- 이것은 HTTP 요청과 유사하다. 호출을 하지 않으면 결과도 없다.
- 각 Subscription은 해당 Publisher의 데이터를 처음부터 시작한다.
- Cold Publisher는 데이터를 생성하고 Subscriber가 Subscription을 요청할 때 데이터를 제공한다.

```rust
Flux<String> source = Flux.fromIterable(Arrays.asList("blue", "green", "orange", "purple"))
                          .map(String::toUpperCase);

source.subscribe(d -> System.out.println("Subscriber 1: "+d));
source.subscribe(d -> System.out.println("Subscriber 2: "+d));
```

```
Subscriber 1: BLUE
Subscriber 1: GREEN
Subscriber 1: ORANGE
Subscriber 1: PURPLE
Subscriber 2: BLUE
Subscriber 2: GREEN
Subscriber 2: ORANGE
Subscriber 2: PURPLE
```

### Mono.defer()

이는 just() 와 달리 구독할 때마다 값을 생성해내는 연산자이다.

따라서 아래와 같은 상황에 쓰일 수 있다.

- 조건에 따라 데이터구독을 하여 받아야하는 경우
- 각 데이터 구독이 다른 결과값을 만들어내야 하는 경우

보통은 `조건부에 따라 데이터 구독`하는 경우로 사용될 것 같다.

이에 따라 캐싱 Miss 조건에 따라 Mono.defer() 를 호출하도록 적용해보았다.

# Fix 🔧

---

> 이전
> 

```java
private Mono<? extends FetchRouteResponse> fetchRoute(Member member, FetchRouteRequestDto request) {
    // Cache Hit -> 추천경로 캐시 반환
    return queryRouteCache.getRouteJsonFromCache(request)
        // Cache Miss -> 추천경로 API 호출 이후 캐시 저장
        .switchIfEmpty(fetchAndCacheRoute(request))
        // 정렬옵션에 따른 정렬
        .flatMap(routeResponse -> sortRoute.sortRouteResponse(routeResponse, request.routeSortOption(), member))
        // 배 혹은 비행기 조회된 결과 제외
        .map(fetchRouteResponse -> filterRoute.excludePlaneOrFerry(fetchRouteResponse, Mode.AIRPLANE, Mode.FERRY));
}
```

> 이후
> 

```java
private Mono<? extends FetchRouteResponse> fetchRoute(Member member, FetchRouteRequestDto request) {
    // Cache Hit -> 추천경로 캐시 반환
    return queryRouteCache.getRouteJsonFromCache(request)
        // ** Cache Miss -> 추천경로 API 호출 이후 캐시 저장 **
        .switchIfEmpty(Mono.defer(() -> fetchAndCacheRoute(request)))
        // 정렬옵션에 따른 정렬
        .flatMap(routeResponse -> sortRoute.sortRouteResponse(routeResponse, request.routeSortOption(), member))
        // 배 혹은 비행기 조회된 결과 제외
        .map(fetchRouteResponse -> filterRoute.excludePlaneOrFerry(fetchRouteResponse, Mode.AIRPLANE, Mode.FERRY));
}
```


# Reference 📚

---

https://randro.tistory.com/43

https://www.baeldung.com/java-mono-defer

https://p-bear.tistory.com/80
