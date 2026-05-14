---
description: "요구사항에 의해 자라나는 정책들,,, 과연 책임 분리는 어떻게 할 것이며 도메인 간 처리는 어떻게 하는 게 좋을까??"
date: 2025-01-23
tags: [journal]
lang: ko
draft: false
---

![](/images/velog/8b6b0ca0b940a310.png)

# Episode 📜

제품을 판매하는 상인이 되어보자.

다나와에서 접속한 사용자에게 상품 판매를 하고자한다.

이 때 판매정책은 아래와 같다.

> 🏷️
>
> - 상품은 상품명, 가격과 수량이 있다.
> - 할인 정책을 적용한다.
>   - 무료 지급 상품이라면 적용 X
>   - 무할인 지급 상품이라면 적용 X
>   - 정률 할인이라면 정률을 통해 할인 (eg 10,000 에 대해 10% 인 경우 1,000 할인)
>   - 정액 할인이라면 정액 할인 (eg 10,000 에 대해 10% 인 경우 1,000 할인)
>   - 구독한 사람이라면 스페셜 할인
>   - 다나와 쿠폰 보유인이라면 쿠폰 할인
> - 할인 정책은 사업이 지속됨에 따라 추가/수정될 수 있다.
> - 절사 정책을 적용한다.
>   - 1원 단위 → 12,518 원 상품이 12,500 원에 판매
>   - 10원 단위 → 12,518 원 상품이 12,510 원에 판매
>   - 100원 단위 → 12,518 원 상품이 12,500 원에 판매
> - 절사 정책은 사업이 지속됨에 따라 추가/수정될 수 있다.

어떤 설계안을 가지고 접근할 것인가?

잠깐 밑에 글을 읽지 말고, 어떻게 처리할지 머리 속으로나 종이로 그려보길 권한다.

# About 💁‍♂️

> ⚠️
>
> 개발에는 정답이 없다.
>
> 앞으로 설명하는 설계안 또한 정답이 아니다.
>
> 더 좋은 해결안이 있다면 공유가 정답이다 ,,, !

과연 이 요구사항에 대해 어떤 설계가 가장 합리적인 설계일까?

우선 설계 순서를 잡아보자.

아래 순서대로 접근하여 차근차근 모래성을 만들어보자

1.

레이어 구성 2.

책임 분리 3.

의존성 설계 4.

구현

## Layer

우선 첫 스텝인 레이어를 구성해보자.

사내 컨벤션에 따라 아래와 같이 구성해보았다.

> 💡
>
> 1.

도메인 로직 오케스트레이션 — Facade

> 2.

도메인 응용 로직 처리 — Service

> 3.

외부 세계 처리 — Repository, WebClient, MessageQueue ,,,

> 4.

도메인 모델 — Entity (여기선 Product)

## Role Seperation

레이어를 구성했다면 이제 책임을 분리할 차례이다.

이에 대해 우선 할인 정책에 대해 어느 레이어에서 책임을 가져갈 것인지를 정해야한다.

과연 할인은 응용로직일까 도메인로직일까?

구현자의 관점에 따라 다르겠지만 **응용로직이라고 믿어 의심치 않는다.**

할인정책 같은 요구사항은 조건에 따라 바뀌어야 하고, 여러 도메인을 아우르는 외부 정책이다.

상품이 내부적으로 할인을 처리해야할까?

즉, 상품 도메인이 할인 정책 책임을 가져갈 것인가?

그렇다면 쿠폰, 구독자, 스페셜 이벤트 등등과 같은 요구사항 추가는 어떻게 처리할 것인가?

`할인정책은 상품 도메인에 있어야해`라는 주장은 이러한 확장성에 있어 모순이 발생한다.

할인정책을 응용로직으로 옮김으로써 여러 도메인이나 기능을 아우르는 방향으로 가야한다.

이에 따라 할인정책은 응용 로직이 자리해야할 Service 레이어에 위치해야한다.

( 절사정책도 마찬가지이다 )

요컨대 책임 분리를 정리하자면 아래와 같이 구성된다.

> 💡
>
> 1.

도메인 로직 오케스트레이션 — Facade

>     1.

상품 도메인 호출 ← 할인, 절사 적용

>     2.

소비자 도메인 호출

>     3.

결제 도메인 호출 ← 상품, 소비자

>     4.

주문 도메인 호출 ← 상품, 소비자, 결제

> 2.

도메인 응용 로직 처리 — Service

>     1.

상품 서비스

>     2.

할인정책 서비스

>     3.

절사정책 서비스

>     4.

소비자 서비스

>     5.

결제 서비스

>     6.

주문 서비스

> 3.

외부 세계 처리 — Repository, WebClient, MessageQueue ,,,

>     1.

이하 생략

> 4.

도메인 모델 — Entity (여기선 Product)

>     1.

이하 생략

## Dependencies

해당 포스트에서는 결제, 주문에 대해서 자세히 다루려 하지 않는다.

다만 응용 서비스와 도메인의 경계에 대해 다루고자한다.

이를 위해 할인/절사 정책에 대해 조금 더 이야기 해보고자 한다.

이제 할인/절사 정책이 서비스 레이어로 넘어왔다.

그럼 상품 도메인과 할인/절사 서비스 간의 경계를 어떻게 할 것인가?

간단하다.

상품은 상품만의 도메인 로직 — 가격을 수정하고, 판매 유효일수를 연산하고 등등 — 을 처리하고

할인정책은 상품에 적용될 함수로서 처리된다.

```java
/// ---- 상품
@Table
public class Product extends BaseTimeEntity {
		private String name;
		private LocalDateTime expiredAt;

		public extendExpirationDate(LocalDateTime date){
				// 유효기간 연장 도메인 로직 구현
		}
}

/// ---- 할인정책
@FunctionalInterface
public interface DiscountPolicy {
    BigDecimal discount(BigDecimal price, DiscountType discountType, Long discountRate);
}
,,,

/// ---- 상품에 대해 할인정책을 적용한다.
BigDecimal discountedPrice = discountPolicy.discount(product.getPrice(), product.getDiscountType(), product.getDiscountRate());

```

상품과 할인정책의 예시

다만 주의할 점은 **할인정책은 상품에 의존성 주입되지 않아야 한다**는 것이다.

만약 의존성 주입이 되는 경우, 요구사항에 의해 추가된 정책들이 N 개씩 늘어날 때마다

상품 도메인에는 N개의 정책들이 의존되기 시작할 것이다.

이는 상품 서비스나 파사드에도 역으로도 성립되어야한다.

```java
@Entity
@NoArgsConstructor
@AllArgsConstructor
@DynamicUpdate
@DynamicInsert
@Getter
@Setter
@Builder
@Table
public class Product extends BaseTimeEntity {

		// 정책이 N 개 추가됨에 따라 기하급수적으로 의존성이 늘어난다.
		private final DiscountPolicy discoutPolicy;
		private final TruncatePolicy truncatePolicy;
		private final SpecialGiftPolicy specialGiftPolicy;
		,,,

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long prdIdx;
}
```

다중 의존성 주입된 예시

이런 의존성 구조보다 되려 외부에서 메서드의 인자값으로 넘겨받는 게 조금 더 깔끔할 것이다.

즉 도메인 메서드에서 인자값으로 서비스를 넘겨받고, 내부에서 해당 서비스를 호출하는 형태이다.

```java
/// ---- 상품
@Table
public class Product extends BaseTimeEntity {
		private String name;
		private LocalDateTime expiredAt;

		public extendExpirationDate(LocalDateTime date){
				// 유효기간 연장 도메인 로직 구현
		}

    **public BigDecimal getDiscountedPrice(
        @NotNull DiscountPolicy discountPolicy
        ,,,
    ) {
		    ,,,
        // 할인 정책 적용
        BigDecimal discountedPrice = discountPolicy.discount(price, discountType, discountRate);
				,,,
				return discountedPrice;
    }**
}

/// ---- 할인정책
@FunctionalInterface
public interface DiscountPolicy {
    BigDecimal discount(BigDecimal price, DiscountType discountType, Long discountRate);
}
@Slf4j
@Service
public class DiscountPolicyImpl implements DiscountPolicy {
		BigDecimal discount(BigDecimal price, DiscountType discountType, Long discountRate){
				// 세부 할인 정책 로직 구현
		}
}

```

이로써 정책에 대한 분리가 되어 도메인은 해당 정책을 알 필요가 없어진다.

만약에 할인정책 요구사항이 틀어져서 **정책이 변경되면 정책 자체만 변경하면 된다.**

**도메인 로직을 수정할 필요가 없어진다.**

```java
/// ---- 상품
/// *** 요구사항이 변경되어도 상품은 변경될 필요가 없다 ***
@Table
public class Product extends BaseTimeEntity {
		private String name;
		private LocalDateTime expiredAt;

		public extendExpirationDate(LocalDateTime date){
				// 유효기간 연장 도메인 로직 구현
		}

    public BigDecimal getDiscountedPrice(
        @NotNull DiscountPolicy discountPolicy
        ,,,
    ) {
		    ,,,
        // 할인 정책 적용
        BigDecimal discountedPrice = discountPolicy.discount(price, discountType, discountRate);
				,,,
				return discountedPrice;
    }
}

/// ---- 할인정책
**/// *** 요구사항이 변경되면 할인정책 세부로직만 변경한다. *****
@FunctionalInterface
public interface DiscountPolicy {
    BigDecimal discount(BigDecimal price, DiscountType discountType, Long discountRate);
}
@Slf4j
@Service
public class DiscountPolicyImpl implements DiscountPolicy {
		BigDecimal discount(BigDecimal price, DiscountType discountType, Long discountRate){
				// 세부 할인 정책 로직 구현
		}
}

```

## Impl

이로써 정리가 어느 정도 되었다.

아래 설계대로 코드를 구현하면 될 것이다.

> 💡
>
> 1.

도메인 로직 오케스트레이션 — Facade

>     1.

상품 도메인 호출 ← 할인, 절사 적용

>         1.

상품 서비스 ← 할인 서비스, 절사 서비스를 인자값으로 넘긴 뒤, 정책을 호출

>         2.

이후 상품 도메인 로직을 통해 상품 로직을 처리

>     2.

소비자 도메인 호출

>     3.

결제 도메인 호출 ← 상품, 소비자

>     4.

주문 도메인 호출 ← 상품, 소비자, 결제

> 2.

도메인 응용 로직 처리 — Service

>     1.

이하 생략

> 3.

외부 세계 처리 — Repository, WebClient, MessageQueue ,,,

>     1.

이하 생략

> 4.

도메인 모델 — Entity (여기선 Product)

>     1.

이하 생략

# Apply 🧑‍💻

사내에서 작성한 간단한 유스케이스 코드를 가져와봤다.

유저가 할인된 상품을 구매 가능한지 검증하는 API 이다.

코드는 아래와 같다.

- Facade Layer

  ```java
  @Facade
  @RequiredArgsConstructor
  @Transactional(readOnly = true)
  public class ChocoPremiumReadFacadeV2Impl implements ChocoPremiumReadFacadeV2, PaginationQueryV2 {

  	,,,

  	@Override
      public SingleResult<UrgentJobPostingAffordabilityResponseV2> canUserAffordUrgentJobPosting(
          Long recruiterMeIdx,
          UrgentJobPostingAffordabilityRequestV2 requestV2
      ) {
          BigDecimal urgentJobPostingPrice = chocoPremiumReadServiceV2.getPriceOf(
              ChocoPremiumCodeV2.PS06,
              requestV2.getNumberOfPeopleV2(),
              chocoTruncatePolicyServiceV2,
              chocoDiscountPolicyServiceV2
          );
          ,, 사내코드
      }
  }
  ```

- Service Layer
  ```java
  // 절사 정책
  @FunctionalInterface
  public interface ChocoTruncatePolicyServiceV2 {
      BigDecimal truncate(BigDecimal price, TruncTypeV2 truncTypeV2);
  }
  ```
  ```java
  // 절사 정책 구현체
  @Slf4j
  @Service
  public class ChocoTruncatePolicyServiceV2Impl implements ChocoTruncatePolicyServiceV2 {

      @Override
      public BigDecimal truncate(BigDecimal price, TruncTypeV2 truncTypeV2) {
  		,, 사내코드
      }
  }
  ```
  ```java
  // 할인 정책
  @FunctionalInterface
  public interface ChocoDiscountPolicyServiceV2 {
      BigDecimal discount(BigDecimal price, DiscountTypeV2 discountTypeV2, Long cpDiscount);
  }
  ```
  ```java
  // 할인 정책 구현체
  @Slf4j
  @Service
  public class ChocoDiscountPolicyServiceV2Impl implements ChocoDiscountPolicyServiceV2 {

      @Override
      public BigDecimal discount(BigDecimal price, DiscountTypeV2 discountTypeV2, Long cpDiscount) {
         ,, 사내코드
      }
  }
  ```
  ```java
  @Service
  @RequiredArgsConstructor
  @Transactional(readOnly = true)
  public class ChocoPremiumReadServiceV2Impl implements ChocoPremiumReadServiceV2 {
      @Override
      public BigDecimal getPriceOf(
          ChocoPremiumCodeV2 chocoPremiumCodeV2,
          NumberOfPeopleV2 numberOfPeopleV2,
          ChocoTruncatePolicyServiceV2 chocoTruncatePolicyServiceV2,
          ChocoDiscountPolicyServiceV2 chocoDiscountPolicyServiceV2
      ) {
  		,,, 사내코드
  		    // 할인 적용된 가격 반환
          return chocoPremiumV2.getDiscountedPrice(
              chocoPremiumPriceV2,
              chocoTruncatePolicyServiceV2,
              chocoDiscountPolicyServiceV2
          );
      }
  }
  ```
- Domain Layer
  ```java
  @Entity
  ,,,
  @Table
  public class Product extends BaseTimeEntity {

  	,, 사내 코드 ,,

      /**
       * 할인가 계산
       */
      public BigDecimal getDiscountedPrice(
          @NotNull ChocoPremiumPriceV2 chocoPremiumPriceV2,
          @NotNull ChocoTruncatePolicyServiceV2 chocoTruncatePolicyServiceV2,
          @NotNull ChocoDiscountPolicyServiceV2 chocoDiscountPolicyServiceV2
      ) {
          if (cpUse == 0){
              throw new RuntimeException("미사용 상품");
          }

          BigDecimal cppPrice = chocoPremiumPriceV2.getCppPrice();

          // 할인 정책 적용
          BigDecimal discountedPrice = chocoDiscountPolicyServiceV2.discount(cppPrice, cpDiscountTypeV2, cpDiscount);

          // 절사 정책 적용
          return chocoTruncatePolicyServiceV2.truncate(discountedPrice, cpTruncV2);
      }

  }
  ```

추후 시간이 되면 주문과 결제를 아우르는 예시 코드를 작성해서 올리겠다.

# Reference 📚

https://velog.io/@devnoyo0123/%EC%95%A0%ED%94%8C%EB%A6%AC%EC%BC%80%EC%9D%B4%EC%85%98-%EC%84%9C%EB%B9%84%EC%8A%A4%EC%99%80-%EB%8F%84%EB%A9%94%EC%9D%B8-%EC%84%9C%EB%B9%84%EC%8A%A4

https://velog.io/@csh0034/%EB%8F%84%EB%A9%94%EC%9D%B8-%EC%A3%BC%EB%8F%84-%EA%B0%9C%EB%B0%9C-%EC%8B%9C%EC%9E%91%ED%95%98%EA%B8%B0-07.-%EB%8F%84%EB%A9%94%EC%9D%B8-%EC%84%9C%EB%B9%84%EC%8A%A4

https://cornswrold.tistory.com/597#%EB%8F%84%EB%A9%94%EC%9D%B8%20%EC%84%9C%EB%B9%84%EC%8A%A4(Domain%20Service)-1

https://jaehoney.tistory.com/248

https://github.com/madvirus/ddd-start2

https://github.com/madvirus/ddd-start2/blob/main/src/main/java/com/myshop/order/command/domain/Order.java

https://github.com/madvirus/ddd-start2/blob/main/src/main/java/com/myshop/order/command/application/OrderRequestValidator.java

https://github.com/madvirus/ddd-start2/blob/main/src/main/java/com/myshop/order/command/application/ChangeShippingService.java#L24
