---
description: "람다식은 간단한 파라미터에 대한 반환형 함수를 쉽게 작성할 수 있다."
date: 2026-02-25
tags: [java]
lang: ko
draft: false
---

# 무엇을 공부하였는가 🤔

람다식은 간단한 파라미터에 대한 반환형 함수를 쉽게 작성할 수 있다.

여기서 람다식을 더욱 줄일 수 있다!

예시를 한 번 보자.

```java
Function<String, Integer> converter = (String s) -> Integer.parseInt(s);
int result = converter.apply(5);
```

위 코드는 문자열을 매개변수로 받아 정수형으로 반환하는 Function 참조변수를 표현하고 있다.

메소드 참조를 이용하면 람다식을 더욱 간략하게 표현이 가능하다.

```java
Function<String, Integer> converter = Integer::parseInt;
int result = converter.apply(5);
```

람다는 이 메소드를 긁어올 수 있다.

> **_다만 참조방법이 스태틱이냐, 어떤 종류의 객체냐, 생성자에 의한 참조냐에 따라 다름_**

1.

스태틱 메소드 참조
**Reference to a Static Method**
-> 타입::스태틱 메소드 2.

특정 객체의 인스턴스 메소드 참조
**Reference to an Instance Method of a Particular Object**
-> 객체 레퍼런스::인스턴스 메소드 3.

임의 객체의 인스턴스 메소드 참조
**Reference to an Instance Method of an Arbitrary Object of a Particular Type**
-> 타입::인스턴스 메소드 4.

생성자 참조
**Reference to a Constructor**
-> 타입::new

# 왜 쓰는가 ❓

> 람다식의 한 종류로서, 동일한 코드구조의 연속인 boiler plate code를 줄이고, 가시성을 높일 수 있음

# 어떻게 쓰는가 ☝️

## 특정 타입의 메소드 참조 예시

만약 조건에 따른 조회를 통해 여러 인스턴스 리스트들이 나왔다고 해보자.

여기서 인스턴스들을 value로 하고, 인스턴스들의 멤버 변수인 productNumber를 key로 하는 Map 구조를 만들고 싶다면 어떻게 해야할까?

```java
// DAO 조회
List<Product> products = productRepository.findAllByProductNumberIn(productNumbers);

//
Map<String, Product> productMap = products.stream()
        .collect(Collectors.toMap(Product::getProductNumber, p -> p));
```

## 레퍼런스 🔍
