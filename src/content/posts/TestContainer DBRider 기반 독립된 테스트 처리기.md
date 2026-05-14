---
title: "TestContainer, DBRider 기반 독립된 테스트 처리기"
description: "TestContainer, DBRider 를 통해 리소스 미러링을 하여 어디서든 동작하는 테스트 환경을 만들어주자"
date: 2025-03-02
tags: [journal]
lang: ko
draft: false
---

![](/images/velog/346e85a54834b08e.png)

# Episode 📜


간혹 세심한 통합 테스트를 통해 API 가 (혹은 API 들 간의 ) 구현 검증을 해야할 때가 있다.

예컨대 아래와 같은 경우가 있을 것이다.

- 하나의 유스케이스가 여러 도메인을 걸쳐 처리되는 경우
- 모듈의 역할로서 재사용성이 짙은 경우
- 여러 테스트 케이스가 존재하는 경우
- ,,,

지금까지는 사내에서는 이러한 사항에 대해 깊게 신경쓰고 있지 않았었다.

그저 개발 서버에서 아래와 같이 테스트를 해보면 된다고 믿었다.

- API 를 직접 호출해보던지 — 수동 테스트
- 서버환경의 테스트 툴에 따라 통합테스트를 철저하게 작성하던지 — 통합/기능 테스트

그러나 이는 잘못된 접근 방법이다.

개발서버는 테스트서버가 아니다.

개발서버는 개발을 위한 서버이다.

필요에 따라 마이그레이션이 진행되며, 기존 기능이 변경되거나 새로운 기능이 추가된다.

또한 프론트팀과 함께 작업을 하는 공간이기도 하다.

즉, 테스트를 통해 기존 데이터를 건드리는 작업을 하기 어려운 환경이다.

따라서 우리가 원하는 입력/출력을 검증하는 테스트를 진행하기에는 적합하지 않다.

그렇다면 우리는 어떻게 이를 우회하여 해결(workaround) 할 수 있을까?

우리는 아래와 같은 통합 테스트 환경을 구색해볼 수 있을 것이다.

- 개발서버 환경 자원과 분리된 테스트 환경 자원 준비
    - 예컨대 테스트용 MySQL 을 따로 준비하는 경우가 있다.
- 테스트 케이스 목업 데이터 준비
- 외부 서비스를 이용 중이라면 똑같은 행동을 하는 가짜를 준비(Mocking)

본 포스트에서는 각 단계에 따른 오픈소스들을 소개하고자 한다.

- 분리된 테스트 환경 자원
    - TestContainer 활용
- 테스트 케이스 목업 데이터
    - DBRider 활용

( 만약 외부서비스 가짜를 만들고 싶다면 SpringBoot 에서는 [MockWebServer](https://www.baeldung.com/spring-mocking-webclient) 를 제공 중에 있으니 찾아보길 바란다. )

# About 💁‍♂️


## TestContainer

도커 컨테이너를 통해 테스트환경을 제공하여 개발환경과 분리할 수 있는 [오픈소스](https://testcontainers.com/)이다.

( [다른 포스트](https://dev.gmarket.com/76)들에 더 잘 나와있어 세부 설명은 건너뛰겠다 )

보통의 포스트들에서는 DBMS 에 대해서만 다루고 있지만, 

Kafka, Nginx, GCP 등등 다양한 리소스를 지원 중에 있다.

TestContainer 를 통해 아래와 같이 구성해줄 수 있다.

- 필요한 자원에 대한 TestContainer 이미지 지정
    - 만약 MySQL 8 이 필요하다면 이에 대한 TestContainer 이미지를 지정
- 원하는 상태의 TestContainer 컨테이너를 세팅해준다.
    - 이는 어떤 자원을 가져오냐에 따라 다르다.
- 테스트케이스에 TestContainer 컨테이너 환경을 적용해준다.

> Q.

잠시만요,,,!

H2 사용하면 되지 왜 TestContainer 를 쓰죠??
> A.

H2 와 MySQL 이 같은가?

아니다.
> 테스트환경을 제공한다는 것은 개발환경을 미러링하는 것과 같다.
> 즉, 동일한 버전의 동일한 자원을 사용해야 한다는 것이다.
> 예컨대 H2 는 Pessismistic Lock 을 걸 수 없다.
> 실제로 필자는 H2 기반 테스트환경에서 Pessismistic Lock 을 처리하는 유스케이스를 테스트할 수 없는 경우를 겪어보았다.
> 요컨대 테스트 환경은 반드시 개발 리소스를 미러링해야한다.

## DBRider

각 테스트 케이스 구성이 정리되었다면 이제 테스트 데이터를 세팅해줄 차례이다.

만약 우리가 각 케이스 별로 테스트 데이터를 달리하고 싶다면 어떻게 해야할까?

굳이 케이스마다 컨테이너를 다시 키게끔 해야할까?

이를 위한 Java/Hibernate 진영 오픈소스가 DBRider 이다.

yaml, json 파일을 통해 데이터를 주입하여 테스트를 실행하고, 실행 이후 데이터를 지운다.

이를 통해 케이스 별로 데이터를 달리하여 테스트 해볼 수 있다.

# Apply 🧑‍💻


## TestContainer

우선 gradle 이 필요하다 ^^

```java
testImplementation 'org.junit.jupiter:junit-jupiter:5.11.3' // JUnit
testImplementation 'org.testcontainers:testcontainers:1.20.4' // TestContainer
testImplementation 'org.testcontainers:junit-jupiter:1.20.4' // JUnit TestContainer
testImplementation 'org.testcontainers:mysql:1.20.4' // MySQL TestContainer
```

또한 도커를 꼭 켜주어야 한다. 

### 1.

TestContainer Image

테스트 컨테이너는 도커 이미지를 사용하여 테스트 케이스를 실행한 뒤, 컨테이너를 죽인다.

이 때 명시적으로 start() 호출하여 실행, stop() 호출하여 죽인다.

따라서 컨테이너 A 를 아래와 같이 사용하게끔 할 수 있다.

- 테스트 환경을 통일
    - 여러 테스트 케이스 ㄱ,ㄴ,ㄷ ,,, 에 대해 컨테이너 A 를 실행
- 테스트 환경을 격리
    - 각 테스트 케이스 별로 컨테이너 A 를 실행

어떻게 사용할 것이냐에 따라 구현체의 구현 방법이 결정된다.

통일된 환경을 사용하고 싶다면 싱글톤을, 

격리된 환경을 사용하고 싶다면 매 번 생성자를 호출하는 방법으로 처리를 해야한다.

여러 싱글톤 구현법이 있으나 그 중 Bill Pugh Singleton 을 사용하였다.

(싱글톤 구현법에 대해서는 [Baelgdung 포스트](https://www.baeldung.com/java-bill-pugh-singleton-implementation) 참조)

> 매 번 생성자 호출
> 

```java
@Test
public class Test {
	private MySQLContainer<?> mySQLContainer;

	static{
			this.mySQLContainer = new MySQLContainer<>("mysql:8")
				.withDatabaseName("customdb")
				.withUsername("root")
				.withPassword("testdbsecret")
				.withInitScript("sql/init.sql")
				.withConfigurationOverride("sql")
				.withReuse(true);
			this.mySQLContainer.start();
	}

	@AfterAll()
	void shutdown(){
	this.mySQLContainer.stop();
	}

	@Junit
	void test(){
			// test 케이스 작성
	}
}
```

> 싱글톤 구현
> 

```java
/**
 * MySQL TestContainer 에 대한 Bill Pugh 기반 싱글톤
 * <p>
 * 여러 유스케이스에 걸쳐 사용할 수 있도록 지원
 */
public class MySQLFixture extends MySQLContainer<MySQLFixture> {

    private static final String IMAGE_VERSION = "mysql:8";

    private MySQLFixture() {
        super(IMAGE_VERSION);
        this.withDatabaseName("customdb")
            .withUsername("root")
            .withPassword("testdbsecret")
            .withInitScript("sql/init.sql")
            .withConfigurationOverride("sql")
            .withReuse(true);
    }

    public static MySQLFixture getInstance() {
        return SingletonHolder.INSTANCE;
    }

    @Override
    public void stop() {
    }

    private static class SingletonHolder {

        private static final MySQLFixture INSTANCE = createInstance();

        private static MySQLFixture createInstance() {
            MySQLFixture instance = new MySQLFixture();
            instance.start();
            return instance;
        }
    }
}
```

### 2.

TestContainer Setup

사전 데이터를 준비하게끔 한다.

이 때 도메인 별로 파일을 최대한 분리시켜주는 것이 정신건강에 이롭다.

필자는 시간이 없어 하나의 파일로 통합시켰다.

TestContainer 는 initScript 를 지원하여 이에 스키마 초기화 sql 을 넣어주었고,

후에 jdbc 를 활용하여 직접 데이터 저장 sql 을 호출해주었다.

( init.sql, data.sql 모두 src/test/resource 하위에 저장하였다. )

또한 스프링 프로퍼티에 db 정보를 알려주어야 JPA 가 정상작동한다.

이를 위해 System.setProperty() 를 호출하여 db 정보를 저장했다.

```java
String jdbcUrl = String.join(
	"",
	mySQLContainer.getJdbcUrl(),
	"?useUnicode=true&serverTimezone=Asia/Seoul&sendFractionalSeconds=false"
);
System.setProperty("spring.datasource.url", jdbcUrl);
System.setProperty("spring.datasource.username", mySQLContainer.getUsername());
System.setProperty("spring.datasource.password", mySQLContainer.getPassword());

// Init Data
JdbcDatabaseDelegate jdbcDatabaseDelegate = new JdbcDatabaseDelegate(mySQLContainer, "");
ScriptUtils.runInitScript(jdbcDatabaseDelegate, "sql/data.sql");
```

### 3.

Apply TestContainer to Test Case

스프링은 AOP 와 어노테이션을 통해 쉽게 코드를 작성하게끔 할 수 있다.

따라서 필자는 어노테이션이 달린 테스트 케이스는 테스트 컨테이너가 적용되게끔 하고 싶었다.

통합된 코드는 아래와 같다.

```java
@Documented
@DirtiesContext // Test Suite 별 Context 격리
@ExtendWith(MySQLExtension.class) // Test Container Initialization
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface TestContainerTest {

    /**
     * 테스트 데이터 초기화 SQL 스크립트
     */
    String[] dataScripts() default {
        "mock/sql/hama_area_define_2024.sql",
        "mock/sql/hama_language_define.sql",
        "mock/sql/hama_role_hierarchy.sql",
        "mock/sql/hama_member.sql",
        "mock/sql/hama_member_profile.sql",
		,,,
    };

    /**
     * 데이터베이스명
     */
    String databaseName() default "customdb";

    /**
     * 유저이름
     */
    String username() default "root";

    /**
     * 비밀번호
     */
    String password() default "testdbsecret";

    /**
     * 싱글톤 테스트 컨테이너 재사용 여부
     */
    boolean isSingleton() default true;
}
```

```java
public class MySQLExtension implements BeforeAllCallback, AfterAllCallback {

    private MySQLContainer<?> mySQLContainer;

    /**
     * 각 Test Suite 별로 컨테이너 생성
     *
     * @author 임지훈
     */
    @Override
    public void beforeAll(ExtensionContext extensionContext) throws Exception {
        TestContainerTest annotation = extensionContext
            .getTestClass()
            .orElseThrow(RuntimeException::new)
            .getAnnotation(TestContainerTest.class);

        createMySQLContainer(annotation);

        this.mySQLContainer.start();

        injectDataSource();

        initData(annotation);
    }

    private void initData(TestContainerTest annotation) {
        JdbcDatabaseDelegate jdbcDatabaseDelegate = new JdbcDatabaseDelegate(mySQLContainer, "");
        Arrays.stream(annotation.dataScripts())
            .forEach(script -> ScriptUtils.runInitScript(jdbcDatabaseDelegate, script));
    }

    private void injectDataSource() {
        String jdbcUrl = String.join(
            "",
            mySQLContainer.getJdbcUrl(),
            "?useUnicode=true&serverTimezone=Asia/Seoul&sendFractionalSeconds=false"
        );
        System.setProperty("spring.datasource.url", jdbcUrl);
        System.setProperty("spring.datasource.username", mySQLContainer.getUsername());
        System.setProperty("spring.datasource.password", mySQLContainer.getPassword());
    }

    private void createMySQLContainer(TestContainerTest annotation) {
        if (annotation.isSingleton()){
            this.mySQLContainer = MySQLFixture.getInstance(
                annotation.databaseName(),
                annotation.username(),
                annotation.password()
            );
            return;
        }
        this.mySQLContainer = new MySQLContainer<>("mysql:8")
            .withDatabaseName(annotation.databaseName())
            .withUsername(annotation.username())
            .withPassword(annotation.password())
            .withConfigurationOverride("sql");
    }

    @Override
    public void afterAll(ExtensionContext extensionContext) throws Exception {
        mySQLContainer.stop();
    }
}
```

- 커스텀 어노테이션을 통해 해당 어노테이션이 달린 테스트 케이스는 TestContainer 기반으로 돌아갈 수 있게끔 해주었다.
- `@DirtiesContext`를 통해 테스트케이스에 대해 격리시켜줄 수 있다.
- `BeforeAllCallback`, `AfterAllCallback` 을 구현함에 따라 테스트케이스 별로 start,stop 을 처리한다. (JUnit 특성)
- 원하는 구성값을 주입해줄 수 있게 어노테이션의 필드값을 매핑시켜주었다.

위와 같이 구성한 뒤 적용하여 테스트를 실행하면 도커에 이미지가 랜덤포트로 잡혀서 돌아가는 것을 볼 수 있을 것이다.

![](/images/velog/7b5110a109d81326.png)

## DBRider

아래 gradle 을 통해 DBRider 의존성을 추가해주자.

```java
testImplementation 'com.github.database-rider:rider-spring:1.44.0' // Database Rider
```

DBRider 는 어노테이션 기반으로 동작하게끔 지원되고 있다.

하지만 아래와 같은 설정값을 만져주어야 한다.

- DBRider 와 DBUnit 설정
  - 설정값에 대해서는 [공식문서를 참고해보자](https://database-rider.github.io/getting-started/#configuration)
- boolean 값을 tinyint 로 변환하게끔 해주는 커스텀 매퍼 구현
  - 구현한 커스텀 매퍼는 DBUnit 설정에 넣어준다.

통합된 코드는 아래와 같다.

```java
public class BooleanToTinyintReplacer implements Replacer {

    @Override
    public void addReplacements(ReplacementDataSet replacementDataSet) {
        replacementDataSet.addReplacementObject(true, 1);
        replacementDataSet.addReplacementObject(false, 0);
    }
}

```

```java
@DBRider
@Documented
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@DBUnit(
    caseSensitiveTableNames = false,
    caseInsensitiveStrategy = Orthography.LOWERCASE,
    allowEmptyFields = true,
    replacers = {
        BooleanToTinyintReplacer.class
    }
)
public @interface DBRiderTest {

}

```

이제 테스트 데이터를 준비해주자.

필자는 멤버 데이터를 가져왔다.

이 때 주의점은 `테이블명 : [ 데이터 객체 ,, ]` 형태로 저장되어야 한다는 것이다.

(해당 데이터는 DataGrip 을 통해 쉽게 export 해올 수 있다.)

```java
{
  "hama_member": [
    {
      "me_idx": 2523,
      "me_type": "google",
      "me_id": "test_user1234@gmail.com",
      "me_password": null,
      "me_uuid": "377c5251-c440-4297-bd7c-2e20c6286c11",
      "me_name": "테스트멤버이름",
      "me_hp": "01012341234",
      "rh_idx": 6,
      "me_last_login": "2024-07-15 16:08:10",
      "me_is_use": 1,
      "me_birth": "1997-05-25",
      "me_address": "테스트 멤버 주소",
      "me_address_detail": "",
      "ad_idx": 3011,
      "me_sex": 1,
      "ms_idx": 1,
      "me_address_lat": 37.1234123,
      "me_address_long": 127.123412,
      "me_silver_bell": 0,
      "me_color": "C3C5C7",
      "created_at": "2024-05-10 07:46:53",
      "updated_at": "2024-08-09 19:48:39"
    }
  ]
}
```

DBRider 는 테스트 결과가 내가 원하는 SQL 형태와 동일한지도 지원한다.

우리는 굳이 이것까지 필요하지 않기 때문에 넘어가주도록 한다.

이제 실제로 테스트 케이스에 해당 데이터를 주입시킬 수 있도록 해보자.

코드는 아래와 같다.

```java

@CustomJpaDataTest
class MemberJpaRepositoryV2Test {

    @Test
    @DataSet(
        value = "sql/member.json",
        strategy = SeedStrategy.INSERT,
        disableConstraints = true,
        cleanAfter = true,
        transactional = true
    )
    // 원하는 결과 JSON 과 호출 결과가 같은지 확인
    // @ExpectedDataSet(value = "/sql/member.json")
    @DisplayName("DB Rider 로 저장한 회원 조회 시 성공합니다.")
    void DBRider로저장한회원_조회시성공() {
        // GIVEN
        Long meIdx = 2523L;

        // WHEN
        MemberV2 found = assertDoesNotThrow(
            () -> memberJpaRepositoryV2
                .findById(meIdx)
                .orElseThrow(() -> new RuntimeException("MEMBER_NOT_FOUND"))
        );

        // THEN
        assertNotNull(found);
        assertEquals(meIdx, found.getMeIdx());
        System.out.println("found.getMeIdx() = " + found.getMeIdx());
    }
}
```

### TestContainer & DBRider Example

두 개 모두 사용한 예시는 아래와 같다.

```java
@DBRiderTest
@TestContainerTest
@CustomJpaDataTest
class MemberJpaRepositoryV2Test {

    @Autowired
    private MemberJpaRepositoryV2 memberJpaRepositoryV2;

    @Test
    @DisplayName("멤버조회 시 성공합니다.")
    void 멤버조회시성공() {
        // GIVEN
        // WHEN
        List<MemberV2> memberV2s = memberJpaRepositoryV2.findAll();

        // THEN
        boolean isEmptyMembers = memberV2s.isEmpty();
        assertFalse(isEmptyMembers);
        System.out.println("memberV2s.size() = " + memberV2s.size());
    }

    @Test
    @DataSet(
        value = "sql/member.json",
        strategy = SeedStrategy.INSERT,
        disableConstraints = true,
        cleanAfter = true,
        transactional = true
    )
    // 원하는 결과 JSON 과 호출 결과가 같은지 확인
    // @ExpectedDataSet(value = "/sql/member.json")
    @DisplayName("DB Rider 로 저장한 회원 조회 시 성공합니다.")
    void DBRider로저장한회원_조회시성공() {
        // GIVEN
        Long meIdx = 2523L;

        // WHEN
        MemberV2 found = assertDoesNotThrow(
            () -> memberJpaRepositoryV2
                .findById(meIdx)
                .orElseThrow(() -> new RuntimeException("MEMBER_NOT_FOUND"))
        );

        // THEN
        assertNotNull(found);
        assertEquals(meIdx, found.getMeIdx());
        System.out.println("found.getMeIdx() = " + found.getMeIdx());
    }
}
```

## To Be Discussed 👀


1.

DBMS 사용 중이라면 Flyway, Liquibase 를 사용하여 개발과 테스트를 용이하게 할 수 있다.
    1.

테스트 시, 개발환경을 똑같이 미러링할 수 있다. 
    2.

아쉽게도 Flyway 는 자동 DB 변경점 감지를 지원 중이지 않는다. ( [~~자동감지에 대해 관심이 없다고 못을 박아버리고 이슈를 close 했다 ㅋ,,, flyway 를 좋게 보지 못 하는 이유 중 하나다,,~~](https://github.com/flyway/flyway/issues/648) )
2.

DB Rider 는 sql 형식의 포맷을 지원하지 않는 모양이다.
    1.

필자가 아는 한해서는 DB Rider 는 Hibernate 를 통해 각 파일형식에 따라 값을 읽어서 저장해주고 테스트 이후에 테스트 데이터를 날려줄 수 있게끔 한다.
    2.

커스터마이제이션을 통해 sql 파일도 지원할 수 있게 하면 어떨까 싶다.

# Reference 📚


https://dev.gmarket.com/76

https://testcontainers.com/

https://github.com/flyway/flyway/issues/648

https://github.com/flyway/flyway/issues/2667

https://www.baeldung.com/java-bill-pugh-singleton-implementation

https://www.baeldung.com/spring-dynamicpropertysource

https://velog.io/@junho5336/TestContainer-%EC%A0%81%EC%9A%A9%ED%95%98%EA%B8%B0#%ED%85%8C%EC%8A%A4%ED%8A%B8-%EA%B2%A9%EB%A6%AC

https://velog.io/@junho5336/TestContainer-%EC%A0%81%EC%9A%A9%ED%95%98%EA%B8%B0

https://velog.io/@namhm23/Spring-TestContainer-%ED%95%84%EC%9A%94%EC%84%B1%EA%B3%BC-%EC%84%A4%EC%A0%95%ED%95%98%EB%8A%94-%EB%B2%95Mysql-Redis

https://glenmazza.net/blog/entry/spring-boot-testcontainers-flyway

https://medium.com/@anil.java.story/springboot-test-containers-mysql-e0350645d608

https://kukim.tistory.com/149

https://feccle.tistory.com/125

https://velog.io/@jskim/MySQL-%EC%84%A4%EC%A0%95-%ED%8C%8C%EC%9D%BC-my.ini-%EB%98%90%EB%8A%94-my.cnf-%EC%B0%BE%EA%B8%B0

https://pretius.com/blog/testcontainers-liquibase/

https://soyphea.medium.com/spring-boot-and-liquibase-with-testcontainers-880c53db6c2d

https://yeongchan1228.tistory.com/134

https://mindybughunter.com/spring-boot-flyway-%EC%A0%81%EC%9A%A9%EA%B8%B0/

https://border-line.tistory.com/124

https://tecoble.techcourse.co.kr/post/2023-11-06-testcontainers/

https://medium.com/@bereketberhe27/simplifying-database-migrations-in-spring-boot-with-flyway-a-comprehensive-guide-c778b5dbb922

https://www.baeldung.com/database-migrations-with-flyway

https://bepoz-study-diary.tistory.com/397

https://blog.jetbrains.com/idea/2024/11/how-to-use-flyway-for-database-migrations-in-spring-boot-applications/

https://documentation.red-gate.com/fd/flyway-baseline-on-migrate-setting-277578974.html

https://medium.com/javarevisited/spring-boot-testing-testcontainers-and-flyway-df4a71376db4

https://martinfowler.com/articles/evodb.html

https://www.baeldung.com/liquibase-vs-flyway

https://medium.com/musinsa-tech/%EB%A6%AC%ED%8C%A9%ED%86%A0%EB%A7%81%EC%9D%84-%EC%9C%84%ED%95%9C-%ED%86%B5%ED%95%A9-%ED%85%8C%EC%8A%A4%ED%8A%B8-cd23498918a7

https://danielblancocuadrado.medium.com/database-rider-how-to-improve-your-db-tests-bef64e27e20

https://github.com/database-rider/database-rider

https://database-rider.github.io/getting-started/

https://database-rider.github.io/database-rider/
