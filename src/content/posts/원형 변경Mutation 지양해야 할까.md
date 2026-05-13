---
title: "원형 변경(Mutation). 지양해야 할까?? "
description: ""
date: 2024-01-30
tags: [Java]
category: uncategorized
lang: ko
draft: false
---

## 무엇을 공부하였는가 🤔

---

### Mutation이란??
### 원형에서 새로운 객체 생성 후 값 변환 🙆‍♂️

> 정렬된 새로운 list를 생성하고 반환함. 원형은 변하지 않음

### 원형 데이터를 변경 🙅‍♂️

> 원형 배열을 정렬. 원형이 바뀜




### 정말 원형 데이터를 건드리는 Mutation은 나쁜 것인가? 🤔

[https://stackoverflow.com/questions/30665622/why-do-we-need-to-avoid-mutations-while-coding-what-is-a-mutation](https://stackoverflow.com/questions/30665622/why-do-we-need-to-avoid-mutations-while-coding-what-is-a-mutation)


참고자료와 내 생각을 조합해보자면 Mutation을 피해야하는 이유는…

- 동시성 이슈
- 트러블 슈팅 이후 백 트래킹 시 발생하는 이슈

라고 볼 수 있겠다.

가령 스레드 A와 B가 다음과 같다고 해보자.
`Thread A`

```java
// 원형 배열을 오름차순 정렬
return Arrays.sort(list);
```

`Thread B`

```java
// 원형 배열을 내림차순 정렬
return Arrays.sort(list,Collections.reverseOrder());
```


스레드가 list에 con-current하게 접근했다고 하자.
어떤 스레드가 원형을 어떻게 건드렸는지 어떻게 알 수 있겠는가??



### 무엇이 좋은 기법인가?? 🤔

> 💡 **이럴 때 Mutation을 피하자!**




## 어떻게 쓰는가 ☝️

---

- java 




## 왜 쓰는가 ❓

---

아래 경우를 피하기 위해 Mutation 피하기!!

- 동시성 이슈
- 트러블 슈팅 이후 백 트래킹 시 발생하는 이슈



## 레퍼런스 🔍

---

사실… 노마드코더 보다가 떠올랐음 ㅋㅋㅋ

[https://youtu.be/e6WV_DXGwSg](https://youtu.be/e6WV_DXGwSg)
