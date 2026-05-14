---
title: "Generic / Wildcard 는 왜 쓰고 언제 쓸까?"
description: "Generic 은 왜 쓸까? 언제 어떻게 쓰고, 한계점은 뭘까? 어떤 한계점이 있길래 Wildcard를 쓸까? Wildcard 의 사용유의점은 뭐고, 기준안은 뭘까?"
date: 2024-02-18
tags: [effective-java, journal]
lang: ko
draft: false
---

# 요약 / Summary 

제네릭의 필요성:

- 타입 안전성: 제네릭은 컴파일 타임 검사를 허용하여 클래스 캐스트 예외와 같은 런타임 오류를 방지함으로써 유형 안전성을 보장
- 가독성 및 유지보수성: 제네릭은 타입 정보를 제공함으로써 코드를 더 명확하고 이해하기 쉽고 유지 관리하기 쉽게 만듬

제네릭 소개 : 
- 개념: Generics 은 type 에 대한 매개변수화된 클래스 또는 인터페이스로, type에 대한 유연성을 허용
- Refiable vs.

Non-refiable types: 런타임에 타입 정보를 유지하는 타입(Refiable)과 그렇지 않은 타입(Non-Refiable) 차이점 소개 <span style="color:grey">-- Generic 은 Non-Refiable 에 해당한다.
- 제네릭의 내부 작동 방식: type parameter를 사용하여 컴파일에게 특정 type 만 허용하게끔 강제, type erasure 를 사용하여 ,런타임런타임 시 type 소거되어도 동일하게 동작하게끔 함
- 이름 지정 규칙: 제네릭 유형 매개변수의 이름 지정 규칙(예: E, K, T 등의 단일 대문자 사용).
- 제네릭의 문제점: 리스코프 치환 원리(LSP):
  - 불변성: 제네릭은 불변성이므로 List<부모>와 List<자식>은 LSP 위반으로 인해 호환되지 않는다.
  - 매개변수화된 타입의 한계: 불변성은 매개변수화된 타입의 유연성을 제한 (한 마디로 부모,자식 간 치환이 되지 않으므로 유연하지 못 하다)

와일드카드 소개 :
- 와일드카드 개념: 와일드카드는 상한 및 하한을 제공하여 Generic 사용 시 LSP 위반을 해결, 유연성 향상
- upper-bound: 특정타입을 확장하는 타입(자식객체) 허용/제한
- lower-bound: 특정타입의 코어타입(부모객체) 허용/제한

와일드카드 사용기준안(PECS) :
- 파라미터가 데이터를 제공하는 Producer 인 경우 upper-bound 와일드카드를 사용하고, 데이터를 저장 및 활용하는 Consumer인 경우 lower-bound 와일드카드를 사용
- 특히 Producer-Consumer 구조에서 와일드카드를 사용 시, 유연성을 제공하고 API 디자인을 개선 

Necessity of Generics:

Type safety: Generics ensure type safety by allowing compile-time checks, preventing runtime errors like ClassCastException.

Readability and maintainability: Generics make code clearer and easier to understand and maintain by providing type information.

Generic Concepts:

Introduction to generics: Generic types are classes or interfaces parameterized over types, allowing for type flexibility.

Refiable vs.

Non-refiable types: Understanding the distinction between types that retain their type information at runtime and those that do not.

Internal workings of generics: Type parameter to force compilation to accept only certain types, and type erasure to ensure that the same behavior is achieved even if the type is erased at runtime.

Naming conventions: Conventions for naming generic type parameters, such as using single uppercase letters like E, K, T, etc.

Problems with Generics: Liskov Substitution Principle (LSP):

Invariance: Generics are invariant, meaning List<Parent> and List<Child> are not compatible due to LSP violation.

Limitations of parameterized types: Invariance limits flexibility in parameterized types, as illustrated by the pushAll method example.

Wildcard Usage: Providing Flexibility:

Introduction to wildcards: Wildcards allow for greater flexibility in type usage, providing upper and lower bounds, which resolves the LSP violation of Generic.

Upper bounds: Allow any type that extends a specified type.

Lower bounds: Allow any type that is a superclass of a specified type.

Guidelines for usage: When to use upper bounds, lower bounds, or unbounded wildcards based on producer-consumer patterns and access needs.

Producer-Consumer Pattern:

Guideline of wildcard usage(PECS):
Producers should use upper-bounded wildcards to produce data, while consumers should use lower-bounded wildcards to consume data.

Wildcards offer flexibility and improve API design, especially in producer-consumer scenarios.

# Generic 의 필요성

### 1.

타입 안전성(Type Safety)
**<span style="color:yellowgreen">제네릭을 사용하지 않으면 잘못된 타입의 객체가 컬렉션에 삽입될 수 있다.**

이로 인해 런타임에 형변환 오류가 발생할 수 있다.

다음 예시를 참고해보자.

```java
public static void main(String[] args) {
    List numbers = Arrays.asList("1", "2", "3", "4", "5", "6");
    int sum = 0;
    for (Object number : numbers) {
        sum += (int) number;
    }
}
```

위 코드는 숫자문자열을 List 컬렉션에 저장, loop 를 통해 int 형으로 변환하며 sum 을 구하는 코드이다.

여기서 문제점이 발생한다.

int형으로 형 변환을 해주며 더해주지만 List의 요소가 int형이라는 보장이 없다.

즉 위와 같이 문자열을 집어넣는 것은 사용자의 입력하는대로라는 것이다.

문제는 위 예제와 같이 List에 문자열을 넣어주어도 컴파일 에러가 발생하지 않고 런타임에 ClassCastException 이 터지게 되는 것이다.

즉 컴파일 시점에서의 에러 체킹이 되지 않는다.

**<span style="color:yellowgreen">제네릭을 사용하면 컴파일러가 컬렉션에 담을 수 있는 타입을 사전에 알고, 이를 강제하여 안전한 프로그래밍을 지향할 수 있다.**

### 2.

가독성과 유지보수성
제네릭을 사용하면 코드가 더 명확하고 가독성이 높아진다.

타입 정보가 명시되어 있기 때문에 읽는 이로 하여금 코드를 이해하고 유지보수하기 쉬워진다.

그러므로, 제네릭을 사용하지 않을 이유가 없다.

이제 제네릭에 대해 좀 더 자세히 알아보자.

# Generic 개념 살펴보기

### How to use "Generic"

> 외부에서 class나 interface에 대한 type을 주입!
> 

A *generic type* is a **generic class or interface** that is parameterized over types. 

```java
/**
 * Generic version of the Box class.
 * @param <T> the type of the value being boxed
 */
public class Box<T> {
    // T stands for "Type"
    private T t;

    public void set(T t) { this.t = t; }
    public T get() { return t; }
}
```

[Generic Types (The Java™ Tutorials >        
            Learning the Java Language > Generics (Updated))](https://docs.oracle.com/javase/tutorial/java/generics/types.html)

그렇다면 내부적으로 어떻게 동작하는 걸까?

이에 앞서서 먼저 "런타임에 구체화되는 여부"인 "구체화/비구체화" 개념에 대해 살펴보아야한다.

### Refiable(구체화) vs Non-Refiable(비구체화)

- `구체화 타입(reifiable type)` : 자신의 타입 정보를 런타임 시에 알고 지키게 하는 것(런타임에 구체화하는 것)
    - 배열이 구체화 타입에 해당
- `비 구체화 타입(non-reifiable type)` : 타입 소거자에 의해 컴파일 타임에 타입 정보가 사라지는 것(런타임에 구체화화지 않는 것)
    - 제네릭 타입이 비구체화 타입에 해당
    - 제네릭은 컴파일 타임에 타입 체크를 한 뒤 런타임에는 타입을 지우는 방법을 사용

```java
// 컴파일 할 때 (타입 소거 전) 
public static void main(String... args) {
  List<String> list = new ArrayList<>();
  Object[] array = new Long[10];

// 런타임 때 (타입 소거 후)
public static void main(String... var0) {
  ArrayList var1 = new ArrayList();
  Long[] var2 = new Long[10];
``` 
  
이 Non-Refialbe, 즉 타입 소거자의 지원에 의해 Generic 이 동작될 수 있다.

이제 내부적으로 어떻게 동작하는지 살펴보자.

### Generic 내부동작과정 

하나 이상의 타입 매개변수를 선언하고 있는 클래스나 인터페이스는 제네릭 클래스 혹은 제네릭 인터페이스라고 한다.

이를 합쳐 제너릭 타입이라고 한다.

각각의 제너릭 타입에서는 매개변수화 타입(parameterized type)들을 정의하는데 다음 과 같다

```java
List<String> list = new ArrayList<>();
```

- `List<E>` 의 `E` = 형식 타입 매개변수(Formal type parameter)
- `List<String>` 의 `String` = 실 타입 매개변수(Actual type parameter)

제네럭은 타입 소거자(Type erasure) 에 의해 자신의 타입 요소 정보를 삭제 하므로 컴파일 시 다음과 같이 변경된다.

```java
ArrayList list = new ArrayList();
```

컴파일러는 컴파일 단계에서 `List` 컬렉션에 `String` 인스턴스만 저장되어야 하는 것을 알게 되었고 그것을 보장해주기 때문에 `ArrayList list` 로 변경해도 런타임에 동일한 동작을 보장한다.

### Generic 네이밍 컨벤션이 존재하므로 사용 시, 유의한다.

Generic 에도 네이밍 컨벤션이 존재한다. 

```java
/** 차이가 보이는가?? */

// List interface
public interface List<E> extends Collection<E> {
    ...
}

public class Car<T> {
    private final T name;
    ,,,
}
```

따라서 사용 시, 해당 네이밍 컨벤션을 지켜서 나와 내 동료를 위하자.

공식문서를 참고해보았다. ~~언제나 그렇듯 공식문서가 갑이다.~~

> By convention, type parameter names are single, uppercase letters.

This stands in sharp contrast to the variable [naming conventions](https://docs.oracle.com/javase/tutorial/java/nutsandbolts/variables.html#naming) that you already know about, and with good reason: Without this convention, it would be difficult to tell the difference between a type variable and an ordinary class or interface name.
>
The most commonly used type parameter names are:
>
- E - Element (used extensively by the Java Collections Framework)
- K - Key
- N - Number
- T - Type
- V - Value
- S,U,V etc. - 2nd, 3rd, 4th types

# Generic 의 문제점 :: 리스코프 치환 법칙


사실, Generic 사용 시, 리스코프 치환 법칙을 어기게 되는 문제점이 있다.

### Generic is “invariant”

Generic 은 불변(invariant)이기에 실체화될 수 없다(Non-Refiable)
  
따라서 List<부모> 와 List<자식>은 호환될 수 없다.

아니, 애초에 이 둘은 다르게 봐야한다.

**<span style="color:yellowgreen">왜냐하면 List<부모>에는 부모만을 넣을 수 있고, List<자식>에는 자식만 넣을 수 있기 때문이다.**

**<span style="color:yellowgreen">따라서 List<자식>은 List<부모>가 하는 일을 대신 해서 할 수 없고, 이는 리스코프 치환 법칙에 어긋나게 된다.**

> As noted in Item 28, parameterized types are invariant.

In other words, for any two distinct types `Type1` and `Type2`, `List<Type1>` is neither a subtype nor a supertype of `List<Type2>`.

Although it is counterintuitive that `List<String>` is not a subtype of `List<Object>`, it really does make sense.

You can put any object into a `List<Object>`, but you can put only strings into a `List<String>`.

Since a `List<String>` can’t do everything a `List<Object>` can, it isn’t a subtype (by the Liskov substitution principal, Item 10).
> 

### invariant parameter limits the freedom

이렇기에, 제네릭을 사용한 매개변수는 유연함이 떨어진다.

다음 코드는 이러한 제네릭 매개변수의 단점을 보여준다!

**우리 입장에서는 부모-자식 관계이므로 서로 호환되어야 마땅한 Iterable<Number>와 Iterable<Integer>이, 제네릭 입장에서는 치환되지 않는다.**
  
따라서 아래와 같은 오류가 발생하게 된다!

```java
// pushAll method without wildcard type - deficient!
public void pushAll(Iterable<E> src) {
    for (E e : src)
        push(e);
}

Stack<Number> numberStack = new Stack<>();
Iterable<Integer> integers = ... ;
numberStack.pushAll(integers);

StackTest.java:7: error: incompatible types: Iterable<Integer>
cannot be converted to Iterable<Number>
        numberStack.pushAll(integers);
                    ^
```

# Wildcard : Generic 보다 더 유연하게


이러한 문제점을 본 Java 팀은 Generic 을 사용한 type-safe, 그리고 유연한 프로그래밍에 그치지 않았나보다.

여기서 더 나아가 wildcard 라는 개념을 도입한다.

두 가지 기능을 제시한다.

**1.

상속관계의 타입을 인자로 넘기게끔 허용 및 제한**
   - upperbound 와 lowerbound 라는 개념을 사용한다.
   
**2.

인자값에 대한 타입의 자유화**
   - Generic 에서 타입정보를 넘겨주어야 하는 일을 없앴다.

위 두 가지 기능을 하나씩 살펴보자.
  
### 1.

상속관계의 타입을 인자로 넘기게끔 허용 및 제한
![](/images/velog/1946a3e8cb1687f3.png)

위에서 Generic 사용 시, 리스코프 치환 법칙 위반 사례를 볼 수 있었다.

Wildcard 는 upper-bound, lower-bound 라는 개념을 사용하여 이를 해결한다.
<span style="color:grey">// 공식문서만 살펴봐도, wildcard 도입 자체가 이를 위한 것을 알 수 있다.
<span style="color:grey">// 챕터 5개가 다 이 내용이다.
  
#### upper-bound
```java
List<? extends Integer> intList = new ArrayList<>();
List<? extends Number>  numList = intList; 
```

**특정 타입의 모든 upper type, 즉 확장된 타입(자식객체)를 인자값으로 넘길 수 있게 도와준다.
**
#### lower-bound

```java
List<? super Integer> intList = new ArrayList<>();
List<? super Number>  numList = intList; 
```

**특정 타입의 모든 lower type, 즉 코어 타입(부모객체)를 인자값으로 넘길 수 있게 도와준다.
**  
### 2.

인자값에 대한 타입의 자유화
Generic 에서는 Caller 에서 타입정보를 입력해주었다.

```java
List<Integer> nums = new ArrayList<>();
```

Wildcard 에서는 이러한 타입정보를 제거해주었다.

즉, 코더로 하여금 더욱 유연한 프로그래밍을 지원하게 하는 것이다.

하지만 똑똑한 Java 팀은 이러한 Wildcard 사용을 아래 세 가지로만 제한하여, 
  
Class / Interface 선언 시, 타입 미지정으로 인한 타입체킹을 강제하였다.
  
- 파라미터
- 필드값
- 지역 변수

## Generic 과 Wildcard 의 차이점

|  | Generic | Wild card |
| --- | --- | --- |
| Class 선언 시, type 주입받게끔 매개변수로서 사용  | O | X |
| Interface 선언 시, type 주입받게끔 매개변수로서 사용 | O | X |
| Local variable로서 사용 | O | O |
| Parameter로서 사용 | O | O |
| Instance field로서 사용 | O | O |

## Wildcard 주의점 :: type 미지정에 따른 연산 불가능

> Generic을 사용할 때는 하나의 타입으로서 사용되는 것이다.
> 
> 
> Wildcard를 사용할 때는 type 미지정이다.

따라서 어떠한 연산조차 불가능하다!!
> 
> 아래 두 가지 예제는 모두 Wildcard를 사용할 때 컴파일에러가 발생한다.
> 
> ```java
> import java.util.List;
> 
> public class Experiment {
>     public static <E> void funct1(final List<E> list1, final E something) {
>         list1.add(something);
>     }
> 
>     public static void funct2(final List<?> list, final Object something) {
>         list.add(something); // does not compile
>     }
> }
> 
> ```
> 
> ```java
> public class Experiment {
>     public static <E> void funct1(final List<E> list) {
>         list.add(list.get(0));
>     }
> 
>     public static void funct2(final List<?> list) {
>         list.add(list.get(0)); // !!!!!!!!!!!!!! won't compile !!!!!!!!!
>     }
> }
> ```
>

# 잠깐, 언제 Lower bound 를 쓰고, 언제 Upper bound 를 쓰지?


해당 기준안은 자바 가이드라인 자체에 권고되어있다.

바로 **PECS** 이다. (Producer Extends, Consumer Super)

요컨대 다음과 같이 요약될 수 있다.

> **해당 파라미터가 Data 를 제공하는 역할이라면(Producer)**
>  - `? extends E` :: upper bound
> 
> **해당 파라미터가 어떤 Data 를 활용하는 역할이라면(Consumer)**
>  - `? super E` :: lower bound
>
> ```java
// Wildcard type for a parameter that serves as an E **producer**
public void pushAll(Iterable<? extends E> src) {
    for (E e : src)
        push(e);
}
>
// Wildcard type for parameter that serves as an E **consumer**
public void popAll(Collection<? super E> dst) {
  while (!isEmpty())
    dst.add(pop());
}
```

공식문서에서는 아래와 같이 나온다.

Wildcard Guidelines: 
- An "**in**" variable is defined with an upper bounded wildcard, using the  keyword.
    
    `extends`
    
- An "**out**" variable is defined with a lower bounded wildcard, using the  keyword.
    
    `super`
    
- In the case where the "in" variable can be accessed using methods defined in the  class, use an unbounded wildcard.
    
    `Object`
    
- In the case where the **code needs to access the variable as both an "in" and an "out" variable, do not use a wildcard.**

[Guidelines for Wildcard Use (The Java™ Tutorials >        
            Learning the Java Language > Generics (Updated))](https://docs.oracle.com/javase/tutorial/java/generics/wildcardGuidelines.html)

[](https://github.com/clxering/Effective-Java-3rd-edition-Chinese-English-bilingual/blob/dev/Chapter-5/Chapter-5-Item-31-Use-bounded-wildcards-to-increase-API-flexibility.md)

#### 예시.

동물을 제공하여(Produce) 행위 지정 / 새로운 동물타입의 데이터 추가(Consumer)

[예시코드](https://www.baeldung.com/java-generics-interview-questions#q13-when-would-you-choose-to-use-a-lower-bounded-type-vs-an-upper-bounded-type)

```java
public static void makeLotsOfNoise(List<? extends Animal> animals) {
    animals.forEach(Animal::makeNoise);   
}
```
위 코드에서는 각 동물에게 소리를 내라고 명령을 한다.

중요한 건 메서드가 하는 역할보다, 파라미터의 역할이다.

여기서 동물에게 소리 명령을 위해 전달되는 데이터는 Animal 리스트이다.

**<span style="color:yellowgreen">Animal 리스트의 역할은 모든 Animal 타입의 데이터를 제공해주는 역할, 즉 Producer 역할이다.**

**<span style="color:yellowgreen">어떤 Animal 확장타입이든 제공할 수 있어야 하므로 여기에는 lower bound 인 `? extends Animal` 를 활용해주는 게 적합하다.**

```java
public static void addCats(List<? super Animal> animals) {
    animals.add(new Cat());   
}
```
반면 위 코드에서는 animal들의 리스트에 새로운 동물을 추가하고 있다. **<span style="color:yellowgreen">즉, animal 리스트가 활용되는 역할인 Consumer 로서 사용된다.**

**<span style="color:yellowgreen">따라서 여기에는 upper bound 인 `? super Animal` 을 활용해주는 게 적합하다.**

**<span style="color:yellowgreen">이에 따라 animal 의 하위 타입 dog 혹은 cat에 대한 리스트를 addCats() 에 넘기는 일을 막을 수가 있다.**

> 보통 Spring 에서는 
> - Pub/Sub 구조의 Event 처리나, 
> - MVC 구조에서 상위 Service Layer, 하위 Service Layer 
> - MVC 구조에서 Query 담당 / Command 담당 Service
> 
> 에서 여러모로 활용가능하다.

![](/images/velog/0b3eafe216d84ef6.png)

[[Java] Producer - Consumer 패턴 구조](https://hochoon-dev.tistory.com/entry/Java-Producer-Consumer-패턴-구조)

# Generic / Wildcard 적용예제 :: Pub/Sub 구조의 Event 처리
---
> Spring 에서의 ApplicationEventPublisher 의 그것보다 Raw 한 코드이니 유의하자.
> 이쯤되면 얼마나 ApplicationEventPublisher 가 편한건지 알 수 있다.

#### 1.

Event 를 정의한다.
```java
class Event {
    private String message;

    public Event(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }
}
```

#### 2.

Lower Bound Generic 을 활용하여 EventListener 인터페이스를 정의한다.
```java
// Define event listener interface
interface EventListener<T extends Event> {
    void onEvent(T event);
}
```
#### 3.

EventListener 인터페이스의 구현체인 NotificationListener 을 정의한다.
```java
class NotificationListener implements EventListener<Event> {
    @Override
    public void onEvent(Event event) {
        System.out.println("Received notification: " + event.getMessage());
    }
}
```
#### 4.

Event 에 대한 upper bound wildcard 를 사용하여 EventPublisher 를 정의한다.
```java
class EventPublisher {
    private List<EventListener<? extends Event>> listeners;

    public EventPublisher() {
        listeners = new ArrayList<>();
    }

    public void subscribe(EventListener<? extends Event> listener) {
        listeners.add(listener);
    }

    public void publish(Event event) {
        for (EventListener<? extends Event> listener : listeners) {
            listener.onEvent(event);
        }
    }
}

```

[^1]: Oracle :: Wildcards <https://docs.oracle.com/javase/tutorial/java/generics/wildcards.html>
[^2]: Oracle :: Wildcards and Subtyping <https://docs.oracle.com/javase/tutorial/java/generics/subtyping.html>
[^4]: 내 노션정리본 :: Effective Java Ch5.

Generic 정리 <https://vanillacake369.notion.site/Ch5-Generic-875c9ac8d6fb4b0086c49b656f0612b2?pvs=4>
[^5]: Baeldung :: Type Parameter vs Wildcard in Java Generics <https://www.baeldung.com/java-generics-type-parameter-vs-wildcard>
[^6]: Baeldung :: Java Generics Interview Questions (+Answers) <https://www.baeldung.com/java-generics-interview-questions>
[^7]: Baeldung :: Producer-Consumer Problem With Example in Java <https://www.baeldung.com/java-producer-consumer-problem>
[^8]: Velog :: Java 의 Generics(5) - 사용 방식 <https://velog.io/@yhlee9753/Java-%EC%9D%98-Generics5-%EC%82%AC%EC%9A%A9-%EB%B0%A9%EC%8B%9D>
