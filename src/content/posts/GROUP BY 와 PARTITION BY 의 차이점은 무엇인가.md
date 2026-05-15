---
description: "GROUP BY는 행을 집약하고, PARTITION BY는 행을 유지한 채 집계한다. 두 방식의 차이를 예제와 함께 비교한다."
date: 2024-05-25
tags: [database]
lang: ko
draft: false
---

# 문제 상황 🐛

LeetCode 문제를 풀다가 `GROUP BY`를 사용하니 원하는 결과가 나오지 않았다.
플레이어별 최초 로그인 다음 날에 재접속한 비율을 구해야 하는데, `GROUP BY`로 집계하면 각 행의 개별 날짜 정보가 사라져 DATEDIFF 비교가 불가능했다.

`PARTITION BY`를 사용하니 각 행의 날짜를 유지한 채 그룹별 최솟값을 구할 수 있었다.

```sql
WITH cte_login AS (
    SELECT player_id,
           DATEDIFF(event_date, MIN(event_date) OVER (PARTITION BY player_id)) = 1 AS login
    FROM activity
)
SELECT ROUND(SUM(login) / COUNT(DISTINCT player_id), 2) AS fraction
FROM cte_login;
```

이 경험을 계기로 두 방식의 차이를 정리한다.

# GROUP BY vs PARTITION BY 📋

## 핵심 차이

| 항목               | GROUP BY                       | PARTITION BY (윈도우 함수)                  |
| ------------------ | ------------------------------ | ------------------------------------------- |
| 행 수 변화         | 그룹당 1행으로 **축소**        | 원본 행 수 **유지**                         |
| 상세 데이터        | 집계 과정에서 **소실**         | 모든 컬럼 **보존**                          |
| 사용 위치          | `GROUP BY` 절                  | `OVER(PARTITION BY ...)` 절                 |
| 함께 쓸 수 있는 것 | 집계 함수 (COUNT, SUM, AVG 등) | 집계 함수 + 순위 함수 (ROW_NUMBER, RANK 등) |

## 예제 데이터

```sql
-- orders 테이블
| user_id | order_date | amount |
|---------|------------|--------|
| 1       | 2024-01-01 | 100    |
| 1       | 2024-01-05 | 200    |
| 2       | 2024-01-02 | 150    |
| 2       | 2024-01-03 | 300    |
```

## GROUP BY — 행을 집약한다

```sql
SELECT user_id, SUM(amount) AS total
FROM orders
GROUP BY user_id;
```

```
| user_id | total |
|---------|-------|
| 1       | 300   |
| 2       | 450   |
```

2행으로 축소된다. 각 주문의 `order_date`나 개별 `amount`는 결과에서 사라진다.

## PARTITION BY — 행을 유지한 채 집계한다

```sql
SELECT user_id, order_date, amount,
       SUM(amount) OVER (PARTITION BY user_id) AS total
FROM orders;
```

```
| user_id | order_date | amount | total |
|---------|------------|--------|-------|
| 1       | 2024-01-01 | 100    | 300   |
| 1       | 2024-01-05 | 200    | 300   |
| 2       | 2024-01-02 | 150    | 450   |
| 2       | 2024-01-03 | 300    | 450   |
```

4행 모두 유지된다. 각 행에 그룹 합계가 새 컬럼으로 붙는다.

# 언제 무엇을 쓰는가 🗺️

| 상황                                             | 선택                  |
| ------------------------------------------------ | --------------------- |
| 그룹별 합계/평균/건수만 필요하다                 | `GROUP BY`            |
| 집계 결과와 개별 행 데이터를 함께 보고 싶다      | `PARTITION BY`        |
| 그룹 내 순위를 매기고 싶다 (ROW_NUMBER, RANK)    | `PARTITION BY`        |
| 그룹 내 이전/다음 행과 비교하고 싶다 (LAG, LEAD) | `PARTITION BY`        |
| 집계 결과를 WHERE 조건에 쓰고 싶다               | `GROUP BY` + `HAVING` |

처음 문제로 돌아오면, `GROUP BY player_id`를 사용하면 플레이어당 1행으로 축소되어 개별 `event_date`를 비교할 수 없다. `PARTITION BY player_id`를 사용하면 모든 로그인 행이 유지되면서도 각 행에서 최초 로그인 날짜(`MIN`)를 참조할 수 있으므로, DATEDIFF로 연속 로그인 여부를 판별할 수 있다.

[^1]: MySQL 8.0 윈도우 함수 공식 문서. <https://dev.mysql.com/doc/refman/8.0/en/window-functions.html>

[^2]: PostgreSQL PARTITION BY 문서. <https://www.postgresql.org/docs/current/tutorial-window.html>

[^3]: LeetCode 550번 문제 — Game Play Analysis IV. PARTITION BY 를 활용해 연속 로그인 비율을 구하는 대표 문제. <https://leetcode.com/problems/game-play-analysis-iv/>
