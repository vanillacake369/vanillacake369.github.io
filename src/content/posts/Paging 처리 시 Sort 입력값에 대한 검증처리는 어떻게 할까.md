---
description: "Pageable의 Sort 파라미터로 엔티티에 없는 필드가 들어올 때 검증하는 OrderCriteriaValidator 구현 방법을 소개한다."
date: 2026-02-25
tags: [java]
lang: ko
draft: false
---

# Why(What For?) 🤷‍♂️

> 조건에 따른 동적 검색 & 페이징 처리를 구현하고 있었다.

# What(What should I know?) 👇

> 혹시나 참고하실 분들은 냠냠꿀꺽하고 가져가시길 바란다.

<details>
<summary>코드</summary>

```java
public final class OrderCriteriaValidator {

    /**
     * Entity에 대한 정렬기준치 입력값에 대한 검증
     *
     * @param target   도메인 엔티티 클래스 정보
     * @param pageable pageable 입력값
     * @throws GlobalException if Entity has no field by name of pageable sort
     * @author 임지훈
     */
    public static void validateOrderCriteria(Class<?> target, Pageable pageable) throws GlobalException {
        List<String> orderCriterias = pageable.getSort().stream()
            .map(Sort.Order::getProperty)
            .toList();

        if (orderCriterias.isEmpty()) {
            return;
        }
        List<String> fields = Arrays.stream(target.getDeclaredFields())
            .map(Field::getName)
            .toList();
        boolean hasNotOrderCriteria = orderCriterias.stream()
            .anyMatch(criteria -> !fields.contains(criteria));
        if (hasNotOrderCriteria) {
            throw new GlobalException(ResultCase.INVALID_ORDER_CRITERIA);
        }
    }
}
```

</details>

- 입력한 정렬기준값이 아예 없다면 통과한다.
- 해당 도메인에 대한 클래스 정보를 가져온다 (target)
- 도메인에 대한 필드값들을 String으로 가져온다.
- 정렬기준값이 필드값들과 매칭되지 않는다면 예외처리를 한다.

![](/images/notion/d9e77fb7f361caea.png)

# How(How to apply to code?) ✍️

> 사용법은 아래와 같다.

![](/images/notion/f14e2c32f30ca30e.png)

> 궁금해서 테스트도 돌려보았는데, 잘 통과하는 것을 볼 수 있다.

![](/images/notion/37aeab9915da2f46.png)
![](/images/notion/328e038700d6b9a5.png)
