---
title: "ERROR : Transactional을 붙였을 때만 테스트가 통과된다??"
description: "카페 키오스크 시스템에서의 아래와 같은 프로세스의 케이스가 있다."
date: 2026-02-25
tags: [java]
lang: ko
draft: false
---

# Episode 📜


카페 키오스크 시스템에서의 아래와 같은 프로세스의 케이스가 있다.

1.

상품
2.

상품 재고
3.

주문요청
4.

주문만큼 상품 재고 삭감

위를 상세하게 구현한다면 아래와 같이 구현할 수 있을 것이다.

1.

상품들을 생성 / 저장
2.

상품들의 재고 생성 / 저장
3.

주문요청 인스턴스를 생성한다.
4.

주문요청 서비스의 주문요청을 수행한다.
5.

주문요청만큼 재고가 감소한다.

이에 대해서 아래와 같은 테스트 케이스를 테스트 해보려고 하였다.

> // GIVEN

여기서 문제가 발생했다.
**Transactional을 붙였을 때만 테스트가 통과된다는 것이다.**

각 테스트 케이스 별로 롤백을 하기 위해서, 각 케이스 별로 롤백해주는 tearDown 메소드를 사용했다.

```java
@AfterEach
void tearDown() {
    orderProductRepository.deleteAllInBatch();
    productRepository.deleteAllInBatch();
    orderRepository.deleteAllInBatch();
    stockRepository.deleteAllInBatch();
}
```

> delete()는 각 데이터 별로 쿼리를 날리고, deleteAllInBatch()는 한 번의 쿼리로 모든 데이터를 롤백하기 때문에 이를 사용해주었다.

**아니, Transactional 또한 롤백을 해주는 친구로 알고 있는데**
**무슨 차이점이 있길래 Transactional 만 테스트케이스가 통과될까??**

# Reason of Err🤷‍♂️


## 문제는, 테스트가 아니다.

> **진짜 문제는 Service에서 ****`@Transactional`****을 안 붙였기 때문이었다.**

```java
@Service
@RequiredArgsConstructor
public class OrderService {
	  ...
}
```

서비스 단의 데이터 변경에 있어서 `@Transactional`사용을 해주어야 한다.
`@Transcational`을 사용해서** 영속성 컨텍스트를 활용하도록 설정해야 하기 때문**이다.

또한, 데이터를 가져오기만 하는 곳은 `@Transcational(readonly = true)`를 사용해서 약간의 성능 이점을 가질 수 있도록 할 수 있다.

## 그렇다면 테스트에만 트랜잭션을 붙였다고 통과가 되는 이유는 무엇인가??

아래 예제를 통해 들여다 보자.

아래에서, 서비스 단에 DB를 사용하는 메소드에서 트랜잭션 사용하는 걸 추가하지 않았고, 테스트 코드 단에서만 트랜잭션을 붙여주었다.

하지만 정상 작동한다.

왤까?

```java
@Service
@RequiredArgsConstructor
public class UserService {

    /* ... */

//    @Transactional
    public User orderAsLazyLoading(Long userId, String item) {
        User findUser = loadById(userId);

        Orders orders = new Orders(item);
        orders.addUser(findUser);
        orderRepository.save(orders);

        return findUser;
    }

}
```
```java
@SpringBootTest
class UserServiceTest {

    /* ... */

    @Test
    @Transactional
    void orderAsLazyLoadingTest() {
        User orderedUser = userService.orderAsLazyLoading(setUpUser.getId(), "sample-item");

        List<Orders> ordersList = orderedUser.getOrdersList();
        for (Orders orders : ordersList) {
            System.out.println("order = " + orders);
        }
    }

}
```

- `@Transactional`을 사용 중인 테스트 메서드에서 `userService`가 호출되고 있으므로, 동일한 트랜잭션에 속하기 때문이다.
- 그러나 해당 코드를 실제 프로덕션에서 실행하면, 즉 테스트 코드에서 `@Transcactional`을 지우고 실행하면 `LazyInitializationException`가 발생한다.

이는 런타임 오류로, 서비스 동작 중에만 캐치할 수 있는 에러다.

[https://velog.io/@tmdgh0221/스프링-테스트-케이스에서의-Transactional-유의점](https://velog.io/@tmdgh0221/%EC%8A%A4%ED%94%84%EB%A7%81-%ED%85%8C%EC%8A%A4%ED%8A%B8-%EC%BC%80%EC%9D%B4%EC%8A%A4%EC%97%90%EC%84%9C%EC%9D%98-Transactional-%EC%9C%A0%EC%9D%98%EC%A0%90)
[Transactional 이 개 긑은 자식,,,, 😠](https://www.notion.so/b2a8bc7bcbf54540ae3b841cb2230eed#ca017517402e4769a2956c75b03dcdb8) 

# How to fix 🔧


서비스 단에 트랜잭션 어노테이션을 붙여주자 ^^
