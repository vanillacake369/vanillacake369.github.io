---
title: "함수형 인터페이스 :: relational 하게 실행하기"
description: ""
date: 2024-01-30
tags: [Java]
category: uncategorized
lang: ko
draft: false
---

## 무엇을 공부하였는가 🤔

---

정책에 따라 함수형 프로그래밍(함수형 인터페이스)을 호출을 할 수 있게 할 수 있다. 

## 어떻게 쓰는가 ☝️

---

```java
// func that return input+100;
Function<Integer, Integer> func1 = (input) -> input + 100;
// func that return input*100;
Function<Integer, Integer> func2 = (input) -> input * 3;

// compose :: func2의 정책을 먼저 적용(higher order func)
// input(3)에 3을 곱한뒤 100을 더함 :: 109
int addAfterMultiply = func1.compose(func2)
        .apply(3);
System.out.println(addAfterMultiply);

// andThen :: 호출자의 정책을 먼저 적용
// input(3)에 100을 더한 뒤 3을 곱합 :: 309
int multiplyAfterAdd = func1.andThen(func2)
        .apply(3);
System.out.println(multiplyAfterAdd);
```

## 왜 쓰는가 ❓

---

가령 우리가 원하는 특정 조건에 따라 A 함수와 B 함수의 호출 및 실행 순서를 바꿔야할 때가 있다.
만약 로그인 이후 결제를 해야하는 경우가 있다하자. 로그인 검증 이후 결제 입력의 순서를 따라야 한다. 만약 비회원 결제를 원한다면 호출 순서를 결제 먼저, 이후에 결제 가능 검증을 해야한다.
함수형 프로그래밍에 있어 호출 절차는 매우 중요하다.
따라서 정책에 따라 변동할 수 있도록 만들어줌으로서 코드 가독성을 높일 수 있고, 코드 변환이 쉽게 할 수 있을 것이다.
