---
title: "하나의 트랜잭션 내에서 수정-삭제 쿼리와 Persistence Context와 Sync 맞추기"
description: "수정/삭제 는 굉장히 민감한 Query이다."
date: 2026-02-25
tags: [java]
lang: ko
draft: false
---

# 수정/삭제 쿼리와 Persistence Context의 연관관계??

수정/삭제 는 굉장히 민감한 Query이다.

데이터 값이 추가되는 것이 아닌 변경 혹은 삭제되기에 연관관계가 틀어지기 때문이다.

따라서 JPQL과 같이 쿼리를 직접 수행해주는 방법을 사용한다면 Persistence Context와 sync가 틀어지지 않는지 확인해보아야한다.

OneToMany와 같은 부모-자식 관계의 연관관계 같은 경우와 같이 말이다.
(이 경우에는 “무조건적으로” Persistence Context와 sync를 해주어야한다.)

그렇다면 어떻게 해주어야할까?

우선 deleteAll()의 단점과 delete에 대한 Hibernate Operation Order를 살펴본 뒤, 
어떻게 동기화를 시켜줄 수 있는지를 알아보도록 하자.

# 왜 기본 deleteAll()은 영속성 컨텍스트와 동기화 되지않을까??

SimpleJpaRepository.deleteAll() 뜯어보자.

내부적으로는 아래와 같이 동작된다.

![](/images/notion/2f1b7a062e1bc23f.png)

1.

일차적으로 `findAll()`을 통해 
2.

각 entity에 대하여 `delete()`를 수행한다.

뭔가 어색하지 않은가??
**그렇다. **
**기본적으로 제공되는 deleteAll()은 각각의 원소를 찾은 뒤, 각각의 원소 별로 delete()를 수행한다.**

1. **select문을 통해 각 값에 대한 n개의 엔티티를 찾은 뒤,**
2. **n개의 delete문이 수행된다.**

(실제로 수행되는 쿼리를 보면 아래와 같이 수행된다)

```sql
Hibernate: select ,,, from post p1_0 ,,, where p1_0.id=?
Hibernate: delete from post where id=?
Hibernate: select ,,, from post p1_0 ,,, where p1_0.id=?
Hibernate: delete from post where id=?
Hibernate: select ,,, from post p1_0 ,,, where p1_0.id=?
Hibernate: delete from post where id=?
Hibernate: select ,,, from post p1_0 ,,, where p1_0.id=?
Hibernate: delete from post where id=?

,,,
```

**이러한 이유로 벌크성 쿼리에서는 이 메소드를 지양하라는 코멘트가 많았다.**

> 그럼 어떻게 해야할까? 

# delete는 가장 마지막 순서로 실행된다

delete문을 그대로 복붙해와서 테스트 코드에 아래와 같이 붙여보았다.

이를 실행하면 어떻게 될까??

![](/images/notion/a274350ac3f2d5d5.png)
![](/images/notion/1dfdb2e744514432.png)

그렇다,,, delete문이 잘도 나간다,,

**그러나 ****함정****이 숨겨져있다.**
**잘 보면 afterEach로 붙여놓은 tearDown메소드에 들어서자마자 delete 쿼리가 수행된다.**

![](/images/notion/eab852b168a70a6e.png)
![](/images/notion/89561e11fe20b39f.png)

**그건 ****각 테스트메서드의 트랜잭션 종료 이후에 — flush() 마지막 순서에 — delete를 수행****하기 때문이다.**

**왜냐고??**
**이건 Hibernate의 쿼리 연산 순서가 그렇게 규정되어 있기 때문이다.**
이건 다다음 챕터인 [Hibernate Operation Order](https://www.notion.so/dde40f06c84a4a1cb6363cc7e5290ad6#4501f98f10524e2e9a5da70c07cb7b31)  에서 살펴보도록 할 것이다.

일단 flush()를 직접 호출하도록 코드를 수정하여, 
delete 쿼리가 트랜잭션 내에서 바로 나가는지 확인해보자!

# flush()를 직접 하여 delete가 바로 나가게끔 바꿔보자.

위 테스트 코드를 조금 수정해보았다.

아래와 같이, remove를 수행한 뒤, flush를 통해 연결한 db와 persistence context 간의 synchronize를 해주었다.

![](/images/notion/284b43cdbbfefb54.png)
![](/images/notion/0fa4cc23b1da8d62.png)

보이는가??

BeforeEach로 지정해둔 setUp 메서드를 통해 save()를 호출한 뒤, 바로 delete 쿼리를 수행하는 것이??

이를 통해 우리는 ***“한 트랜잭션 내부에서 delete쿼리에 대한 순서를 조작해주기 위해서는 flush()를 직접 해주는 것이 하나의 방법이구나” ***를 배웠다 ㅎㅎ
***그렇다면 왜 Hibernate는 flush()의 마지막순서에 delete를 수행하게끔 연산 순서를 규정하였을까??***

# Hibernate Operation Order

공신력 있는 소스를 보기 위해 공을 좀 들였다.

그러던 중, Hibernate Team의 일원인 [Vlad Mihalcea](https://vladmihalcea.com/)의 블로그를 통해 왜 Delete문이 늦게 수행되는지에 대한 글을 접할 수 있었다.

이 포스트 내에서는 Operation의 순서를 볼 수 있었다.

[https://vladmihalcea.com/hibernate-facts-knowing-flush-operations-order-matters/](https://vladmihalcea.com/hibernate-facts-knowing-flush-operations-order-matters/)

> Hibernate did not execute the `DELETE` first as we did in our test case.

It executed the `INSERT` statement first, and that’s why we get the `ConstraintviolationException`.

# 안전한 벌크성 쿼리 :: 영속성컨텍스트(1차 캐시)와 동기화해주기

> 2줄 요약

JPQL에서 @Query와 @Modifying을 통해서 벌크성 수정/삭제 쿼리를 작성해주자.

근데 벌크성 수정/삭제 쿼리를 사용하면 Persistence Context와 동기화가 되지 않는다.

그렇다면 어떻게 해주어야할까?
flush,clear 옵션을 지정해주면, 작업 이전,이후로 영속성 컨텍스트를 초기화해주거나 flush를 함으로서 
연산에 따른 결과를 동기화할 수 있다.

### **@Query**

### **@Modifying**

> **clearAutomatically**

![](/images/notion/9887269fae86c61d.png)

# 예제1 :: 다대다 관계 중간테이블 데이터 삭제

보통 다대다 관계는 중간테이블을 통해 일대다 관계를 사용하여 해결한다.

여기서 N:M 관계를 이어주는 중간조인 테이블의 데이터를 삭제하는 JPQL쿼리를 실행해보려 한다.

만약 FK키값이 날라가면 연관관계 또한 끊어져야 한다.

과연 그럴까???

이 프로세스에 대해 구현해주는 방법은 두 가지 방법이 있다.

1. **영속성 컨텍스트와 싱크를 맞추지 않는 JPQL 쿼리**
2. **영속성 컨텍스트와 싱크를 맞추는 JPQL 쿼리**

우선 첫번째 방법부터 보자.

만약 어떤 컨텍스트인지 상세하게 보고 싶다면 아래를 펼쳐보자.

<details>
<summary>예제에 사용되는 엔티티 관계</summary>

`ERD`

![](/images/notion/baa0867cd1c301c5.png)

**`Post`**

![](/images/notion/d9149b34d69b913f.png)

**`PostHobby`**

![](/images/notion/1c59636f36b5a853.png)

**`Hobby`**

![](/images/notion/0c5978087d817466.png)
</details>

## 영속성 컨텍스트와 싱크를 맞추지 않는 JPQL 쿼리

중간테이블에 대한 데이터 삭제 이후, 만약 영속성 컨텍스트와 동기화를 하지 않는다면, 
편의메소드를 호출하지 않았으므로 영속성 컨텍스트에는 아직 연관관계가 남아있을 것이고,
이에 따라 객체 그래프 탐색을 통해 남아있는 연관관계를 사용할 수 있을 것이다.
`JPQL쿼리`
`테스트메소드`

![](/images/notion/a5f02cac8fe3c095.png)

`테스트메소드 결과`

![](/images/notion/566ec569bc3c0e84.png)

그렇다.

영속성 컨텍스트와 DB가 동기화 되지 않아서 stream을 통해 `Post`엔티티와 연관관계에 있는 `Hobby `엔티티를 찾을 수 있고,
이로 인해 `hasBaseballInPost`와 `hasSoccerLeftInPost`값이 true로 되는 것이다.

## 영속성 컨텍스트와 싱크를 맞춘 JPQL 쿼리

중간테이블에 대한 데이터 삭제 이후, 만약 영속성 컨텍스트와 동기화를 한다면,
연관관계에 대한 엔티티를 영속성 컨텍스트에서 지워버릴 것이다.

이에 따라 객체 그래프 탐색을 통해 남아있는 연관관계는 사용할 수 없을 것이고,
역탐색이 불가능해질 것이다.
`JPQL쿼리`

![](/images/notion/7faa0de2cc7c1ad7.png)

`테스트 케이스`

![](/images/notion/6739c5b7dfca41c1.png)

`테스트 케이스 결과`

![](/images/notion/79f72afdfa8a4e9a.png)

의도한대로,  stream을 통해 `Post`엔티티와 연관관계에 있는 `Hobby `엔티티를 찾을 수 없게 되었다.

우리가 수행한 JPQL 연산결과와 Persistence Context가 동기화 되었기 때문이다.

이로 인해 `hasBaseballInPost`와 `hasSoccerLeftInPost`값이 false로 되는 것을 확인할 수 있다.

# If you think you need to `flush` the Persistence Context manually, think twice.

delete의 실행 순서를 변경하기 위해 **flush()를 명시적으로 호출하는 행동은 분명한 code smell**이다.

위에서 언급한 [Vlad Mihalcea](https://vladmihalcea.com/) 또한 *“차라리 update로 대체해라” *라고 권고하고 있다.

> Knowing the flush operation order is very important when using JPA and Hibernate.

Because Hibernate executes the SQL statements in a strict order, [JDBC batching](https://vladmihalcea.com/how-to-batch-insert-and-update-statements-with-hibernate/) can be applied automatically.

# Favor “`deleteAllInBatch()`” over `deleteAll()`

deleteAll()은 내부적으로 컬렉션을 순회하며 각 엔티티를 remove() 해주게끔 프로세싱한다.

반면, `deleteAllInBatch()`는 하나의 벌크성 쿼리 짜서 실행해주기 때문에 Performance 측면에서 상대적으로 효율적이다.

![](/images/notion/10ae369a5b0cd264.png)

> Both deleteAll() and deleteAllInBatch() use to delete all entities. 

[https://javatute.com/jpa/spring-data-jpa-deleteall-vs-deleteallinbatch/](https://javatute.com/jpa/spring-data-jpa-deleteall-vs-deleteallinbatch/)

# Reference 🔖

[https://w97ww.tistory.com/109](https://w97ww.tistory.com/109)
[https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/test/annotation/Rollback.html](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/test/annotation/Rollback.html)
[https://docs.jboss.org/hibernate/orm/6.1/userguide/html_single/Hibernate_User_Guide.html](https://docs.jboss.org/hibernate/orm/6.1/userguide/html_single/Hibernate_User_Guide.html)
[https://devhan.tistory.com/204](https://devhan.tistory.com/204)
[https://stackoverflow.com/questions/50370376/spring-data-deleteall-and-insert-in-same-transaction](https://stackoverflow.com/questions/50370376/spring-data-deleteall-and-insert-in-same-transaction)
[https://stackoverflow.com/questions/2827770/why-are-transactions-not-rolling-back-when-using-springjunit4classrunner-mysql-s](https://stackoverflow.com/questions/2827770/why-are-transactions-not-rolling-back-when-using-springjunit4classrunner-mysql-s)
[https://stackoverflow.com/questions/23723025/spring-data-delete-by-is-supported](https://stackoverflow.com/questions/23723025/spring-data-delete-by-is-supported)
[https://velog.io/@chosj1526/JPA-commit과-flush에-관해-영속-컨텍스트에서-세세하게-어떤-일이-일어날까-데이터-삭제-및-수정-시-1차-캐시에서-발생하는-현상-flush의-진짜-의미](https://velog.io/@chosj1526/JPA-commit과-flush에-관해-영속-컨텍스트에서-세세하게-어떤-일이-일어날까-데이터-삭제-및-수정-시-1차-캐시에서-발생하는-현상-flush의-진짜-의미)
[https://stackoverflow.com/questions/31346356/spring-data-jpa-deleteby-query-not-working](https://stackoverflow.com/questions/31346356/spring-data-jpa-deleteby-query-not-working)
[https://medium.com/javarevisited/transactional-annotation-in-spring-framework-d571e91bf6bb](https://medium.com/javarevisited/transactional-annotation-in-spring-framework-d571e91bf6bb)
