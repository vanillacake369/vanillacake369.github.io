---
description: "Stream의 noneMatch와 anyMatch는 의미가 다르다. 중복 검증 로직에서 잘못 사용하면 테스트가 통과하지 않는 이유를 분석한다."
tags: [java]
lang: ko
draft: false
---

# 문제 상황

이미 좋아요한 상품에 대해 좋아요 기능을 중복 요청하는 것을 막기 위해 아래와 같은 코드를 작성했다.

```java
@Transactional
public void likeProduct(User user, Long productId) {
    Product product = getProductBy(productId);
    boolean hasNotLikedThisProduct = user.getLikeProducts().stream()
        .anyMatch(likeProduct -> !likeProduct.getProduct().equals(product));
    if (hasNotLikedThisProduct) {
        user.addLikeProduct(product);
    }
}
```

의도는 "이 상품을 아직 좋아요하지 않았다면 추가"이다. 그러나 이 코드는 의도대로 동작하지 않는다.

# 원인 분석

`anyMatch`와 `noneMatch`는 판별 기준이 근본적으로 다르다.

| 메서드                 | 동작                                               | 반환값 |
| ---------------------- | -------------------------------------------------- | ------ |
| `anyMatch(predicate)`  | 스트림의 **하나라도** predicate를 만족하면         | `true` |
| `noneMatch(predicate)` | 스트림의 **어떤 것도** predicate를 만족하지 않으면 | `true` |
| `allMatch(predicate)`  | 스트림의 **모든 요소**가 predicate를 만족하면      | `true` |

위 코드의 문제는 `anyMatch`에 부정 조건(`!equals`)을 넣은 것이다.

사용자가 상품 A, B, C를 좋아요한 상태에서 상품 A를 다시 좋아요하면 어떻게 되는가?

```
likeProducts = [A, B, C]
target = A

anyMatch(lp -> !lp.equals(A))
  → A: !equals(A) = false
  → B: !equals(A) = true  ← 여기서 즉시 true 반환
```

B가 A와 다르기 때문에 `anyMatch`는 `true`를 반환한다. 결과적으로 "좋아요하지 않은 상품"이라고 판정하여 중복 추가가 발생한다.

핵심은 `anyMatch(!equals)`가 "리스트에 다른 원소가 하나라도 있는가"를 검사한다는 점이다. 우리가 원하는 것은 "리스트에 같은 원소가 하나도 없는가"이므로 질문 자체가 다르다.

# 해결 방법

의도에 맞는 메서드는 `noneMatch`이다.

```java
@Transactional
public void likeProduct(User user, Long productId) {
    Product product = getProductBy(productId);
    boolean hasNotLikedThisProduct = user.getLikeProducts().stream()
        .noneMatch(likeProduct -> likeProduct.getProduct().equals(product));
    if (hasNotLikedThisProduct) {
        user.addLikeProduct(product);
    }
}
```

변경점은 두 가지이다.

1. `anyMatch` → `noneMatch`로 교체
2. predicate 내부의 `!` 부정 제거

```
likeProducts = [A, B, C]
target = A

noneMatch(lp -> lp.equals(A))
  → A: equals(A) = true  ← 매칭 발견, noneMatch는 false 반환
```

A가 이미 존재하므로 `noneMatch`는 `false`를 반환하고, 중복 추가가 차단된다.

# 정리

| 의도                 | 올바른 표현                   | 잘못된 표현                   |
| -------------------- | ----------------------------- | ----------------------------- |
| 리스트에 X가 없는가? | `noneMatch(e -> e.equals(X))` | `anyMatch(e -> !e.equals(X))` |
| 리스트에 X가 있는가? | `anyMatch(e -> e.equals(X))`  | `allMatch(e -> e.equals(X))`  |

`anyMatch`에 부정 조건을 넣으면 "다른 원소가 하나라도 있는가"를 검사하게 되어, 리스트에 2개 이상의 원소가 있으면 거의 항상 `true`를 반환한다. 부정 검사가 필요할 때는 `noneMatch`에 긍정 조건을 넣는 것이 의도가 명확하다.

[^1]: Stream.noneMatch 공식 문서. <https://docs.oracle.com/javase/8/docs/api/java/util/stream/Stream.html#noneMatch-java.util.function.Predicate->

[^2]: Stream.anyMatch 공식 문서. <https://docs.oracle.com/javase/8/docs/api/java/util/stream/Stream.html#anyMatch-java.util.function.Predicate->
