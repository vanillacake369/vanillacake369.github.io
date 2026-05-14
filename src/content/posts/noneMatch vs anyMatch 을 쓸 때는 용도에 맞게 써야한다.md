---
title: "noneMatch vs anyMatch 을 쓸 때는 용도에 맞게 써야한다 !"
description: "Stream의 noneMatch와 anyMatch는 의미가 다르다. 중복 검증 로직에서 잘못 사용하면 테스트가 통과하지 않는 이유를 분석한다."
date: 2026-02-25
tags: [java]
lang: ko
draft: false
---

# Why(What For?) 🤷‍♂️


> 이미 좋아요한 상품에 대해 좋아요 기능을 중복해서 요청하게 되는 경우를 막기 위해 아래와 같은 코드를 구현하였다.

```java
@Transactional
public void likeProduct(User user, Long productId) {
    Product product = getProductBy(productId);
    boolean hasNotLikedThisProduct = user.getLikeProducts().stream()
        .anyMatch(likeProduct -> !likeProduct.getProduct().equals(product));
    if (hasNotLikedThisProduct) {
        user.addLikeProduct(product);
    }
}
```

> 위 코드는 통과되지 않는다.

왤까?

# What(What should I know?) 👇


> 아래 보다싶이 차이점이 극명하다.

![](/images/notion/222b03efaea53a29.png)
![](/images/notion/bb92290e8b8a2495.png)

# How(How to apply to code?) ✍️


> 이를 통해 아래와 같이 고쳤더니 통과되는 모습을 볼 수 있었다 🙆‍♂️

![](/images/notion/b0d24f0d701b7a5c.png)
