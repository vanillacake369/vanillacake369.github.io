---
title: "Left Join 대신 Cross Join 을 해야하는 경우는 언제일까?"
description: "https://leetcode.com/problems/students-and-examinations/description/?envType=study-plan-v2&envId=top-sql-50"
date: 2024-05-27
tags: [database]
category: uncategorized
lang: ko
draft: false
---

# Problem

---

[https://leetcode.com/problems/students-and-examinations/description/?envType=study-plan-v2&envId=top-sql-50](https://leetcode.com/problems/students-and-examinations/description/?envType=study-plan-v2&envId=top-sql-50)

# My Attempt

---

처음에는 아래와 같이 작성하였다.

```sql
# Write your MySQL query statement below
select 
    stu.student_id as student_id
    , stu.student_name as student_name
    , sub.subject_name as subject_name
    , count(e.subject_name) as attended_exams
from 
    Examinations e
left join 
    Students stu
on 
    e.student_id = stu.student_id
left join 
    Subjects sub
on 
    e.subject_name = sub.subject_name
group by 
    stu.student_name
    , sub.subject_name
order by 
    student_id
    , subject_name
```


이에 따라 잘못된 결과가 나왔다.
우리가 원하는 결과에서는, 지원자가 접수하지 않은 과목에 대해 그룹핑을 하고 0으로 count 해야한다.
즉 아래와 같이 나와야한다.
`Expected`

| student_id | student_name | subject_name | attended_exams |
| --- | --- | --- | --- |
| 1 | Alice | Math | 3 |
| 1 | Alice | Physics | 2 |
| 1 | Alice | Programming | 1 |
| 2 | Bob | Math | 1 |
| 2 | Bob | Physics | 0 |
| 2 | Bob | Programming | 1 |
| 6 | Alex | Math | 0 |
| 6 | Alex | Physics | 0 |
| 6 | Alex | Programming | 0 |
| 13 | John | Math | 1 |
| 13 | John | Physics | 1 |
| 13 | John | Programming | 1 |


하지만 위 쿼리는 접수하지 않은 과목은 무시하므로 아래와 같은 결과가 나온다.
`Outcome`

| student_id | student_name | subject_name | attended_exams |
| --- | --- | --- | --- |
| 1 | Alice | Math | 3 |
| 1 | Alice | Physics | 2 |
| 1 | Alice | Programming | 1 |
| 2 | Bob | Math | 1 |
| 2 | Bob | Programming | 1 |
| 13 | John | Math | 1 |
| 13 | John | Physics | 1 |
| 13 | John | Programming | 1 |


# Solution

---

그렇다면 어떻게 풀어야할까?
정답은 아래와 같다.

```sql
SELECT Students.student_id, Students.student_name, Subjects.subject_name, COUNT(Examinations.student_id) as attended_exams
FROM Students  
CROSS JOIN Subjects 
LEFT JOIN Examinations ON Students.student_id = Examinations.student_id 
                      AND Subjects.subject_name = Examinations.subject_name
GROUP BY Students.student_id, Students.student_name, Subjects.subject_name
ORDER BY Students.student_id, Subjects.subject_name;

```

그렇다면 정답과 내 접근은 무엇이 달랐을까?

# What was the difference of two queries ?

---


# Used Query

---

> **CROSS JOIN**

- Cartesian Product (카테시안 곱)을 처리한다.
- ON 절이 필요없다. ( ← 카테시안 곱을 처리하기 때문 )


가령 아래와 같이 학생과 과목 테이블이 있다고 해보자.

### Students Table:

| student_id | student_name |
| --- | --- |
| 1 | Alice |
| 2 | Bob |
| 13 | John |
| 6 | Alex |


### Subjects Table:

subject_name

---

Math

---

Physics

---

Programming

---


cross join 을 하게되면 결과는 아래와 같다.

### Cross Join Result:

| student_id | student_name | subject_name |
| --- | --- | --- |
| 1 | Alice | Math |
| 1 | Alice | Physics |
| 1 | Alice | Programming |
| 2 | Bob | Math |
| 2 | Bob | Physics |
| 2 | Bob | Programming |
| 13 | John | Math |
| 13 | John | Physics |
| 13 | John | Programming |
| 6 | Alex | Math |
| 6 | Alex | Physics |
| 6 | Alex | Programming |


# Reference

---

[https://www.sqlshack.com/sql-cross-join-with-examples/](https://www.sqlshack.com/sql-cross-join-with-examples/)
[https://velog.io/@leejy1046/SQL-LeetCode-1280.-Students-and-Examinations](https://velog.io/@leejy1046/SQL-LeetCode-1280.-Students-and-Examinations)
[https://bmmahmud.medium.com/leetcode-1280-students-and-examinations-analyzing-and-optimising-a-sql-query-ba45b4a6f9b0](https://bmmahmud.medium.com/leetcode-1280-students-and-examinations-analyzing-and-optimising-a-sql-query-ba45b4a6f9b0)
