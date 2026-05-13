---
title: "GROUP BY 와 PARTITION BY 의 차이점은 무엇인가?"
description: "1."
date: 2024-05-25
tags: [database]
category: uncategorized
lang: ko
draft: false
---

```sql
WITH cte_login AS(
SELECT player_id
, DATEDIFF(event_date, MIN(event_date) OVER(PARTITION BY player_id)) = 1 as login
FROM activity
) -- 1
SELECT ROUND(SUM(login) / COUNT(DISTINCT player_id), 2) as fraction
FROM cte_login -- 2
```

1. INNER QUERY
: 최초 로그인한 날 MIN(event_date) 과 다음 로그인 한 날이 연속으로 있는지를 알아보기 두 날짜의 차이가 1인 행을 찾아야한다. (DATEDIFF)
2. OUTER QUERY
: player_id별로 로그인 여부를 파악해야 하므로 PARTITION BY를 사용해준다. (GROUP BY를 해버리면 최초 또는 최대의 날짜밖에 구하지 못한다)

---

✅  GROUP BY
GROUP BY 절은 특정 칼럼을 기준으로 집계 함수를 사용하여 건수(COUNT), 합계(SUM), 평균(AVG) 등 집 계성 데이터를 추출할 때 사용

- group 에 따라 행을 집약해 결과를 도출함
- 하나 이상의 컬럼을 기준으로 컬럼값에 따라 그룹화 하여 그룹별로 출력한다.

즉 집계 함수를 사용하여 기존 행에 있던 값들을 계산한 후 새로운 행에 입력해 주는데,
집계 함수가 데이터를 하나로 합쳐주는 과정에서, 기존의 상세 데이터들을 잃게 된다.

---

✅  PARTITION BY
GROUP BY와 집계 함수가 하는 역할과 거의 유사하지만, 차이점이 1가지 존재함.
PARTITION BY를 사용하면, GROUP BY와는 달리 기존 행의 세세한 정보들은 사라지지 않고 그대로 유지된다.

- 행을 집약한 결과를 보여주지는 않는다.
- 레코드가 줄어들지 않는다.
