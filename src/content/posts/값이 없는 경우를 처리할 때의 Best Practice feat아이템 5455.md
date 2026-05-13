---
title: "값이 없는 경우를 처리할 때의 Best Practice? (feat.아이템 54,55)"
description: "https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/Optional.html"
date: 2026-02-25
tags: [java]
category: uncategorized
lang: ko
draft: false
---

# Why? 왜 배움?

---

> ***비즈니스 로직 상, 값이 없는 경우를 어떻게 처리해주어야할까? 과연 어떤 방법이 best practice일까?? ***

# What? 뭘 배움?

---

## null 반환을 “지양”해야하는 이유

- null 반환

## 빈 배열 혹은 빈 불변 컬렉션 반환 시의 이점

- 빈 배열 || 빈 불변 컬렉션 반환

## 값 반환 불가 케이스 대처법 세 가지

- 예외를 throw
- null 반환
- Optional 반환

## 옵셔널이란? 

> A container object which may or may not contain a non-`null` value. 

[https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/Optional.html](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/Optional.html)

## 옵셔널을 쓸 때의 이점

- 데이터값을 가지거나 혹은 null값을 가지는 컨테이너
- **null이 발생할 수 있음을 API 사용자에게 알려줄 수 있음**

## 옵셔널 잘 사용하기

1. null 케이스에 대한 기본값 설정
2. null 케이스에 대한 예외 처리 설정
3. null 케이스가 없다고 가정

## 옵셔널 사용주의점

1. 컬렉션,스트림,배열,옵셔널 같은 컨테이너타입은 옵셔널로 감싸면 안 됨!
2. 결과가 없을 수 있으며, 클라이언트가 이 상황을 특별하게 처리해야하는 경우 Optional<T>를 반환
3. 박싱된 기본타입에 대해서는 OptionalInt와 같은 타입이 존재하므로 유념하자.
4. 인스턴스의 키 값으로 옵셔널 사용을 “지양”하자.

## QueryDSL에 비어있는 값들에 대한 핸들링 

### QueryDSL :: BooleanExpression 사용

동적 쿼리 핸들링을 위해서
Querydsl의 `where `에 조건문을 쓰되 파라미터가 비어있다면, 해당 파라미터의 조건절에서 생략되었으면 한다.
Querydsl에서는 이럴땔 대비해서 `BooleanExpression`을 지원하여 null이 파라미터로 올 경우 조건문에서 제외해준다.

- 방법1
- 방법2

> 이외에도 여러가지 응용방법이 있겠다.

### QueryDSL ::  Optional.ofNullable 사용

```java
default Optional<Correlation> findOne(
        @Nonnull final String value, @Nullable final String environment,
        @Nullable final String application, @Nullable final String service) {
    final QSome Some = QSome.some;
    final BooleanBuilder builder = new BooleanBuilder();
    ofNullable(service).map(some.service::eq).map(builder::and);
    ofNullable(application).map(some.application::eq).map(builder::and);
    ofNullable(environment).map(some.environment::eq).map(builder::and);
    builder.and(some.value.eq(value));
    return findOne(builder);
}
```
```java
@RequiredArgsConstructor
@Repository
public class BookQueryRepository {

    private final JPAQueryFactory queryFactory;
    
    public Optional<Book> findByIdx(Long idx) {
        return Optional.ofNullable(queryFactory
                .selectFrom(book)
                .where(
                        book.idx.eq(idx)
                )
                .fetchOne());
    }
}
```

[https://kkambi.tistory.com/193](https://kkambi.tistory.com/193)
[https://stackoverflow.com/questions/23750528/handle-optional-parameters-in-querydsl/23896303#23896303](https://stackoverflow.com/questions/23750528/handle-optional-parameters-in-querydsl/23896303#23896303)
