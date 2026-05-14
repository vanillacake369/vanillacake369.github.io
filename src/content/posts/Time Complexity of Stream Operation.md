---
title: "Time Complexity of Stream Operation"
description: "ss Stream에서 max(), sort(), filter() 등등을 자주 사용하곤 한다."
date: 2026-02-25
tags: [java]
lang: ko
draft: false
---

## 무엇을 공부하였는가 🤔


ss Stream에서 max(), sort(), filter() 등등을 자주 사용하곤 한다.

Stream을 사용하면 코드도 깔끔해질 뿐 더러, 코더 스스로도 편하게 짤 수 있다.
~~솔직히 코드 5줄 짤 거를 한 줄에 끝내버리니;;~~
그런데 Stream에서 각각의 Operation 별로 시간측정을 하고 싶을 때는 어떻게 할 수 있을까?
**중요한 건 세 가지로 요약된다.**

- **Stream의 Intermediate Op 대부분 내부적으로 Iteration을 실행한다.**
- **만약 Stream에서 원하는 조건에 해당된다면 Iteration을 멈춘다.**
- **Stream에서 Intermediate Operation은 Lazy하기에, Terminal Operation이 오기 전까지 실행되지 않는다.
⇒ Terminal이 어떤 것이 오냐에 따라 수행속도가 달라짐**

아래는 Stack Overflow 답변 내용이다.

> Stream computations heavily depend on the operation performed.

If you are doing any intermediate operation(like filter and sorted),the method invocation will return almost immediately, only after scheduling the operation to be performed. 
> When you invoke a terminal operation, the computation actually starts and the terminal operation (like forEach, collect and reduce) doesnt return until the whole process has been completed.

This part takes the actual time and I am listing how much here
> 스트림 계산은 수행된 작업에 크게 의존합니다.

필터 및 정렬과 같은 중간 작업을 수행하는 경우 수행할 작업을 예약한 후에만 메서드 호출이 거의 즉시 반환됩니다.

터미널 작업을 호출하면 계산이 실제로 시작되고 터미널 작업(예: forEach, 수집 및 감소)은 전체 프로세스가 완료될 때까지 반환되지 않습니다.

이 부분은 실제 시간이 걸리며 여기에 얼마인지 나열하고 있습니다.
> `filter` itself *without* a terminal operation would have a zero overhead - as it does absolutely nothing; streams are driven by the terminal operation only - no terminal operation, nothing gets executed.

## 왜 쓰는가 ❓


- Stream의 시간측정!

## 레퍼런스 🔍


[https://stackoverflow.com/questions/69390200/big-o-time-complexity-of-java-streams](https://stackoverflow.com/questions/69390200/big-o-time-complexity-of-java-streams)
[https://stackoverflow.com/questions/45684200/time-complexity-of-stream-filter](https://stackoverflow.com/questions/45684200/time-complexity-of-stream-filter)
