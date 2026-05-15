---
description: "utils 클래스에서 클래스 레벨 메서드를 작성하기 위해 다음을 신경써주었다."
date: 2026-02-25
tags: [java]
lang: ko
draft: false
---

# Why?

utils 클래스에서 클래스 레벨 메서드를 작성하기 위해 다음을 신경써주었다.

- static : 클래스 레벨에서 접근
- final : 더 이상 재정의 불가하게끔 제한

다음과 같이 작성해주었는데 final 키워드를 제거하는게 어때?

라며 intellij가 추천을 해줬다.

![](/images/notion/135212a013bccead.png)

아니, 하위 클래스에서 변경하지 말라고 일부러 명시해놓은건데 왜 불필요하는 거지??

싶어 찾아보았다.

# What?

## Static Method 단점 :: Hiding 🫣

> **static method는 하위 클래스에서도 redefine이 가능하다.**

### Overriding for a instance method

만약, 인스턴스 메서드 (static이 아닌 메서드)를 재정의하게 되면, — 여기서 내가 말하고자하는 재정의는 override를 의미하는 재정의가 아니라, 말 그대로 re-write code를 뜻하는 재정의이다 — JVM은 run time에서 해당 인스턴스를 찾아, 인스턴스의 메서드를 호출한다.

```java
class Foo {
    public void instanceMethod() {
        System.out.println("instanceMethod() in Foo");
    }
}

class Bar extends Foo {
    public void instanceMethod() {
        System.out.println("instanceMethod() in Bar");
    }
}

// Foo f = new Bar();
// f.instanceMethod(); => Bar의 인스턴스 메소드 호출
```

### Hiding for a class method

반면, 클래스 메서드(static 메서드)를 재정의하게되면,
— 여기서 내가 말하고자하는 재정의는 override를 의미하는 재정의가 아니라, 말 그대로 re-write code를 뜻하는 재정의이다 —
JVM은 compile time에서 레퍼런스(참조변수)의 type을 찾아 그 type에서의 메서드를 호출한다. 즉, 내가 인스턴스를 통해 클래스 레벨에 덮어쓰우려고 한 코드가 hide 된 것을 볼 수 있다.

```java
class Foo {
    public static void classMethod() {
        System.out.println("classMethod() in Foo");
    }
}

class Bar extends Foo {
    public static void classMethod() {
        System.out.println("classMethod() in Bar");
    }
}

// Foo f = new Bar();
// f.classMethod(); => Foo 클래스 메서드 호출
// Bar.classMethod(); => Bar 클래스 메서드 호출
```

[https://stackoverflow.com/questions/1743715/behaviour-of-final-static-method](https://stackoverflow.com/questions/1743715/behaviour-of-final-static-method)[^1]
[https://coderanch.com/wiki/659959/Overriding-Hiding](https://coderanch.com/wiki/659959/Overriding-Hiding)[^2]

## static method 호출 시 이렇게 해라! 📣

static method는 class method이다. 따라서 이를 호출할 때, 클래스 메서드에 대한 의도를 명시해주는 게 good practice이다.

```java
// avoid this ❌
f.classMethod();

//instead,, ✅
Foo.classMethod();
Bar.classMethod();
```

## static method 설계/구현 가이드라인 📐

> 혹자는 static method가 hidden 되는 것을 방지하기 위해, final을 붙이는 건 good practice라 한다.

- 만약 redefine을 원치 않는다면 — 되도록 하지 말아야 한다 — final을 통해 컴파일에러를 불러일으키는 건 good practice이다.
- utils에서는 상속을 통한 확장은 지양해라
- static method를 호출할 때는 무조건 클래스를 명시해주어라
- 하위 클래스에서 redefine을 금하라

[https://stackoverflow.com/questions/1932399/is-it-a-bad-idea-to-declare-a-final-static-method](https://stackoverflow.com/questions/1932399/is-it-a-bad-idea-to-declare-a-final-static-method)[^3]

## 그럼,,,나는?? 🤔

> 일단 질문에 한 번 올려봐야겠다.

static method에 final 키워드를 붙이는 것은 good practice 일까, bad practice 일까?

# How?

어떻게 쓰나요?

## Math 클래스에서는 이렇게 활용된다. 🔢

- `public final class` 로 선언하고
- 생성자를 `private` 으로 막아두고
- 메서드는 그냥 `static` 으로만 선언

```java
public final class Math {

    /**
     * Don't let anyone instantiate this class.
     */
    private Math() {}
		,,,

    @IntrinsicCandidate
    public static double sin(double a) {
        return StrictMath.sin(a); // default impl. delegates to StrictMath
    }
}
```

## 나는 이렇게 활용해본다. ✍️

> static method를 사용하는 경우는 웬만하면 utils이거나 여러 인스턴스가 공통적으로 사용하는 로직을 선언하는 경우가 많았다.

- 중요한 건 확장을 제한하냐 마느냐를 상황에 맞게 정하고
- 재정의가 되지 않도록 final 키워드를 붙이자.

```java
public class UserDtoValidator{
		private UserDtoValidator(){}
		public static final void validateSomething(UserDto userDto){
				// ,,,
		}
}
```

[^1]: <https://stackoverflow.com/questions/1743715/behaviour-of-final-static-method>

[^2]: <https://coderanch.com/wiki/659959/Overriding-Hiding>

[^3]: <https://stackoverflow.com/questions/1932399/is-it-a-bad-idea-to-declare-a-final-static-method>

[^4]: <https://docs.oracle.com/javase/tutorial/java/IandI/override.html>

[^5]: <https://docs.oracle.com/javase/specs/jls/se17/html/jls-8.html#jls-8.4.8>
