---
title: "ERROR : JPA가 정상동작하는데 Table을 생성하지 않는 이슈"
description: ""
date: 2024-01-30
tags: [Java]
category: uncategorized
lang: ko
draft: false
---

## JPA가 자동으로 테이블을 변경해주어야 하는 이유

---

응….그냥 매핑을 해주는, 개발자를 위한 편의기능이라고 보면 된다!
테스트에도 용이하다고 나와있고(chat gpt 왈), 엔티티에 대한 변경사항이 생기게 되면 자동으로 테이블을 변경해주므로 시간을 절약할 수 있다.

## JPA가 테이블을 생성해내지 않는 이유

---

드디어,,,!!
드디어 몇 시간의 삽질에 해결했다!!


1. jpa의 platform을 지정해주었다. 자동으로 설정하게 두면, 혹여나 H2 DB에 접근하려나 싶었기 때문이다.
2. 그 다음 hibernate의 ddl-auto를 create-drop이 아닌 create로 두었다.
3. generate-ddl을 true로 설정하였다. 스키마를 정의하는 언어인 ddl문을 생성할 수 있게 옵션을 켜놓는 것이다.

```yaml
jpa:
    properties:
      hibernate:
        ddl-auto: create # update
        show_sql: true
    show-sql: true
    database-platform: org.hibernate.dialect.MySQL5Dialect
    generate-ddl: true
```


잘못된 mapping에 의해 에러가 났지만, 이건 entity 설정이 잘못된 것 같다.
이건 엔티티 연관관계에 대해 다시 공부해봐야겠다.


아무튼 JPA의 테이블 생성은 정상작동된다!!!!

**아래 링크에 JPA 동작방법이 잘 나와있다!! (영한님 책 설명인데,,굉장한 것 같다)
[https://lob-dev.tistory.com/49](https://lob-dev.tistory.com/49)
