---
title: "언제 Join 을 써야하고 언제 SubQuery 를 사용해야할까?"
description: "A subquery is a query that is **nested inside another query**."
date: 2024-05-20
tags: [database]
category: uncategorized
lang: ko
draft: false
---

# Subquery vs Join

## Subquery

A subquery is a query that is **nested inside another query**. It can be used to **filter, aggregate, or calculate** data from one or more tables.

## Join

A join is a query that **combines data from two or more tables** based on a common column or condition. It can be used to create a new table that contains data from multiple sources.

## When to use subquery or join

The decision to use a subquery or a join in SQL depends on the specific requirements of your query, the structure of your data, and performance considerations.
Personally, I have specific guidelines that help me consider whether to use a subquery or a join.
When I want **to combine columns from two or more tables based on a related column, I use a join**. I employ joins to merge data from different tables by matching values in specified columns.
When performing a task that **involves comparing a single value or aggregate result to a column in the outer query, I use a subquery.** I use subqueries for situations where I am checking existence, comparing against a single value, or using an aggregate result.

## Semi join

[https://clack2933.tistory.com/m/33](https://clack2933.tistory.com/m/33)

subquery 와 main query의 연결을 위한 **유사 join query문**

- optimizer 전략에 따라서 여러 최적화 방식이 사용 됩니다 (firstMatch/pullout/Materializaion ...etc) -> 아래에서 자세하게 설명하겠습니다
- subquery에서 join에 필요한 데이터를 먼저 추려 내는 과정을 거칩니다.
- **중복 제거**를 할 수 있습니다(Duplicate Weedout)

아래 join 문을

```sql
select distinct food.*
from food left outer join food_flavor 
    on food.food_id = food_flavor.food_id
where food.category_id = 1 and food_flavor.flavor_id in (1,2);
```
```sql
select food.*
from food left outer join food_flavor 
    on food.food_id = food_flavor.food_id
    where food.category_id = 1
    group by food.food_id;
```

아래 semi join 으로 변경가능

```sql
select food.* 
from food 
where food.food_id in ( 
    select foodflavor1_.food_id 
    from food_flavor foodflavor1_ 
        where foodflavor1_.food_id=food.food_id 
            and food.category_id=1 
            and foodflavor1_.flavor_id in (1,2) 
);
```

### 내부적으로 이렇게 최적화됨

> pullout
> **FirstMatch**

** first match 방식을 사용할지 in-to-exist방식을 사용할지 optimizer 가 환경에 따라 선택

> Materializaion 최적화

### 언제, 왜 씀 ?

> https://www.reddit.com/r/PostgreSQL/comments/10pqcav/what_is_the_point_of_a_semi_join_besides/
> That's a pretty common type of query: find things in one table that do exist exist in another table - but you only care about the existence of the other rows. e.g. users that have created at least one thread, customers that have placed at least one order and so on.

### Anti join

[https://www.geeksforgeeks.org/difference-between-anti-join-and-semi-join/](https://www.geeksforgeeks.org/difference-between-anti-join-and-semi-join/)

When anti-join is applied, it returns the rows from one table for which there are no matching records in another related table.

- It is Exactly the opposite to semi-join.
- An Anti-join returns rows from the left table for which there are no corresponding matching rows in the right table

```sql
SELECT Customers.*
FROM Customers
LEFT JOIN Orders
ON Customers.Customer_ID = Orders.Customer_ID
WHERE Orders.Customer_ID IS NULL;
```

# Performance : subquery vs join

> One of the main factors to consider when choosing between subqueries and joins is performance. **Generally speaking, joins are faster than subqueries, because they can use indexes and other optimization techniques.** Subqueries, on the other hand, may require more processing and memory, especially if they return large or complex results. However, this is not always the case, and the performance may depend on the database engine, the data size, the query complexity, and the indexes available.

# Flexibility : subquery vs join

Join: Joins **offer more flexibility in terms of the types of relationships** you can establish between tables. You can perform different types of joins (e.g., inner join, outer join) and specify various join conditions to control how tables are combined. Joins also **allow you to easily include additional columns** from joined tables in the result set.
Subquery: Subqueries provide flexibility in terms of **performing complex calculations, filtering, or conditional logic within a query.** They allow you to embed one query within another, enabling dynamic filtering, row-by-row processing, and more sophisticated data manipulation. Subqueries can be useful for scenarios where joins alone are not sufficient to achieve the desired result.

# Subquery is translated to join at mysql 5.6

explain extended 실제쿼리 를 통해 실제로 옵티마이저가 해석한 실행 계획을 보면!?
**Join이 들어간 것**을 볼 수 있습니다.
즉, MySQL 5.6 부터는 **서브쿼리를 사용하면 내부적으로 Join으로 풀어서 실행**한다는 것을 알 수 있는데요.

## How about in mysql 8.x ?

[https://jojoldu.tistory.com/520](https://jojoldu.tistory.com/520)

> 테이블 스키마 그래도 사용,
> 랜덤 데이터 넣고,
> Datagrip 에서 explain extended 사용해 테스트 해보자
> 확실하 다양한 기능이 추가되면서 optimizer 또한 개선되었다,,, ㅠㅠ
> Optimizer Changes: MySQL 8.0 includes improvements in the optimizer which may change the performance characteristics of your queries. Run thorough tests to check the performance implications.
> https://www.rapydo.io/blog/mysql-5-7-vs-mysql-8-0-new-features-migration-planning-and-pre-migration-checks
> https://myvelop.tistory.com/m/208

# Reference

[https://www.linkedin.com/advice/0/how-do-you-decide-when-use-subquery-join-sql](https://www.linkedin.com/advice/0/how-do-you-decide-when-use-subquery-join-sql)
[https://jojoldu.tistory.com/520](https://jojoldu.tistory.com/520)

—-
아니,,, 왜 `SQL 레벨업` 책에서는 결합 사용 시 n*m 이라면서,,, 왜 말이 다른데,,,
꼭 개발자 단톡방이랑 커뮤니티에 물어봐야겠다,,,
