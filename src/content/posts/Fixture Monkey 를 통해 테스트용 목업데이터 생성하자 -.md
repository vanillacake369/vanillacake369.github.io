---
title: "Fixture Monkey 를 통해 테스트용 목업데이터 생성하자 :-)"
description: "Test Fixture 라이브러리 활용 케이스를 소개해보고자 한다."
date: 2025-03-02
tags: []
category: uncategorized
lang: ko
draft: false
---

# Episode 📜

---

![](/images/velog/fbc2bc911e7876cd.png)


유닛 테스트를 짤 때의 가장 큰 고민점이 바로 given context 를 세팅하는 것일 것이다.

이를 Test Fixture 라고 부른다.

어떤 목적의 테스트인지, 어떤 유스케이스와 어떤 도메인들이 묶여있을지에 따라 다르게 세팅해야한다.

이 때 고민하는 것 중에 하나가 테스트 목업 데이터이다.

하지만 매 테스트 케이스마다 직접 생성하는 것은 번거로운 작업이다.

우리는 이런 수작업보다 자동화된 Utils 를 원하게 된다.

FixtureMonkey 는 이를 지원하는 네이버에서 오픈소스화한 라이브러리이다.

Java, Kotlin 을 지원 중에 있으며, 

최근에도 커밋이 올라오는 것을 보아하니 유지보수가 계속 되고 있음을 확인할 수 있었다.

이외에도 Instancio 와 AutoParam 도 있는데 Instancio 도 상당히 매력적이라

쓰고 싶은 사람은 고려를 해보는 것도 좋을 거 같다.

( 함수형을 좋아하는 필자는 FixtureMonkey 로 정착하기 전이였다면 Instancio 를 선택했을 듯하다 )


# About 💁‍♂️

---

사실 해당 포스트는 그다지 깊은 내용을 다룰 수가 없다고 생각한다.

이미 [공식문서](https://github.com/naver/fixture-monkey) 와 국내 블로그에서 너무나도 잘 소개 되어있기 때문이다.

~~특히 공식문서가 한글로 이렇게 친절히 되어있는 것은,,, 국뽕심취주의를 불러일으킨다,,~~

그렇기에 필자는 사내에서 어떻게 활용하고 있는지만 코드로 남기고자 한다.

도입 직후 사내에 아래와 같은 부수효과가 나타났기 때문이다.

- 목업 섹션에서 Fixture Monkey 는 공통 모듈이라고 인지하지 않는 팀원들이 나타났다.
   
  - 대부분의 부수효과는 이로 인해 발생했었다,,, ^^

- Fixture Monkey 코드 설정을 여기저기서 하게됨

- 목업 데이터 구성코드가 본 테스트 코드보다 길어지게 됨

- `비슷한 패턴의 함수 호출 & 객체 타입만 바뀜` 의 코드가 계속 반복

# Apply 🧑‍💻

---

필자는 아래와 같이 FixtureMonkey 에 대한 공통 헬퍼 클래스를 만들었다.

```java
public final class FixtureFactory {

    private final static FixtureMonkey FIXTURE_MONKEY = FixtureMonkey.builder()
        .objectIntrospector(new FailoverIntrospector(
            List.of(
                BeanArbitraryIntrospector.INSTANCE,
                BuilderArbitraryIntrospector.INSTANCE,
                FieldReflectionArbitraryIntrospector.INSTANCE,
                ConstructorPropertiesArbitraryIntrospector.INSTANCE
            )))
        .defaultNotNull(true) // 설정되지 않은 필드는 null 이 아닌 랜덤값이 자동으로 할당된다.
        .build();

    public static <T> T createFixture(Class<T> clazz) {
        ArbitraryBuilder<T> entityBuilder = FixtureFactory.FIXTURE_MONKEY
            .giveMeBuilder(clazz);
        return entityBuilder.sample();
    }

    public static <T> T createFixture(Class<T> clazz, Map<JavaGetterMethodReference<T, ?>, ?> getterToFieldValues) {
        ArbitraryBuilder<T> entityBuilder = FixtureFactory.FIXTURE_MONKEY
            .giveMeBuilder(clazz);
        getterToFieldValues.forEach((getterMethodReference, fieldValue) ->
            entityBuilder.set(
                javaGetter(getterMethodReference),
                fieldValue
            )
        );
        return entityBuilder.sample();
    }

    @SafeVarargs
    public static <T> T createFixture(
        Class<T> clazz,
        Map<JavaGetterMethodReference<T, ?>, ?> getterToFieldValues,
        JavaGetterMethodReference<T, ?>... ignoreFields
    ) {
        ArbitraryBuilder<T> entityBuilder = FixtureFactory.FIXTURE_MONKEY
            .giveMeBuilder(clazz);
        getterToFieldValues.forEach((getterMethodReference, fieldValue) ->
            entityBuilder.set(
                javaGetter(getterMethodReference),
                fieldValue
            )
        );
        Arrays.stream(ignoreFields).forEach(ignoreField ->
            entityBuilder.set(
                javaGetter(ignoreField),
                null
            )
        );
        return entityBuilder.sample();
    }

    public static <T> List<T> createFixtures(int size, Class<T> clazz) {
        ArbitraryBuilder<T> entityBuilder = FixtureFactory.FIXTURE_MONKEY
            .giveMeBuilder(clazz);
        return entityBuilder.sampleList(size);
    }

    public static <T> List<T> createFixtures(int size, Class<T> clazz, Map<JavaGetterMethodReference<T, ?>, ?> getterToFieldValues) {
        ArbitraryBuilder<T> entityBuilder = FixtureFactory.FIXTURE_MONKEY
            .giveMeBuilder(clazz);
        getterToFieldValues.forEach((getterMethodReference, fieldValue) ->
            entityBuilder.set(
                javaGetter(getterMethodReference),
                fieldValue
            )
        );
        return entityBuilder.sampleList(size);
    }

    @SafeVarargs
    public static <T> List<T> createFixtures(
        int size,
        Class<T> clazz,
        Map<JavaGetterMethodReference<T, ?>, ?> getterToFieldValues,
        JavaGetterMethodReference<T, ?>... ignoreFields
    ) {
        ArbitraryBuilder<T> entityBuilder = FixtureFactory.FIXTURE_MONKEY
            .giveMeBuilder(clazz);
        getterToFieldValues.forEach((getterMethodReference, fieldValue) ->
            entityBuilder.set(
                javaGetter(getterMethodReference),
                fieldValue
            )
        );
        Arrays.stream(ignoreFields).forEach(ignoreField ->
            entityBuilder.set(
                javaGetter(ignoreField),
                null
            )
        );
        return entityBuilder.sampleList(size);
    }

    public static Arbitrary<String> generateRandomEmail() {
        return Arbitraries.strings()
            .withCharRange('a', 'z')
            .ofLength(5)
            .map(id -> id + "@hamagroups.io");
    }

    public static Arbitrary<String> generateRandomPhoneNumber() {
        return Arbitraries.integers().between(1000, 9999)
            .flatMap(firstPart -> Arbitraries.integers().between(1000, 9999)
                .map(secondPart -> "010-" + firstPart + "-" + secondPart));
    }

    public static Arbitrary<String> generateRandomBirthDay() {
        return Arbitraries.integers().between(1950, 2010)  // 연도는 1950 ~ 2010 사이
            .flatMap(year -> Arbitraries.integers().between(1, 12)
                .map(month -> {
                    int lastDayOfMonth = YearMonth.of(year, month).lengthOfMonth();
                    return Arbitraries.integers().between(1, lastDayOfMonth)
                        .map(day -> String.format("%04d-%02d-%02d", year, month, day));
                }).flatMap(date -> date)
            );
    }

    public static Arbitrary<String> generateRandomIsoDate() {
        return Arbitraries.integers().between(1900, 2100)  // 연도는 1900 ~ 2100 사이
            .flatMap(year -> Arbitraries.integers().between(1, 12)
                .map(month -> {
                    int lastDayOfMonth = YearMonth.of(year, month).lengthOfMonth();
                    return Arbitraries.integers().between(1, lastDayOfMonth)
                        .map(day -> String.format("%04d-%02d-%02d", year, month, day));
                }).flatMap(date -> date)
            );
    }

    public static Arbitrary<LocalDate> generateRandomPastLocalDate() {
        return Arbitraries.integers()
            .between(0, 365 * 10)
            .map(day ->
                LocalDate
                    .now()
                    .minusDays(day));
    }

    public static Arbitrary<LocalDateTime> generateRandomPastLocalDateTime() {
        // 과거 10년 동안의 랜덤 날짜를 생성
        return Arbitraries.integers().between(0, 365 * 10)
            .flatMap(day -> Arbitraries.integers().between(0, 23)
                .flatMap(hour -> Arbitraries.integers().between(0, 59)
                    .flatMap(minute -> Arbitraries.integers().between(0, 59)
                        .map(second -> LocalDateTime.now()
                            .minusDays(day)
                            .withHour(hour)
                            .withMinute(minute)
                            .withSecond(second)))));
    }

    public static Arbitrary<LocalDateTime> generateRandomFutureLocalDateTime() {
        // 미래 10년 동안의 랜덤 날짜를 생성
        return Arbitraries.integers().between(0, 365 * 10)
            .flatMap(day -> Arbitraries.integers().between(0, 23)
                .flatMap(hour -> Arbitraries.integers().between(0, 59)
                    .flatMap(minute -> Arbitraries.integers().between(0, 59)
                        .map(second -> LocalDateTime.now()
                            .plusDays(day)
                            .withHour(hour)
                            .withMinute(minute)
                            .withSecond(second)))));
    }


    public static Arbitrary<LocalDateTime> generateRandomLocalDateTime() {
        // 과거, 미래 포함 10년 동안의 랜덤 날짜를 생성
        return Arbitraries.integers().between(-365 * 5, 365 * 5)
            .flatMap(day -> Arbitraries.integers().between(0, 23)
                .flatMap(hour -> Arbitraries.integers().between(0, 59)
                    .flatMap(minute -> Arbitraries.integers().between(0, 59)
                        .map(second -> LocalDateTime.now()
                            .plusDays(day)
                            .withHour(hour)
                            .withMinute(minute)
                            .withSecond(second)))));
    }

    public static Arbitrary<Double> generateRandomLatitude() {
        return Arbitraries.doubles().ofScale(17)
            .between(37.1234567890123, 37.1234567890124);
    }

    public static Arbitrary<Double> generateRandomLongitude() {
        return Arbitraries.doubles().ofScale(17)
            .between(126.1234567890123, 126.1234567890124);
    }
}

```

```java 
@Test
@DisplayName("브랜드관 신청가능 기업 조회결과목록에 대해 기업에 따른 직종들을 매핑합니다.")
void 브랜드관신청가능기업조회결과목록에대해_기업에따른직종들을_매핑(Long id) {
	// GIVEN
    Long size = 3L;
    Class<T> clazz = BrandAffiliateQueryResponseV2.class;
	List<BrandAffiliateQueryResponseV2> fixtures1 = FixtureFactory.createFixtures(size, clazz,
            Map.ofEntries(
                Map.entry(BrandAffiliateQueryResponseV2::getMcIdx, id)
            )
        );
        
	,,,
}
```


또한 도메인 객체를 싱글톤으로 유지할 수 있도록 해주었다.

~~이것 또한 Generic 하게 만들어주고 싶었지만 쉽지 않아서 패스했다 :-)~~

```java
public class AreaDefineV2Fixture {

    private final AreaDefineV2 areaDefineV2;

    private AreaDefineV2Fixture() {
        this.areaDefineV2 = FixtureFactory.createFixture(AreaDefineV2.class);
    }

    public static AreaDefineV2 getSingleton() {
        return SingletonHolder.INSTANCE.areaDefineV2;
    }

    private static class SingletonHolder {

        private static final AreaDefineV2Fixture INSTANCE = createInstance();

        private static AreaDefineV2Fixture createInstance() {
            return new AreaDefineV2Fixture();
        }
    }
}

```

이렇게 생성한 목업 도메인 객체들은 영속화를 해주고 테스트 케이스에 사용해주면 된다 :-)


# Reference 📚

---

https://naver.github.io/fixture-monkey/v1-0-0-kor/docs/generating-objects/introspector/

https://haril.dev/en/blog/2024/02/03/Fixture-Monkey

https://oliveyoung.tech/2024-04-01/testcode-use-fixture-monkey/

https://github.com/naver/fixture-monkey
