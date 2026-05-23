---
description: "QueryDSL에서 count 쿼리를 처리할 때 stream().count() 대신 fetchFirst()를 써야 하는 이유와, group by가 포함된 공통 쿼리에서 count를 분리하는 방법을 정리한다."
tags: [java]
lang: ko
draft: false
---

# Episode 📜

count 쿼리에 대한 에러가 발생한다는 리포트를 보고 코드를 수정 중에 코드 스멜을 감지해서 오랜만에 글을 작성한다. (원인조차 몰라 한참을 헤맸다,,,)

비슷해보이는 아래 두 코드에서는 서로 다른 결과를 반환한다. 첫 번째는 동일한 count 쿼리를 실행하지만 10개를 반환하고 — 비정상, 두 번째는 65888개를 반환한다. — 정상, 왜일까?

### 첫 번째

```java
private <T> JPAQuery<T> searchListQuery(Expression<T> select, HtmlFailQueryRequest request) {
  JPAQuery<T> query = select(select)
      .from(parsingErrorLog)
      .join(crawling).on(crawling.craIdx.eq(parsingErrorLog.craIdx))
      .join(adminCustomer).on(adminCustomer.acIdx.eq(crawling.acIdx))
      .join(admin).on(admin.admIdx.eq(adminCustomer.admIdx))
      .join(customer).on(customer.cusIdx.eq(adminCustomer.cusIdx))
      // 크롤링 실패일 필터
      .where(request.getLink() == null || request.getLink().isEmpty() ? null : parsingErrorLog.pelLink.contains(request.getLink()))
      // 링크 검색 필터
      .where(request.getCrsd() == null ? null : parsingErrorLog.createdAt.goe(request.getCrsd()))
      .where(request.getCred() == null ? null : parsingErrorLog.createdAt.loe(request.getCred()));

  if (!Long.class.isAssignableFrom(select.getType())) {
    if (request.isPaging()) {
      query
          .offset(request.setOffset())
          .limit(request.getSize());
    }
  }

  return query;
}

@Override
public Long countList(HtmlFailQueryRequest historyQueryRequest) {
  Long count = searchListQuery(parsingErrorLog.count(), historyQueryRequest).fetchOne();
  log.info("count : {}", count);
  return count;
}
```

![](/images/notion/7e0ffe8b84f1813a.png)

### 두 번째

```java
private <T> JPAQuery<T> searchListQuery(Expression<T> select, HtmlFailQueryRequest request) {
  JPAQuery<T> query = select(select)
      .from(parsingErrorLog)
      .join(crawling).on(crawling.craIdx.eq(parsingErrorLog.craIdx))
      .join(adminCustomer).on(adminCustomer.acIdx.eq(crawling.acIdx))
      .join(admin).on(admin.admIdx.eq(adminCustomer.admIdx))
      .join(customer).on(customer.cusIdx.eq(adminCustomer.cusIdx))
      // 크롤링 실패일 필터
      .where(request.getLink() == null || request.getLink().isEmpty() ? null : parsingErrorLog.pelLink.contains(request.getLink()))
      // 링크 검색 필터
      .where(request.getCrsd() == null ? null : parsingErrorLog.createdAt.goe(request.getCrsd()))
      .where(request.getCred() == null ? null : parsingErrorLog.createdAt.loe(request.getCred()));

  if (!Long.class.isAssignableFrom(select.getType())) {
    if (request.isPaging()) {
      query
          .offset(request.setOffset())
          .limit(request.getSize());
    }
  }

  return query;
}


@Override
public Long countList(Long admIdx, HtmlFailQueryRequest historyQueryRequest) {
  return searchListQuery(parsingErrorLog.count(), admIdx, historyQueryRequest).stream().count();
}
```

![](/images/notion/5491ce2149a0ddcd.png)

# Reason of Err 🤷‍♂️

> `stream().count()`는 내부적으로 JAVA 8 Stream API를 사용하여 불안정하기 때문이다.

![](/images/notion/876e888ee1832afd.png)
![](/images/notion/195cbf13f6da547f.png)

위는 디버깅 포인트를 통해 실제 `stream().count()`가 내부적으로 어떻게 돌아가는지를 보여주는 것이다. `parsingErrorLog.count() & stream().count()`를 사용한 count 처리는 다음 단계들로 나뉜다.

1. 우선 첫 번째로 `count(parsingErrorLog)`를 수행한다.
2. 그 다음 `new Long()`을 통해 Stream 인스턴스를 만들게 된다.
3. 이후 Stream을 memory에 fetch하여 Stream의 크기를 count한다.

여기서 문제는 1, 2번이다. `new Long(count(parsingErrorLog))`를 수행하게 될 때, fetch된 `count(parsingErrorLog)`는 한 개가 된다(당연하다. count query를 통해 parsingErrorLog 개수를 가져왔으니). 즉, 65388을 가지고 있는 Long 인스턴스 하나가 생성되는 것이다. 이에 대해 Stream을 생성하고 count를 수행하니 당연히 1이 나올 수밖에 없다. 65388을 가지고 있는 Long 인스턴스는 하나이기 때문이다.[^1]

# How to fix 🔧

`stream().count()` 처리 방법은 java agnostic, 즉 java 지향적이다. 모든 결과를 fetch한 뒤 java를 통해 순회하며 개수를 세므로 불필요한 작업이 수행된다. 따라서 count()에 대한 `fetchFirst()`를 사용하도록 하자. `fetchCount()`, `fetchResults()`는 deprecated되었다.[^2]

### `fetchFirst()`

- **Database-Native**: This method relies on the database to perform the counting operation. The `COUNT` function in SQL is executed directly by the database, which is highly optimized for such operations.
- **Efficiency**: The database engine counts the rows and returns a single result. This minimizes data transfer and leverages the database's optimized algorithms.
- **Consistency**: The result is consistent with the state of the database at the time the query is executed.

### `stream().count()`

- **Application Layer**: This approach retrieves all matching records from the database and then counts them in the application layer using Java's Stream API.
- **Inefficiency**: The query first retrieves all matching records, which can be resource-intensive and slow, especially for large datasets. It then counts the records in memory, which is less efficient than performing the count directly in the database.
- **Potential for Inconsistency**: If data changes during the fetching process, the count might not be accurate. There's also a higher chance of running into performance and memory issues due to large result sets.

위와 같은 이유로 인해 count 쿼리를 통해 페이지네이션을 처리할 때는 `fetchOne()`을 권장한다. 이 방법이 조금 더 database 지향적인 방법이다(불필요한 java memory 사용도 없애고 말이다).

## select, count 메서드를 이렇게 쓰면 코드스멜! 🚨

데이터 조회 메서드를 아래와 같이 작성했다.

```java
/**
 * @param select
 * @param req
 * @param admIdx api call 한 관리자 admIdx
 * @param <T>
 * @return 고객사 관련 정보, 연결된 관리자/크롤링/LLM count
 */
private <T> JPAQuery<T> getCustomerSearchListQuery(Expression<T> select, CustomerSearchListGetReq req, Long admIdx) {
  JPAQuery<T> query = select(select)
      .from(customer)
      ,,,
      .where(customer.isDeleted.eq(IsDeleted.USABLE))
      ,,,
      .groupBy(customer.cusIdx)
      .orderBy(,,,);

  if (!Long.class.isAssignableFrom(select.getType())) {
    if (req.isPaging()) {
      query
          .offset(req.setOffset())
          .limit(req.getSize());
    }
}
```

이렇게 작성한 데이터 조회 메서드를 아래와 같이 1. 말그대로 select 하는 메서드 하나, 2. count 하는 메서드 하나를 작성하여 호출해주었다.

```java
@Override
public List<CustomerSearchListGetRes> getCustomerSearchList(
    CustomerSearchListGetReq req, Long admIdx
) {
  Expression<CustomerSearchListGetRes> select = Projections.fields(
      CustomerSearchListGetRes.class,
      Projections.fields(
          CustomerInfoGetRes.class,
          customer.cusIdx,
          customer.cusName,
          customer.cusPhone,
          customer.cusAddress,
          customer.cusAddressDetail,
          customer.cusPostCode,
          adminCustomer.acIdx,
          adminCustomer.acNote,
          customer.createdAt
      ).as("customerInfoGetRes"),
      adminCustomer.acIdx.count().as("countAcIdx"),
      crawling.craIdx.count().as("countCraIdx"),
      lLM.llIdx.count().as("countLlIdx")
  );

  return getCustomerSearchListQuery(select, req, admIdx).fetch();
}

@Override
public Long getCustomerSearchListCount(CustomerSearchListGetReq req, Long admIdx) {
  return getCustomerSearchListQuery(customer.cusIdx.count(), req, admIdx).fetchOne();
}
```

여기서 문제가 발생한다. 처음 단추부터 잘못 끼운 것이다.

```sql
select *
from `hama_customer` c1_0
         left join
     `hama_admin_customer` a1_0
     on a1_0.`cus_idx` = c1_0.`cus_idx`
         left join
     `hama_lucy_keyword` l1_0
     on l1_0.`ac_idx` = a1_0.`ac_idx`
         left join
     `hama_portal_keyword` p1_0
     on p1_0.`ac_idx` = a1_0.`ac_idx`
         left join
     `hama_crawling` c2_0
     on c2_0.`ac_idx` = a1_0.`ac_idx`
         left join
     `hama_llm` l2_0
     on l2_0.`cra_idx` = c2_0.`cra_idx`
where c1_0.`is_deleted` = 0
  and (
    a1_0.`adm_idx` = 3
        and a1_0.`ac_status` = 1
    )
group by c1_0.`cus_idx`, c1_0.`created_at`
order by c1_0.`created_at` desc;
```

이 로직은 group by, order by를 사용했으므로 result 그대로를 내뱉는다. 따라서 아래와 같이 결과를 반환한다.

![](/images/notion/943adc6262524db7.png)

이 쿼리를 기반으로 `count(customer.cusIdx)`를 호출하면 어떻게 될까? 이런 쿼리가 작성되고, 결과는 우리의 예상을 벗어난다.

```sql
select count(c1_0.cus_idx)
from `hama_customer` c1_0
         left join
     `hama_admin_customer` a1_0
     on a1_0.`cus_idx` = c1_0.`cus_idx`
         left join
     `hama_lucy_keyword` l1_0
     on l1_0.`ac_idx` = a1_0.`ac_idx`
         left join
     `hama_portal_keyword` p1_0
     on p1_0.`ac_idx` = a1_0.`ac_idx`
         left join
     `hama_crawling` c2_0
     on c2_0.`ac_idx` = a1_0.`ac_idx`
         left join
     `hama_llm` l2_0
     on l2_0.`cra_idx` = c2_0.`cra_idx`
where c1_0.`is_deleted` = 0
  and (
    a1_0.`adm_idx` = 3
        and a1_0.`ac_status` = 1
    )
group by c1_0.`cus_idx`, c1_0.`created_at`
order by c1_0.`created_at` desc;
```

![](/images/notion/a2717821a25cc6ad.png)

왜일까? 우리가 공통쿼리로 group by를 처리했기 때문이다. count() 대상인 cusIdx를 group by에 추가함으로써 각각의 cusIdx 그룹들에 대한 row count를 반환하게 된다.[^3]

## 이렇게 바꿔줄 수 있다 🛠️

어떻게 하면 이를 분리할까? 쉽다. 메서드 분리만 잘 해주면 된다.

1. count 쿼리라면 count 쿼리에 필요한 조건절을 적용한다.
2. count 쿼리가 아니라면 select 절에 필요한 조건절을 적용해준다.
3. count 쿼리가 아니고 && 페이징처리가 맞다면, 페이지네이션을 적용한다.

필자는 아래와 같이 함수형 인터페이스를 작성하고 사내 QueryDsl 추상클래스에 조건분기절에 따라 적용할 수 있게끔 구현해주었다.[^4]

```java
@FunctionalInterface
public interface QuerydslFilterApplier<T> {

  void modify(JPAQuery<T> query);
}
```

```java
@SafeVarargs
protected final <T> void applyFiltersIfNotCountQuery(JPAQuery<T> query, Expression<T> select, QuerydslFilterApplier<T>... filters) {
  if (!Long.class.isAssignableFrom(select.getType())) {
    for (QuerydslFilterApplier<T> filter : filters) {
      filter.modify(query);
    }
  }
}

@SafeVarargs
protected final <T> void applyFiltersIfCountQuery(JPAQuery<T> query, Expression<T> select, QuerydslFilterApplier<T>... filters) {
  if (Long.class.isAssignableFrom(select.getType())) {
    for (QuerydslFilterApplier<T> filter : filters) {
      filter.modify(query);
    }
  }
}

protected final <T> void applyPaginationIfPaging(JPAQuery<T> query, Expression<T> select, SearchRequest req) {
  if (!Long.class.isAssignableFrom(select.getType()) && req.isPaging()) {
    query
        .offset(req.setOffset())
        .limit(req.getSize());
  }
}
```

이제 이렇게 작성된 메서드를 알맞게 적용해준다.

```java

  /**
   * @param select
   * @param req
   * @param admIdx api call 한 관리자 admIdx
   * @param <T>
   * @return 고객사 관련 정보, 연결된 관리자/크롤링/LLM count
   */
  private <T> JPAQuery<T> getCustomerSearchListQuery(Expression<T> select, CustomerSearchListGetReq req, Long admIdx) {
    JPAQuery<T> query = select(select)
        .from(customer)
        .leftJoin(adminCustomer).on(adminCustomer.cusIdx.eq(customer.cusIdx))
        .leftJoin(lucyKeyword).on(lucyKeyword.acIdx.eq(adminCustomer.acIdx))
        .leftJoin(portalKeyword).on(portalKeyword.acIdx.eq(adminCustomer.acIdx))
        .leftJoin(crawling).on(crawling.acIdx.eq(adminCustomer.acIdx))
        .leftJoin(lLM).on(lLM.craIdx.eq(crawling.craIdx))
        .where(customer.isDeleted.eq(IsDeleted.USABLE))
        .where(admIdx == 0L ?
            reqAdmIdxEq(req.getAdmIdx()) :
            adminCustomer.admIdx.eq(admIdx).and(adminCustomer.acStatus.eq(1)))
        .where(_searchConditions(req))
        .orderBy(createOrderFilter(req, this::_searchOrderFilter));

    applyFiltersIfNotCountQuery(query, select, q -> q.groupBy(customer.cusIdx));
    applyPaginationIfPaging(query, select, req);

    return query;
  }
```

```java
public Long getCustomerSearchListCount(CustomerSearchListGetReq req, Long admIdx) {
  return getCustomerSearchListQuery(customer.cusIdx.countDistinct(), req, admIdx).fetchFirst();
}
```

이를 통해 조금 더 가독성이 높고 리팩터하기 쉬운 코드로 변신했다.

![](/images/notion/b47af4fd3f0d14c0.png)

# +) Query 처리순서 > 쿼리튜닝 방법 암기

좋은 글이 있어 가져와봤다. HAVING 절은 POST AGGREGATION에 대해 적용되므로 AGGREGATE RESULT에 적용하는 것이 아니라면 최대한 WHERE 절로 옮기는 게 좋다.[^5]

근데 이러한 것을 알고 넘기는 것보다 더 중요한 것은 단순히 QUERY 처리순서를 이해하는 것이다. 처리순서를 이해하면 자연스레 알게된다는 것이다.

> Solomon gives very good explanations, but to me, the easy answer is to remember the SQL query logical processing order as Itzik Ben-Gan wrote [here](http://www.itprotoday.com/microsoft-sql-server/logical-query-processing-what-it-and-what-it-means-you) The sequence is always

[^1]: `stream().count()`는 DB에서 반환된 Long 인스턴스 자체를 Stream으로 감싸 개수를 세기 때문에, count 결과값이 아닌 인스턴스 수(항상 1)를 반환한다.

[^2]: QueryDSL 5.x부터 `fetchCount()`와 `fetchResults()`는 deprecated되었다. <https://querydsl.com/static/querydsl/5.0.0/apidocs/com/querydsl/jpa/impl/JPAQuery.html>

[^3]: group by 절이 포함된 공통 쿼리에 count를 그대로 적용하면 그룹별 row count를 반환하게 되어 의도한 전체 건수와 달라진다.

[^4]: 함수형 인터페이스를 활용한 QueryDSL 필터 분리 패턴은 count/select 쿼리 간 조건절 충돌을 방지하는 실용적인 방법이다.

[^5]: SQL 논리 처리 순서: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY. HAVING은 집계 이후에 적용되므로 집계가 필요 없는 조건은 WHERE에 두는 것이 성능상 유리하다.
