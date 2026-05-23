---
description: "VO 와 DTO 를 혼용되어 사용되곤 하는데, 이는 엄연히 다르다. 무엇이 다른지 알아보자."
tags: [journal, java]
lang: ko
draft: false
---

# DTO

## What is DTO?? 📦

> 값들을 하나의 곳으로 모아서, 목적에 따라 인스턴스 간 주고받을 수 있게 포장되어지는 데이터셋
>
> It is a *Data Transfer Object,* i.e. the data aggregate object, sole purpose of which is to facilitate conveying data from the point A (the source) to the point B (destination).

## Why use DTO?? 🤔

> 목적에 따른 값을 추출해 A→B로 값을 옮기기 위함
>
> to convey data from point A (the source) to the point B (destination).

## When to use DTO?? 📋

> 어떤 반환값을 전달할 지에 따라 달려있다.

값이 어떤 값을 나타내어야 하는지에 따라 다르다.

> **it depends on what do you use response for; what representation of data do you need; what should be the capacity and purpose of the object in question, and etc..**
>
> 아래 두 가지 유형이 있겠다!
>
> 1.

여러 인스턴스로부터 값을 추출하여 다른 곳으로 리소싱할 때

> 2.

인스턴스로부터 값들을 추출한 뒤, 값을 깎아서 반환해야할 때

1.

When you want to **aggregate the data for your object from different [re]sources**, i.e. you want to put some *object transformation* logic between the Persistence Layer and the Business(or Web) Layer

    ![Untitled](https://prod-files-secure.s3.us-west-2.amazonaws.com/3db2b170-876f-457d-b66e-dd806b51bd64/86a5ba92-383d-4cf2-b5c7-58c0d6760503/Untitled.png)

2.

When you don't necessarily combine data received from different sources, but **you want to modify and customize the model instance, which you will be returning**

[DTO or not to DTO?](https://medium.com/javarevisited/dto-or-not-to-dto-58259d4228ec)

# VO

## What is VO?? 🧩

VO란 이렇게 도메인에서 한 개 또는 그 이상의 속성들을 묶어서 **특정 값을 나타내는** 객체이다.

> When programming, I often find it's useful to represent things as a compound.
> 👉 프로그래밍할 때, 사물을 복합물로 표현하는 것이 유용한 경우가 종종 있다.

A 2D coordinate consists of an x value and y value. An amount of money consists of a number and a currency. A date range consists of start and end dates, which themselves can be compounds of year, month, and day.
👉 예를 들면 x, y로 이루어진 2차원 좌표를 표현하거나, 숫자와 통화로 이루어진 금액, 시작 날짜와 끝 날짜로 이루어진 날짜 기간 등이 있다.

>

## Why use VO?? 🛡️

> To avoid "Primitive Obsession"

사용자가 값을 입력한다. 그런데, 사용자의 입력값은 언제나 어떤 특정한 목적성을 가진 값이다. 따라서 특정 값들은 동일한 캐릭터로서 , 즉 하나의 type으로서 보장받아야한다. 우리는 이것을 원시값으로 저장하면 안 되고, 원시값을 이용하여 그 캐릭터를 만들어주어야 한다.

```java
/** 사용자가 좌표값을 입력 **/

// 좌표인지, 좌표가 아닌 다른 값인지 구분할 수 있는가?
int x = 3; int y =5;

// 확실히 구분가능하다.
Point p = new Point(3,5);
```

## VO의 특징 세 가지 📌

판단에는 "어떤 공통된 성격의 원시값들을 살아있는 인스턴스로 만들어내는 작업" 이라고 판단된다.

왜냐하면 다음과 같은 특징이 있기 때문이다.

- **Value Equality : They are equal if their attributes are equal.**
  - **이 특성으로 인해, VO는 무조건 아래 두 함수를 Override 해주어야한다.**
    - **hashCode()**
    - **equals()**
- **Immutability : Once created, a value object should always be equal**
  - **이 특성으로 인해, VO는 setter를 제공해주면 안 된다.**
- \*\*Self-Validation : A value object must verify the validity of its attributes when being created.

If any of its attributes are invalid, then the object should not be created and an error or exception should be raised.** - **이 특성으로 인해, VO는 모든 입력값에 대한 검증함수를 작성해주어야 한다.\*\*

> 아래와 같이, 엔티티 내에서 일급 컬렉션과 같은 구조로 사용할 때 용이할 것 같다.

```java
public final class EmailAddress {
    private static final EmailValidator validator = EmailValidator.getInstance();
    private final String value;

    public EmailAddress(String value) {
        if (!validator.isValid(value)) {
            throw new InvalidEmailException();
        }
        this.value = value;
    }

    public EmailAddress change(String value) {
        return new EmailAddress(value);
    }

    @Override
    public String toString() {
        return value;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        EmailAddress that = (EmailAddress) o;
        return Objects.equals(value, that.value);
    }

    @Override
    public int hashCode() {
        return Objects.hash(value);
    }
}
```

## When to use VO?? 🎯

1.

값을 하나의 캐릭터로(타입으로) 사용하고자 할 때 ("Avoid primitive obsession")

    ```java
    // How can you identify the difference ??
    Double price;
    Double weight;
    Double height;

    // VO do validation, and won't ever change its value !!
    Price price;
    Weight weight;
    Height height;
    ```

2.

각 속성에 대한 equality를 강력하게 해야할 때 1.

멱등성(Value Equality) 과 불변성(Immutability)을 보장해주기 때문, 단 제대로 된 VO라면 이 두 가지를 지원해주어야만 한다. (즉, 구현 오버헤드가 존재함)

    ```java
    if(EmailAddress.equals(EmailAddress)){
    		,,,,
    }
    ```

3.

함수의 파라미터가 공통된 특성일 때 1.

추가로 VO를 사용하면, VO에게 검증기능이 있으므로 값입력과 타입 체킹 한 번에 가능함

    ```java
    /** Avoid this ❌ **/
    void sendEmail(String email, String subject, String body);
    // => sendEmail("Some subject", "Some content", "john@doe.com");
    // => 이렇게, 잘못된 입력값에 대해 검증을 못 하거나, 따로 해주어야하는 상황 발생

    /** Favor this ✅ **/
    1. sendEmail(EmailAddress recipient, Subject subject, Content content);
    2. sendEmail(Email email);
    ```

- [VO(Value Ojbect)란 무엇일까?](https://tecoble.techcourse.co.kr/post/2020-06-11-value-object/)

- [Value Objects to the rescue!](https://medium.com/swlh/value-objects-to-the-rescue-28c563ad97c6)

- [Do "avoid primitive obsession" and "use most abstract type as possible" contradict each other?](https://softwareengineering.stackexchange.com/questions/404768/do-avoid-primitive-obsession-and-use-most-abstract-type-as-possible-contradi)

- [Primitive obsession - why you should stop using int and string everywhere](https://www.reddit.com/r/csharp/comments/onbypx/primitive_obsession_why_you_should_stop_using_int/)

[^1]: DTO 는 레이어 간 데이터 이동을 목적으로 하며, 그 자체로는 어떤 비즈니스 로직도 포함하지 않는 단순 운반체다.
[^2]: VO 는 값 그 자체가 식별자 역할을 한다. 즉, 속성이 같으면 동일한 객체로 간주하므로 `equals`/`hashCode` 재정의가 필수다.
[^3]: VO 의 불변성(Immutability)은 값 변경 시 새 인스턴스를 반환하는 방식으로 구현한다. 이는 `String` 이 동작하는 방식과 동일하다.
[^4]: DTO 는 mutable 해도 무방하지만, VO 에 setter 를 두면 동일 참조가 여러 곳에서 예기치 않게 변경되어 불변 보장이 깨진다.
[^5]: "Primitive Obsession" 은 도메인 개념을 `int`, `String` 같은 원시 타입으로만 표현할 때 발생하는 코드 악취(code smell)로, VO 도입이 대표적인 해결책이다.
