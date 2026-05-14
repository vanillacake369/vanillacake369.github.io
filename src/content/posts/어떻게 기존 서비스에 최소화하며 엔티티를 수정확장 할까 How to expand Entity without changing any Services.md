---
title: "어떻게 기존 서비스에 최소화하며 엔티티를 수정/확장 할까?? How to expand Entity without changing any Services??"
description: "만약 아래와 같은 엔티티가 있을 때 어떻게 해야할까?"
date: 2026-05-11
tags: [java]
lang: ko
draft: false
---

# Why(For What?)


> 공부하다 문뜩, 엔티티를 바꿔야 할 일이 생겼다.

# What (What should we know?)


만약 아래와 같은 엔티티가 있을 때 어떻게 해야할까?

```java
@SuperBuilder
@Data
@AllArgsConstructor //@RequiredArgsConstructor => not suitable for @Builder, since it only makes constructor for final field.
@NoArgsConstructor
@JsonIgnoreProperties(value = {"password"})
@JsonFilter("UserInfo")
public class User {
    private Integer id;
    @Size(min=2,message = "Name should be at least 2 words")
    private String name;
    @Past
    private Date joinDate;
    private String password;
    @Builder.Default
    private String ssn = null;
}

==================================================

@SuperBuilder
@Data
@AllArgsConstructor //@RequiredArgsConstructor => not suitable for @Builder, since it only makes constructor for final field.
@NoArgsConstructor
@JsonFilter("UserInfo2")
public class UserVersionTwo extends User{
    private String address;
}
```

챗지피티의 답변은 이러했다.

1.

상속을 사용할 수도 있다, 하지만 그 대신 컴포지션을 통해 복합 엔티티를 형성할 수 있다.
2.

데코레이터 패턴
3.

DTO를 통해 기존 엔티티 + 추가적인 필드를 받아라.
4.

엔티티를 확장할 때마다 버저닝을 해라

> **요컨대, 데코레이터 패턴을 사용하는 것이 이상적인 방식이다!!**

### Decorator Pattern?

[https://refactoring.guru/design-patterns/decorator](https://refactoring.guru/design-patterns/decorator)

> **Simply, “put interface between target system and entities”**

**Change This,,,,,**

![](/images/notion/981c1c5d467da286.png)

**To This,,,**

### 예시코드

유연한 코드 설계 강의를 들었을 때, DIP 강의 자료로 사용된 예시코드를 퍼왔다.
(nhn 유진호 개발자님,,, 감삼다,,)
[Untitled](https://www.notion.so/868cab235fe04c2e97025af9784cf568) 
`Bad Code ❌`

![](/images/notion/acc0e667d65e3dac.png)

```java
package com.wanted.preonboarding.clean.code.solid.dip;

public class PayService {
    SamsungPay samsungPay; // 의존 저수준 객체
		ApplyPay applyPay; // 의존 저수준 객체
		Payco payco; // 의존 저수준 객체
		Naverpay naverPay;

    public PayService(SamsungPay s, ApplyPay a, Payco p, Naverpay n){
        samsungPay = s;
        applyPay = a;
        payco = p;
				naverPay = n;
    }

    public void pay(String type, int toAmount){
				
        System.out.println("간편결제 서비스 호출");
				switch(type){
					case "samsung":
						if(samsungPay != null)
							samsungPay.pay(toAmount);
					break;
					case "apply":
						applyPay.pay(toAmount);
					break;
					case "payco":
						payco.pay(toAmount);
					break;
					case "naverpay":
						naverPay.pay(toAmount);
					break;
					default:
						throwsa NotfoundException("지원하지 않는 결제수단 입니다");
    }


}
```
```java
package com.wanted.preonboarding.clean.code.solid.dip;

public class SamsungPay {

    public boolean connect(){
        if(!auth())
            return false;
        // To Do Connection;
        return true;
    }
    private boolean auth(){
        return true;
    }
    public void pay(int amount){
        System.out.println("PAY");
    }
}
```

`Good Code ✔`

![](/images/notion/c8da06a28be46c8c.png)

```java
package com.wanted.preonboarding.clean.code.solid.dip;

public interface Payment {
    public boolean pay(int amount);
}
```
```java
package com.wanted.preonboarding.clean.code.solid.dip;

public class PayService {
    Payment payment; // 의존 저수준 객체

    public PayService(Payment p){ // 구현체 생성하고 결정할 때는 switch 써!
        payment = p;
    }

    public void pay(int toAmount){
        System.out.print("간편결제 서비스 호출");
        payment.pay(toAmount);
    }
}
```
```java
package com.wanted.preonboarding.clean.code.solid.dip;

public class SamsungPay implements Payment {

    public boolean connect(){
        if(!auth())
            return false;
        // To Do Connection;
        return true;
    }
    private boolean auth(){
        return true;
    }
    @Override
    public boolean pay(int amount){
        System.out.println("PAY");
        return true;
    }
}
```
