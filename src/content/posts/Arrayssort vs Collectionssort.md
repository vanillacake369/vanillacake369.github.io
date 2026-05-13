---
title: "Arrays.sort() vs Collections.sort()"
description: "우선적으로, 들어가기 전에어떤 정렬 알고리즘이 있으며 배웠는지 복기하고자 아래에 나열해보았다."
date: 2026-02-25
tags: [java]
category: uncategorized
lang: ko
draft: false
---

## 무엇을 공부하였는가 🤔

---

우선적으로, 들어가기 전에어떤 정렬 알고리즘이 있으며 배웠는지 복기하고자 아래에 나열해보았다.

<details>
<summary>Sort</summary>

*Stable Sort*

- Bubble Sort 버블 정렬
- Selection Sort 선택 정렬
- Insertion Sort 삽입 정렬
- Shell Sort 셸 정렬
- Heap Sort 힙 정렬
- Quick Sort 퀵 정렬

*Un-Stable Sort*

- Merge Sort 병합 정렬
- Counting Sort 계수 정렬
- Radix Sort 기수 정렬
- Bucket Sort 버킷 정렬
</details>

Arrays.sort()와 Collections.sort()는 같은 정렬이고, Sub-Set의 관계에 있다. 
하지만, 목적과 사용대상이 다르다고 생각하자.

### 1. 정렬대상이 다르다.

- **`Arrays.sort`** 는 배열에 대해 정렬
-  **`Collections.sort`** 는 **`List`**s 에 대해 정렬한다.

### 2. Collections.sort()는 내부적으로 Arrays.sort()를 사용한다.

Collections.sort(Comparator) → List⇒Array → Arrays.sort(Array,Comparator)

1. 우선 List를 Array로 변환한다. 
(이 때 Collections는 모든 로직이 객체로 돌아가므로 Object[]로 받는 걸 볼 수 있다)
2. Arrays.sort() ← Array와 Comparator
3. 정렬된 Array를 List로 다시 변환한다.

다음은 Collections.sort()의 내부 로직이다.

```java
default void sort(Comparator << ? super E > c) {
  // Convert list into array
  Object[] a = this.toArray();
  // Call Arrays.sort on newly allocated array
  Arrays.sort(a, (Comparator) c);
  ListIterator < E > i = this.listIterator();
  for (Object e: a) {
    i.next();
    i.set((E) e);
  }
}
```

Collections.sort()는 내부적으로 여러가지의 단점을 지닌다.

1. List → Array → List 변환과정의 오버헤드가 필요함
2. Arrays.sort()를 호출하게 되면 새로운 배열 선언을 하게 되므로 그만큼의 공간 낭비가 됨
3. Array → List 변환과정 중, for-loop를 사용하므로 O(n)만큼의 List로의 변환 연산이 필요함


java에서는 거의 웬만한 자료구조들이 Collections 프레임워크 아래에 선언되어있다.

![Hierarchy of Collection Framework](/images/notion/e35c942b8634905d.png)

Collections.sort()를 무자비하게 쓰기보다 조금 줄여야한다고 생각한다.
따라서 써야할 때와 쓰지 않아도 되는 경우로 나눠보자.
이럴 때는 Collections.sort()를 써야한다고 생각한다. // 물론 객체지향에서 허벌나게 쓰인다고 생각한다.

1. 배열이 아닌 동적 메모리를 사용해야 할 때
2. 내장된 자료구조를 쓸 때
3. Wrapper나 Generic을 통해 클래스와 인터페이스를 넘나들며 코딩을 해야할 때 :: 특히 OOP
4. 객체를 저장한 구조에서 serialization을 해야할 때

이럴 때는 Collections.sort()를 피해야 할 것 같다.

1. 어떻게든 무조건 시간과 공간을 줄여야 할 때
2. Primitive만을 사용할 때

### ~~3. Arrays.sort()는 두 가지 정렬 알고리즘을 사용한다 :: Quick OR Merge~~

~~Arrays.sort()는 primitive에는 quick sort()를, generic에 대해서는 merge sort()를 사용한다.~~

![**Quick Sort ⇒ Pivot에 대해 왼,오 대소비교 후 swap, 재귀적으로 각 영역의 pivot을 지정하여 전체 정렬**](/images/notion/5a236769f1af6d9d.png)
![~~**Merge Sort**~~](/images/notion/cf35f08bd3a25363.png)

어떨 때 Quick Sort를 사용하고 어떨 때 Tim Sort ~~Merge Sort~~를 사용하나?
이는 parameter type에 따라 어떤 정렬 알고리즘이 사용될지 결정된다.
Quick Sort는 unstable, 즉 정렬 이후 원래의 원소 순서가 유지되지 않는다. 
Tim Sort ~~Merge Srot~~는 stable, 즉 정렬 이후 원래의 원소 순서가 유지된다.
primitive type은 값이 서로 같으면 순서가 바뀌어도 그게 그거이기에 상관이 없다. 
반면, generic을 사용하여 객체를 정렬해야하는 경우에 있어서는 순서가 바뀌면 어떤 사고가 발생할 지 모른다.
따라서 parameter가 primitive type이면 quick sort를, generic이면 tim sort~~ merge sort~~를 실행한다.
물론 pivot의 선정에 따라 quick sort는 o(n^2)일 수 있지만, quick, tim 둘 다 평균,최악 o(nlogn)의 시간 복잡도를 가진다.

![](/images/notion/45593516eafbabbb.png)

## 어떻게 쓰는가 ☝️

---

Arrays.sort() 사용예시

```java
import java.util.Arrays;

int [] arr = {5, -2, 23, 7, 87, -42, 509};
Arrays.sort(arr);
```

Collections.sort() 사용예시

```java
import java.util.*;

ArrayList<Integer> listInt = new ArrayList<Integer>();
listInt.add(5);
listInt.add(-42);
listInt.add(509);
Collections.sort(listInt);
```

## 왜 쓰는가 ❓

---

- 그리디인 경우의 최대,최소 추출
- 최대 최소 값을 추출해서 사용해야할 때

## 레퍼런스 🔍

---

- Stable,Unstable Sort [https://hyo-ue4study.tistory.com/421#:~:text=안정적인(stable) 정렬과 불안정한,하지 않는다면 UnStable Sort이다](https://hyo-ue4study.tistory.com/421#:~:text=%EC%95%88%EC%A0%95%EC%A0%81%EC%9D%B8(stable)%20%EC%A0%95%EB%A0%AC%EA%B3%BC%20%EB%B6%88%EC%95%88%EC%A0%95%ED%95%9C,%ED%95%98%EC%A7%80%20%EC%95%8A%EB%8A%94%EB%8B%A4%EB%A9%B4%20UnStable%20Sort%EC%9D%B4%EB%8B%A4).
- 기본 정렬 알고리즘 비교 [https://code-lab1.tistory.com/24](https://code-lab1.tistory.com/24)
- Arrays.sort vs Collections.sort() [https://www.gregorygaines.com/blog/what-is-the-time-complexity-arrays-and-collections-sort/](https://www.gregorygaines.com/blog/what-is-the-time-complexity-arrays-and-collections-sort/)
