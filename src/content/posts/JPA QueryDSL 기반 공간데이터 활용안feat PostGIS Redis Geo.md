---
title: "JPA & QueryDSL 기반 공간데이터 활용안(feat. PostGIS, Redis Geo)"
description: "공간데이터란 무엇이고, 주의점은 무엇인지, 또한 이를 Spring 단에서 처리하며 맞닥드렸던 문제점과 해결방법에 대해 나열해보고자 한다."
date: 2025-07-28
tags: [journal]
lang: ko
draft: false
---

# Why?

왜 배움?

---

---

공간데이터란 무엇이고, 주의점은 무엇인지, 또한 이를 Spring 단에서 처리하며 맞닥드렸던 문제점과 해결방법에 대해 나열해보고자 한다.

# What?

뭘 배움?

---

---

## 공간 데이터(Spatial Data)란?

공간 데이터(Spatial Data)는 지리적 위치 정보를 포함한 데이터를 말하며, 실제 세계의 객체나 사건, 현상이 가지는 위치(좌표, 주소 등)를 기반으로 표현됩니다.

주로 점(Point), 선(Line), 면(Polygon)의 형태로 나타납니다.

- **점(Point)**: 특정 위치를 나타내는 단일 좌표 (예: 상점, 버스 정류장).
- **선(LineString)**: 두 개 이상의 점을 연결하여 형성되는 객체 (예: 도로, 강).
- **면(Polygon)**: 세 개 이상의 점으로 둘러싸인 닫힌 영역 (예: 공원, 행정구역).

## 공간 데이터 저장 방식

공간 데이터 저장 방식은 크게 벡터(Vector)와 래스터(Raster) 두 가지가 있습니다.

### 벡터(Vector) 데이터 모델

- 점, 선, 면과 같은 기하학적 요소를 사용하여 객체를 표현합니다.
- 객체별 좌표 배열을 관리하며 정밀한 경계 및 형태 표현에 적합합니다.
- 예시: 건물 경계, 도로 네트워크 등

### 래스터(Raster) 데이터 모델

- 픽셀(Pixel)로 이루어진 격자(Grid) 형태로 데이터를 표현합니다.
- 위성 이미지, 고도 데이터, 온도와 같은 연속적인 값 표현에 적합합니다.

## SRID(Spatial Reference System Identifier)

SRID는 공간 데이터를 표현하는 데 사용되는 좌표계와 투영 방식을 식별하는 고유한 번호입니다.

- **EPSG:4326** (WGS84): 가장 널리 사용되는 위도·경도 기반 좌표계로 GPS에 사용됩니다.
- **EPSG:3857** (Web Mercator): 웹 지도 서비스(구글 맵 등)에서 많이 사용되는 좌표계입니다.

SRID는 정확한 위치 표현과 좌표계 변환을 가능하게 합니다.

## R-Tree와 공간지리인덱스(Spatial Index)

공간 데이터는 2차원 이상의 다차원 구조로 인해 일반적인 데이터베이스 인덱스(B-Tree 등)로는 효율적이지 않습니다.

이를 위해 공간지리인덱스가 사용됩니다.

### R-Tree

- 다차원 데이터를 효율적으로 검색하기 위한 계층적 트리 구조입니다.
- 최소 경계 사각형(MBR, Minimum Bounding Rectangle)을 사용하여 객체들을 그룹화하여 관리합니다.
- 검색 효율성이 뛰어나며 GIS 및 위치 기반 서비스(LBS)에서 널리 쓰입니다.

## PostgreSQL(PostGIS)에서의 공간 데이터 저장

PostgreSQL은 PostGIS 확장 모듈을 통해 공간 데이터를 지원하며, 주요 타입으로 **geometry**와 **geography**를 제공합니다.

### geometry 타입

- **좌표 체계**: 유클리드 평면(Euclidean Plane)을 기반으로 합니다.
- **성능**: 연산이 빠르고 데이터가 압축된 바이너리 형태로 저장되어 효율적입니다.
- **적합한 용도**: 좁은 지역 내에서의 정밀한 연산 및 지도 투영 좌표계(EPSG:3857 등)에 적합합니다.

**사용 예시:**

```sql
CREATE TABLE places (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    geom GEOMETRY(POINT, 4326)
);

```

### geography 타입

- **좌표 체계**: 지구의 곡률을 고려한 타원체(Spheroidal Coordinate System)를 기반으로 합니다.
- **정확성**: 넓은 지역에서 실제 거리와 면적을 정확하게 계산할 수 있습니다.
- **성능**: geometry보다 연산 속도가 느릴 수 있으나 정확성은 높습니다.
- **적합한 용도**: 대규모 범위에서 정확한 거리 계산이 필요한 경우 적합합니다.

**사용 예시:**

```sql
CREATE TABLE cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    coord GEOGRAPHY(POINT, 4326)
);

```

### geometry vs geography 선택 기준

- **geometry**: 좁은 지역, 빠른 성능 우선, 지도 투영 좌표계 활용 시
- **geography**: 넓은 지역, 정확한 거리 및 면적 계산 우선 시

## Redis에서의 공간 데이터 저장

Redis는 기본적으로 Key-Value 데이터베이스이지만, Redis 3.2부터 공간 데이터를 위한 GeoSpatial Index를 지원합니다.

### Redis Geo 명령어

- **GEOADD**: 위치 데이터 추가
    
    ```jsx
    GEOADD locations 127.0 37.5 "Seoul"
    
    ```
    
- **GEOPOS**: 객체의 위치 조회
    
    ```jsx
    GEOPOS locations "Seoul"
    
    ```
    
- **GEODIST**: 두 위치 간 거리 계산
    
    ```jsx
    GEODIST locations "Seoul" "Busan" km
    
    ```
    
- **GEOSEARCH / GEORADIUS**: 특정 위치 중심의 객체 검색
    
    ```jsx
    GEOSEARCH locations FROMMEMBER "Seoul" BYRADIUS 50 km
    
    ```
    

### Redis 공간 데이터 특징

- **Geohash 기반 Sorted Set**: 위도·경도를 Geohash로 변환하여 효율적으로 관리합니다.
- **빠른 성능**: 메모리 기반으로 실시간 위치 검색 및 근접 객체 검색에 최적화되어 있습니다.
- **적합한 용도**: 간단한 위치 기반 서비스, 캐싱, 실시간 추적 등

복잡한 공간 연산 및 대규모 GIS는 PostGIS와 같은 전문 데이터베이스가 더 적합합니다.

# How?

어떻게 씀?

---

## 전체적인 컴포넌트

| 계층 | 컴포넌트 | 역할 |
| --- | --- | --- |
| **API Layer** | ContentEndpoint | 클라이언트로부터 지도 콘텐츠 검색 요청을 받아들이는 API 엔드포인트 |
|  | ContentOnMapSearchReq | 지도 검색에 필요한 파라미터(좌표, 반경 등)를 담는 요청 DTO |
|  | ContentOnMapSearchResp | 검색 결과(콘텐츠 리스트, 메타데이터 등)를 담아 반환하는 응답 DTO |
| **Business Logic** | ContentUseCase | 비즈니스 로직을 수행하는 유스케이스 계층 |
|  | ContentUseCaseMapper | 엔티티 ↔ DTO 간 변환을 담당하는 매퍼 |
| **Infrastructure Layer** | ContentInfra | 인프라스트럭처 계층 추상화, 리포지토리 호출을 조율 |
|  | ContentCustomRepository | PostgreSQL/PostGIS 기반의 커스텀 쿼리 실행 리포지토리 |
| **Redis Cache Layer** | Redis | 빠른 공간 검색을 위한 인메모리 캐시 서버 |
|  | ContentGeoCache | Redis에 저장되는 지리정보 캐시 엔티티 |
|  | ContentGeoCacheRepository | Redis Geo 캐시의 읽기·쓰기 인터페이스 |
|  | GeoOperations (GEOSEARCH commands) | Redis의 GEOSEARCH 등 지리공간 연산 명령 호출 |
| **PostgreSQL + PostGIS** | PostgreSQL | 영구 저장소로서의 메인 RDBMS |
|  | PostGIS Extension | PostgreSQL에서 공간 데이터를 다루기 위한 확장 기능 |
|  | ContentEntity | DB 테이블 매핑 엔티티 (co_point: geometry(Point, 4326)) |
|  | Spatial Index (GiST/SP‑GiST) | 공간 쿼리 성능 향상을 위한 인덱스 |
| **PostGIS Functions** | ST_Distance / ST_DistanceSpheroid | 정확한 거리 계산을 위한 PostGIS 함수 |
|  | ST_Within | 지정된 영역 내 포함 여부를 판단하는 PostGIS 함수 |
|  | ST_MakePoint / ST_SetSRID | 점(포인트) 좌표 생성 및 SRID 설정 함수 |

![](/images/velog/dcbc1d40732bc8bb.png)

## 컴포넌트 설명

컴포넌트 설명에 앞서서 설계 의도 자체는 아래와 같다.

- 하드코딩은 최대한 지양할 것
- 모든 PostGis 를 지원할 수 있게 할 것
- Spatial Index 를 사용하는 함수만을 지향할 것 (

이를 주의하여 참고하도록 하자.

만약 다르게 설계 및 사용하고 싶다면 변형해도 좋다.

### PostGisJPQLTemplate

기본적으로 거리순정렬, 각 데이터에 대한 거리차이들을 구하려면 PostGIS 함수를 호출해야한다.

하지만 사내에서의 Querydsl 은 기본적으로 JPA & JPQL 을 따른다.

따라서 Native JPQL 대신해서 사용할 수 있도록 아래와 같이 직접적으로 선언해서 주입해주었다.

```java
/**
 * PostGis Function 을 사용하기 위한 Custom JPQL Template
 * @apiNote
 * SpatialTemplatesSupport 사용하여 내장된 PostGis Operator 추가.
 * HibernateSpatialSupport 사용 시 ST_ 함수에 대해 지원하지 않으므로 에러 발생함
 * <-> 함수에 대한 지원이 없어 직접 선언
 */
public class PostGisJPQLTemplate extends JPQLTemplates {

    public static final PostGisJPQLTemplate DEFAULT = new PostGisJPQLTemplate();

    /**
     * 내장된 Spatial Operator 추가
     * <p>
     * JPQL 전용 PostGis Operator 가 없어 com.querydsl.sql.spatial.PostGISTemplates 참조, 하드코딩을 통해 PostGis 함수들 추가
     */
    protected PostGisJPQLTemplate() {
        super();
        SpatialTemplatesSupport
            .getSpatialOps(true)
            .forEach(this::add);
        add(SpatialOps.DISTANCE_SPHERE, "ST_Distance_Sphere({0}, {1})");
        add(SpatialOps.DISTANCE_SPHEROID, "ST_DistanceSpheroid({0}, {1}, 'SPHEROID[\"WGS 84\",6378137,298.257223563]')" );
    }

    /**
     * KNN 알고리즘 사용하는 PostGis <-> 함수 선언
     * @see <a href="https://postgis.net/documentation/faq/spatial-indexes/[^2]">How do I use spatial indexes?</a>
     */
    public static NumberExpression<Double> distanceKnn(Path<Point> point, Expression<Point> other) {
        return Expressions.numberTemplate(
            Double.class,
            String.format("%s({0}, {1})",CustomPostGisDialect.KNN_DISTANCE_FUNCTION_NAME),
            point,
            other
        );
    }
}

```

```java
@Autowired
public void setEntityManager(EntityManager entityManager) {
    Assert.notNull(entityManager, "EntityManager must not be null!");
    JpaEntityInformation entityInformation = JpaEntityInformationSupport.getEntityInformation(domainClass, entityManager);
    SimpleEntityPathResolver resolver = SimpleEntityPathResolver.INSTANCE;
    EntityPath path = resolver.createPath(entityInformation.getJavaType());
    this.entityManager = entityManager;
    this.querydsl = new Querydsl(entityManager, new PathBuilder<>(path.getType(), path.getMetadata()));
    // PostGIS 함수를 사용하기 위해 JPQLTemplate 을 커스터마이징
    this.queryFactory = new JPAQueryFactory(PostGisJPQLTemplate.DEFAULT, entityManager);
}
```

### CustomPostGisDialect

위에서 보다보면 `CustomPostGisDialect` 이라는 친구를 선언한 것을 볼 수 있을 것이다.

이 또한 PostGis 의 `<->` 함수를 사용하기 위함이다.

다만 우리의 JPQL , Dialect 에 있는 SQL 예약어가 아니면 에러를 내뱉는다.

따라서 `<->` 를 인식하게끔 해주기 위해 다음 두 단계 작업을 처리해주었다.

1.

Dialect 를 직접 선언
2. resoureces/META-INF 에 직접 선언한 Dialect 를 등록
    1. `src/main/resources/META-INF/services/org.hibernate.boot.model.FunctionContributor`파일을 생성한다.
    2.

해당 파일에 직접 구현한 CustomFunctionContributor를 등록한다.
        1.

패키지명.컨트리뷰터이름 형태로 등록

```java
/**
 * PostGis Function 을 사용하기 위한 Custom Dialect Function
 *
 * @see <a href="https://www.inflearn.com/community/questions/1096265/hibernate-6-custom-%ED%95%A8%EC%88%98-%EB%93%B1%EB%A1%9D-%EB%B0%A9%EB%B2%95-%EA%B3%B5%EC%9C%A0[^4]">[hibernate 6] custom 함수 등록 방법</a>
 */
public class CustomPostGisDialect extends SpatialFunctionContributor {

    public static final String KNN_DISTANCE_FUNCTION_NAME = "distance_knn";
    public static final String KNN_DISTANCE_FUNCTION_PATTERN = "?1 <-> ?2";

    @Override
    public void contributeFunctions(final FunctionContributions functionContributions) {
        functionContributions
            .getFunctionRegistry()
            .registerPattern(
                KNN_DISTANCE_FUNCTION_NAME,
                KNN_DISTANCE_FUNCTION_PATTERN,
                functionContributions.getTypeConfiguration().getBasicTypeRegistry().resolve(StandardBasicTypes.DOUBLE)
            );
    }
}
```

![](/images/velog/63f4f0ca7948f653.png)

![](/images/velog/260bdc4b874bb724.png)

### 동적 조건부절

위와 같이 환경설정이 끝났다면 이제 실제로 SQL 문에 대한 쿼리를 짤 차례이다.

두 가지 주의사항이 있는데 하나는 좌표계이고, 하나는 ST_DistanceSpheroid 함수이다.

> 좌표계
> 

필자는 4326 좌표계 & Geometry 를 사용하고 있어 실제 거리가 아닌 각도 체계 거리로 처리되는 문제가 있었다.

이를 해결하기 위해서 ST_Transform 함수를 통해 3857 좌표계로 변환, ST_DWithin 함수를 사용하였다.

> ST_DistanceSpheroid 함수
> 

필자는 실제 거리에 가까운 ST_DistanceSpheroid  함수 사용하지 않았다.

엥 실제 거리에 가까우니까 좋은 거 아냐 하는 마음에 사용할 수 있지만, 

이는 Spatial Index 를 사용하지 않았고, 앞서 말했듯이 최대한 Spatial Indeex 를 사용하고자 하였다.

따라서 필자는 [PostGis 에 적혀있는 함수목록](https://postgis.net/documentation/faq/spatial-indexes/) 을 최대한 사용하였다.

```java
/**
 * 반경 내에 있는지에 대한 WHERE 절
 *
 * @implNote
 * PostGIs :: ST_DWithin & ST_Transform 함수 사용
 * <p>
 * ST_DWithin -> Spatial Index 를 사용하여 R-Tree 사용, 쿼리 최적화 가능
 * ST_Transform -> SRID 에 대해 3857 좌표계로 변환하여 사용 (4326 좌표계는 각도 체계이므로 m 단위의 처리 X)
 */
default BooleanExpression coPointInBoundary(BigDecimal coLatitude, BigDecimal coLongitude, BigDecimal mapRadius) {
    if (coLatitude == null || coLongitude == null) {
        return null;
    }
    Latitude.validate(coLatitude);
    Longitude.validate(coLongitude);
    if (Objects.nonNull(mapRadius) && mapRadius.compareTo(BigDecimal.valueOf(0)) <= 0) {
        throw new IllegalArgumentException("요청 반경은 0 이하일 수 없습니다.");
    }

    return Optional.ofNullable(mapRadius)
        .stream()
        .map(radius -> JTSGeometryExpressions.dwithin(
                JTSGeometryExpressions.asJTSGeometry(contentEntity.coPoint).transform(3857),
                    JTSGeometryExpressions.asJTSGeometry(
                        GeoValue.newGisPoint(coLongitude, coLatitude)
                    ).transform(3857),
                    mapRadius.doubleValue()
                )
                .isTrue()
        )
        .findFirst()
        .orElse(null);
}
```

```java
/**
 * 가장 가까운 거리 순에 대한 ORDER BY 절
 *
 * @apiNote PostGIs :: <-> Operator 사용 ST_DistanceSpheroid 사용 시 Spatial Index 를 사용하지 않아 성능 저하
 */
default <T> JPAQuery<T> orderByDistanceAsc(JPAQuery<T> query, Boolean isDistanceAsc, BigDecimal userLongitude, BigDecimal userLatitude) {
    if (isDistanceAsc == null || !isDistanceAsc) {
        return query;
    }
    if (userLongitude == null || userLatitude == null) {
        return query;
    }
    Point userPoint = GeoValue.newGisPoint(userLongitude, userLatitude);
    JTSGeometryExpression<Point> jtsGeometry = JTSGeometryExpressions.asJTSGeometry(userPoint);
    NumberExpression<Double> distance = PostGisJPQLTemplate.distanceKnn(contentEntity.coPoint, jtsGeometry);
    return query.orderBy(distance.asc());
}
```

## 주의점

### 캐시와 DB 동기화

입력에 따른 캐싱 저장과 Cache-aside 를 활용한 조회는 단순하다.

다만 수정/삭제에 따라 캐싱과 DB 를 동기화해야하는 포인트가 어렵다.

특히 Redis Geo 는 Sorted Set 으로 관리되므로 — ${KEY} ${MEMBER:위경도} ${VALUE} — 

수정/삭제 시에는 아래와 같이 처리해주어야 한다.

> 수정
> 
> 
> : GEOADD 를 호출
> 

```bash
# 기존 위치 덮어쓰기
GEOADD locations 127.045 37.512 "loc1"

```

```java
// Spring RedisTemplate
String key = "locations";
String member = "loc1";
Point newPoint = new Point(127.045, 37.512);
redisTemplate.opsForGeo().add(key, newPoint, member);

```

> 삭제
> 
> 
> : ZREM 을 호출
> 

```bash
ZREM locations "loc1"

```

```java

// Spring RedisTemplate
redisTemplate.opsForZSet().remove("locations", "loc1");

```

# 총평


예제가 없어서 그냥 SQL 로 짜면 될 것을 굳이굳이 Querydsl 로 하겠다고 몇 번의 삽질을 했는지 모른다.

다만 이렇게 해두고 나니 하드코딩이 아닌 코드 단으로 로직을 처리할 수 있다는 장점이 있다.

아래와 같이 여러 방면에서의 제한점이 있는지 체크해보고 도입해도록 하자.

- Redis Geo 와 PostGis 의 차이가 얼만큼이 나는지
- Spatial Index 사용, 미사용의 성능 최대치 차이점
- SQL 에 대한 커스텀 Dialect 선언 시 Multi DB 사용 가능한지

[^1]: https://postgis.net/workshops/postgis-intro/geography.html <https://postgis.net/workshops/postgis-intro/geography.html>
[^2]: https://postgis.net/documentation/faq/spatial-indexes/ <https://postgis.net/documentation/faq/spatial-indexes/>
[^3]: https://redis.io/docs/latest/develop/data-types/geospatial/ <https://redis.io/docs/latest/develop/data-types/geospatial/>
[^4]: https://www.inflearn.com/community/questions/1096265/hibernate-6-custom-%ED%95%A8%EC%88%98-%EB%93%B1%EB%A1%9D-%EB%B0%A9%EB%B2%95-%EA%B3%B5%EC%9C%A0 <https://www.inflearn.com/community/questions/1096265/hibernate-6-custom-%ED%95%A8%EC%88%98-%EB%93%B1%EB%A1%9D-%EB%B0%A9%EB%B2%95-%EA%B3%B5%EC%9C%A0>
