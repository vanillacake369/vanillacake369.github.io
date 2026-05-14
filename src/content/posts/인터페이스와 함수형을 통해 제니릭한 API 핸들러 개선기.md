---
title: "인터페이스와 함수형을 통해 제니릭한 API 핸들러 개선기"
description: "동일한 API 호출코드를 인터페이스와 함수형을 활용하여 제네릭하게 처리하자!"
date: 2024-10-01
tags: [journal]
lang: ko
draft: false
---

![](/images/velog/92e7d60ad43fad73.png)

# Episode 📜


사내에서는 논블로킹 API 호출을 처리하고자  Webflux & Webclient 를 사용 중에 있다.

Webflux & Webclient 를 사용하면 세 가지 반환 타입을 활용할 수 있다.

- block 처리를 하여 결과값을 그대로 반환하거나,
- 하나의 스트림을 담는 Mono 를 반환하거나
- 여러 스트림을 담는 Flux 를 반환할 수 있다.

하지만 기획이 지속적으로 변경됨에 따라 어떤 변경점이 있을지 몰랐고, 

메서드 오버로딩을 통해 세 가지 모두 처리하게끔 하였다.

아래와 같이 말이다.

```java
// 실제 API 호출
private ResponseSpec fetchBusLane(TagoBusLaneApiRequestBodyDto requestBody) {
    return webClient
        .get()
        .uri(uriBuilder -> uriBuilder
            .path("/getRouteInfoIem")
            .queryParam("_type", "json")
            .queryParam("cityCode", requestBody.cityCode())
            .queryParam("routeId", requestBody.routeId())
            .build())
        .retrieve()
        .onStatus(HttpStatusCode::isError, WebClientErrorHandler.handleError());
}

// Blocking 하여 결과값 fetch
public <T> T fetchBusLanes(
    ParameterizedTypeReference<T> typeReference,
    TagoBusLaneApiRequestBodyDto requestBody
) {
    return fetchBusLane(requestBody)
        .bodyToMono(typeReference)
        .timeout(Duration.ofSeconds(1))
        .retry(3)
        .block();
}

// Mono 결과값 fetch
public <T> Mono<T> fetchBusLaneMono(
    ParameterizedTypeReference<T> typeReference,
    TagoBusLaneApiRequestBodyDto requestBody
) {
    return fetchBusLane(requestBody)
        .bodyToMono(typeReference)
        .timeout(Duration.ofSeconds(1))
        .retry(3)
        .subscribeOn(Schedulers.boundedElastic());
}

// Flux 결과값 fetch
public <T> Flux<T> fetchBusLaneFlux(
    ParameterizedTypeReference<T> typeReference,
    TagoBusLaneApiRequestBodyDto requestBody
) {
    return fetchBusLane(requestBody)
        .bodyToFlux(typeReference)
        .timeout(Duration.ofSeconds(1))
        .retry(3)
        .subscribeOn(Schedulers.boundedElastic());
}
```

하지만 API 호출이 많아질수록 중복코드가 늘어났다.

각 API 호출 별로 모두 동일 옵션에 대해 동일한 정책을 취했다.

- timeout
- retry
- subscribe 에 대한 scheduler

이를 제너릭하게 만들 수 없을까?

싶었고, 다음에 소개할 제네릭 인터페이스를 구현하게 되었다.

# Reason 🤷‍♂️


- Webclient API 호출에 대한 중복코드 발생
    - API 별 동일 옵션에 대한 동일 정책 사용

# Fix 🔧


제네릭과 함수형을 사용하여 인터페이스를 구축하였다.

```java
public interface GenericApiHandler {

    default <T, K> Mono<T> fetchMonoInternal(K requestBody, Function<K, Mono<T>> apiCall) {
        return apiCall
            .apply(requestBody)
            .timeout(Duration.ofSeconds(1))
            .retry(3)
            .subscribeOn(Schedulers.boundedElastic());
    }

    default <T, K> Flux<T> fetchFluxInternal(K requestBody, Function<K, Flux<T>> apiCall) {
        return apiCall
            .apply(requestBody)
            .timeout(Duration.ofSeconds(1))
            .retry(3)
            .subscribeOn(Schedulers.boundedElastic());
    }

    default <T, K> T fetchBlock(K requestBody, Function<K, Mono<T>> apiCall) {
        return fetchMonoInternal(requestBody, apiCall).block();
    }

    default <T, K> Mono<T> fetchMono(K requestBody, Function<K, Mono<T>> apiCall) {
        return fetchMonoInternal(requestBody, apiCall);
    }

    default <T, K> Flux<T> fetchFlux(K requestBody, Function<K, Flux<T>> apiCall) {
        return fetchFluxInternal(requestBody, apiCall);
    }
}
```

fetch() 메서드는 아래와 같은 역할을 한다.

- `api 에 필요한 request`와 `함수형`을 인자값으로 받는다.
- 해당 메서드 내에만 API 호출 정책이 존재한다.
- API 호출 정책에 따라 API 호출을 처리한다.
    - `apiCall.apply(requestBody)` 을 사용하여 넘겨받은 메서드를 호출한다.
    - `timeout()` 을 통해 1초 간 시그널이 없다면 `TimeoutException` 을 전파한다.
    - `retry()`를 통해 error 발생 시 3번의 Re-subscribes 한다.
    - `subscribeOn()`을 통해 subscriber 에 대한 scheduler 를 등록한다.

이제 API 호출에 대한 제너릭 인터페이스를 구현하였으므로 구현체가 이를 처리할 수 있도록 해주자.

```java

@Slf4j
@Component
@RequiredArgsConstructor
public class TagoBusLaneApiHandler implements GenericApiHandler {

		// 실제 API 호출 처리
		private ResponseSpec fetchBusLaneInfo(TagoBasicInfoRequestDto requestBody) {
		    return webClient
		        .get()
		        .uri(uriBuilder -> uriBuilder
		            .path("/BusRouteInfoInqireService")
		            .path("/getRouteInfoIem")
		            .queryParam("_type", "json")
		            .queryParam("cityCode", requestBody.cityCode())
		            .queryParam("routeId", requestBody.routeId())
		            .build())
		        .retrieve();
		}
		
		// Blocking 처리
		public <T> T fetchBusLaneInfo(
		    ParameterizedTypeReference<T> typeReference,
		    TagoBasicInfoRequestDto requestBody
		) {
		    return fetchBlock(
		        requestBody,
		        req -> fetchBusLaneInfo(req).bodyToMono(typeReference)
		    );
		}
		
		// Mono 처리
		public <T> Mono<T> fetchBusLaneInfoMono(
		    ParameterizedTypeReference<T> typeReference,
		    TagoBasicInfoRequestDto requestBody
		) {
		    return fetchMono(
		        requestBody,
		        req -> fetchBusLaneInfo(req).bodyToMono(typeReference)
		    );
		}
		
		// Flux 처리
		public <T> Flux<T> fetchBusLaneInfoFlux(
		    ParameterizedTypeReference<T> typeReference,
		    TagoBasicInfoRequestDto requestBody
		) {
		    return fetchFlux(
		        requestBody,
		        req -> fetchBusLaneInfo(req).bodyToFlux(typeReference)
		    );
		}

}
```

이를 통해 조금 더 읽기 수월하게 구현할 수 있었고, 중복코드를 줄일 수 있었다.

중복코드가 줄다보니 구현하기도 수월해져 구현시간이 단축되는 효과도 있었다.

`이전`

```java

// Blocking 하여 결과값 fetch
public <T> T fetchBusLanes(
    ParameterizedTypeReference<T> typeReference,
    TagoBusLaneApiRequestBodyDto requestBody
) {
    return fetchBusLane(requestBody)
        .bodyToMono(typeReference)
        .timeout(Duration.ofSeconds(1))
        .retry(3)
        .block();
}

// Mono 결과값 fetch
public <T> Mono<T> fetchBusLaneMono(
    ParameterizedTypeReference<T> typeReference,
    TagoBusLaneApiRequestBodyDto requestBody
) {
    return fetchBusLane(requestBody)
        .bodyToMono(typeReference)
        .timeout(Duration.ofSeconds(1))
        .retry(3)
        .subscribeOn(Schedulers.boundedElastic());
}

// Flux 결과값 fetch
public <T> Flux<T> fetchBusLaneFlux(
    ParameterizedTypeReference<T> typeReference,
    TagoBusLaneApiRequestBodyDto requestBody
) {
    return fetchBusLane(requestBody)
        .bodyToFlux(typeReference)
        .timeout(Duration.ofSeconds(1))
        .retry(3)
        .subscribeOn(Schedulers.boundedElastic());
}
```

`이후`

```java
// Blocking 처리
public <T> T fetchBusLaneInfo(
    ParameterizedTypeReference<T> typeReference,
    TagoBasicInfoRequestDto requestBody
) {
    return fetchBlock(
        requestBody,
        req -> fetchBusLaneInfo(req).bodyToMono(typeReference)
    );
}

// Mono 처리
public <T> Mono<T> fetchBusLaneInfoMono(
    ParameterizedTypeReference<T> typeReference,
    TagoBasicInfoRequestDto requestBody
) {
    return fetchMono(
        requestBody,
        req -> fetchBusLaneInfo(req).bodyToMono(typeReference)
    );
}

// Flux 처리
public <T> Flux<T> fetchBusLaneInfoFlux(
    ParameterizedTypeReference<T> typeReference,
    TagoBasicInfoRequestDto requestBody
) {
    return fetchFlux(
        requestBody,
        req -> fetchBusLaneInfo(req).bodyToFlux(typeReference)
    );
}
```
# Note that,,, ⚠️


단점이라고 한다면 API 호출 별로 정책이 획일화되어있다는 것이다.

만약 예민한 API 호출이라면 API 의 TPS 에 따라 정책을 달리해야할 것이다.
