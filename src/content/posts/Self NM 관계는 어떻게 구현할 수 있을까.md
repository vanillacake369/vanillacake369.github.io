---
title: "Self N:M 관계는 어떻게 구현할 수 있을까??"
description: ""
date: 2024-01-30
tags: [Java]
category: uncategorized
lang: ko
draft: false
---

# Why(What For?) 🤷‍♂️

---

> **“Context”**

# What(What should I know?) 👇

---

> A와 B 간의 N:M 관계가 아니라 A와 A 간의 N:M 관계라서 중간테이블을 사용하는 방식으로 접근하면 안 될 지 않을까?

정답이다.

보통은 엔티티 A, 엔티티 B 간의 다대다 연관관계는 아래와 같이 구현한다.

<details>
<summary>n명의 고객이 m개의 상품을 선택한다.</summary>

```java
@Entity
public class Member {

    @Id
    @Column(name = "MEMBER_ID")
    private Long id;

	// 연결 테이블(MEMBER_PRODUCT)쪽이 외래키를 갖고있기 때문에, 연결 테이블이 연관관계의 주인이다.
    @OneToMany(mappedBy = "member")
    private List<MemberProduct> memberProducts = new ArrayList<>();

    @Column(name = "USERNAME")
    private String username;

    // Getter, Setter, Constructor

}
```

**Produdct 클래스**

```java
@Entity
public class Product {

    @Id
    @Column(name = "PRODUCT_ID")
    private Long id;

    @Column(name = "NAME")
    private String name;

    // Getter, Setter, Constructor
}
```

**MemberProduct 클래스 (****`다대다`**** 에서 연결 테이블)**

```java
@Table(name = "ORDERS")
@Entity
public class MemberProduct {

    @Id
    @Column(name = "ORDER_ID")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "MEMBER_ID")
    private Member member;

    @ManyToOne
    @JoinColumn(name = "PRODUCT_ID")
    private Product product;

    @Column(name = "ORDERAMOUNT")
    private Integer orderAmount;

    @Column(name = "ORDERDATE")
    private LocalDateTime orderDate;

    // Getter, Setter, Constructor
}
```
</details>

[https://velog.io/@yuseogi0218/JPA-다대다-연관관계](https://velog.io/@yuseogi0218/JPA-다대다-연관관계)


그렇다면 하나의 중간테이블을 사용하여 A와 A간의 다대다 관계는 어떻게 구현할까??’

아래 핵심사항을 지켜가며 구현하자.

- 중간테이블에 `ManyToOne`을 두 개 지정한다.
- A엔티티에 `OneToMany` 를 통해 중간테이블의 외래키값을 mapping 한다.

[https://stackoverflow.com/questions/63383801/hibernate-self-referencing-manytomany-join-into-single-list-with-annotations](https://stackoverflow.com/questions/63383801/hibernate-self-referencing-manytomany-join-into-single-list-with-annotations)

**주인이 뭔지 모르겠다면,,?


이제 실제로 구현을 해보자!


# How(How to apply to code?) ✍️

---

회원 엔티티

```java
@Getter
@Entity
@Table(name="client")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Client extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_pk")
    private Long id;

    private String email;

    private String name;

    @Column(name = "phone_num")
    private String phoneNum;

    // client_img 외래키
    private Long img;

    private String studentId;

    // 제외 옵션 선택 여부
    @Column(name = "has_exclude_acquaintance")
    private Boolean hasExcludeAcquaintance;

    /* connection */
    @OneToMany(mappedBy = "maleMatcher")
    List<Connection> maleConnections;

    @OneToMany(mappedBy = "femaleMatcher")
    List<Connection> femaleConnections;

    /* chat */
    @OneToMany(mappedBy = "sender")
    List<Chat> sentChats;

    @OneToMany(mappedBy = "receiver")
    List<Chat> recvChats;

    /* exlusion */
    @OneToMany(mappedBy = "excludeInitClient")
    List<Exclusion> excludeInits;

    @OneToMany(mappedBy = "excludeTargetClient")
    List<Exclusion> excludeTargets;

    @Override
    public String
    toString() {
        return "Client{" +
                "id=" + id +
                ", email='" + email + '\'' +
                ", name='" + name + '\'' +
                ", phoneNum='" + phoneNum + '\'' +
                ", img=" + img +
                ", studentId='" + studentId + '\'' +
                ", hasExcludeAcquaintance=" + hasExcludeAcquaintance +
                '}';
    }

    @Builder
    private Client(Long id, String email, String name, String phoneNum, Long img, String studentId, Boolean hasExcludeAcquaintance) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.phoneNum = phoneNum;
        this.img = img;
        this.studentId = studentId;
        this.hasExcludeAcquaintance = hasExcludeAcquaintance;
    }
}
```

매칭(연결) 엔티티

```java
package com.example.dateanu.domain.connection;

import com.example.dateanu.domain.BaseEntity;
import com.example.dateanu.domain.client.Client;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "connection")
public class Connection extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_pk")
    private Long id;

    @ManyToOne
    @JsonIgnore
    @JoinColumn(name = "male_client_id")
    Client maleMatcher;

    @ManyToOne
    @JsonIgnore
    @JoinColumn(name = "female_client_id")
    Client femaleMatcher;

    @Builder
    private Connection(Long id, Client maleMatcher, Client femaleMatcher) {
        this.id = id;
        this.maleMatcher = maleMatcher;
        this.femaleMatcher = femaleMatcher;
    }
}
```


실제로 잘 작동하는 것을 알 수 있었다.

다만, 지난 10월 원티드 MySQL세션에서 나와 비슷한 어플을 만드시는 분이 계셨는데, 
매칭 시도와 연결을 인메모리DB인 Redis에 넣고, 세션값으로 유지하게끔 하는 설계하셨다 하였다.
이렇게 하면 회원 간의 다대다 관계를 직접적으로 RDB에 넣지 않아도 되지 않을까 싶기도 하다.
