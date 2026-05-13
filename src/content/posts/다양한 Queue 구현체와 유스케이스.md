---
title: "다양한 Queue 구현체와 유스케이스"
description: "Go는 \"하나의 정답\"을 강요하기보다 상황에 맞는 **최적의 도구**를 선택하도록 설계되었습니다."
date: 2026-01-28
tags: [go]
category: uncategorized
lang: ko
draft: false
---

# Why? 왜 배움?

---

Go는 "하나의 정답"을 강요하기보다 상황에 맞는 **최적의 도구**를 선택하도록 설계되었습니다.

- **성능 중심:** 메모리 지역성과 CPU 캐시 효율이 중요하다면 **Slice**.
- **유연성 중심:** 데이터의 크기가 매우 크고 빈번한 삽입/삭제 시 성능 변동을 최소화해야 한다면 **`container/list`**.
- **안전 중심:** 여러 프로세스(고루틴) 간의 동기화와 데이터 전달이 목적이라면 **Channel**.



# What? 뭘 배움?

---

| **구분** | **Slice (슬라이스)** | **container/list (리스트)** | **Channel (채널)** |
| --- | --- | --- | --- |
| **기반 구조** | 연속된 메모리 배열 | 이중 연결 리스트 (노드 기반) | 런타임 관리 FIFO 버퍼 |
| **시간 복잡도** | $O(1)$ (Amortized) | $O(1)$ | $O(1)$ |
| **주요 특징** | 가장 빠름, 캐시 친화적 | 메모리 재할당 복사 없음 | Thread-safe, Blocking 지원 |
| **단점** | 메모리 누수 위험 (앞부분) | 인터페이스 사용(느림), 캐시 미스 | 고정된 크기, 상대적 오버헤드 |




### 그럼 언제 뭘 쓰나 ??

1. **일반적인 경우 (Standard Case):** **Slice**를 사용하세요. 현대 CPU 구조에서 연속된 메모리 접근은 연결 리스트의 포인터 추적보다 수십 배 빠를 수 있습니다.
2. **동시성 제어 (Concurrency):** `sync.Mutex`로 직접 잠금을 구현하기 번거롭다면 **Channel**이 가장 직관적이고 안전합니다.
3. **대규모 가변 데이터:** 큐의 크기가 짐작 불가능할 정도로 커지고, 슬라이스의 대규모 메모리 복사(Reallocation)로 인한 'Stop-the-world'와 비슷한 지연을 피하고 싶다면 **`container/list`*를 고려하세요.



# How? 어떻게 씀?

---

### 1. Slice (가장 권장됨)

단순하고 빠르지만, 오래된 데이터를 삭제할 때 포인터를 `nil`로 만들어 GC를 도와주는 것이 좋습니다.

```go
queue := []int{}

// Enqueue
queue = append(queue, 10)

// Dequeue
if len(queue) > 0 {
    element := queue[0]
    queue[0] = 0 // 메모리 해제 도움 (포인터일 경우 nil)
    queue = queue[1:]
}
```

### 2. container/list

데이터가 수백만 개 이상이며, 중간에 삽입/삭제가 일어날 때 유리합니다.

```go
import "container/list"

l := list.New()
l.PushBack(10) // Enqueue

element := l.Front() // Dequeue
if element != nil {
    value := l.Remove(element).(int) // Type Assertion 필요
}
```

### 3. Channel

동시성 프로그래밍에서 고루틴끼리 데이터를 주고받을 때 사용합니다.

```go
ch := make(chan int, 10) // 버퍼 크기 10인 큐

ch <- 10        // Enqueue (버퍼 꽉 차면 대기)
value := <-ch   // Dequeue (버퍼 비면 대기)
```

# Reference

---

### 1. 공식 문서 (Official Docs)

- [**Go 슬라이스(Slices): 사용법 및 내부 구조**](https://go.dev/blog/slices-intro)**:** 슬라이스가 내부적으로 배열을 어떻게 참조하고 확장하는지 설명하는 공식 블로그 글입니다. 큐 구현 시 왜 메모리 관리에 유의해야 하는지 이해할 수 있습니다.
- [**Package container/list 공식 문서**](https://pkg.go.dev/container/list)**:** 연결 리스트의 메서드와 사용법, 그리고 모든 요소가 `Element` 구조체로 감싸져 있는 구조를 확인할 수 있습니다.
- [**Effective Go - Channels**](https://www.google.com/search?q=https%3A%2F%2Fgo.dev%2Fdoc%2Feffective_go%23channels)**:** 채널을 단순한 자료구조가 아닌 동기화 도구로 사용하는 Go의 철학이 담겨 있습니다.

### 2. 성능 및 벤치마크 (Performance & Deep Dive)

- [**GopherCon: Slice vs Linked List 벤치마크**](https://www.ardanlabs.com/blog/2013/07/singleton-design-pattern-in-go.html)**:** (Ardan Labs) 현대 CPU 캐시 구조에서 왜 슬라이스가 연결 리스트보다 성능상 압도적으로 유리한지 데이터로 증명하는 분석글입니다.
- [**Go의 가비지 컬렉션과 슬라이스 메모리 누수**](https://go101.org/article/memory-leaking.html)**:** (Go 101) 슬라이스 기반 큐에서 요소를 제거할 때, 왜 명시적으로 `nil`을 할당해야 메모리 누수를 피할 수 있는지 상세히 다룹니다.

### 3. 실무적인 대안 (Advanced Implementation)

- [**Efficient Queue in Go (Slice-based)**](https://www.google.com/search?q=https%3A%2F%2Fgithub.com%2Fgolang-design%2FGo-Questions%2Fblob%2Fmaster%2Fen%2F014-slice-queue.md)**:** 단순 슬라이스의 단점(메모리 낭비)을 보완하기 위해 링 버퍼(Ring Buffer) 스타일로 큐를 구현하는 기법을 소개합니다.
