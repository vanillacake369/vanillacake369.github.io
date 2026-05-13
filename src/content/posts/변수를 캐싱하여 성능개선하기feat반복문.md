---
title: "변수를 캐싱하여 성능개선하기(feat.반복문)"
description: "변수를 캐싱하면 호출을 줄일 수 있다고??"
date: 2024-04-07
tags: [반복문개선, 변수캐싱, 자바성능튜닝이야기]
category: uncategorized
lang: ko
draft: false
---

![](/images/velog/0317730064a920ff.png)


# Intro

---

최근 기업과제를 수행하며 “잘못 구현된 부분이 있을까?” 하고 돌아보던 중, REGEX 에 대한 Pattern 객체를 적용 시, 성능적인 Degration 을 체감했던 순간이 있었다.

이번 포스트에서는 “자바 성능 튜닝 이야기” 를 기반으로 변수 캐싱을 통해 성능개선할 수 있는 방법에 대해 기술해보고자 한다.

# TL;DR

---
> **이 글의 무엇보다도, Stream 이 언제나 빠른 것이 아니라는 것을 강조하고 싶어서 서두에 이렇게 적는다.**
> **스트림은 주요 목적은 성능을 극대화하고자 사용하는 게 아니다는 것을 알았으면 좋겠다.**

- loop 은 target logic 과 loop 를 위한 logic 이 있다. target logic 과 관련없다면 캐싱을 해두자.
    
    ```java
    
    // ❌
    for (int loop = 0; loop < list.size(); loop++){ // <- loop 를 위한 logic
    		callTargetLogic();                          // <- target logic 
    }
    
    // ✅
    int listSize = list.size();
    for (int loop = 0; loop < listSize; loop++){    // <- loop 를 위한 logic 
    		callTargetLogic();                          // <- target logic 
    }
    ```
    
- target logic 에서 동일한 생성자 및 변환을 수행 중이라면 캐싱처리를 하자.
    
    ```java
    // ❌
    for (int i=0; i< treeSet2.size(); i++) {
        DataVO2 data2 = (DataVO2)treeSet2.toArray()[i];
        ...
    }
    
    // ✅
    DataVO2[] dataVO2 = (DataVO2)treeSet2.toArray();
    int treeSetSize = treeSet2.size();
    for (int i=0; i< treeSetSize; i++) {
        DataVO2 data2 = dataVO2[i];
        ...
    }
    ```
    
- Regex 에 대한 Pattern 객체를 사용할 때는 Pattern 객체를 캐싱하도록 하자.
    
    ```java
    // ❌
    // 매 호출마다 Pattern 인스턴스를 생성한다.
    public class ValidNickNameValidator implements ConstraintValidator<ValidNickName, String> {
    
        private final static String NICK_NAME_REGEX = "(?!^\\d+$)^.+$";
    
        @Override
        public boolean isValid(String value, ConstraintValidatorContext context) {
            return Pattern.matches(NICK_NAME_REGEX, value);
        }
    }
    
    ✅
    public class ValidNickNameValidator implements ConstraintValidator<ValidNickName, String> {
    
        private final static Pattern NICK_NAME_REGEX = Pattern.compile("(?!^\\d+$)^.+$");
    
        @Override
        public boolean isValid(String value, ConstraintValidatorContext context) {
            return NICK_NAME_REGEX.matcher(value).matches();
        }
    }
    ```
    

# loop 의 target logic 과 관련없다면 캐싱을 해두자.

---

책에서 나와있는 내용을 그대로 인용하고자 한다.

매 번 반복하는 loop 문에서 메서드 호출을 최대한 자제하자.

이게 무슨 말이냐

아래와 같은 구현을 하지말라는 것이다

```java
for (int i=0; i< treeSet2.size(); i++) { ,,, }
```

아래와 같이 처리하여 변수를 통해 캐싱처리를 하여 불필요한 호출을 줄이자.

```java
int listSize = list.size();
for (int loop = 0; loop < listSize; loop++){ ,,, }
```

# target logic 동일한 생성자 및 변환을 수행 중이라면 캐싱처리를 하자.

---

loop 를 통해 처리되어야할 비즈니스 로직을 target logic 이라고 하는데,

이 target logic 을 실행할 때마다 불필요한 생성자 및 변환을 호출하는 경우가 있다.

이 때, 동일한 logic 수행임에도 생성자 및 변환로직을 계속 호출하여 heap 에 계속 참조값이 쌓이게 된다.

```java
// ❌
for (int i=0; i< treeSet2.size(); i++) {
    DataVO2 data2 = (DataVO2)treeSet2.toArray()[i];
    ...
}
```

아래와 같이 바꿔주어 불필요한 생성자 및 변환로직을 최소화할 수 있다.

```java
// ✅
DataVO2[] dataVO2 = (DataVO2)treeSet2.toArray();
int treeSetSize = treeSet2.size();
for (int i=0; i< treeSetSize; i++) {
    DataVO2 data2 = dataVO2[i];
    ...
}
```

# +) Pattern 사용 시 Pattern 객체를 캐싱처리 하자

---

String.matches() 를 호출, Pattern.matches() 를 호출하는 모두의 경우에서 Pattern 인스턴스를 생성한다.

즉, 내부적으로 생성자를 호출한다.

```java
// String
public boolean matches(String regex) {
    return Pattern.matches(regex, this);
}

// Pattern
public static boolean matches(String regex, CharSequence input) {
    Pattern p = Pattern.compile(regex);
    Matcher m = p.matcher(input);
    return m.matches();
}
```

따라서 Validator 를 처리하기 위해 아래와 같이 String.matches() 혹은 Pattern.matches() 를 사용하는 것은 안티 패턴이다.

```java
// ❌
// 매 호출마다 Pattern 인스턴스를 생성한다.
public class ValidNickNameValidator implements ConstraintValidator<ValidNickName, String> {

    private final static String NICK_NAME_REGEX = "(?!^\\d+$)^.+$";

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        return Pattern.matches(NICK_NAME_REGEX, value);
    }
}
```

1) Pattern 을 캐싱하여 재사용하거나 2) 싱글톤 인스턴스로 만들어두거나 3) 불변객체로 지정해두도록하자.

아무래도 1번 처리 방법을 간단하게 구현하여 적용해주는 게 편하다.

```java
// ✅
public class ValidNickNameValidator implements ConstraintValidator<ValidNickName, String> {

    private final static Pattern NICK_NAME_REGEX = Pattern.compile("(?!^\\d+$)^.+$");

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        return NICK_NAME_REGEX.matcher(value).matches();
    }
}
```

# +) 과연 Stream 은 빠를까

---

이 주제는 이 포스트의 코어와 벗어나므로 따로 포스트를 분리하였다.

아래를 참고하자.

[Stream is not superior than for loops](https://www.notion.so/Stream-is-not-superior-than-for-loops-6e28630b26dd4e54a02b85db091a6f16?pvs=21)
