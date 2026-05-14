---
description: "누군가 실수로 엉뚱한 타입의 객체를 넣어두면 런타임에 형변환 오류가 난다.제네릭은 이를 우회한다.제너릭을 사용하면 컬렉션이 담을 수 있는 타입을 컴파일러에게 알려주다. 따라서 엉뚱한 타입의 객체를 넣는 시도를 컴파일 과정에서 차단하여 안전한 프로그래밍을 지향할 수 있게"
date: 2024-02-18
tags: [effective-java, journal]
lang: ko
draft: false
series: { id: "Effective Java", order: 3 }
---

# Generic 을 사용할 때의 이점

> 누군가 실수로 엉뚱한 타입의 객체를 넣어두면 런타임에 형변환 오류가 난다.
>
> 제네릭은 이를 우회한다.
>
> 제너릭을 사용하면 컬렉션이 담을 수 있는 타입을 컴파일러에게 알려주다.
>
> 따라서 엉뚱한 타입의 객체를 넣는 시도를 컴파일 과정에서 차단하여 안전한 프로그래밍을 지향할 수 있게 한다.
>
> 그럼 제너릭을 안 쓸 이유가 없다.
>
> 이제 아래 내용을 공부해보자!
>
> - 제너릭을 사용할 때 주의점
> - 제너릭을 최대 활용법

# Generic Method 를 왜 사용하는가 ?

> 제너릭메서드를 사용할 때 이점이 명확하기에 권장함!
>
> - 제너릭이 훨씬 안정적임
> - 형변환할 필요가 없기 때문
> - 즉, 입력매개변수와 반환값을 명시적으로 형변환해야하는 메서드 👎

> 추가로 Java가 발전하면 할 수록,함수형 인터페이스에 대한 의존성(사용)이 커지고 있다.
>
> 함수형 인터페이스는 “기본적으로 제너릭을 사용”한다.
>
> 따라서 제너릭에 대한 깊은 이해도는 필수적이게 되는 것 같다.
>
> [2.

Java에서 기본적으로 제공하는 함수형 인터페이스](https://www.notion.so/2-Java-687c2fd070774547a3b2efa98d47973a?pvs=21)

> ![](/images/velog/b4156f17967fc49e.png)

# 어떤 경우에 Generic Method 를 사용해야할까 ?

> <span style="color:yellowgreen">\*\*1.

대상 타입이 미지정 되어있지만, 알고리즘은 명세화 되어있을 때\*\*

> <span style="color:yellowgreen">\*\*2.

여러 도메인에 걸쳐서 사용되는 메서드일 때 -- 특히 정적 메서드인 경우 좋다\*\*

## 어떻게 Generic Method 를 정의하나요?

- 외부에서 입력,반환의 타입을 명시할 수 있게 하자
  ⇒ 타입 매개변수 목록 사용
  - `<E> Set<E> 함수이름 (Set<E> 매개변수들) { ,,, }`
    - 타입 매개변수 목록 ⇒ <E>
    - 반환 타입 ⇒ Set<E>

```java
// Avoid this ❌
public static Set union(Set s1, Set s2) {
		,,,
}
```

```java
// Do this ✅
public static <E> Set<E> union(Set<E> s1, Set<E> s2) {
		,,,
}
```

## Wild Card 를 사용하여 더욱 확장성 있게 하자

- 왜??

어떻게?? - 매개변수화 타입은 불공변, 즉 바뀔 수 없다.

따라서 다형적으로 사용할 수 없다. - 아래와 같이 지정하면 **(본인 + 하위타입)**을 받을 수 있다. - **Lower Bounded Wildcard**

        ```java
        public static <E> Set<E> union(Set<? extends E> s1, Set<? extends E> s2) {
        		,,,
        }
        ```

    - 아래와 같이 지정하면 **(본인 + 상위타입)**을 받을 수 있다.
        - **Upper Bounded Wild**

        ```java
        public static <E> Set<E> union(Set<? super E> s1, Set<? super E> s2) {
        		,,,
        }
        ```

# 응용 1 :: Generic Singleton Factory

### 제너릭 싱글턴 팩터리란?

**불변객체를 여러 타입으로 활용할 수 있게** 하고 싶다면 어떻게 해야할까?

예를 들어, 유틸리티 클래스를 아래와 같은 조건으로 만들고 싶다면??

- **여러 타입**을 유연하게 받아야하고
- **여러 곳에서 사용되는 해당 인스턴스가 변경불가하게끔** 강제 (:: 싱글톤, 불변객체)

이를 만들기 위해서 등장한 개념이 제너릭 싱글턴 팩터리이다.

- 제너릭을 사용하여 타입매개변수를 통해 외부에서 타입 주입
- 해당 타입으로 형변환을 해주는 정적 팩터리 메서드

> 여러 컬렉션을 사용하는 유틸리티와 같은 용도에 사용되면 유용할 것이다.

그렇다면 어떻게 만들 수 있을까?

아래 예제를 보자

### 예제1 :: 제너릭 싱글턴 팩터리를 사용하여 어떤 타입이든 받을 수 있는 항등함수를 만들어보자.

### 항등함수?

> 항등함수란??
>
> : 입력값을 수정없이 그대로 반환하는 특별한 함수
>
> ```java
> // #1
> String sameVal(String input){
> 	return input;
> }
>
> // #2 (LAMDA)
> String sameVal = (input) -> input;
> ```

```java
// Generic singleton factory pattern
private static UnaryOperator<Object> IDENTITY_FN = (t) -> t;

@SuppressWarnings("unchecked")
public static <T> UnaryOperator<T> identityFunction() {
    return (UnaryOperator<T>) IDENTITY_FN;
}
/*
T : 외부에서 타입 주입
static <T> UnaryOperator<T> : 해당타입으로 형변환해주는 정적팩토리 메서드
*/
```

```java
public static void main(String[] args) {
		String[] strings = {"삼베", "대마", "나일론"};
		UnaryOperator<String> sameString = identityFunc();
		for(String s : strings) {
        System.out.println(sameString.apply(s));
    }
}

private staticUnaryOperator<Object> IDENTITY_FN = (t) -> t;

@SuppressWarnings("unchecked")
public static<T>UnaryOperator<T> identityFunc() {
			return(UnaryOperator<T>) IDENTITY_FN;
}
```

**NOTE**

여기서 주의할 점은 type casting이다.

물론 Object는 Root Class이라 문제가 될 소지는 없다.

다만, 컴파일러 입장에서는 T가 어떤 타입이든 UnaryOperator<Object>는 UnaryOperator<T>가 아니기 때문에 unchecked cast 경고를 날리게 된다.

하지만 이 예제에서는, 값을 modify 하지 않고, 입력값을 그대로 반환하기에 문제될 소지가 없다.

따라서 `@SuppressWarnings`를 추가하여 오류와 경고 없이 컴파일 해주도록 하자.

![](/images/velog/13ed7754deb14143.png)

> Unchecked cast??
>
> Raw Types Generic 을 쓰거나, Paramatized Generic을 쓰는 경우, 형변환 시, unchecked cast를 던질 수 있다.  
> Java 컴파일러는 실행되는 모든 시점에서 각 변수의 유형을 알 수 있는데, 만약 잘못된 cating으로 호환되지 않는 유형으로 작동하면 컴파일 오류이기 때문에, 컴파일 이전에 unchecked cast에 관련된 경고를 던진다.

만약 이를 무시하고 형변환 이후에, 호환되지 않는 값을 사용하게 되는 경우, 해당 코드가 실행되어야만 예외를 던진다.

즉, 호환되지 않는 값에 대한 처리를 하기 전까지는 멀쩡히 돌아가게 된다.

> If we cast a raw type collection containing data with the wrong types to a parameterized type collection, the ***ClassCastException* won’t be thrown until we load the data with the wrong type**.
> 따라서 raw type은 웬만하면 쓰지 말거나, 형변환 시 유의하는 게 좋다

# 응용 2 :: Overriding Operator

> 해당 응용은 Effective Java 에서 제시하는 예시 중 하나일 뿐이다.

단지 여러 도메인에 걸쳐 활용되는 연산자를 Generic 을 사용하여 재정의할 뿐이다.

실제 비즈니스 컨텍스트에 적용하기는 어려울 수 있으니 유의해서 살펴보자.

## 응용2 :: 연산자 오버로딩

### Recursive Type Bound

```java
public interface Comparable<T> {
    int compareTo(T o);
}
```

- 타입 매개변수가 자신을 포함하는 수식에 의해 한정
  - 타입 매개변수 T

    ⇒ Comparable<T>를 구현한 타입이 비교할 수 있는 타입

    ![](/images/velog/379d33ed1e711498.png)
    - String ⇒ Comparable<String>을 구현
    - Integer ⇒ Comparable<Integer>을 구현

### 제너릭 메소드인데, type이 본인 스스로에게(recursive) 제한(bound)

Recursive Type Bound의 장점은 parameterized type을 통해 type을 수식내에 제한할 수 있다는 것이다.

이를 활용하여 수식을 구현한 타입 A만을 입력받는 메서드를 만들 수 있지 않을까?

예시로 Comparable을 구현한 원소만을 입력받는 메서드를 만들어보자.

Comparable에서의 parameterized type는 본인과 비교할 수 있는 요소를 정의했다.

Comparable을 통해 순서를 정하는 원소들을 입력받아 정렬,검색,최대최소의 기능을 구현하는 메서드들을 만들어 볼 수 있지 않을까?

### 예제2 :: 연산자 오버로딩

```java
public static <T> int countGreaterThan(T[] anArray, T elem) {
    int count = 0;
    for (T e : anArray)
        if (e > elem)  // compiler error
            ++count;
    return count;
}

public static <T extends Comparable<T>> int countGreaterThan(T[] anArray, T elem) {
    int count = 0;
    for (T e : anArray)
        if (e.compareTo(elem) > 0)
            ++count;
    return count;
}
```

- `<T extends Comparable<T>>` 는 자신과 비교될 수 있는 모든 타입 T 라고 읽을 수있다.
- Java 는 연산자 오버로딩을 지원하지 않기 때문에 short, int, double 등과 같은 primitive 타입에는 `>` 과 같은 비교연산자를 사용할 수 있다.
- `Comparable` 인터페이스와 재귀적 타입바운드를 통해 이 한계를 극복한다.
- Java 가 문법적으로 연산자 오버 로딩을 지원했다면 이런 기능도 필요 없었을 거라 판단된다.

[^4]: https://velog.io/@yhlee9753/Java-의-Generics5-사용-방식 <https://velog.io/@yhlee9753/Java-%EC%9D%98-Generics5-%EC%82%AC%EC%9A%A9-%EB%B0%A9%EC%8B%9D>
