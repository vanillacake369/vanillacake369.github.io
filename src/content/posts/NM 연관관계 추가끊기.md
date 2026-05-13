---
title: "N:M 연관관계 추가&끊기"
description: ""
date: 2024-01-30
tags: [Java]
category: uncategorized
lang: ko
draft: false
---

# Entity

![](/images/notion/7169b13d0dc2383f.png)

## Post

![](/images/notion/11628c6b7dfde8a9.png)

## PostHobby

![](/images/notion/743c44704188772d.png)

## Hobby

![](/images/notion/2dd4fbac30998d78.png)

### ManyToOne :: optional

FK에 `not null 제약조건` 여부를 지정할 수 있다.

```java
// Car Entity
@ManyToOne(optional = false) // true가 기본값
private User user;

// User Entity
@OneToMany(mappedBy = "user")
private List<Car> cars;
```

`optional = false`로 설정되어 있으면, FK에 not null 제약조건이 걸린 DDL이 발생한다.

[https://velog.io/@314_dev/ManyToOne-JoinColumn](https://velog.io/@314_dev/ManyToOne-JoinColumn)

## Hobby 추가

1. 추가하고자 하는 인스턴스를 args로 받음
2. 주어진 Post와 Hobby에 대한 PostHobby 인스턴스 생성
3. Hobby의 PostHobby 리스트에 생성한 PostHobby 인스턴스 추가
4. Post의 PostHobby 리스트에 생성한 PostHobby 인스턴스 추가



## Hobby 끊기

1. 지우고자 하는 인스턴스를 args로 받음
2. 주어진 Post와 Hobby에 대한 PostHobby 인스턴스 삭제
3. Hobby의 PostHobby 리스트에서 생성한 PostHobby 인스턴스 삭제
4. Post의 PostHobby 리스트에서 생성한 PostHobby 인스턴스 삭제
