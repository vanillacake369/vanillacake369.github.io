---
title: "Make Exception Message internationalized using MessageSource "
description: "모든 소스코드는 해당 깃허브를 참고하면 된다."
date: 2026-02-25
tags: [java]
lang: ko
draft: false
---

# Why(What For?) 🤷‍♂️


> 만약 내 서비스를 세계 어디서든 사용한다고 생각해보자.
> 알고보니,,, 메세지 국제화는 보통 Front 단에서 처리한다고 한다,,,

# What(What should I know?) 👇


모든 소스코드는 [해당 깃허브](https://github.com/sparta-nullnull/otil)를 참고하면 된다.

Message Source에 대한 build.gradle 설정을 해주자.

```java
/* Message Source */
implementation 'net.rakugakibox.util:yaml-resource-bundle:1.2'
```

국제화 파일들을 만들어주자.

<details>
<summary>**`exception_en.yml`**</summary>

```java
# Common
unKnown:
  code: "-9000"
  msg: "An unknown error occurred."
  status: "404"
communicationError:
  code: "-9001"
  msg: "An error occurred during communication."
  status: "404"
dataError:
  code: "-9002"
  msg: "Data error occurred due to incorrect format."
  status: "400"

# User
userNotFound:
  code: "-1100"
  msg: "User not found."
  status: "404"
incorrectAccountIdOrPassword:
  code: "-1101"
  msg: "The account id or password is incorrect."
  status: "404"
entryPointException:
  code: "-1102"
  msg: "Permission is not granted to access this resource."
  status: "403"
accessDenied:
  code: "-1103"
  msg: "Access to the resource is denied with current permissions."
  status: "403"
existingUser:
  code: "-1105"
  msg: "The user is already registered. Please log in."
  status: "403"
requiresLogin:
  code: "-1106"
  msg: "Login is required for this request. Please log in."
  status: "403"
requiresLoggedOut:
  code: "-1107"
  msg: "Logout is required for this request. If you are already logged in, please logout."
  status: "403"
accountIdValidationFail:
  code: "-1108"
  msg: "Account ID should be a combination of numbers and lowercase/uppercase letters."
  status: "400"
duplicatedAccountId:
  code: "-1109"
  msg: "The account ID is already in use by another user. Please choose a different one."
  status: "400"
passwordValidationFail:
  code: "-1110"
  msg: "Password should be a combination of uppercase/lowercase letters, numbers, and special characters."
  status: "400"
nickNameValidationFail:
  code: "-1111"
  msg: "Nickname should be a combination of uppercase/lowercase letters and numbers."
  status: "400"
emailValidationFail:
  code: "-1112"
  msg: "Email should be in the format \"~~~@~~~.~~~\"."
  status: "400"
invalidAdminKey:
  code: "-1113"
  msg: "The admin authorization key does not match."
  status: "403"

# Post
notFoundPost:
  code: "-2100"
  msg: "The requested post does not exist."
  status: "404"
duplicatedPost:
  code: "-2101"
  msg: "A post for the request already exists."
  status: "409"
notAuthorOfPost:
  code: "-2103"
  msg: "You are not the owner of this post."
  status: "400"

# Comment
notFoundComment:
  code: "-3100"
  msg: "The requested comment does not exist."
  status: "404"
duplicatedComment:
  code: "-3101"
  msg: "A comment for the request already exists."
  status: "409"
notAuthorOfComment:
  code: "-3103"
  msg: "You are not the owner of this comment."
  status: "400"
inappropriateComment:
  code: "-3104"
  msg: "The comment is inappropriate."
  status: "400"

# Category
notFoundCategory:
  code: "-4100"
  msg: "The requested category does not exist."
  status: "404"
duplicatedCategory:
  code: "-4101"
  msg: "A category for the request already exists."
  status: "409"
notAuthorOfCategory:
  code: "-4103"
  msg: "You are not the owner of this category."
  status: "400"
inappropriateCategory:
  code: "-4104"
  msg: "The category is inappropriate."
  status: "400"
```
</details>
<details>
<summary>`exception_ko.yml`</summary>

```java
# Common
unKnown:
  code: "-9000"
  msg: "알수 없는 오류가 발생하였습니다."
  status: "404"
communicationError:
  code: "-9001"
  msg: "통신 중 오류가 발생하였습니다."
  status: "404"
dataError:
  code: "-9002"
  msg: "형식에 맞지 않는 데이터 오류가 발생하였습니다."
  status: "400"

# User
userNotFound:
  code: "-1100"
  msg: "존재하지 않는 회원입니다."
  status: "404"
incorrectAccountIdOrPassword:
  code: "-1101"
  msg: "계정 아이디 또는 비밀번호가 정확하지 않습니다."
  status: "404"
entryPointException:
  code: "-1102"
  msg: "해당 리소스에 접근하기 위한 권한이 없습니다."
  status: "403"
accessDenied:
  code: "-1103"
  msg: "보유한 권한으로 접근할수 없는 리소스 입니다."
  status: "403"
existingUser:
  code: "-1105"
  msg: "이미 가입한 회원입니다. 로그인을 해주십시오."
  status: "403"
requiresLogin:
  code: "-1106"
  msg: "로그인이 필요한 요청입니다. 로그인을 해주십시오."
  status: "403"
requiresLoggedOut:
  code: "-1107"
  msg: "로그아웃이 필요한 요청입니다. 이미 로그인을 하셨다면 로그아웃을 해주세요."
  status: "403"
accountIdValidationFail:
  code: "-1108"
  msg: "계정아이디는 숫자와 영대소문자 조합으로 작성해주세요."
  status: "400"
duplicatedAccountId:
  code: "-1109"
  msg: "이미 다른 회원이 사용하고 계시는 계정아이디입니다. 다시 입력해주세요."
  status: "400"
passwordValidationFail:
  code: "-1110"
  msg: "비밀번호는 영대소문자,숫자와 특수문자의 조합으로 작성해주세요."
  status: "400"
nickNameValidationFail:
  code: "-1111"
  msg: "닉네임은 영대소문자와 숫자의 조합으로 작성해주세요."
  status: "400"
emailValidationFail:
  code: "-1112"
  msg: "이메일은 \"~~~@~~~.~~~\"형식으로 작성해주세요."
  status: "400"
invalidAdminKey:
  code: "-1113"
  msg: "어드민 권한 획득 키값과 일치하지 않습니다."
  status: "403"


# Post
notFoundPost:
  code: "-2100"
  msg: "해당 게시글은 존재하지 않습니다."
  status: "404"
duplicatedPost:
  code: "-2101"
  msg: "요청에 대한 게시글이 기존에 이미 존재합니다."
  status: "409"
notAuthorOfPost:
  code: "-2103"
  msg: "해당 게시글의 소유주가 아닙니다."
  status: "400"

# Comment
notFoundComment:
  code: "-3100"
  msg: "해당 댓글은 존재하지 않습니다."
  status: "404"
duplicatedComment:
  code: "-3101"
  msg: "요청에 대한 댓글이 기존에 이미 존재합니다."
  status: "409"
notAuthorOfComment:
  code: "-3103"
  msg: "해당 댓글의 소유주가 아닙니다."
  status: "400"
inappropriateComment:
  code: "-3104"
  msg: "부적절한 댓글입니다."
  status: "400"

# Comment
notFoundCategory:
  code: "-4100"
  msg: "해당 카테고리는 존재하지 않습니다."
  status: "404"
duplicatedCategory:
  code: "-4101"
  msg: "요청에 대한 카테고리는 기존에 이미 존재합니다."
  status: "409"
notAuthorOfCategory:
  code: "-4103"
  msg: "해당 카테고리의 소유주가 아닙니다."
  status: "400"
inappropriateCategory:
  code: "-4104"
  msg: "부적절한 카테고리입니다."
  status: "400"
```
</details>

application.yml을 통해 국제화 저장경로를 지정해주자.

```yaml
spring:
  messages:
    basename:message/messages
    encoding:UTF-8
    fallbackToSystemLocale:false
    alwaysUseMessageFormat:true
```

다음으로 메세지 소스에 대한 설정을 해주자.

```java
package com.spartanullnull.otil.config;

import java.util.*;
import net.rakugakibox.util.*;
import org.springframework.beans.factory.annotation.*;
import org.springframework.context.*;
import org.springframework.context.annotation.*;
import org.springframework.context.support.*;
import org.springframework.web.servlet.*;
import org.springframework.web.servlet.config.annotation.*;
import org.springframework.web.servlet.i18n.*;

@Configuration
public class MessageSourceConfig implements WebMvcConfigurer {

    @Bean // 세션에 지역설정. default는 KOREAN = 'ko'
    public LocaleResolver localeResolver() {
        SessionLocaleResolver slr = new SessionLocaleResolver();
        slr.setDefaultLocale(Locale.KOREAN);
        return slr;
    }

    @Bean // 지역설정을 변경하는 인터셉터. 요청시 파라미터에 lang 정보를 지정하면 언어가 변경됨.
    public LocaleChangeInterceptor localeChangeInterceptor() {
        LocaleChangeInterceptor lci = new LocaleChangeInterceptor();
        lci.setParamName("lang");
        lci.setIgnoreInvalidLocale(true);
        return lci;
    }

    @Override // 인터셉터를 시스템 레지스트리에 등록
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(localeChangeInterceptor()).addPathPatterns("/**");
    }

    @Bean // yml 파일을 참조하는 MessageSource 선언
    public MessageSource messageSource(
        @Value("i18n/exception") String basename,
        @Value("UTF-8") String encoding
    ) {
        YamlMessageSource ms = new YamlMessageSource();
        ms.setBasename(basename);
        ms.setDefaultEncoding(encoding);
        ms.setAlwaysUseMessageFormat(true);
        ms.setUseCodeAsDefaultMessage(true);
        ms.setFallbackToSystemLocale(true);
        return ms;
    }

    // locale 정보에 따라 다른 yml 파일을 읽도록 처리
    private static class YamlMessageSource extends ResourceBundleMessageSource {

        @Override
        protected ResourceBundle doGetBundle(String basename, Locale locale) {
            return ResourceBundle.getBundle(basename, locale, YamlResourceBundle.Control.INSTANCE);
        }
    }
}
```

위 설정을 통해 각기 다른 지역에 따라, 다른 yml 파일을 읽게 할 수 있다.

이제 예외처리 할 때, 메세지 국제화한 값을 예외메세지로 반환하게 해주게 할 수 있다.

이 때, 조금 어색하지만 중요한 작업을 해주어야만 돌아가게끔 해주었다.

바로 “Bean에 대한 의존성 주입을 static variable로 받게 하기” 이다.

사실 이러한 행위는 DI를 역행하는 행위이다.

하지만 이렇게 해야만 하는 이유가 있었는데, 
그것은 바로 MessageSource 인스턴스 자체는 동적으로 변경되고 주입되지만, 예외처리는 static 한 상황에서 처리하게끔 하고자 하기 때문이다.

MessageSource 인스턴스가 지역에 따라 다르게 변경되는 반면, 예외처리는 정적으로 처리하게끔해야한다.

만약, 예외처리를 동적으로 — MessageSource 인스턴스를 주입받아 하고자한다면 — 매 번 새로운 인스턴스를 주입받아야 할 것이고, 이는 오버헤드가 상당히 크다고 판단하였다.

따라서 `@PostConstruct`를 통해 미리 주입받은 뒤, 예외메세지를 처리해주었다.

```java
private final static String DEFAULT_MESSAGE = "messageKeyNotFound";
static MessageSource messageSource; // 정적 인스턴스
private final MessageSource wiredMessageSource; // DI 주입받은 인스턴스

@PostConstruct
public void init() {
    messageSource = wiredMessageSource;
}
```

이렇게 처리한 MessageSource 를 통해 에러 케이스 코드를 변환해주었다.

```java
// code정보, 추가 argument로 현재 locale에 맞는 메시지를 조회합니다.
static String getMessage(String code, Object[] args) throws NoSuchMessageException {
    String message = messageSource.getMessage(code, args, DEFAULT_MESSAGE, Locale.getDefault());
    assert message != null;
    if (message.equals(DEFAULT_MESSAGE)) {
        throw new NoSuchMessageException(
            "missing translation for messageKey : " + code + " of locale : "
                + Locale.getDefault().getLanguage());
    }
    return message;
}

// code정보에 해당하는 메시지를 조회합니다.
private static String getMessage(String code) {
    return getMessage(code, null);
}

// 에러 케이스 코드를 반환
public static int getCode(ErrorCase errorCase) throws NoSuchMessageException {
    return Integer.parseInt(getMessage(errorCase.getCode()));
}

// 에러 메세지를 반환
public static String getMsg(ErrorCase errorCase) throws NoSuchMessageException {
    return getMessage(errorCase.getMsg());
}

// 에러에 대한 HTTP STATUS를 반환
public static HttpStatus getStatus(ErrorCase errorCase) throws NoSuchMessageException {
    return HttpStatus.resolve(
        Integer.parseInt(
            getMessage(errorCase.getStatus())
        )
    );
}
```

이제 모든 설정은 다 끝났다.

GlobalExceptionHandler를 통해 예외처리를 AOP를 통해 하는 핸들러를 만들어주면 된다!

```java
@Slf4j
@RestControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionHandler {

    /**
     * 형식에 어긋난 입력형식오류예외 발생 시 예외처리 핸들러
     *
     * @param ex 입력형식오류예외
     * @return ErrorResponse => {에러코드,메세지,HttpStatus 를 담은 ErrorCode} + {에러발생사유를 담은 ErrorDetail}
     * @author 임지훈
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValidException(
        MethodArgumentNotValidException ex) {
        log.error("handleMethodArgumentNotValidException", ex);
        ErrorCode errorCode = ErrorCode.of(ErrorCase.DATA_ERROR);
        final ErrorResponse response = ErrorResponse.of(errorCode, ex.getBindingResult());
        return new ResponseEntity<>(response, errorCode.getStatus());
    }


    /**
     * 권한 제한 예외 발생 시 예외처리 핸들러
     *
     * @param ex 권한 제한 예외
     * @return ErrorResponse => {에러코드,메세지,HttpStatus 를 담은 ErrorCode} + {에러발생사유를 담은 ErrorDetail}
     * @author 임지훈
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDeniedException(AccessDeniedException ex) {
        log.error("handleDomainException", ex);
        ErrorCode errorCode = ErrorCode.of(ErrorCase.ACCESS_DENIED);
        final ErrorResponse response = ErrorResponse.of(errorCode);
        return new ResponseEntity<>(response, errorCode.getStatus());
    }

    /**
     * 메세지 국제화 처리 오휴 발생 시 예외처리 핸들러
     *
     * @param ex 메세지 국제화 처리 오휴
     * @return ErrorResponse => {에러코드,메세지,HttpStatus 를 담은 ErrorCode} + {에러발생사유를 담은 ErrorDetail}
     * @author 임지훈
     */
    @ExceptionHandler(NoSuchMessageException.class)
    public ResponseEntity<?> handleNoSuchMessageException(NoSuchMessageException ex) {
        log.error("handleNoSuchMessageException", ex);
        return ResponseEntity.internalServerError().body(ex.getMessage());
    }


    /**
     * 비즈니스 관련 예외 발생 시 예외처리 핸들러
     *
     * @param ex 비즈니스 도메인 예외
     * @return ErrorResponse => {에러코드,메세지,HttpStatus 를 담은 ErrorCode} + {에러발생사유를 담은 ErrorDetail}
     * @author 임지훈
     */
    @ExceptionHandler(DomainException.class)
    public ResponseEntity<ErrorResponse> handleDomainException(DomainException ex) {
        log.error("handleDomainException", ex);
        ErrorCode errorCode = ex.getErrorCode();
        ErrorDetail errorDetail = ex.getErrorDetail();
        final ErrorResponse response = ErrorResponse.of(errorCode, errorDetail);
        return new ResponseEntity<>(response, errorCode.getStatus());
    }
}
```

혹시 몰라 테스트 코드 또한 작성해주었다. 

```java
@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = {MessageSourceConfig.class, ErrorCaseResolver.class})
class ErrorCaseResolverTest {

    @Autowired
    MessageSource messageSource;
    @Autowired
    ErrorCaseResolver errorCaseResolver;

    public static Stream<Arguments> createErrorCaseOfDataError() {
        return Stream.of(
            Arguments.of(
                ErrorCase.DATA_ERROR
            )
        );
    }

    @Test
    @DisplayName("Post Construct를 통해 static context field에 MessageSource를 주입받습니다.")
    public void MessageSource_정적주입() {
        // THEN
        assertEquals(errorCaseResolver.getWiredMessageSource(), messageSource);
        assertEquals(ErrorCaseResolver.messageSource, messageSource);
    }

    @ParameterizedTest
    @MethodSource("createErrorCaseOfDataError")
    @DisplayName("에러케이스에 대해 에러 코드를 반환합니다.")
    public void 에러케이스_에러코드_반환_해피케이스(ErrorCase errorCase) {
        // WHEN
        int code = ErrorCaseResolver.getCode(errorCase);

        // THEN
        assertEquals(-9002, code);
    }

    @ParameterizedTest
    @MethodSource("createErrorCaseOfDataError")
    @DisplayName("에러케이스에 대해 에러 코드를 반환합니다.")
    public void 에러케이스_에러코드_반환_언해피케이스() {
        // WHEN
        NoSuchMessageException noSuchMessageException = assertThrows(NoSuchMessageException.class,
            () -> ErrorCaseResolver.getMessage("invalidErrorCaseName", null)
        );

        // THEN
        System.out.println(noSuchMessageException.getMessage());
    }
}
```

# Reference 📚


[https://blog.hkwon.me/spring-boot-spring-i18n-configuration/](https://blog.hkwon.me/spring-boot-spring-i18n-configuration/)
[https://velog.io/@maketheworldwise/다국어-처리의-모든-것](https://velog.io/@maketheworldwise/다국어-처리의-모든-것)
[https://blog.naver.com/vps32/222140843367](https://blog.naver.com/vps32/222140843367)
[https://kim-jong-hyun.tistory.com/26](https://kim-jong-hyun.tistory.com/26)
[https://velog.io/@youjung/Spring-MessageSource-자동설정으로-MessageSource-쉽게-세팅하기](https://velog.io/@youjung/Spring-MessageSource-자동설정으로-MessageSource-쉽게-세팅하기)
