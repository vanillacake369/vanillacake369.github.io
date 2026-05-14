---
title: "아이템 65. 리플렉션보다는 인터페이스를 사용하라(feat. Spring 에서의 리플렉션 활용)"
description: "리플렉션의 동작 원리와 단점을 살펴보고, 이펙티브 자바 아이템 65에서 인터페이스 사용을 권장하는 이유를 정리했다."
date: 2026-02-25
tags: [java]
lang: ko
draft: false
series: { id: "Effective Java", order: 5 }
---

# Why?

왜 쓰나요?

---

> Effective Java의 아이템 65에 대한 내용들을 정리함과 동시에 아래 내용들을 소개해보고자 한다.

# What?

뭘 배웠나요?

---

# 리플렉션이란?

![](/images/notion/fba3bf326a22af22.png)

> Reflection is a feature in the Java programming language. 
> **그렇다.

여기서 reflection과 introspect는 동일한 어원으로 쓰였다. **

[https://www.oracle.com/technical-resources/articles/java/javareflection.html](https://www.oracle.com/technical-resources/articles/java/javareflection.html)

## How reflection works

다음 정보들을 가져와서 런타임 시점에서 동적 바인딩을 이용한다.

- Class
- Constructor
- Method
- Field

![](/images/notion/a16e9150fbce8b84.png)
![](/images/notion/dcdbc8604e402ff2.png)
![](/images/notion/f300e0b237040ee4.png)
![](/images/notion/7dff56ca23685f15.png)

# 리플렉션의 단점?

- 동적 타잎 체킹이다 보니, 컴파일 타입 검사의 이점을 활용할 수가 없다.
- 엄청난 예외 검사를 해주어야 한다.
- 런타임 바인딩이므로 성능이 떨어진다.

# Effective java에서의 지향점

## 왜 인터페이스를 권장할까?

- 리플렉션을 대신해서 인터페이스를 쓰라는 것이 아니다.
- 리플렉션으로 생성된 인스턴스에 대해서 인터페이스로 참조하라는 것이다.
- 이렇게 함으로서 리플렉션에 따라 생성된 여러 종류의 클래스 타입의 인스턴스를 하나의 인터페이스 변수로 받을 수 있다.

```java
public class ReflectiveInstantiation {
    // 리플렉션으로 생성하고 인터페이스로 참조해 활용한다.

    // 명령줄 인수 예시1: java.util.HashSet apple banana
    // 명령줄 인수 예시2: java.util.TreeSet apple banana
    public static void main(String[] args) {
        // 클래스 이름을 Class 객체로 변환
        Class<? extends Set<String>> cl = null;
        try {
            cl = (Class<? extends Set<String>>)  // 비검사 형변환!
                    Class.forName(args[0]);
        } catch (ClassNotFoundException e) {
            fatalError("클래스를 찾을 수 없습니다.");
        }

        // 생성자를 얻는다.
        Constructor<? extends Set<String>> cons = null;
        try {
            cons = cl.getDeclaredConstructor();
        } catch (NoSuchMethodException e) {
            fatalError("매개변수 없는 생성자를 찾을 수 없습니다.");
        }

        // 집합의 인스턴스를 만든다.
        Set<String> s = null;
        try {
            s = cons.newInstance();
        } catch (IllegalAccessException e) {
            fatalError("생성자에 접근할 수 없습니다.");
        } catch (InstantiationException e) {
            fatalError("클래스를 인스턴스화할 수 없습니다.");
        } catch (InvocationTargetException e) {
            fatalError("생성자가 예외를 던졌습니다: " + e.getCause());
        } catch (ClassCastException e) {
            fatalError("Set을 구현하지 않은 클래스입니다.");
        }

        // 생성한 집합을 사용한다.
        s.addAll(Arrays.asList(args).subList(1, args.length));
        System.out.println(s);
    }

    private static void fatalError(String msg) {
        System.err.println(msg);
        System.exit(1);
    }
}
```

# Spring에서의 리플렉션 사용 :: DI

> 어떻게 리플렉션의 장점을 극대화??

필드 주입에 사용되는 객체인지 확인하기 위해, `@Inject`라는 어노테이션을 생성
런타임 시 참조해야하므로 `@Retention`어노테이션도 적용해줌

```java
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;

@Retention(RetentionPolicy.RUNTIME)
public @interface Inject {
}
```

## 동적 바인딩

`getObject` 메서드를 통해 classType 에 해당하는 타입의 객체 생성해줌
단, 해당 객체의 필드 중에 `@Inject` 어노테이션이 있다면 해당 필드도 같이 만들어 제공

```java
public class ContainerService {

	// 클래스 타입이 들어오면, 해당 클래스의 인스턴스를 리턴하도록 Generic 타입으로 정의함
    public static <T> T getObject(Class<T> classType) {
        T instance = createInstance(classType); // 리플렉션을 이용하여 인스턴스를 생성한다.
        Arrays.stream(classType.getDeclaredFields()).forEach(f -> { // 클래스 타입의 필드들을 확인하면서,
            if (f.getAnnotation(Inject.class) != null) { // 필드에 적용된 어노테이션이 @Inject 이면
                Object fieldInstance = createInstance(f.getType()); // 필드 타입에 맞는 클래스 인스턴스를 생성하고
                f.setAccessible(true); // 접근 지시자를 무시하도록 설정하고
                try {
                    f.set(instance, fieldInstance); // 해당 필드에 객체를 주입한다.
                } catch (IllegalAccessException e) {
                    throw new RuntimeException(e);
                }
            }
        });

        return instance;
    }

    private static <T> T createInstance(Class<T> classType) { // 리플렉션 이용-> 생성자를 만들어 리턴해준다.
        try {
            return classType.getConstructor(null).newInstance();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
```

[https://velog.io/@suyeon-jin/리플렉션-스프링의-DI는-어떻게-동작하는걸까](https://velog.io/@suyeon-jin/리플렉션-스프링의-DI는-어떻게-동작하는걸까)
