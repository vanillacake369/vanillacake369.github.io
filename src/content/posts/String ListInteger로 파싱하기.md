---
title: "String → List<Integer>로 파싱하기"
description: "문자열을 Integer에 대한 List형태로 바꾸는 방법"
date: 2026-02-25
tags: [java]
lang: ko
draft: true
---

## 주제


문자열을 Integer에 대한 List형태로 바꾸는 방법

## 무엇 🤔


## 왜 ❓


다음과 같은 경우에 쓰인다.
"1 2 3 4” → [1][2][3][4] → 최대/최소 찾기

## 어떻게 ☝️


- 물론 원소 하나 하나에 접근한 뒤, List.add()를 해주면 된다.
- 허나 다른 좋은 방법으로는 java8의 Stream을 쓰는 것이다.

## 레퍼런스 🔍


[https://stackoverflow.com/questions/11009818/how-to-get-list-of-integer-from-string](https://stackoverflow.com/questions/11009818/how-to-get-list-of-integer-from-string)
