---
description: "HAVING 절에서 Subquery를 잘못 사용하는 함정을 짚고, LEFT JOIN으로 미매칭 행을 더 명확하게 처리하는 방법을 비교 설명한다."
date: 2024-05-31
tags: [database]
lang: ko
draft: false
---

# Problem 🔍

[https://leetcode.com/problems/customer-who-visited-but-did-not-make-any-transactions/description/?envType=study-plan-v2&envId=top-sql-50](https://leetcode.com/problems/customer-who-visited-but-did-not-make-any-transactions/description/?envType=study-plan-v2&envId=top-sql-50)

# Solution 💡

## 1.

CTE & Sub-Qeury 사용

```sql
WITH t_visit_group AS (
	select visit_id
	from Transactions
	group by visit_id
)
select
	customer_id
	, count(customer_id)
from
	Visits
group by
	customer_id
having not in t_visit_group;
```

### [ERROR] Syntax error : 어떤 부분이 잘못된 문법이었을까??

> **HAVING 은 aggregate functions 에 대한 filter group**

GROUP BY로 묶은 뒤, HAVING을 CTE에 대한 처리를 하였다. 하지만 HAVING은 GROUP BY 이후 적용된 aggregate functions에 대한 filter group이다.[^1] 따라서 아래와 같이 고쳐야 한다.

```sql
WITH t_visit_group AS (
    SELECT visit_id
    FROM Transactions
    GROUP BY visit_id
)

SELECT
    customer_id,
    COUNT(customer_id) as count_no_trans
FROM
    Visits
WHERE
    visit_id NOT IN (SELECT visit_id FROM t_visit_group)
GROUP BY
    customer_id;

```

### 하지만 비교적 느리다.

![](/images/notion/6b4405b4ac8148df.png)

### 왜 느릴까? → Full Scan 을 5 번을 한다.

Datagrip을 통해 Execute Plan을 확인해보자.

> Table Schema

왜 Table Full Scan을 5번이나 할까? 이유는 아래와 같다.

1. WHERE 절에 대한 Subquery가 실행되어서.
2. Index가 존재하지 않아서.

```sql
SELECT (select)
		SEQ_SCAN (Table scan)	 table: <temporary>;
		UNKNOWN (Aggregate using temporary table)
		FILTER (filter)		7	0.95		<in_optimizer>(Visits.visit_id,Visits.visit_id in (select #2) is false)
				SEQ_SCAN (Table scan)	 table: Visits;	7	0.95
				SUBQUERY (Select)					#2 (subquery in condition; run only once)
				FILTER (filter)		1	7.47	7.47	((Visits.visit_id = `<materialized_subquery>`.visit_id))
				UNKNOWN (Limit)		1	7.38	7.38	1 row(s)
				UNIQUE_INDEX_SCAN (Index lookup)	 table: <materialized_subquery>; index: <auto_distinct_key>;				(visit_id=Visits.visit_id)
				UNKNOWN (Materialize with deduplication)		5	7.38	7.38
						SEQ_SCAN (Table scan)	 table: t_visit_group;	5	6.88	4.83
						UNKNOWN (Materialize CTE t_visit_group)		5	4.31	4.31
								SEQ_SCAN (Table scan)	 table: <temporary>;	5	3.81	1.76
								TEMPORARY (Temporary table with deduplication)		5	1.25	1.25
										SEQ_SCAN (Table scan)	 table: Transactions;	5	0.75
```

![](/images/notion/aab43ea497ec33b2.png)

어떻게 하면 개선할 수 있을까?

### Subquery 에서 DISTINCT 를 사용하여 개선

동일쿼리 내에서 개선할 수 있는 방법이 있다. 바로 id에 대한 `DISTINCT` 처리를 하는 것이다. 아래와 같이 visit_id에 대해 `DISTINCT`를 처리하여 range를 좁혔다. 과연 얼마나 빨라질까?

```sql
WITH t_visit_group AS (
    SELECT visit_id
    FROM Transactions
    GROUP BY visit_id
)

SELECT
    customer_id,
    COUNT(customer_id) as count_no_trans
FROM
    Visits
WHERE
    visit_id NOT IN (SELECT **DISTINCT** visit_id FROM t_visit_group)
GROUP BY
    customer_id;
```

그렇다면 왜 빨라졌을까? Datagrip에서 Explain을 처리해보자.

```sql
SELECT (select)
		SEQ_SCAN (Table scan)	 table: <temporary>;
		UNKNOWN (Aggregate using temporary table)
		FILTER (filter)		7	0.95		<in_optimizer>(Visits.visit_id,Visits.visit_id in (select #2) is false)
				SEQ_SCAN (Table scan)	 table: Visits;	7	0.95
				SUBQUERY (Select)					#2 (subquery in condition; run only once)
				FILTER (filter)		1	7.47	7.47	((Visits.visit_id = `<materialized_subquery>`.visit_id))
				UNKNOWN (Limit)		1	7.38	7.38	1 row(s)
				UNIQUE_INDEX_SCAN (Index lookup)	 table: <materialized_subquery>; index: <auto_distinct_key>;				(visit_id=Visits.visit_id)
				UNKNOWN (Materialize with deduplication)		5	7.38	7.38
						SEQ_SCAN (Table scan)	 table: t_visit_group;	5	6.88	4.83
						UNKNOWN (Materialize CTE t_visit_group)		5	4.31	4.31
								SEQ_SCAN (Table scan)	 table: <temporary>;	5	3.81	1.76
								TEMPORARY (Temporary table with deduplication)		5	1.25	1.25
										SEQ_SCAN (Table scan)	 table: Transactions;	5	0.75
```

아예 바뀐 게 없었다. 사실 DISTINCT는 데이터를 줄여주는 역할만 수행해주었을 뿐이다. 그래서 최적화가 되는 것처럼 속도가 빨라진 것이다.[^2]

Stackoverflow에서는 SubQuery의 IN 절에서 DISTINCT를 쓰는 것은 일반적인 최적화가 되지 않는다고 한다.[^3]

> The `SELECT DISTINCT` in the `IN` subquery does nothing.

Nothing at all.

The `IN` implicitly does a `SELECT DISTINCT` because if something is in `(1, 2, 3)`, then that something is in `(1, 1, 1, 2, 2, 3)`.

## 2.

LEFT JOIN 사용

```sql
SELECT V.customer_id, COUNT(V.visit_id) AS count_no_trans
FROM Visits V
LEFT JOIN Transactions T ON V.visit_id = T.visit_id
WHERE T.transaction_id IS NULL
GROUP BY V.customer_id;
```

### [Join X] Full Scan 5번 → [Join O] Full Scan 3번 ⚡

![](/images/notion/d6038ce9f445ef26.png)

```sql
SELECT (select)
		SEQ_SCAN (Table scan)	 table: <temporary>;
		UNKNOWN (Aggregate using temporary table)
		FILTER (filter)		7	4.26		(T.transaction_id is null)
				UNKNOWN (Left hash join)		7	4.26		(T.visit_id = V.visit_id)
						SEQ_SCAN (Table scan)	 table: V;	7	0.95
						HASH_UNIQUE (Hash)
						SEQ_SCAN (Table scan)	 table: T;	5	0.107
```

LEFT hash join을 함으로써 Full Scan 횟수를 줄일 수 있었다.[^4] 이로써 SubQuery는 Join보다 일반적인 성능이 좋지 않다는 것을 다시금 느낄 수 있었다.[^5]

[^1]: MariaDB HAVING 절과 GROUP BY 최적화: <https://mariadb.com/kb/en/optimizing-group-by/>
[^2]: Quora — SubQuery에서 DISTINCT 사용 여부: <https://www.quora.com/Should-I-use-DISTINCT-in-a-subquery-when-using-IN>
[^3]: Stack Overflow — SQL DISTINCT subquery: <https://stackoverflow.com/questions/47379281/sql-distinct-subquery>
[^4]: MySQL LEFT JOIN 최적화: <https://dev.mysql.com/doc/refman/8.0/en/left-join-optimization.html>
[^5]: MySQL Subquery 최적화 문서: <https://dev.mysql.com/doc/refman/8.0/en/subquery-optimization.html>
