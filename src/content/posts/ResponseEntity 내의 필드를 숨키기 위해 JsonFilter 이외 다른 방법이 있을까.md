---
description: "ResponseEntity에서 필터를 통해 원하는 데이터는 노출시키고, 원치 않는 데이터는 노출시키지 않는 방법을 알고 싶었다."
date: 2026-02-25
tags: [java]
lang: ko
draft: false
---

# Why(What For?) 🤷‍♂️

ResponseEntity에서 필터를 통해 원하는 데이터는 노출시키고, 원치 않는 데이터는 노출시키지 않는 방법을 알고 싶었다.

# What(What should I know?) 👇

## JsonFilter 사용하기

인프런의 스프링부트로 만드는 REST API 강의에서는 1) `@JsonFilter`라는 어노테이션을 엔티티에 달고, 2) `FilterProvider`필터를 직접 만들고, 3) MappingJacksonValue에 결과데이터와 필터를 매핑시킨다.

```java
@JsonFilter("UserInfo")
public class User {
	...
}

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin")
public class AdminUserController {
	...
		@GetMapping(value = "users/{id}/",headers = "X-API-VERSION=2")
    public MappingJacksonValue retrieveUserVersion2(@PathVariable int id) {
				...
				SimpleBeanPropertyFilter filter = SimpleBeanPropertyFilter
                .filterOutAllExcept("id", "name", "joinDate", "ssn","address");

        FilterProvider filters = new SimpleFilterProvider().addFilter("UserInfo2",filter);

        MappingJacksonValue mapping = new MappingJacksonValue(userV2);
        mapping.setFilters(filters);
				...
		}
	...
}
```

## 다른 방법은??

> 아직,, 공부가 부족하지만 찾아봐야 할 것 같다.

일단은 아래와 같은 방법이 가능하다고 되어있다.

### Using`@JsonFilter` directly, is not tht recommended.

Putting the **`@JsonFilter`** directly on your entity classes may not always be the best practice.

While it provides a way to apply dynamic filtering on the JSON output for specific entities, it couples the serialization logic with the entity itself, which might not be desirable in some situations.

Instead,,, Use these :

1. **DTO (Data Transfer Object) Pattern:** Create separate DTO classes that represent the data you want to expose via your API.

These DTOs can be tailored to each specific endpoint and do not need to include all the fields present in the entity.

You can apply Jackson annotations directly to DTOs to control the serialization process. 2. **@JsonView Annotation:** The **`@JsonView`** annotation allows you to define different views of the same entity for serialization.

It separates the serialization logic from the entity and provides better control over what fields are included in the JSON output for different endpoints. 3. **Custom Serializers:** You can implement custom serializers in Jackson to have fine-grained control over how your entities are serialized to JSON.

Custom serializers give you more flexibility and can be applied conditionally based on the context of the serialization.

# How(So How?) ✍️
