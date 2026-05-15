---
description: "결제 비즈니스 로직과 외부 Toss API 처리를 단일 서비스가 담당하던 구조를 Spring ApplicationEventPublisher 기반 Pub/Sub 패턴으로 분리하고, 그 한계와 개선 방향을 돌아본다."
date: 2024-02-06
tags: [journal, spring-boot]
lang: ko
draft: false
---

# Intro (Issue Context)

Gream 서비스가 사용하고 있는,혹은 사용예정 중인 외부 서비스는 현재 아래와 같다.

- AWS
  - S3
- Pay
  - Toss
  - Kakao(예정)
  - Naver(예정)
- Email
  - Gmail(예정)
  - Naver(예정)
- SMS
  - KakaoTalk(예정)

Toss 를 구현하다보니 문제점들이 상당히 많았다.

> ![](/images/velog/91177948b7af25ff.png)

1. 비즈니스와 외부 API 가 별개로 처리
2. 둘 중 하나가 실패하더라도 롤백처리 없음
3. 시스템으로 하여금 ERROR 인지에 따른 대처가 불가능

왜 그런지 분석을 해보고, 어떻게 조율하기로 할 지 고민을 해보았다.

# Reason of Issue

> 가장 중요한 이슈는 하나의 서비스가 비즈니스와 외부 API 사용이라는 두 가지의 역할을 맡고 있다는 것이다.
> ![](/images/velog/56f7a6cea6b0a52b.png)

위에서 볼 수 있듯이, PaymentService는 주문 비즈니스 처리 & Toss API Event 처리를 하고 있다. 이에 따라 아래와 같은 이슈가 있었다.

1. 비즈니스 클래스가 외부 API 와의 결합도가 상당히 높았고, 다른 Payment Event 처리에 대해 유연하게 처리할 수가 없었다.
2. 다른 Payment 로직 추가 시, 비즈니스 클래스에 모든 Payment 주입을 해야한다.

그렇다면 어떻게 유연하게 이를 처리할 수 있을까?

# Solution #1 :: Pub/Sub

해답은 비교적 쉽게 찾을 수 있었다. 이 주제로 여러 가지 관점에서 고민을 하고 있었는데, 마침 유튜브가 목구멍으로 친절하게 꿀을 한 숟갈 가져다 주었다.

![https://www.youtube.com/watch?v=uk5fRLUsBfk](/images/velog/4d3b0eacb523a1e8.png)

위 영상에서 나온 코드를 참고하였다. 다음과 같은 프로세스로 진행된다.

1. 필요한 비즈니스 처리를 한다.
2. 비즈니스 처리결과 데이터에 대해 Event를 생성한다.
3. EventHandler 를 통해 Event를 처리한다.
4. 결과를 반환한다.

![](/images/velog/40b19984e56f0b88.png)

![](/images/velog/01c8e145e1fc4c83.png)

나는 eventHandler를 따로 서비스로 분리하여, 주입받는 패턴 또한 지양하고자 하였다. 이것 또한 모든 외부 API에 대한 의존성을 띄게 된다고 생각하였다.

따라서 옵저버 패턴을 사용하고자 했다. 참으로 기가차고 코가차게도, 스프링 부트에서는 옵저버 패턴과 Event에 대한 인터페이스가 마련되어있다.

어떤 것일까?

## Event / ApplicationEventPublisher 📣

![](/images/velog/64958ff9456b6c8f.png)

https://velog.io/@yu-jin-song/Spring-ApplicationEventPublisher

스프링 부트에서 제공하는 ApplicationEventPublisher 는 옵저버 패턴의 Publisher 역할을 수행한다.[^spring-event-publisher]

위 그림과 같이 이벤트를 생성하고, Publisher 가 이벤트에 대한 발행 처리를 하면, Subscriber 가 이에 대한 Handling 을 수행한다.

이에 따라 나는 아래와 같이 구성하였다.

![](/images/velog/27caed3f1e8f357e.png)

ApplicationPublisher 와 Pub/Sub 구조에 대해 공부가 필요하다면 아래 링크를 참조하자.

- [Spring의 @EventListener ( 간단한 활용기를 볼 수 있다 )](https://sunghs.tistory.com/139)
- [Spring @EventListener ( 친절히 내부구조를 설명해주신다 )](https://brunch.co.kr/@springboot/422)
- [Spring Events ( Baeldung )](https://www.baeldung.com/spring-events)

## How to return Non-Null in ApplicationEventPublisher 🔄

<span style="color:yellowgreen">**사실 Toss 프로세스와 Pub/Sub 구조와 정확히 부합하지 않는다.**</span>

Toss 프로세스는 엔드포인트를 찍고 콜백URL과 결과값을 반환한다. 결과에 따라 success를 할지, fail을 처리한다.

Pub/Sub 구조의 취지는 이것과 다르다.
<span style="color:yellowgreen">**Event 를 Publish 하게 되면 Subscriber 는 Subsribed Event 에 대한 엔드포인트 처리를 할 뿐이다.

이에 따라 Event의 상태값이 변할 뿐, Publisher 에게 어떠한 값을 반환하는 구조가 아니다.**</span>

이에 따라 스프링부트 내의 EventPublisher 제공인터페이스인 ApplicationEventPublisher 에서는 아래와 같은 메소드를 제공하게 된다.
![](/images/velog/c19ab621db41a79b.png)

요컨대, Toss 프로세스는 Two-Way, Pub/Sub 구조는 One-Way이다.

그렇다면 어떻게 ApplicationEventPublisher 를 통해 Toss API의 결과값을 받아올까? 즉, Non-Null Value를 가져올까?

> 참고로, @EventListener 메소드가 Non-Null 을 반환하는 형태로 할 수 있는데, 이러한 정의는 목적이 다르다.

Non-Null 로 처리하는 목적은 새로운 이벤트를 발행하여 다른 Subsriber 들에게 전달하는 것이다. ApplicationEventPublisher는 이 반환값에 대해 새로운 Event를 발행하여, 이에 관련된 Subsriber 들에게 전달한다.[^eventlistener-nonnull]

> Also, there's an alternative way of publishing events.

If we return a non-null value from a method annotated with @EventListener as the result, Spring Framework will send that result as a new event for us.

Moreover, we can publish multiple new events by returning them in a collection as the result of event processing.
[generic-publisher[baeldung]](https://www.baeldung.com/spring-events#generic-publisher)

### CallBack Method 을 사용하기 🔧

나는 Functional Interface를 사용하여 CallBack을 사용하기로 하였다. 프로세스는 다음과 같다.

1. Event 안에 Callback 을 선언해준다.
```java
@Getter
public class TossPaymentSuccessEvent extends ApplicationEvent {

        private final TossPayment tossPayment;
        private final String testSecretApiKey;
        private final TossPaymentSuccessCallback callback;
    	,,,
    }
    ```

2. Event 의 Callback 을 통해 ResponseDto 를 담는다.
```java
@GetMapping("/success")
@Operation(summary = "토스페이 결제 성공 리다이렉트", description = "결제 성공 시 최종 결제 승인 요청을 보냅니다.")
public RestResponse<TossPaymentSuccessResponseDto> requestFinalTossPayment(
@Schema(description = "토스 결제고유번호") @RequestParam String paymentKey,
@Schema(description = "서버 주분고유번호") @RequestParam String orderId,
@Schema(description = "결제금액") @RequestParam Long amount
) throws InterruptedException {
AtomicReference<TossPaymentSuccessResponseDto> responseDtoHolder = new AtomicReference<>();
Semaphore semaphore = new Semaphore(0);

        paymentService.requestFinalTossPayment(paymentKey, orderId, amount, responseDto -> {
            responseDtoHolder.set(responseDto);
            semaphore.release();
        });

        ,,,
    }
    ```

3. EventListener 를 사용하여 ResponseDto 값을 받아오고, 이에 대한 값을 Callback 에 저장해준다.
```java
@Async
@TransactionalEventListener
public void handleTossPaymentSuccess(TossPaymentSuccessEvent event) {
,,, 토스 서버 API 호출 ,,,

        TossPaymentSuccessResponseDto responseDto = sendFinalRequest(rest, headers, param);

        updateUserPointByPaymentStatus(event, responseDto);
    }
    private static void updateUserPointByPaymentStatus(TossPaymentSuccessEvent event, TossPaymentSuccessResponseDto responseDto) {
        assert responseDto != null;
        if (responseDto.status().equals("DONE")) {
            User user = event.getTossPayment().getUser();
            user.increasePoint(event.getTossPayment().getAmount());
            event.getCallback().handle(responseDto);
        } else {
            throw new GlobalException(ResultCase.TOSS_FINAL_REQUEST_FAIL);
        }
    }
    ```

4. 결제 성공값을 Callback을 통해 가져온다.

    ```java
    @GetMapping("/success")
    @Operation(summary = "토스페이 결제 성공 리다이렉트", description = "결제 성공 시 최종 결제 승인 요청을 보냅니다.")
    public RestResponse<TossPaymentSuccessResponseDto> requestFinalTossPayment(
        @Schema(description = "토스 결제고유번호") @RequestParam String paymentKey,
        @Schema(description = "서버 주분고유번호") @RequestParam String orderId,
        @Schema(description = "결제금액") @RequestParam Long amount
    ) throws InterruptedException {
        ,,,

        return RestResponse.success(responseDtoHolder.get());
    }
    ```

> 전체 코드는 다음 깃허브를 참고하자.
> https://github.com/Team-BC-1/gream/tree/main/src/main/java/bc1/gream/domain/payment

# @TransactionalEventListener & @Async ⚙️

`@TransactionalEventListener` 를 사용하면 아래의 이점을 챙길 수 있다.[^transactional-event-listener]

- 도메인 비즈니스 예외 발생 시, 이와는 별개로 외부 API가 호출되는 이슈를 막을 수 있다.
- 트랜잭션 Commit 시점에 따른 Event Handling 시점을 조작할 수 있다.
- 기본전략은 AFTER_COMMIT으로, COMMIT 이후 Event Handling 을 처리한다.

`@Async` 를 사용하면 아래의 이점을 챙길 수 있다.

- 이벤트 핸들러는 기본적으로 동기적으로 수행된다.
- 비동기적으로 이벤트를 발행/처리하여 여러 스레드를 처리할 수 있게 지원할 수 있다.
- `@Async` 를 통해 해당 메서드는 기존 스레드와 분리된다. `@Async` 를 사용하려면 `@EnableAsync` 지정해주어야 한다. (main 클래스나 별도의 config 클래스 사용)
- 이에 따라 자연스레 트랜잭션과도 분리된다.

![](/images/velog/45823cbcbf5a9a64.png)

위 그림과 같이 처리하여 여러 이점을 가져갔다.

# 다시 돌아보니,,글쎄 과연 좋은 코드일까? 🤔

사실 이러한 패턴적인 고안에 대해 스스로 조금 뿌듯해했다. 동작이 될 뿐더러, 내가 보기에도 의존성과 결합도를 낮추었다고 판단했기 때문이다.

이제 카카오페이든 뭐든, 도메인 로직과 이벤트 핸들러 별개로 구색을 맞추어 가면 된다고 생각했다.

그러던 와중 우러러 바라보던 -- 본인만의 철학으로 근거있는 관점을 제시해주시는 -- 멘토분의 의견을 듣게 되었다.

- "One-Way인 Pub/Sub 구조랑 Two-Way인 페이요청이랑 너무 안 맞는 패턴이 아닌가"
- "결제요청 이후 결과에 따른 여러 로직을 처리해야하는 구조상 유연하지 않지 않은가"
- "다른 페이먼츠의 프로세스는 무시한 채, 유연성과 결합도 측면만을 바라보고 Pub/Sub 패턴을 적용한 것 아닌가"

Pub/Sub 패턴을 적용하고자 하는 것은 아니었다만, 결과론적으로는 반박이 힘들었다. 왜냐하면 의견 반증이 불가하게끔 하는 사건이 발생했기 때문이다.

## ??? : 페이먼츠 내에 A 로직 추가해주세요 🚨

우리 시스템은 포인트 충전제 이다. 즉, 충전상태에 따라 충전액만큼 포인트를 충전해주어야 한다.

문제는 충전상태를 알려면 TossEventHandler 의 결과보고서를 받아야만 한다. 이 곳이 바로 긁어부스럼이었다.

TossEventHandler 가 도메인 로직인 "충전상태에 따른 포인트 충전" 까지 수행하게 되었기 때문이다.

![](/images/velog/f4450b730f5ea623.png)

튜터님의 말이 하나 틀린 것이 없었다.

~~왜냐하면 그 분께서도 같이 이야기 나눈 당일날 페이먼츠 개발을 하다 오셨다 했다.

오히려 더욱 신빙성이 갔다~~

외부 API이기는 하나, 페이먼츠 특성 상, PUB/SUB 성격이랑은 거리가 멀다. 아마 후에 리팩토링 과정을 거쳐 손을 좀 많이 봐야할 것 같다.

방안은 여러가지이다.

1. 모든 페이먼츠 추상화 - 이니시스, 카카오, 토스 - 공통 데이터를 추상화해보자 - 저장해야할 로그포맷 / 데이터 포맷 / 테이블 - 공통 로직을 추상화해보자 - 이에 대해서 추상화된 Event,Event 구현체에 따른 EventListener 를 적용해보자

2. 파사드 패턴 - 각각의 페이먼츠 비즈니스와 API 핸들러 등등 여러 서비스로 분리하자. - 이에 대한 파사드 패턴을 사용하여 유스케이스를 처리하자.

[^spring-event-publisher]: Spring의 `ApplicationEventPublisher`는 `ApplicationContext`가 구현하는 인터페이스로, `publishEvent(Object event)` 메서드 하나로 이벤트를 발행한다. `@EventListener`가 붙은 메서드가 자동으로 구독자 역할을 한다.
[^eventlistener-nonnull]: `@EventListener` 메서드가 `void`가 아닌 값을 반환하면 Spring은 그 반환값을 새 이벤트로 간주하여 다시 `publishEvent`를 호출한다. 이는 이벤트 체이닝 용도이며 원래 발행자에게 값을 돌려주는 수단이 아니다.
[^transactional-event-listener]: `@TransactionalEventListener`의 기본 phase는 `AFTER_COMMIT`이다. 트랜잭션이 롤백되면 이벤트 핸들러 자체가 호출되지 않아, 결제 승인 요청이 DB 롤백 없이 단독으로 실행되는 사고를 방지할 수 있다.
[^async-new-transaction]: `@Async`로 분리된 스레드는 부모 트랜잭션 컨텍스트를 공유하지 않는다. 따라서 핸들러 안에서 DB 쓰기가 필요하다면 `@Transactional(propagation = REQUIRES_NEW)`를 별도로 선언해야 한다.
[^facade-payment]: 결제 수단이 여럿인 경우 파사드 패턴을 사용하면 컨트롤러 계층은 `PaymentFacade` 하나만 의존하고, 내부에서 `TossPaymentService`, `KakaoPaymentService` 등을 조율하는 구조로 관심사를 분리할 수 있다.
