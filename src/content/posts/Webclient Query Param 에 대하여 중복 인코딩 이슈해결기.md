---
description: "Webclient 에서 중복인코딩이 되는 원인을 살펴보고 이를 해결해보자"
date: 2024-10-01
tags: [journal]
lang: ko
draft: false
---

![](/images/velog/549408f2c1ee89b3.png)

# Episode 📜

공공데이터포털의 TAGO API 를 사용할 일이 있었다.

~~이상하게도 인증키를 쿼리파라미터로 넣는다.~~

이를 호출하기 위해 Webflux & Webclient 를 사용 중에 있었는데, 인증키값이 이상하게 인코딩되는 것을 발견했다.

```java
public <T> T get(
    ParameterizedTypeReference<T> typeReference,
    TagoBusLaneApiRequestBodyDto requestBody
) {
    return webClient
        .get()
        .uri(uriBuilder -> uriBuilder
            .path("/getRouteAcctoThrghSttnList")
            // 인증키 URI 쿼리파라미터
            .queryParam("serviceKey", dataGoDecodingKey)
            .queryParam("pageNo", "1")
            .queryParam("numOfRows", "10")
            .queryParam("_type", "json")
            .queryParam("cityCode", "25")
            .queryParam("routeId", "DJB30300004")
            .build())
        .retrieve()
        .onStatus(HttpStatusCode::isError, WebClientErrorHandler.handleError())
        .bodyToMono(typeReference)
        .timeout(Duration.ofSeconds(1))
        .retry(3)
        .block();
}

```

하지만 아래와 같이 이상하게 값이 인코딩되어 요청되는 것을 확인할 수 있었다.

- 입력한 인증키 : "....

Cohg%3D%3D"

- 실제 요청된 인증키 : "....

Cohg%253D%253D"

왜일까? 이유인 즉슨 WebClient 의 인코딩 정책과 UriBuilder 이다.

## WebClient 인코딩 정책 🔍

https://www.baeldung.com/webflux-webclient-parameters

> If the default behavior doesn't fit our requirements, we can change it.

We need to provide a UriBuilderFactory implementation while building a WebClient instance.

In this case, we'll use the DefaultUriBuilderFactory class.

To set encoding, we'll call the setEncodingMode() method.

The following modes are available:

> - TEMPLATE_AND_VALUES: Pre-encode the URI template and strictly encode URI variables when expanded
> - VALUES_ONLY: Do not encode the URI template, but strictly encode URI variables after expanding them into the template
> - URI_COMPONENTS: Encode URI component value after expending URI variables
> - NONE: No encoding will be applied
>
> The default value is TEMPLATE_AND_VALUES.

위 baeldung 포스트에서 확인할 수 있듯이 WebClient 의 URI 인코딩 기본정책은 `TEMPLATE_AND_VALUES` 이다.

그렇다면 기본정책인 `TEMPLATE_AND_VALUES` 는 내부적으로 어떻게 인코딩하는 걸까 ??

[DefaultUriBuilderFactory.EncodingMode :: Spring Docs](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/util/DefaultUriBuilderFactory.EncodingMode.html)

> Pre-encode the URI template first, then strictly encode URI variables when expanded, with the following rules:
>
> - For the URI template replace only non-ASCII and illegal (within a given URI component type) characters with escaped octets.
> - For URI variables do the same and also replace characters with reserved meaning.

요컨대 strict uri encoding 을 지원한다는 것이다. 여기서 reserved 는 uri reserved characters 이다.

uri reserved characters 는 아래와 같다.

[percent-encoding :: wikipedia](https://en.wikipedia.org/wiki/Percent-encoding)

RFC 3986 section 2.2 Reserved Characters (January 2005)

| [`!`](https://en.wikipedia.org/wiki/Exclamation_mark) | [`#`](https://en.wikipedia.org/wiki/Number_sign) | [`$`](https://en.wikipedia.org/wiki/Dollar_sign) | [`&`](https://en.wikipedia.org/wiki/Ampersand) | [`'`](<https://en.wikipedia.org/wiki/Apostrophe_(mark)>) | [`(`](https://en.wikipedia.org/wiki/Parenthesis) | [`)`](https://en.wikipedia.org/wiki/Parenthesis) | [`*`](https://en.wikipedia.org/wiki/Asterisk) | [`+`](https://en.wikipedia.org/wiki/Plus_sign) | [`,`](https://en.wikipedia.org/wiki/Comma) | [`/`](<https://en.wikipedia.org/wiki/Slash_(punctuation)>) | [`:`](<https://en.wikipedia.org/wiki/Colon_(punctuation)>) | [`;`](https://en.wikipedia.org/wiki/Semicolon) | [`=`](https://en.wikipedia.org/wiki/Equal_sign) | [`?`](https://en.wikipedia.org/wiki/Question_mark) | [`@`](https://en.wikipedia.org/wiki/At_sign) | [   | ]   |
| ----------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------ | ---------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------ | --------------------------------------------- | ---------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------- | -------------------------------------------------- | -------------------------------------------- | --- | --- |

RFC 3986 section 2.3 Unreserved Characters (January 2005)

| [`A`](https://en.wikipedia.org/wiki/A)            | [`B`](https://en.wikipedia.org/wiki/B)            | [`C`](https://en.wikipedia.org/wiki/C)            | [`D`](https://en.wikipedia.org/wiki/D)            | [`E`](https://en.wikipedia.org/wiki/E)            | [`F`](https://en.wikipedia.org/wiki/F)            | [`G`](https://en.wikipedia.org/wiki/G)            | [`H`](https://en.wikipedia.org/wiki/H)            | [`I`](https://en.wikipedia.org/wiki/I)            | [`J`](https://en.wikipedia.org/wiki/J)            | [`K`](https://en.wikipedia.org/wiki/K)            | [`L`](https://en.wikipedia.org/wiki/L)         | [`M`](https://en.wikipedia.org/wiki/M)          | [`N`](https://en.wikipedia.org/wiki/N)     | [`O`](https://en.wikipedia.org/wiki/O) | [`P`](https://en.wikipedia.org/wiki/P) | [`Q`](https://en.wikipedia.org/wiki/Q) | [`R`](https://en.wikipedia.org/wiki/R) | [`S`](https://en.wikipedia.org/wiki/S) | [`T`](https://en.wikipedia.org/wiki/T) | [`U`](https://en.wikipedia.org/wiki/U) | [`V`](https://en.wikipedia.org/wiki/V) | [`W`](https://en.wikipedia.org/wiki/W) | [`X`](https://en.wikipedia.org/wiki/X) | [`Y`](https://en.wikipedia.org/wiki/Y) | [`Z`](https://en.wikipedia.org/wiki/Z) |
| ------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------- | ------------------------------------------ | -------------------------------------- | -------------------------------------- | -------------------------------------- | -------------------------------------- | -------------------------------------- | -------------------------------------- | -------------------------------------- | -------------------------------------- | -------------------------------------- | -------------------------------------- | -------------------------------------- | -------------------------------------- |
| [`a`](https://en.wikipedia.org/wiki/A)            | [`b`](https://en.wikipedia.org/wiki/B)            | [`c`](https://en.wikipedia.org/wiki/C)            | [`d`](https://en.wikipedia.org/wiki/D)            | [`e`](https://en.wikipedia.org/wiki/E)            | [`f`](https://en.wikipedia.org/wiki/F)            | [`g`](https://en.wikipedia.org/wiki/G)            | [`h`](https://en.wikipedia.org/wiki/H)            | [`i`](https://en.wikipedia.org/wiki/I)            | [`j`](https://en.wikipedia.org/wiki/J)            | [`k`](https://en.wikipedia.org/wiki/K)            | [`l`](https://en.wikipedia.org/wiki/L)         | [`m`](https://en.wikipedia.org/wiki/M)          | [`n`](https://en.wikipedia.org/wiki/N)     | [`o`](https://en.wikipedia.org/wiki/O) | [`p`](https://en.wikipedia.org/wiki/P) | [`q`](https://en.wikipedia.org/wiki/Q) | [`r`](https://en.wikipedia.org/wiki/R) | [`s`](https://en.wikipedia.org/wiki/S) | [`t`](https://en.wikipedia.org/wiki/T) | [`u`](https://en.wikipedia.org/wiki/U) | [`v`](https://en.wikipedia.org/wiki/V) | [`w`](https://en.wikipedia.org/wiki/W) | [`x`](https://en.wikipedia.org/wiki/X) | [`y`](https://en.wikipedia.org/wiki/Y) | [`z`](https://en.wikipedia.org/wiki/Z) |
| [`0`](<https://en.wikipedia.org/wiki/0_(number)>) | [`1`](<https://en.wikipedia.org/wiki/1_(number)>) | [`2`](<https://en.wikipedia.org/wiki/2_(number)>) | [`3`](<https://en.wikipedia.org/wiki/3_(number)>) | [`4`](<https://en.wikipedia.org/wiki/4_(number)>) | [`5`](<https://en.wikipedia.org/wiki/5_(number)>) | [`6`](<https://en.wikipedia.org/wiki/6_(number)>) | [`7`](<https://en.wikipedia.org/wiki/7_(number)>) | [`8`](<https://en.wikipedia.org/wiki/8_(number)>) | [`9`](<https://en.wikipedia.org/wiki/9_(number)>) | [`-`](https://en.wikipedia.org/wiki/Hyphen-minus) | [`.`](https://en.wikipedia.org/wiki/Full_stop) | [`_`](https://en.wikipedia.org/wiki/Underscore) | [`~`](https://en.wikipedia.org/wiki/Tilde) |                                        |                                        |                                        |                                        |                                        |                                        |                                        |                                        |                                        |                                        |                                        |                                        |

하지만 나의 케이스인 `....

Cohg%3D%3D` 에는 예약캐릭터가 없다. 즉, 이미 인코딩된 값으로 보여진다.

근데 왜 `....

Cohg%253D%253D` 으로 나올까?

## 중복 인코딩 이슈 ⚠️

[WebClient 사용할때 주의 (3편)](https://yangbongsoo.tistory.com/34#:~:text=uri%20%EB%A9%94%EC%84%9C%EB%93%9C%20%EB%9E%8C%EB%8B%A4,%EB%B3%80%EC%88%98%EA%B0%92%EC%9D%84%20%EC%8B%A0%EA%B2%BD%EC%8D%A8%EC%95%BC%20%ED%95%9C%EB%8B%A4)

webClient 사용 시 request value 를 넣기 위해서는 아래와 같이 처리한다.

```java
public <T> T get(
    ParameterizedTypeReference<T> typeReference,
    TagoBusLaneApiRequestBodyDto requestBody
) {
    return webClient
        .get()
        .uri(uriBuilder -> uriBuilder
            .path("/getRouteAcctoThrghSttnList")
            .queryParam("serviceKey", dataGoDecodingKey)  // Prevent re-encoding
	,,,
}

```

즉 내부적으로 lambda 를 사용하여 uriBuilder 를 사용하게 되는데, uriBuilder 를 build 하면 내부적으로 DefaultUriBuilderFactory 에서 this.uriComponentsBuilder.build().expand(uriVars) 가 수행되고 디폴트로 인코딩이 안됐다고(false) 설정된다.

```java
public UriComponents build() {
	return build(false);
}

```

즉 따라서 이미 인코딩된 값이더라도 다시 인코딩된다는 것이다.

# Reason 🤷‍♂️

- WebClient 의 URI 기본 EncodingMode 는 `TEMPLATE_AND_VALUES`
- WebClient 의 `.uri(uriBuilder -> uriBuilder ,,,)` 사용 시 중복인코딩 될 수 있음

# Fix 🔧

다양한 해결방안이 있지만 나의 경우 간단하게 URI 기본 EncodingMode 를 바꿔주었다.
~~그러게 왜 인증키값을 쿼리파라미터로 받아가지고,,,~~

- URI 기본 EncodingMode 변경 -> URI 인코딩 정책이 변경됨.
- UriComponentsBuilder 를 활용하여 해결 -> 처리과정 중 Exception 이 발생할 수 있어 이를 try-catch 로 해결해야 하므로 불필요한 코드가 발생함.
- 직접 query 에 대한 하드코딩(e.g. url = "apiPath?value=1") -> 가장 최악인 방법. 하드코딩된 값으로 인해 기획 변경에 따른 기능변경이 불가능함.

```java
DefaultUriBuilderFactory factory = new DefaultUriBuilderFactory(BASE_URL);
factory.setEncodingMode(DefaultUriBuilderFactory.EncodingMode.VALUES_ONLY);
webClient = WebClient
  .builder()
  .uriBuilderFactory(factory)
  .baseUrl(BASE_URL)
  .exchangeFunction(exchangeFunction)
  .build();

```

[^1]: `TEMPLATE_AND_VALUES` 모드는 URI 템플릿을 먼저 인코딩한 뒤 변수를 확장할 때 한 번 더 인코딩하기 때문에, 이미 퍼센트 인코딩된 값이 들어오면 `%` 자체가 `%25` 로 이중 인코딩된다.
[^2]: `VALUES_ONLY` 모드는 URI 템플릿은 그대로 두고 변수값만 인코딩하므로, 이미 인코딩된 값을 그대로 전달할 때 안전하다.
[^3]: RFC 3986 기준으로 `=` 는 reserved character 에 해당하므로 strict 인코딩 시 `%3D` 로 치환되고, `%3D` 가 다시 들어오면 `%` → `%25` 로 한 번 더 치환되어 `%253D` 가 된다.
[^4]: 공공데이터포털 인증키처럼 서버 측에서 이미 인코딩된 채로 발급되는 값은 클라이언트에서 두 번 인코딩하지 않도록 주의해야 한다.
[^5]: `UriComponentsBuilder.fromUriString()` 을 사용하면 인코딩 여부를 직접 제어할 수 있으나, 예외 처리 코드가 추가로 필요하다는 트레이드오프가 있다.
