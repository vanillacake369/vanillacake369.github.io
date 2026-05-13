---
title: "Concurrency Control in SpringBoot, MongoDB"
description: ""
date: 2024-05-28
tags: [Java]
category: uncategorized
lang: ko
draft: false
---

# CRUD Tutorial in Spring Boot with MongoDB

[https://www.mongodb.com/resources/products/compatibilities/spring-boot](https://www.mongodb.com/resources/products/compatibilities/spring-boot)

# BaseEntity for document entity

[https://velog.io/@hanblueblue/프로젝트3-3.-관계형-DB에-맞춰-작성된-코드를-NoSQL에-알맞게-변경한다](https://velog.io/@hanblueblue/프로젝트3-3.-관계형-DB에-맞춰-작성된-코드를-NoSQL에-알맞게-변경한다)

# MongoRepository vs MongoTemplate

[https://dev.to/shadowphoenix/comment/139pahttps://medium.com/@prekshaan95/difference-between-spring-boot-mongotemplate-and-mongorepository-6da468bd716a](https://dev.to/shadowphoenix/comment/139pahttps://medium.com/@prekshaan95/difference-between-spring-boot-mongotemplate-and-mongorepository-6da468bd716a)

> Spring write a logic for you -> MongoRepository
> Developer write complex custom logic -> MongoTemplate

- MongoRepository
- MongoTemplate

보통 hybrid 식으로 많이들 처리하는 것 같다 (이러면 infra 모듈로 어떻게 뜯어내지?? 싶지만,,,)

```kotlin
@Service
class BoardService(
        private val boardRepository: BoardRepository,
        private val mongoTemplate: MongoTemplate,
){

```

# In-Memory MongoDB Test :: Embeded MongoDB

[https://www.baeldung.com/spring-boot-embedded-mongodb](https://www.baeldung.com/spring-boot-embedded-mongodb)

# Load init script for MongoDB Test in spring boot

[https://devs0n.tistory.com/49](https://devs0n.tistory.com/49)

# MongoTemplate : Query & Criteria

[https://github.com/eugenp/tutorials/tree/master/persistence-modules/spring-data-mongodb](https://github.com/eugenp/tutorials/tree/master/persistence-modules/spring-data-mongodb)
[https://www.baeldung.com/queries-in-spring-data-mongodb](https://www.baeldung.com/queries-in-spring-data-mongodb)
[https://javatechonline.com/mongotemplate-spring-boot-examples/](https://javatechonline.com/mongotemplate-spring-boot-examples/)

# [ERROR] **Argument passed in must be a string of 24 hex characters**

[https://velog.io/@onezerokang/오늘의-에러-Argument-passed-in-must-be-a-string-of-24-hex-characters](https://velog.io/@onezerokang/오늘의-에러-Argument-passed-in-must-be-a-string-of-24-hex-characters)

**Argument passed in must be a string of 24 hex characters**이 에러를 자주 만나서 확실히 공부하고 기록하면 다음에 해결하는데 시간이 적게 걸릴 것이라 생각했고 공부했다.
이 에러가 발생하는 이유는 **ObjectId가 들어가야 할 곳에 다른 값이 들어갔기 때문이다. 그래서 ObjectId를 넣어주면된다**(String으로 된 id를 넣어도 정상동작한다)

# MongoDB Shell Commands

- Install & Run & Connect to mongo shell in docker container
- Show DB / Table / Collections
For database list:
For table/collection list:
- MongoDB Show Current User
- View all contents of collection
- Remove all contents of collection
- Insert single data in collection
- Find single data by condition in collection
- Remove single data by condition in collection

# About ObjectId

[https://medium.com/@wonjerry24/mongodb-objectid는-유일성을-보장할까-788a3b0c3554](https://medium.com/@wonjerry24/mongodb-objectid는-유일성을-보장할까-788a3b0c3554)

# Exampla : **MongoTemplate findAndModify 활용**

[https://junuuu.tistory.com/m/985](https://junuuu.tistory.com/m/985)
