---
title: "OSIV 위치를 바꾸어, Spring Security 단에서 영속화된 User 를 가져오자 !"
description: ""
date: 2024-01-30
tags: [Java]
category: uncategorized
lang: ko
draft: false
---

# Why(What For?) 🤷‍♂️

---

> 컨트롤러에서 로그인된 유저에 대해 영속화된 엔티티를 가져오려고 하였다.

# What(What should I know?) 👇

---

### 결론부터 말하자면,,,

[https://tecoble.techcourse.co.kr/post/2020-09-20-entity-lifecycle-2/](https://tecoble.techcourse.co.kr/post/2020-09-20-entity-lifecycle-2/)

영속화를 담당하는 Open Session In View는 Interceptor를 통해 적용되기 때문이다.
Spring Security에서 Filter를 통해 User 정보를 가지고 오는데, Filter는 Interceptor보다 먼저 실행된다.
이로 인해, 영속성 컨텍스트가 종료된 상황에서의 User를 가져온다.
즉, Controller에서 @CurrnetUser를 통해 가지고 온 User객체는 **준영속화**된 상태이다.

### 해결방법

해결방법은 간단한다.
아래 코드를 “복붙” 하면 된다.

```java
@Component
@Configuration
public class OpenEntityManagerConfig {
    @Bean
    public FilterRegistrationBean<OpenEntityManagerInViewFilter> openEntityManagerInViewFilter() {
        FilterRegistrationBean<OpenEntityManagerInViewFilter> filterFilterRegistrationBean = new FilterRegistrationBean<>();
        filterFilterRegistrationBean.setFilter(new OpenEntityManagerInViewFilter());
        filterFilterRegistrationBean.setOrder(Integer.MIN_VALUE); // 예시를 위해 최우선 순위로 Filter 등록
        return filterFilterRegistrationBean;
    }
}
```


여기까지가 간단한 설명이고
그렇다면 왜 그런지를 알아보자.

### 아니 왜,,,?

이를 알기 위해서는 Spring Security 동작과정을 간단하게 뜯어보아야 한다.

[https://tecoble.techcourse.co.kr/post/2020-09-20-entity-lifecycle-2/](https://tecoble.techcourse.co.kr/post/2020-09-20-entity-lifecycle-2/)
[https://docs.spring.io/spring-security/reference/servlet/architecture.html](https://docs.spring.io/spring-security/reference/servlet/architecture.html)

![](/images/notion/16230a49e9c411f4.png)


위 그림과 같이, Spring 에서는 Container를 통해 요청을 전달하는 Servlet 이전에 Filter로서 Security 검증을 처리한다.
DelegatingFilterProxy에서 사용자의 요청을 가로채 Spring Security의 기능들이 수행되며 모든 요청에 대해 보안이 적용되게끔 한다.

![](/images/notion/6e891fba9ed77f4a.png)

우리가 기존에 구현한 CustomUserDetailsService도 Spring Security 인증과정에 필요한 UserDetailsService를 구현한 것이다. 
이 Service를 통해 DB에 존재하는 User 정보와 사용자가 입력한 로그인 정보를 대조해 인증/인가를 진행한다.

그렇다면
이 과정이 과연 영속화 과정에 있을까?
정답은 아니다.
영속화는 OpenEntityManagerInViewInterceptor 를 통해 구현된다.

```java
@Configuration(proxyBeanMethods = false)
@ConditionalOnWebApplication(type = Type.SERVLET)
@ConditionalOnClass(WebMvcConfigurer.class)
@ConditionalOnMissingBean({ OpenEntityManagerInViewInterceptor.class, OpenEntityManagerInViewFilter.class })
@ConditionalOnMissingFilterBean(OpenEntityManagerInViewFilter.class)
@ConditionalOnProperty(prefix = "spring.jpa", name = "open-in-view", havingValue = "true", matchIfMissing = true)
protected static class JpaWebConfiguration {
    ...

    @Bean
    public OpenEntityManagerInViewInterceptor openEntityManagerInViewInterceptor() {
        ...
        return new OpenEntityManagerInViewInterceptor();
    }

    @Bean
    public WebMvcConfigurer openEntityManagerInViewInterceptorConfigurer(OpenEntityManagerInViewInterceptor interceptor) {
        return new WebMvcConfigurer() {
            @Override
            public void addInterceptors(InterceptorRegistry registry) {
                registry.addWebRequestInterceptor(interceptor);
            }
        };
    }
}
```


하지만 Spring Security가 실행되는 단계인 Filter 는 Interceptor의 이전단계이다.
따라서 FilterChainProxy에서 CustomUserDetailsService는 Service 내에서 @Transactional이 적용되는 부분에서만 영속성 컨텍스트가 유지된다는 뜻이다.
즉 영속성 컨텍스트가 종료된 상황에서 Controller에서 UserDetails 를 통해 가지고 온 User객체는 **준영속화**된 상태이다. 
따라서 다시 영속성 컨텍스트가 OSIV를 통해 Controller에 주입된다 하더라도 가져온 User는 이미 준영속화 된 User이다.

![](/images/notion/8a55cf6efb6f5713.jpg)
![](/images/notion/9a2d6a58c0712ed9.png)

### 엥?? OSIVFilter는 Filter 아니야?? 내가 알고 있기로는 OSIV가 Filter에 있는데??

뭐, 틀린 말은 아니다.
그렇다고 맞는 말도 아니다.
여기서 `OSIVFilter`라고 칭하는 `OpenEntityManagerInViewFilter`는 
`OpenEntityManagerInViewInterceptor `를 Filter로 순서를 바꿔주기 위한 
Spring Boot에서 지원해주는 클래스이다.
그러나 스프링부트의 기본설정은 `OpenEntityManagerInViewFilter`가 아니다 ㅎㅎ

### Spring Boot 에서서는 OpenEntityManagerInViewInterceptor 가 기본설정으로 박혀있다.

[https://velog.io/@cooper25_dev/코드로-보는-OSIV-Open-Session-In-View#만약-filter-에서-엔티티를-관리되어야-한다면](https://velog.io/@cooper25_dev/코드로-보는-OSIV-Open-Session-In-View#만약-filter-에서-엔티티를-관리되어야-한다면)

Spring-Boot 는 프로퍼티를 기반으로 한 자동 설정을 지원한다. 
JpaBaseconfiguration 추상 클래스의 nested static class 인 `JpaWebConfiguration `에
 OSIV 를 담당하는 인터셉터인 `OpenEntityanagerInViewInterceptor `를 활성 여부를 관리한다.
 `spring.jpa.open-in-view` 프로퍼티를 통해 관리되며 별도의 설정이 없는 경우에는 
`OpenEntityanagerInViewInterceptor` 는 빈으로 등록되고 인터셉터로 관리된다.

```java
package org.springframework.boot.autoconfigure.orm.jpa;

// imports ...

@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(JpaProperties.class)
public abstract class JpaBaseConfiguration implements BeanFactoryAware {

	private final DataSource dataSource;

	// 여기에 JpaProperties
	private final JpaProperties properties;

	private final JtaTransactionManager jtaTransactionManager;

	private ConfigurableListableBeanFactory beanFactory;

	@Configuration(proxyBeanMethods = false)
	@ConditionalOnWebApplication(type = Type.SERVLET)
	@ConditionalOnClass(WebMvcConfigurer.class)
	@ConditionalOnMissingBean({ OpenEntityManagerInViewInterceptor.class, OpenEntityManagerInViewFilter.class })
	@ConditionalOnMissingFilterBean(OpenEntityManagerInViewFilter.class)
	@ConditionalOnProperty(prefix = "spring.jpa", name = "open-in-view", havingValue = "true", matchIfMissing = true)
	protected static class JpaWebConfiguration {

		private static final Log logger = LogFactory.getLog(JpaWebConfiguration.class);

		private final JpaProperties jpaProperties;

		protected JpaWebConfiguration(JpaProperties jpaProperties) {
			this.jpaProperties = jpaProperties;
		}

		// 실제 OSIV 를 담당하는 OpenEntityManagerInViewInterceptor 가 빈으로 선언되는 부분
		@Bean
		public OpenEntityManagerInViewInterceptor openEntityManagerInViewInterceptor() {
			if (this.jpaProperties.getOpenInView() == null) {
				logger.warn("spring.jpa.open-in-view is enabled by default. "
						+ "Therefore, database queries may be performed during view "
						+ "rendering. Explicitly configure spring.jpa.open-in-view to disable this warning");
			}
			return new OpenEntityManagerInViewInterceptor();
		}

		@Bean
		public WebMvcConfigurer openEntityManagerInViewInterceptorConfigurer(
				OpenEntityManagerInViewInterceptor interceptor) {
			return new WebMvcConfigurer() {

				@Override
				public void addInterceptors(InterceptorRegistry registry) {
					registry.addWebRequestInterceptor(interceptor);
				}

			};
		}

	}
```
```
spring.jpa.open-in-view: false # default value = true
```

### OSIVFilter를 사용하게되면,,,

OSIVFilter를 사용하게 되면 아래와 같이 동작된다.

![](/images/notion/8aed9d223bba565b.png)

- OpenSessionInViewFilter는 기본 SessionFactory의 openSession 메서드를 호출하여 새 세션을 가져옴
- 이 세션은 트랜잭션 동기화 관리자에 바인딩
- OpenSessionInViewFilter는 javax.servlet.FilterChain 객체 참조의 doFilter를 호출하고 요청이 추가로 처리
- DispatcherServlet이 호출되고, 이 서브렛은 HTTP 요청을 기본 PostController로 라우팅
- PostController는 PostService를 호출하여 getPosts() 요청
- PostService는 새 트랜잭션을 열고, HibernateTransactionManager는 OpenSessionInViewFilter에 의해 열린 것과 동일한 세션을 재사용
- PostDAO는 lazy association을 초기화하지 않고 Post 엔티티들을 가져옵니다.
- PostService는 기본 트랜잭션을 커밋한다.
- DispatcherServlet은 UI 렌더링을 시작한다. 이 때, Lazy Association을 탐색, 모든 Lazy Association에 대한 초기화를 실행한다.
- 최종적으로 OpenSessionInViewFilter는 세션을 닫은 뒤, 기본 데이터베이스 연결도 해제된다.

# How(How to apply to code?) ✍️

---

추가로 OSIV 자체가 View 와 DB 시점에서 악영향을 끼칠 수 있는 가능성을 띄는지에 대해서 알아보면 좋을 것 같다.
대충 읽었는데 솔직히 View 에 대해서는 신경쓰지 않아서 넘어갔다.

[https://stackoverflow.com/questions/1103363/why-is-hibernate-open-session-in-view-considered-a-bad-practice](https://stackoverflow.com/questions/1103363/why-is-hibernate-open-session-in-view-considered-a-bad-practice)
