---
description: 언제 `BETWEEN` 을 쓰는 게 적합하고, 언제 `IN` 을 쓰는 게 적합할까?
date: 2024-05-17
tags:
  - database
lang: ko
draft: false
---

# Intro : 언제 무엇을 쓰는지 ??

리트코드 SQL 문제들을 푸는 도중 값에 대한 범위에 대한 조건을 처리해야 했다.

의문점이 생겼다.

언제 `BETWEEN` 을 쓰는 게 적합하고, 언제 `IN` 을 쓰는 게 적합한지 내 머릿 속의 기준이 애매모호했다.

따라서 아래와 같은 의문점을 해결해보고자 한다.

- 언제 `BETWEEN` 을 쓰는 게 적합하고,
- 언제 `IN` 을 쓰는 게 적합한지
- 각각의 Operation Plan 이 무엇인지
- 어떤 것이 더 성능이 좋은지

# TL;DR

> 웬만하면 순차데이터는 `BETWEEN` , 특정데이터셋은 `IN`이 좋다.
>
> 일반적으로 `BETWEEN` 이 `IN` 보다 빠르다.

이는 내부동작과정 때문이다.

> `IN`은 여러 `OR`보다 빠르다.

내부적으로 인덱스를 사용할 수 있기 때문이다.

>

# `BETWEEN` , `IN` 사용 기준

> The `BETWEEN` operator is utilized to compare **two values inside a range**, whereas the `IN` operator is utilized to compare **a value with a set of values.**

`BETWEEN` 절은 **range 에 대한 필터링**을 하기 위함이라는 것을 주목하자.

가령 아래와 같이 사용될 수 있다.

```sql
SELECT *
FROM Orders
WHERE Order_Date BETWEEN '2020-01-01' AND '2020-12-31';
```

`IN()` 절은 set of values 에 대한 필터링을 하기 위함이라는 것을 주목하자.

우리가 필터링하고자 하는 **specific values 에 대해서 처리**를 해야한다.

```sql
SELECT * FROM Customers
WHERE CustomerName IN ('IBM', 'Microsoft', 'Apple');
```

# `BETWEEN`,`IN` Operation Plan in MySQL

## 사실 내부적으로 이렇게 변경되어 처리된다.

```sql
SELECT * FROM Person WHERE age BETWEEN 1 AND 3;
```

```sql
SELECT * FROM Person WHERE age IN [1, 2, 3];
```

사실 위 BETWEEN, IN 은 아래와 같이 변경된다.

```sql
select * from person where age >= 1 and age <= 3;
```

```sql
select * from person where age = 1 or age = 2 or age 3;
```

일반적으로 AND 가 OR 보다 빠르므로 BETWEEN 이 더욱 우세하다.

(순차적인 조건에 대해 true인 경우, 다음 조건식을 판단하지 않으므로)

또한 = 을 통해 조건 판별을 하는 것이 아닌, ≥ , ≤ 와 같은 range 에 대한 판별을 하므로 general data 에 대해서 우세하다.

또한 인덱스 처리가능 여부에 따라 다르다.

## 인덱스 처리가능 여부에 따른 성능 차이

[Is there a performance difference between BETWEEN and IN with MySQL or in SQL in general?](https://stackoverflow.com/questions/3308280/is-there-a-performance-difference-between-between-and-in-with-mysql-or-in-sql-in)

- 테이블 크기가 `m` , 범위의 크기가`n` 이라고 치자.

### 인덱스가 사용될 때

- Oracle 에 따르면 `BETWEEN` primary key index 에 대해 single "range scan" 을 사용하여 구현될 수 있다. (최대 n 개의 인덱스 노드들을 순회할 수 있다.)
  - 이에 따라 복잡도는 `O(n + log m)` 로 처리될 수 있다.
- IN 은 보통 primary key index 에 대해 series (loop) of `n` "range scans" 을 사용하여 구현된다.
  - 이에 따라 복잡도는 `O(n * log m)` 로 처리될 수 있다.

### 인덱스가 사용되지 않을 때

인덱스가 사용되지 않는다면, full table scan 을 실행하여 각각의 row 에 대해 조건에 대한 필터링을 한다.(evaluate the predicate on each row)

- `BETWEEN` 은 두 가지 조건을 처리한다 : 하나는 lower bound, 하나는 upper bound
  - 따라서 복잡도는 `O(m)` 이다.
- 반면 `IN` 은 n 개의 조건 모두를 처리한다 : m 개의 row 에 대해 n 개의 조건통과여부를 판별한다.
  - 따라서 복잡도는 `O(m * n)` 이다.

# For Date, Use `BETWEEN` / For Specific Set, Use `IN`

- Date 는 보통 순차적인 데이터이다.

따라서 이에 대한 필터링을 하고자한다면 BETWEEN 을 사용하자.

    ```sql
    SELECT
    	name
    FROM
    	celebrity
    WHERE
    	birth
    	BETWEEN '1980-01-01' AND '2000-12-31';
    ```

- 특정 집합에 대한 필터링은 순차적이지 않다.

따라서 이에 대한 필터링을 하고자한다면 IN 을 사용하자.

    ```sql
    SELECT
    	name
    FROM
    	celebrity
    WHERE
    	name IN ('Jusin Biber','Beyonce','Pop Smoke');
    ```

# Favor `IN` than multiple `OR`

> \*\*IN clause queries outperforms the multiple OR clauses variants.

The difference is much larger than the queries on the indexed attribute above and the gap widens even more with an increase in the number of predicates.

With 5000 predicates, PostgreSQL executes the IN clause query approximately 288x faster than the OR clause (1.8 seconds vs. 518.2 seconds).\*\*

> ```sql
> SELECT * FROM item WHERE price IN (?); –-  IN Clause
> SELECT * FROM item WHERE price = ? OR price = ? OR price = ? OR ... ; -- OR Clauses
> ```
>
> ![](/images/velog/d48d8a46594f99ce.png)

`IN` 은 내부적으로 인덱스를 탈 수 있다.

따라서 여러 `OR` 보다 `IN` 을 사용하는 것이 조금 더 빠르다.

위 그림과 같이 조건절(Predicates)의 개수가 늘어날 수록 OR 가 수행속도가 더 오래 걸린다는 것을 볼 수 있다.

# Reference 📚

[Is there a performance difference between BETWEEN and IN with MySQL or in SQL in general?](https://stackoverflow.com/questions/3308280/is-there-a-performance-difference-between-between-and-in-with-mysql-or-in-sql-in)

[AGE [1, 2, 3] vs.

AGE BETWEEN 1 AND 3](https://stackoverflow.com/questions/5769703/age-1-2-3-vs-age-between-1-and-3)

[MySQL OR vs IN performance](https://stackoverflow.com/questions/782915/mysql-or-vs-in-performance)

[SQL Between: Best Way to Retrieve Desired Range of Values](https://www.simplilearn.com/tutorials/sql-tutorial/sql-between)

[BETWEEN AND IN operators in SQL](https://www.almabetter.com/bytes/tutorials/sql/in-and-between-operator-in-sql)

[Query best practices: When should you use the IN instead of the OR operator? | OtterTune](https://ottertune.com/blog/query-best-practices-when-should-you-use-the-in-instead-of-the-or-operator)
