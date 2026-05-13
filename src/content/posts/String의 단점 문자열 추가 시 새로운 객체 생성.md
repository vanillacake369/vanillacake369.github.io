---
title: "String의 단점 :: 문자열 추가 시 새로운 객체 생성"
description: "String은 문자열을 추가할 때마다 String객체를 생성해 메모리에 쌓는다."
date: 2026-02-25
tags: [java]
category: uncategorized
lang: ko
draft: false
---

## 무엇을 공부하였는가 🤔

---

### 문자열 추가 시 새로운 객체 생성

String은 문자열을 추가할 때마다 String객체를 생성해 메모리에 쌓는다. 이러한 단점이 존재하므로 반복문을 통해 문자열을 추가해야하는 케이스에는 StringBuilder를 사용하는 것이 좋다.

### StringBuffer / StringBuilder

StringBuffer / StringBuilder는 문자열 추가 시, 버퍼에 저장해놓는다.
이후 toString()을 통해 문자열을 꺼낼 때, 버퍼에 저장된 문자열들을 토대로 String객체를 생성한다.

> StringBuffer

공식문서에도 나와있듯이 멀티스레딩 시에는 StringBuffer를, 싱글스레드 사용 시에는 StringBuilder를 사용하자.

## 어떻게 쓰는가 ☝️

---

### StringBuilder

```java
StringBuilder sbSql
    = new StringBuilder("Insert Into Users (name, email, pass, address)");
 
sbSql.append(" values ('").append(user.getName());
sbSql.append("', '").append(user.getEmail());
sbSql.append("', '").append(user.getPass());
sbSql.append("', '").append(user.getAddress());
sbSql.append("')");
 
String sql = sbSql.toString();
```

### StringBuffer

```java
StringBuffer sbSql
    = new StringBuffer("Insert Into Users (name, email, pass, address)");
 
sbSql.append(" values ('").append(user.getName());
sbSql.append("', '").append(user.getEmail());
sbSql.append("', '").append(user.getPass());
sbSql.append("', '").append(user.getAddress());
sbSql.append("')");
 
String sql = sbSql.toString();
```

## 왜 쓰는가 ❓

---

**String에 대한 문자열 추가(Concatenation) 작업 시 메모리 누수를 막기 위함**

## 레퍼런스 🔍

---

[https://www.codejava.net/java-core/the-java-language/why-use-stringbuffer-and-stringbuilder-in-java](https://www.codejava.net/java-core/the-java-language/why-use-stringbuffer-and-stringbuilder-in-java)
[https://docs.oracle.com/javase/7/docs/api/java/lang/StringBuilder.html](https://docs.oracle.com/javase/7/docs/api/java/lang/StringBuilder.html)
[https://docs.oracle.com/javase/7/docs/api/java/lang/StringBuffer.html](https://docs.oracle.com/javase/7/docs/api/java/lang/StringBuffer.html)
