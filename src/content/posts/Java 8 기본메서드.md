---
title: "Java 8 기본메서드"
description: ""
date: 2024-01-30
tags: [Java]
category: uncategorized
lang: ko
draft: false
---

## 무엇을 공부하였는가 🤔

---

Iterable의 기본 메소드

- **forEach()**
- spliterator()

Collection의 기본 메소드

- **stream() / parallelStream()**
- removeIf(Predicate)
- **spliterator()**

Comparator의 기본 메소드 및 스태틱 메소드

- reversed()
- thenComparing()
- static reverseOrder() / naturalOrder()
- static nullsFirst() / nullsLast()
- static comparing()

## 어떻게 쓰는가 ☝️

---

### forEach

> **`Interface Iterable<T>`**** ⇒ **`default void forEach(`[`Consumer`](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/function/Consumer.html)`<? super `[`T`](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/lang/Iterable.html)`> action)`
> **The action to be performed is contained in a class that implements the *****Consumer***** interface and is passed to *****forEach *****as an argument.**

```java
// 우리가 흔지 사용하는 forEach 문
for (String name : names) {
    System.out.println(name);
}
// 이를 객체에 대한 람다식으로 바꿀 수 있다.
names.forEach(name -> {
    System.out.println(name);
});
```

위와 달리 익명 Consumer를 주입하여 함수형 프로그래밍이 가능하다.

```java
Consumer<String> printConsumer= new Consumer<String>() {
    public void accept(String name) {
        System.out.println(name);
    }
};
names.forEach(printConsumer);
```

### Spliterator

> 객체들이 저장된 구조들을 훑으며 파티셔닝 기능을 지원
> An object for traversing and partitioning elements of a source

- tryAdvance() : 나머지 요소가 존재하면 해당 요소에 대해 지정된 작업을 수행하고 true를 반환

```java
Spliterator<String> spliterator = name.spliterator();
while (spliterator.tryAdvance(System.out::println));
```

- trySplit() : 원소들의 파티셔닝 수행, 전체 원소의 절반 정도를 파티셔닝함

```java
List<String> name = new ArrayList<>();
name.add("keesum");
name.add("whiteship");
name.add("toby");
name.add("vanilla");
name.add("foo");
Spliterator<String> spliterator = name.spliterator(); // toby vanilla foo
Spliterator<String> spliterator1 = spliterator.trySplit(); // keesum whiteship
```

### Stream

```java
int sum = widgets.stream()
              .filter(w -> w.getColor() == RED)
              .mapToInt(w -> w.getWeight())
              .sum();
```

**중개 operation & 종료 operation**

> To perform a computation, stream operations are composed into a stream pipeline. 
> A stream pipeline consists 
> - of a ***source ***(which might be an array, a collection, a generator function, an I/O channel, etc), 
> - zero or more*** ******intermediate operations*** (which transform a stream into another stream, such as filter(Predicate)), 
> - and a ***terminal operation*** (which produces a result or side-effect, such as count() or forEach(Consumer)). 
> 
> Streams are lazy; computation on the source data is only performed when the terminal operation is initiated, and source elements are consumed only as needed.
> 
> 계산을 수행하기 위해 스트림 작업은 스트림 파이프라인으로 구성됩니다. 
> 스트림 파이프라인은 
> 소스(배열, 컬렉션, 생성기 함수, I/O 채널 등일 수 있음), 
> 0개 이상의 중간 작업(필터(Predicate)과 같이 스트림을 다른 스트림으로 변환하는)
> 종료 작업(count() 또는 forEach(Consumer)와 같은 결과 또는 부작용 생성). 으로 구성된다.
> 
> 스트림은 게으르다. 소스 데이터에 대한 계산은 터미널 작업이 시작될 때만 수행되며 소스 요소는 필요한 경우에만 소비됩니다.

***intermediate operation은 stream을 반환하고 terminal operation은 stream을 반환하지 않는다.***

대표적으로 쓰이는 intermediate operation이다.

- `filter`<데이터를 걸러내는 작업> 
- `map`<변환 작업>

대표적으로 쓰이는 terminal operation이다.

- `collect` <리턴 결과를 만들어주는 작업>


**Stream은 다음과 같은 특징을 지닌다**

1. 실행처리에 대한 저장소가 아니다.
*// 단순히 source를 아웃소싱하여 termainl operation에 의한 실행처리가 되어질 뿐, 이전 데이터를 저장하는 저장소가 아니다.*
2. 반드시 마지막에 terminal operation이 와야 작업 처리가 된 스트림이 반환된다.

### parallel

> `Stream.parallel()`은 Stream에서 수행되는 작업을 병렬로 처리하도록 합니다. 멀티 쓰레드에서 병렬로 처리되기 때문에 속도는 빠르지만, `forEach()`에서 출력되는 순서는 리스트에 저장된 순서와 다릅니다. 또한, 실행할 때마다 처리되는 쓰레드의 타이밍이 다르기 때문에 결과가 달라질 수 있습니다. 그렇기 때문에 처리 순서가 달라져도 결과에 영향을 주지 않을 때만 병렬로 처리해야 합니다.
> 병렬 stream 처리가 항상 좋은 것만은 아님!! 따라서 실제로 stream이나 다른 로직 케이스들을 성능비교해보는 게 가장 좋음!

```java
List<String> list =
        Arrays.asList("a", "b", "c", "d", "e", "f", "g", "h", "i");
Stream<String> stream = list.stream();

stream.parallel().forEach(System.out::println);
```

## 왜 쓰는가 ❓

---

### Stream을 사용하는 이유

- 컬렉션 구조에 대한 순회 혹은 필터링 처리를 할 수 있음
- 내부 반복자를 사용하여 순회 처리가 쉬움
- 람다식, 람다식 메소드 참조를 사용하기에 코드를 간결하게 짤 수 있음

## 레퍼런스 🔍

---

- forEach [https://www.baeldung.com/foreach-java](https://www.baeldung.com/foreach-java)
- Comparator [https://docs.oracle.com/javase/8/docs/api/java/util/Comparator.html](https://docs.oracle.com/javase/8/docs/api/java/util/Comparator.html)
- Splitator [https://docs.oracle.com/javase/8/docs/api/java/util/Spliterator.html#trySplit--](https://docs.oracle.com/javase/8/docs/api/java/util/Spliterator.html#trySplit--)
- Stream [https://docs.oracle.com/javase/8/docs/api/java/util/stream/Stream.html](https://docs.oracle.com/javase/8/docs/api/java/util/stream/Stream.html)
- 백기선 더 자바 8 강의노트
- Stream 멀티스레드(parallel) [https://codechacha.com/ko/java8-parallel-stream/](https://codechacha.com/ko/java8-parallel-stream/)
- Stream > collect [https://codechacha.com/ko/java8-stream-collect/](https://codechacha.com/ko/java8-stream-collect/)
