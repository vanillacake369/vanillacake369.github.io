---
title: "Function.compose와 andThen으로 함수 실행 순서 제어하기"
description: "Java Function 인터페이스의 compose와 andThen을 활용하여 함수 실행 순서를 정책에 따라 유연하게 조합하는 방법을 정리한다."
date: 2026-02-25
tags: [java]
lang: ko
draft: false
---

# 문제 상황

비즈니스 로직에서 두 함수의 실행 순서를 정책에 따라 바꿔야 하는 경우가 있다.

예를 들어 결제 시스템에서:
- **회원 결제**: 로그인 검증 → 결제 처리
- **비회원 결제**: 결제 처리 → 사후 검증

if-else로 분기하면 함수 호출 순서가 코드 곳곳에 하드코딩된다.
Java의 `Function` 인터페이스가 제공하는 `compose`와 `andThen`을 사용하면 함수 조합 순서를 선언적으로 제어할 수 있다.

# compose vs andThen

`java.util.function.Function<T, R>`은 두 가지 조합 메서드를 제공한다.

| 메서드 | 실행 순서 | 의미 |
|---|---|---|
| `f1.compose(f2)` | **f2 → f1** | f2를 먼저 실행하고, 그 결과를 f1에 전달 |
| `f1.andThen(f2)` | **f1 → f2** | f1을 먼저 실행하고, 그 결과를 f2에 전달 |

## 코드 예제

```java
Function<Integer, Integer> add100 = input -> input + 100;
Function<Integer, Integer> multiply3 = input -> input * 3;
```

### compose — 인자 함수를 먼저 실행

```java
int result = add100.compose(multiply3).apply(3);
// multiply3(3) = 9 → add100(9) = 109
System.out.println(result); // 109
```

`compose`는 수학의 함수 합성 `(f ∘ g)(x) = f(g(x))`와 동일하다.
인자로 전달한 함수(`multiply3`)가 먼저 실행된다.

### andThen — 호출자 함수를 먼저 실행

```java
int result = add100.andThen(multiply3).apply(3);
// add100(3) = 103 → multiply3(103) = 309
System.out.println(result); // 309
```

`andThen`은 호출자(`add100`)를 먼저 실행하고, 그 결과를 인자 함수에 전달한다.
파이프라인처럼 왼쪽에서 오른쪽으로 읽히므로 가독성이 높다.

## 실행 흐름 비교

```
compose:  input → [multiply3] → [add100] → output
andThen:  input → [add100] → [multiply3] → output
```

# 실무 적용 예시

```java
Function<Order, Order> validate = order -> {
    // 결제 가능 여부 검증
    if (!order.isValid()) throw new IllegalStateException("invalid order");
    return order;
};

Function<Order, Receipt> process = order -> {
    // 결제 처리
    return paymentGateway.charge(order);
};

// 회원 결제: 검증 → 처리
Function<Order, Receipt> memberFlow = validate.andThen(process);

// 비회원 결제: 처리 → 사후 검증 (process의 반환 타입이 다르므로 별도 구성)
```

`andThen`으로 체이닝하면 실행 순서가 코드에 그대로 드러난다.
정책이 변경되어 순서를 바꿔야 할 때 조합 방식만 교체하면 된다.

# 정리

| 항목 | compose | andThen |
|---|---|---|
| 실행 순서 | 인자 → 호출자 | 호출자 → 인자 |
| 읽는 방향 | 오른쪽에서 왼쪽 | 왼쪽에서 오른쪽 |
| 수학 표현 | `f(g(x))` | `g(f(x))` |
| 가독성 | 수학적 합성에 익숙하면 자연스러움 | 파이프라인 스타일로 직관적 |

대부분의 경우 `andThen`이 코드 가독성 면에서 유리하다.
여러 단계를 순차적으로 연결할 때 `f1.andThen(f2).andThen(f3)`처럼 체이닝하면 실행 순서가 선언 순서와 일치한다.

[^1]: Function.compose 공식 문서. <https://docs.oracle.com/javase/8/docs/api/java/util/function/Function.html#compose-java.util.function.Function->
[^2]: Function.andThen 공식 문서. <https://docs.oracle.com/javase/8/docs/api/java/util/function/Function.html#andThen-java.util.function.Function->
