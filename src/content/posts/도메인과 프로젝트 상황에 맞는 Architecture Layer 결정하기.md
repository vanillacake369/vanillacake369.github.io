---
title: "도메인과 프로젝트 상황에 맞는 Architecture Layer 결정하기"
description: ""
date: 2024-01-30
tags: [Java]
category: uncategorized
lang: ko
draft: false
---

# Why(What For?) 🤷‍♂️

---

### Service라는 이름으로 다양한 역할과 책임

> 프로젝트를 진행하다보니, `@Service`을 달고 다양한 역할을 하고 있는 것을 발견할 수 있었다.

### 도메인을 어떤 기준으로 분류할까?

> 도메인이 분리되어야 하는 도메인인가, 아니면 서브셋의 도메인인가?

# What(What should I know?) 👇

---

### Service ⇒ Provider 와 Service로 분리 !

- 유스케이스 제어 핸들러 / 비즈니스로직처리 핸들러 로 구분하기로 하였다.

![](/images/notion/4fe62f4a4257999c.png)



### 속성값으로 가지는 값이라면 서브셋 , 아니라면 분리 !

- 도메인을 아래와 같이 분리

### Controller 분리는 어떤 기준으로 할까?

- `API 당 Controller가 1:1이면 Overhead가 너무 큼`

# How(How to apply to code?) ✍️

---
