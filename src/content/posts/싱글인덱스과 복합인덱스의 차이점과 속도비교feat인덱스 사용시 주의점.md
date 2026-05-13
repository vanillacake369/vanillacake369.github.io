---
title: "싱글인덱스과 복합인덱스의 차이점과 속도비교(feat.인덱스 사용시 주의점)"
description: "Gream 프로젝트에서는 “조회”에 대해 여러 요구사항이 존재하였다.\n\n어떤 데이터에 어떤 인덱스를 적용하는 게 좋을까? 성능측정 실험을 통해 알아보자!"
date: 2024-04-14
tags: [mysql, 성능개선, 인덱스, 주의점]
category: uncategorized
lang: ko
draft: false
---

![](/images/velog/3fb8ea612f1dede3.png)


# Intro

---

Gream 프로젝트에서는 “조회”에 대해 여러 요구사항이 존재하였다.

그 중에서 가장 빈도수가 높고 중요도가 높은 순으로 정리를 해보았다.

1. 상품 조회
2. 유저 조회 (마이페이지에서 본인 데이터 불러올 때)
3. 판매입찰가 조회
4. 구매입찰가 조회
5. 사용자 판매완료 내역 /sell/history

이러한 조회에 대해서 빠르게 데이터를 처리해줄 수 있는 방법으로 “DB 인덱스 적용” 이라는 방안을 떠올렸다.

며칠 전에 과제에서 주어진 주소 테이블에 대해 인덱스 처리해본 것을 적용해보려는 것이다.

삽입삭제가 거의 없는 주소 테이블은 인덱스를 처리하기 좋았다.

더군다나 대부분의 사람들이 시-군-동-코드 를 통해 복합적으로 검색을 하다보니 복합인덱스를 적용하기 안성맞춤이었다.

Gream 프로젝트에 적용을 해보고 어떤 것을 썼을 때 안티패턴이고, 어떤 주의사항이 존재하는지를 실제로 적용해봄으로써 살펴보았다.

# 어떤 테이블에 대해 어떤 인덱스를 적용할 것인가 ?

---

### 가장 빈번한 조회를 필요로하는 요구사항이 무엇인가?

아래는 Gream 프로젝트에서 요구되는 모든 GET 요청이다.

1. GET /api/users/points - 사용자 포인트 조회 요청
2. GET /api/products/likes - 관심상품 조회 요청
3. DELETE /api/products/{id}/dislike - 관심상품 해제 요청
4. GET /api/payments/toss/success - 토스페이 결제 성공 리다이렉트
5. GET /api/payments/toss/fail - 토스페이 결제 실패 리다이렉트
6. GET /api/admin/refunds - 신청된 환급 리스트 조회 요청 [어드민 ONLY]
7. GET /api/sell/history/onprogress - 판매입찰 히스토리 조회 요청
8. GET /api/sell/history/end - 판매내역 히스토리 조회 요청
9. GET /api/products - 상품 전체 조회
10. GET /api/products/{id} - 상품 상세조회
11. GET /api/products/{id}/trade - 상품 체결내역 조회
12. GET /api/products/{id}/sell - 판매 입찰가 조회
13. GET /api/products/{id}/buy - 구매 입찰가 조회
14. GET /api/coupons - 사용가능한 쿠폰 조회 요청
15. GET /api/coupons/used - 사용완료한 쿠폰 조회 요청
16. GET /api/buy/history/onprogress - 구매자 진행 중인 구매입찰 조회 요청
17. GET /api/buy/history/end - 구매자 구매완료상품 조회 요청

이에 따라 GPT에게 가장 빈번한 조회를 요청하는 도메인을 정렬해달라고 부탁했다.

1. **Product Query Domain** (5 GET requests)
    - 상품 전체 조회
    - 상품 상세조회
    - 상품 체결내역 조회
    - 판매 입찰가 조회
    - 구매 입찰가 조회
2. **User Domain** (3 GET requests)
    - 사용자 포인트 조회 요청
    - 관심상품 조회 요청
    - 관심상품 해제 요청
3. **Coupon Domain** (2 GET requests)
    - 사용가능한 쿠폰 조회 요청
    - 사용완료한 쿠폰 조회 요청
4. **User Sell History Domain** (2 GET requests)
    - 판매입찰 히스토리 조회 요청
    - 판매내역 히스토리 조회 요청
5. **Toss Payment Domain** (2 GET requests)
    - 토스페이 결제 성공 리다이렉트
    - 토스페이 결제 실패 리다이렉트
6. **User Bought History Domain** (2 GET requests)
    - 구매자 진행 중인 구매입찰 조회 요청
    - 구매자 구매완료상품 조회 요청
7. **Admin Domain** (1 GET request)
    - 신청된 환급 리스트 조회 요청 [어드민 ONLY]

### 어떤 데이터에 대해 인덱싱이 필요한가?

아무래도 대부분의 테이블이 PK 와 FK 가 적당히 잡혀있어 인덱스 처리하기가 어려웠다.

(팀 모두가 며칠씩 투자하여 ERD 설계를 했던터라 이 부분은 혹자가 우스워할지라도 좀 뿌듯했다 :) )

다만 역시 상품에 대한 조회가 가장 빈번했고 가장 중요한 도메인이였다.

더군다나 상품은 자주 삽입/삭제되지 않는다.

상품에 대한 구매입찰과 판매입찰 데이터가 자주 삽입/수정/삭제될 뿐이다.

(이는 한정판 중고판매 서비스인 크림도 마찬가지이다. 사용자가 관리자에게 따로 문의를 넣어야만 비로소 상품을 직접 추가해준다. 아직도 이 정책에 대해서는 고개가 갸우뚱해지지만 말이다.)

따라서 상품에 대해 인덱스를 처리하기로 하였다.

### 어떤 인덱싱을 적용할 것인가?

단일인덱스 처리를 할지, 복합인덱스 처리를 할지 고민이 되었다.

여러 구글링 결과 “요구사항 상황과 데이터셋에 따라 다르다” 라는 여러 여론이 존재했다.

이에 따라 만 건 정도의 더미데이터에 대해서 실험하기로 하였다.

아래와 같은 조건조회에 대해서 실험을 돌렸다.

- 실제 요구사항 쿼리문
- 복합조건문
- (QueryDsl 에 따른) 단일조건문


*참고로 MySQL 은 `PRIMARY`, `UNIQUE`키워드가 없다면 Non-Clustered Index 를 생성한다.

*잘 모르겠다면 Clustered Index 에 대해 먼저 공부하자.

*더미데이터는 Python 의 Faker 를 통해 생성했다.

*아래는 Faker 를 활용한 더미데이터 생성코드

```python
# NOTE :
# install Faker previously using `pip install Faker`

import datetime
import random

from faker import Faker

fake = Faker()

# Open a file to write the SQL insert statements
with open('dummy_data.sql', 'w') as file:
    file.write("INSERT INTO tb_product (created_at, modified_at, brand, description, image_url, name, price) VALUES\n")

    loopSize = 1000
    # loopSize = 100000

    for _ in range(loopSize):
        created_at = fake.date_time_between(start_date='-1y', end_date='now').strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
        modified_at = fake.date_time_between_dates(
            datetime_start=datetime.datetime.strptime(created_at, '%Y-%m-%d %H:%M:%S.%f'),
            datetime_end=datetime.datetime.now()).strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
        brand = fake.company()
        description = fake.sentence()
        image_url = fake.image_url()
        name = fake.word().capitalize() + fake.word()
        price = random.randint(10, 1000)  # Random price between 10 and 1000

        file.write(f"('{created_at}', '{modified_at}', '{brand}', '{description}', '{image_url}', '{name}', {price})")

        if _ != 99999:  # Add comma at the end of each line except the last one
            file.write(",\n")
        else:
            file.write(";\n")
```

# 이제 직접 돌려보고 성능측정을 해보자.
---
## None Index

```sql
gream> select *
from tb_product
where
tb_product.brand = 'starbucks'
[2024-04-13 16:38:35] 500 rows retrieved starting from 1 in 196 ms (execution: 44 ms, fetching: 152 ms)
```

```sql
gream> select *
from tb_product
where
tb_product.name = 'Tendelection'
[2024-04-13 16:38:16] 1 row retrieved starting from 1 in 92 ms (execution: 39 ms, fetching: 53 ms)
```

```sql
gream> select *
from tb_product
where
tb_product.brand = 'ediya'
and
tb_product.name = 'Tendelection'
[2024-04-13 16:38:55] 1 row retrieved starting from 1 in 78 ms (execution: 38 ms, fetching: 40 ms)
```

```sql
gream> select *
from tb_product
where
500<=price <=800
[2024-04-13 16:37:42] 500 rows retrieved starting from 1 in 236 ms (execution: 49 ms, fetching: 187 ms)
```

```sql
gream> select *
from tb_product
where
tb_product.brand = 'ediya'
and
tb_product.name = 'Tendelection'
and
tb_product.price = 72
[2024-04-13 16:48:25] 1 row retrieved starting from 1 in 88 ms (execution: 37 ms, fetching: 51 ms)
```

## After Creating Singular Index

```sql
create index idx_brand on tb_product(brand);
create index idx_name on tb_product(name);
create index idx_price on tb_product(price);

```

```sql
gream> select *
from tb_product
where
tb_product.brand = 'starbucks'
[2024-04-13 16:40:14] 500 rows retrieved starting from 1 in 216 ms (execution: 74 ms, fetching: 142 ms)
```

```sql
gream> select *
from tb_product
where
tb_product.name = 'Tendelection'
[2024-04-13 16:40:36] 1 row retrieved starting from 1 in 77 ms (execution: 36 ms, fetching: 41 ms)
```

```sql
gream> select *
from tb_product
where
tb_product.brand = 'ediya'
and
tb_product.name = 'Tendelection'
[2024-04-13 16:41:09] 1 row retrieved starting from 1 in 88 ms (execution: 39 ms, fetching: 49 ms)
```

```sql
gream> select *
from tb_product
where
500<=price <=800
[2024-04-13 16:41:23] 500 rows retrieved starting from 1 in 178 ms (execution: 43 ms, fetching: 135 ms)
```

```sql
gream> select *
from tb_product
where
tb_product.brand = 'ediya'
and
tb_product.name = 'Tendelection'
and
tb_product.price = 72
[2024-04-13 16:48:50] 1 row retrieved starting from 1 in 85 ms (execution: 38 ms, fetching: 47 ms)
```

## After Creating Concatanated Index

```sql
create index idx_brand_name_price on tb_product(brand,name,price);

```

```sql
gream> select *
from tb_product
where
tb_product.brand = 'starbucks'
[2024-04-13 16:44:08] 500 rows retrieved starting from 1 in 156 ms (execution: 43 ms, fetching: 113 ms)
```

```sql
gream> select *
from tb_product
where
tb_product.name = 'Tendelection'
[2024-04-13 16:44:48] 1 row retrieved starting from 1 in 91 ms (execution: 42 ms, fetching: 49 ms)
```

```sql
gream> select *
from tb_product
where
tb_product.brand = 'ediya'
and
tb_product.name = 'Tendelection'
[2024-04-13 16:45:21] 1 row retrieved starting from 1 in 79 ms (execution: 35 ms, fetching: 44 ms)
```

```sql
gream> select *
from tb_product
where
500<=price <=800
[2024-04-13 16:45:36] 500 rows retrieved starting from 1 in 180 ms (execution: 42 ms, fetching: 138 ms)
```

```sql
gream> select *
from tb_product
where
tb_product.brand = 'ediya'
and
tb_product.name = 'Tendelection'
and
tb_product.price = 72
[2024-04-13 16:49:19] 1 row retrieved starting from 1 in 70 ms (execution: 35 ms, fetching: 35 ms)
```

# 결론

---

| Query Description | Without Index (ms) | With Singular Index (ms) | With Concatenated Index (ms) |
| --- | --- | --- | --- |
| Brand 'starbucks' | 196 | 216 | 156 |
| Name 'Tendelection' | 92 | 77 | 91 |
| Brand 'ediya' and Name 'Tendelection' | 78 | 88 | 79 |
| Price between 500 and 800 | 236 | 178 | 180 |
| Brand 'ediya', Name 'Tendelection', and Price 72 | 88 | 85 | 70 |

신기하게도 단일 쿼리에 대해서는 단일 인덱스가 가장 빨랐지만, 아닌 경우에는 인덱스가 없거나 복합 인덱스가 빠른 것을 볼 수 있었다.

더군다나 복합 인덱스의 평균 성능은 인덱스 없는 케이스와 단일 인덱스 케이스보다 좋았다.

평균적으로 대략 25.6 ms, 13.06% 개선된 것을 볼 수 있다.

## 왜 Composite Index 가 Single Index 보다 빨랐을까?

이건 당연하다.

왜냐하면 복합 인덱스는 복합필드의 순서에 따라 정렬이 되어있기 때문이다.

만약 아래와 같이 데이터가 구성되어있다고 치자.

```sql
ID | first_name | last_name    | class      | position |
--------------------------------------------------------
 1 | Teemo      | Shroomer     | Specialist | Top      |
 2 | Cecil      | Heimerdinger | Specialist | Mid      |
 3 | Annie      | Hastur       | Mage       | Mid      |
 4 | Fiora      | Laurent      | Slayer     | Top      |
 5 | Garen      | Crownguard   | Fighter    | Top      |
 6 | Malcolm    | Graves       | Specialist | ADC      |
 7 | Irelia     | Lito         | Figher     | Top      |
 8 | Janna      | Windforce    | Controller | Support  |
 9 | Jarvan     | Lightshield  | Figher     | Top      |
10 | Katarina   | DuCouteau    | Assassin   | Mid      |
11 | Kayle      | Hex          | Specialist | Top      |
12 | Emilia     | LeBlanc      | Mage       | Mid      |
13 | Lee        | Sin          | Fighter    | Jungle   |
14 | Lux        | Crownguard   | Mage       | Mid      |
15 | Sarah      | Fortune      | Marksman   | ADC      |
16 | Morgana    | Hex          | Controller | Support  |
17 | Orianna    | Reveck       | Mage       | Mid      |
18 | Sona       | Buvelle      | Controller | Support  |
19 | Jericho    | Swain        | Mage       | Mid      |
20 | Shauna     | Vayne        | Marksman   | ADC      |
21 | Xin        | Zhao         | Fighter    | Jungle   |
22 | Yorick     | Mori         | Tank       | Top      |
23 | Wu         | Kong         | Fighter    | Jungle   |
```

이에 대해 아래와 같이 인덱스가 처리되었다고 하자.

```sql
CREATE INDEX class_pos_index ON users (class, position);
```

이에 따라 데이터는 아래와 같이 저장되게끔 된다.

```sql
class-position       Primary Key
--------------------------------
AssassinMid       -> 10
ControllerSupport -> 16
ControllerSupport -> 18
ControllerSupport -> 8
FigherTop         -> 7
FigherTop         -> 9
FighterJungle     -> 13
FighterJungle     -> 21
FighterJungle     -> 23
FighterTop        -> 5
MageMid           -> 12
MageMid           -> 14
MageMid           -> 17
MageMid           -> 19
MageMid           -> 3
MarksmanADC       -> 15
MarksmanADC       -> 20
SlayerTop         -> 4
SpecialistADC     -> 6
SpecialistMid     -> 2
SpecialistTop     -> 1
SpecialistTop     -> 11
TankTop           -> 22
```

따라서 복합 인덱스가 여러개의 조건조회에 대해 평균적으로 성능이 좋을 수 밖에 없다.

## 그렇다면 Composite Index 가 최고인가?

아니다.

인덱스는 추가 데이터를 쌓기에 테이블의 데이터가 많아질수록 인덱스가 차지하는 메모리가 많아지게된다.

또한 Composite Index 는 Composite Order 또한 중요하다.

아래는 Composite Order 에 대한 Guideline 이다.

- High Cardinality First : 가장 유니크한 컬럼 먼저
    - High cardinality columns, with many distinct values, can narrow down the search range more effectively than low cardinality columns.
- Follow Logical Order : 정렬,필터링의 순서를 유지하라
    - Logical order columns, which follow a natural or meaningful sequence, may help to avoid sorting the result set if they match the query order.

이외에도 수많은 가이드라인이 있으나 모두를 취할 수는 없다. 당장 앞 두가지만 하더라도 충돌된다.

따라서 “요구사항에 맞는 합성처리”를 하는 게 현명하다.

# 아무래도 인덱스 적용은 실무에서는 적용하기 어렵겠다 싶다.

---

index 자체가 manipulation 에 영향을 많이 끼치므로 삽입삭제와 같은 manipulation 이 적은 테이블에 index 처리를 하는 게 맞다. 

다만!

어디 그런 테이블이 있냐 이 말이다.

주소나 회사코드와 같이 정적인 테이블은 현업에서 존재하기란 어렵다.

실제 erd 에서는 manipulation 이 적은 테이블이 어디 있을까 싶다.

# 인덱스 적용 시 주의점

---

> 이 부분에 대해서는 여러 의견이 갈리나 아래 내용이 가장 적절한 조언인 것 같아 가져와보았다.
> 

[What should be considered before adding an index on a MySQL table? Can it negatively impact performance?](https://www.quora.com/What-should-be-considered-before-adding-an-index-on-a-MySQL-table-Can-it-negatively-impact-performance)

1. Only if it's needed
    
    Never “pre-emptively” add indexes to tables that are unused by the current set of queries accessing the table.
    Add them only if they make important queries faster.
    
2. Be aware of potential costs
    
    There are a few potential costs of adding new indexes:
    
    - Time to do INSERTs, DELETEs, and UPDATEs can be impaired, as indexes have to be dealt with as well as the base table. This can be significant if there are many indexes on the table.
    - Indexes take storage space. A lot of indexes can take a lot of storage space.
    - More indexes take more buffer pool space. Index records will end up in the buffer pool even if the index itself isn’t used if the table is frequently written to.
    - Indexes can make query planning more difficult for the query optimizer, which could hurt the overall performance of queries against the table.

# Reference

---

[[Database] 인덱스(index)란?](https://mangkyu.tistory.com/96)

[[MySQL] B-Tree로 인덱스(Index)에 대해 쉽고 완벽하게 이해하기](https://mangkyu.tistory.com/286)

[[MySQL] 프라이머리 키(PK, Primary Key)에 대해 쉽고 완벽하게 이해하기](https://mangkyu.tistory.com/285)

[What do Clustered and Non-Clustered index actually mean?](https://stackoverflow.com/questions/1251636/what-do-clustered-and-non-clustered-index-actually-mean)

[When should you use a composite index in database performance and scalability?](https://www.linkedin.com/advice/0/when-should-you-use-composite-index-database-qa4tc)

[Single vs Composite Indexes in Relational Databases](https://user3141592.medium.com/single-vs-composite-indexes-in-relational-databases-58d0eb045cbe)

[https://velog.io/@kwontae1313/복합인덱스#:~:text=복합 인덱스(Composite Index)는,하여 인덱스를 생성한다](https://velog.io/@kwontae1313/%EB%B3%B5%ED%95%A9%EC%9D%B8%EB%8D%B1%EC%8A%A4#:~:text=%EB%B3%B5%ED%95%A9%20%EC%9D%B8%EB%8D%B1%EC%8A%A4(Composite%20Index)%EB%8A%94,%ED%95%98%EC%97%AC%20%EC%9D%B8%EB%8D%B1%EC%8A%A4%EB%A5%BC%20%EC%83%9D%EC%84%B1%ED%95%9C%EB%8B%A4).

[복합 인덱스의 이해와 활용](https://f-lab.kr/insight/understanding-composite-indexes)
