---
title: "요청값에 대해 Immutable Object 로 바인딩 (feat. Spring MVC)"
description: "SprinMVC,SpringWebFlux 은 어떻게 요청값에 대한 POJO 바인딩을 할까? 어떻게하면 불변객체에 대한 값 바인딩을 지원할 수 있을까?"
date: 2025-02-26
tags: [journal]
lang: ko
draft: false
---

> 틀린 부분이 있다면 과감하게 댓글 남겨주세요 🤗

# Episode 📜


Spring 에서는 AOP 기반 `@ModelAttribute` 이나 `@RequestParam`을 통해 요청값을 POJO 에 바인딩을 지원한다.

이 때, JSON 에 대한 형태는 Jackson 의 ObjectMapper 를, 쿼리파라미터 형태의 값들은 Spring Web Bind 의 ModelAttributeMethodProcessor 를 사용한다.

이러한 값 바인딩 역할을 담당하는 컴포넌트들은

- (Reflection 을 활용한) Setter 사용
- (필드 주입에 따른) 필드값 매핑
- 생성자

를 통해 값을 바인딩한다.

,,, 까지가 내가 알고 있는 지식의 바다였다.

이를 기반으로 `불변객체 또한 Reflection 으로 처리되겠지` 라는 생각으로 아래와 같은 POJO 를 선언하여 쿼리파라미터들을 가져오고자 하였다.

```java
@Value
public class AllPremiumApplicationRequestV2 {

    @Parameter(description = "검색 시작일", example = "2007-12-03T10:15:30")
    LocalDate crsd;

    @Parameter(description = "검색 마감일", example = "2007-12-03T10:15:30")
    LocalDate cred;

    @Parameter(description = """
        진행상태 구분
        0: 거절
        1: 예약
        2: 진행 중
        3: 종료
        """)
    List<Integer> psProcess;
}

```

그리고 실제로 mockMvc 를 통해 통합테스트를 해보았다. 

```java
@Test
@DisplayName("모든 프리미엄 서비스 신청내역 조회 시 성공합니다.")
void 모든프리미엄서비스신청내역조회시성공() throws Exception {
    // GIVEN
    String apiV2Prefix = ApiPathPrefix.API_V2_PREFIX;
    String apiPath = "/choco/premium/application/all";
    String url = String.format("%s%s", apiV2Prefix, apiPath);
    LinkedMultiValueMap<String, String> requestParams = new LinkedMultiValueMap<>();
    requestParams.add("cursorId", "-1");
    requestParams.add("size", "20");
    requestParams.add("dir", "desc");
    requestParams.add("crsd", "2025-02-11");
    requestParams.add("cred", "2025-02-18");
    requestParams.add("psProcess[]", "1");
    requestParams.add("psProcess[]", "2");

    // WHEN
    // THEN
    this.mockMvc
        .perform(
            MockMvcRequestBuilders.get(url)
                .params(requestParams)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
        )
        .andDo(MockMvcResultHandlers.print())
        .andExpect(MockMvcResultMatchers.status().isOk())
        .andExpect(MockMvcResultMatchers.content().string(Matchers.containsString("cphJpIdx")));
}
```

그런데 이게 왠걸, psProcess 에 대한 값 바인딩이 안 되는 것이 아닌가?

반면에 `@Setter` 를 사용하여 처리했을 때는 값 바인딩이 잘 되는 것을 확인할 수 있었다.

어떤 사유로 처리가 안 되는지, 또 어떻게 해야 불변객체에 대해 값 바인딩을 할 수 있을지 알아보고자 한다.

# About 💁‍♂️


>
>💡
>
>TL;DR;
>
>- SpringMVC,SpringWebFlux 값 바인딩 기본전략은 setter 기반 주입
>- 생성자를 사용하게끔 하고자한다면 `WebDataBinder.initDirectFieldAccess()` 를 호출하여 `WebDataBinder` 의 `directFieldAccess` 를 true 로 바꿔주자

`@RequestParam`은 

- `RequestParamMethodArgumentResolver`
- `AbstractNamedValueMethodArgumentResolver`

등등을 통해 값 바인딩을 처리한다.

`@ModelAttribute`은 

- ModelAttributeMethodProcessor
- ServletModelAttributeMethodProcessor

등등을 통해 값 바인딩을 처리한다

- ModelAttribute 의 값 바인딩 순서
    
    ```java
    ModelAttributeMethodProcessor.resolveArgument() 
    -> ServletModelAttributeMethodProcessor.bindRequestParameters() 
    -> ServletRequestDataBinder.bind()
    -> WebDataBinder.doBind()
    -> WebDataBinder.adaptEmptyArrayIndices() // 여기서 [] 으로 넘어온 인자값 처리
    -> DataBinder.applyPropertyValues()
    -> AbstractNestablePropertyAccessor.setPropertyValue()
    -> AbstractNestablePropertyAccessor.setValue()
    	-> BeanWrapperImpl.setValue()
    		public void setValue(@Nullable Object value) throws Exception {
                PropertyDescriptor var4 = this.pd;
                Method var10000;
                if (var4 instanceof GenericTypeAwarePropertyDescriptor typeAwarePd) {
                    var10000 = typeAwarePd.getWriteMethodForActualAccess();
                } else {
                    var10000 = this.pd.getWriteMethod();
                }
    
                Method writeMethod = var10000;
                ReflectionUtils.makeAccessible(writeMethod);
                writeMethod.invoke(BeanWrapperImpl.this.getWrappedInstance(), value);
            }
    	-> DirectFieldAccessor.setValue()
    		public void setValue(@Nullable Object value) throws Exception {
                try {
                    ReflectionUtils.makeAccessible(this.field);
                    this.field.set(DirectFieldAccessor.this.getWrappedInstance(), value);
                } catch (IllegalAccessException ex) {
                    throw new InvalidPropertyException(DirectFieldAccessor.this.getWrappedClass(), this.field.getName(), "Field is not accessible", ex);
                }
            }
    ```
    

중요한 건 둘 다 최종적으로 `WebDataBinder`컴포넌트의 doBind()를 통해 값 바인딩을 한다는 것이다.

이 때, 아래 그림과 같이 부모 클래스인 DataBinder 의 doBind() 를 호출하고 있는 것을 볼 수 있다.

(이전 메서드들은 함수명 그대로 동작하니 궁금하면 직접 뜯어보자)

![](/images/velog/5d96adbbbc647598.png)

DataBinder 는 최종적으로 `applyPropertyValues()`를 통해 값 바인딩을 처리한다.

(이전 메서드들 또한 함수명 그대로 동작한다.

궁금하면 직접 ㄱㄱ)

![](/images/velog/0f90a4d263ed53aa.png)

해당 메서드는 내부적으로 `getPropertyAccessor().setPropertyValues()`를 호출하고 있다.

그럼 이 친구는 또 어떤 처리를 하고 있을까?

![](/images/velog/bd4556f7829682df.png)

아래와 같이 `directFieldAccess`값을 확인하여 값 바인딩 전략을 지정한다.

이 때 만약 `directFieldAccess`이 

- true 라면
    - `DirectFieldAccessor`의  생성자 기반의 값 바인딩 처리
- false 라면
    - `DirectFieldAccessFallbackBeanWrapper`의 setter 기반의 값 바인딩 처리

하게 된다.

![](/images/velog/634573ad49df1b31.png)

하지만 `directFieldAccess` 은 기본적으로 false 이다.

따라서 값 바인딩 기본 전략은 setter 기반의 값 바인딩이라고 볼 수 있겠다.
(근데 이제,,reflection 을 곁들인,,)

![](/images/velog/3ce2807bdfe6e067.png)

하지만 우리의 목적은 불변객체에 대한 바인딩을 처리해주어야한다.

불변객체는 생성되는 순간에 값이 고정되어있으므로 setter 를 통해 값 바인딩을 처리해줄 수 없다.

따라서 생성자에 의한 값 바인딩을 처리해주어야한다.

그래서 우리는 directFieldAccess 값을 true 로 바꿔주어야 한다.

다행히도 아래와 같이 true 로 바꿔줄 수 있게끔 config 를 만져줄 수 있다.

# Apply 🧑‍💻


```java
@Slf4j
@RequiredArgsConstructor
@RestControllerAdvice
public class DataBinderAdvice {

    @InitBinder
    public void initBinder(WebDataBinder binder) {
        binder.initDirectFieldAccess();
    }
}
```

이렇게 세팅을 해준 뒤에 실제로 값을 요청해보면 제대로 수행되는 것을 확인해볼 수 있었다.

![](/images/velog/0f7942ac0ae20826.png)

> 위와 같이 처리하였을 때 java::record 나 kotlin::data 에 대해서는 매핑이 불가능하다.
>
> 왜냐하면 우리가 initDirectFieldAccess 를 켰기 때문인데, 앞서 언급한 것과 같이 DataBinder 내에서 해당 옵션을 켰는지 확인하고 필드 주입으로 Pojo 를 생성할지, 생성자로 Pojo 를 생성할지 결정하기 때문이다.
>
> 따라서 특정 DTO 에 대해서만 필드 주입으로 처리하고 싶다면 아래와 같이 선언해주면 된다.
>```java
> @RestControllerAdvice
> public class DataBinderAdvice {
> 
>     @InitBinder("venueDeleteReq") // 필드주입할 DTO
>     public void initBinder(WebDataBinder binder) {
>         binder.initDirectFieldAccess();
>     }
> }
>```

# Reference 📚


https://lnt.github.io/blog/poster-spring-bind-request-params-to-pojo.html

https://www.baeldung.com/spring-mvc-and-the-modelattribute-annotation

https://breakcoding.tistory.com/404

https://sjiwon-dev.tistory.com/15

https://jschan0911.tistory.com/91

https://happyzodiac.tistory.com/98

https://galid1.tistory.com/769

https://cotak.tistory.com/321
