---
title: "JSON Serialize with Jackson 과정 "
description: "Jackson can be used to automatically serialize this class to JSON so that it can, for example, be sent over the network to another service that may..."
date: 2026-02-25
tags: [java]
category: uncategorized
lang: ko
draft: false
---

# Why(What For?) 🤷‍♂️

---

> JSON Serialize 에 대해 알아보고, 이에 대한 주의점을 살펴보자.

# What(What should I know?) 👇

---

> 사실상 제일 하단에 적어둔 레퍼런스를 옮겨놓은 것 밖에 없다. 레퍼런스에 모든 내용이 들어있으니 뻘짓 말고 들어가서 보자.

```java
public class Person {
    private final String firstName;
    private final String lastName;
    private final int age;

    public Person(String firstName, String lastName, int age) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.age = age;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public int getAge() {
        return age;
    }
}
```

Jackson can be used to automatically serialize this class to JSON so that it can, for example, be sent over the network to another service that may or may not be implemented in Java and that can receive JSON-formatted data.
You can set up this serialization with a very simple bit of code, as follows:

```java
var grant = new Person("Grant", "Hughes", 19);

var mapper = new ObjectMapper();
try {
    var json = mapper.writeValueAsString(grant);
    System.out.println(json);
} catch (JsonProcessingException e) {
    e.printStackTrace();
}
```

This code produces the following simple output:
`{"firstName":"Grant","lastName":"Hughes","age":19}`
The key to this code is the Jackson `ObjectMapper` class. This class has two minor wrinkles that you should know about.

- Jackson 2 supports Java 7 as the baseline version.
- `ObjectMapper` expects getter (and setter, for deserialization) methods for *all* fields.

## 주의점

> `ObjectMapper` expects getter (and setter, for deserialization) methods for *all* fields.

그렇다. 
만약 필드값으로 다른 도메인에 인스턴스가 들어있다면
해당 인스턴스 내에 있는 필드들 또한 접근을 하게 된다.
따라서 Serialize 대상 엔티티나 다른 도메인 엔티티 내부의 필드값들이 어떤 것들이 있는지 주의해야한다.

# Reference 📖

---

[https://blogs.oracle.com/javamagazine/post/java-json-serialization-jackson](https://blogs.oracle.com/javamagazine/post/java-json-serialization-jackson)
