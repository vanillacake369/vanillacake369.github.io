---
title: "ERROR : DB 테스트 코드 실행 시 DB 연결이 안 되는 경우"
description: "레포지토리를 통한 데이터를 삽입 테스트를 작성하고 돌려보니 DB에 접속할 수 없고, 어느 곳에서인가 DB를 사용하고 있다는 동일한 오류가 반복되었다."
date: 2026-02-25
tags: [java]
category: uncategorized
lang: ko
draft: false
---

## 무엇을 공부하였는가 🤔

---

레포지토리를 통한 데이터를 삽입 테스트를 작성하고 돌려보니 DB에 접속할 수 없고, 어느 곳에서인가 DB를 사용하고 있다는 동일한 오류가 반복되었다.

```java
Caused by: org.h2.mvstore.MVStoreException: The file is locked
```


`@Autowired`문제인가 싶었지만, 그게 아니었다.
찾아보니 여러 프로세스에서 DB에 동시에 접근할 때 발행하는 오류라고 한다. 따라서 추가 설정을 해주면 두 개의 프로세스에서 동시 접근이 가능하다고 한다.

> 아마도 App은 돌려놓고 Test를 추가로 돌리려 하다보니 lock이 걸려있던 것 같다.

`application.properties`

```java
datasource:
#    url: jdbc:h2:file:~/test
url: jdbc:h2:~/test;AUTO_SERVER=true
username: sa
driver-class-name: org.h2.Driver
```

## 요약 💁

---

- 에러코드는 자세히 잘 읽자~~
- H2 DB에 대해 여러 프로세스 접근 시, 추가 설정이 필요하다.

## 레퍼런스 🔍

---

[https://www.donnert.net/94](https://www.donnert.net/94)
[https://junior-datalist.tistory.com/264?category=911489](https://junior-datalist.tistory.com/264?category=911489)
