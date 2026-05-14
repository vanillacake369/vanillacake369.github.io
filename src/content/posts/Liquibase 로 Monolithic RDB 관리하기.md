---
description: "Liquibase 를 통해 스키마 변경점을 관리하고, 스테이징 별 스키마 업데이트 및 롤백을 지원해보자"
date: 2025-03-02
tags: [journal]
lang: ko
draft: false
---

# Liquibase 란?

“database schema change management solution”

마이그레이션 스크립트를 작성하여 DB 스키마의 형상관리를 지원해주는 툴이다.

> Liquibase is a database schema change management solution that enables you to revise and release database changes faster and safer from development to production.
>
> To start using Liquibase quickly and easily, you can write your migration scripts in SQL.
>
> To take advantage of database abstraction abilities that allow you to write changes once and deploy to different database platforms, you can specify database-agnostic changes in XML, JSON, or YAML.
>
> [Introduction to Liquibase](https://docs.liquibase.com/concepts/introduction-to-liquibase.html)

# 왜 Liquibase 를 선택했는가 ?

Flyway 라는 좋은 친구도 있다.

하지만 롤백 지원, RDS 로그 테이블 저장, 테이블 간 DIFF 스냅샷 지원 등등 다양한 기능이 지원되는 게 좋았다.

또한 코드 상으로 버전관리가 되는 부분이 이점으로 다가왔다.

# Liquibase 사용 장단점은 무엇일까 ?

## 장점

### DB 스키마 변경내역을 형상관리할 수 있게함

liquibase 를 통해 ddl 을 날릴 수 있다.

이렇게 처리된 내역은 DATABASECHANGELOG 라는 RDB 상에 박혀있게된다.

또한 git 에도 남게되어 형상관리하기 용이하다.

( 또 친히 여러 군데에서 한 번에 스키마 변경하지 말라고 DATABASECHANGELOGLOCK 테이블을 통해 LOG 테이블에 대한 LOCK 을 지원한다,,, 스윗,,,, )

### SQL,JSON,XML,YAML 등등 다양한 언어를 지원한다.

각 팀이 편한 방식을 따르면 될 것 같다.

필자의 경우 ddl 을 사용하는 게 편해서 sql 을 선택했다. (yml 도 지원하는데 이건 포맷을 따라야하므로 적응기가 필요해보인다.)

### 현 Snapshot, 각 스테이징 DB 간의 diff 등을 처리가능

아래 그림과 같이 source 와 target 을 통해 log 를 저장할 수 있다.

여러 스테이징을 관리하고 있다면 참 유용한 기능인 것 같다.

![](/images/velog/9ea5a6ce61e88cf9.png)

![](/images/velog/87d1b4825e5a9a2a.png)

JPA Buddy 와 IntelliJ 내장 기능을 통해 처리가능함

### 필요한 경우 롤백이 가능

\*flyway 는 유료소스에서만 가능하다. (가능은 한데,,, undo 스크립트를 따로 작성해 실행하도록 해야한다,,)

\*또한 flyway 는 데이터에 대한 스냅샷을 지원치 않는다.

[https://www.baeldung.com/liquibase-vs-flyway#:~:text=Defining a Change,changes to different database types](https://www.baeldung.com/liquibase-vs-flyway#:~:text=Defining%20a%20Change,changes%20to%20different%20database%20types)

### 인텔리제이, 스프링부트 친화적임

https://contribute.liquibase.com/extensions-integrations/directory/integration-docs/springboot/#__tabbed_1_2

https://www.jetbrains.com/help/idea/liquibase.html#generate-migration-script

현재 모델에 대한 스냅샷 또한 코드로써 저장 가능함

### Docker container image 도 제공한다.

> Liquibase Docker container image includes the Liquibase software, Java, JDBC drivers, and all other dependencies already preconfigured.

The image is based on the [Eclipse Temurin](https://hub.docker.com/_/eclipse-temurin/) image `eclipse-temurin:17-jre-focal`.

> Docker pull command:
>
> ```
> docker pull liquibase/liquibase
> ```
>
> [Using Liquibase and Docker](https://docs.liquibase.com/workflows/liquibase-community/using-liquibase-and-docker.html)

## 단점

### changelog 처리에 대한 학습곡선

changelog 를 건드리거나 이전 작업물을 조금이라도 건드리면 에러를 뱉는다.

물론 스키마를 자주 변경하지는 않겠지만, 디버깅에도 걸리지 않아서 이게 어지간히 빡친다.

### 아래 주의사항을 꼭 지켜줘야 한다.

1. liquibase 는 comment 도 중요데이터이므로 빼먹지 말자. new line 도 신경써줘야한다.

가령 아래와 같이 `--liquibase formatted sql` 코멘트가 빠지면 추가되는 changeset 에 대해서 checksum 에러를 내뱉는다.

    ```yaml
    --liquibase formatted sql

    --changeset sql-test:1
    --validCheckSum: 8:b4fd16a20425fe377b00d81df722d604
    create table test2(
    id int
    );
    ```

    https://docs.liquibase.com/concepts/changelogs/changeset-checksums.html#sql_example

    https://www.liquibase.com/blog/what-affects-changeset-checksums

2. `--validCheckSum` 을 추가하여 `허용되는 checksum 이야~ 이 친구는 안전하다구~` 라고 알려준다.

   https://stackoverflow.com/questions/71917324/how-to-fix-validationfailedexception-in-liquibase-checksum

3. `runOnChange` 속성을 추가한다.

4.

위 세 가지 방법을 다 처리하더라도 안 되면 DB 롤백을 해줘야한다. (이게 진짜 고역이다,,)

웬만한 이슈는 1,2 번이였다.

필자는 1,2까지만 해줘도 다 해결되었었다.

대부분 포맷을 잘 못 맞추었거나, syntax 에러가 발생하거나였다.

### liquibase 가 말을 안 듣게 되면 명령어를 직접 수행해야할 수도 있다.

mysql server 에 들어가서 liquibase 에 대한 command 를 날려줘야한다.

즉, 이러한 경우 spring boot 에 command 를 날릴 수 없다

(왜 이런 건 사용자 친화적이 아닌 만드는 사람 친화적으로 만드는지 모르겠다,,)

따라서 cli 를 적용하는 bean 을 만들어 한 번 처리를 해줘야하는 단점이 존재한다.

# 실습

build.gradle

```yaml
plugins {
id 'java'
id 'org.springframework.boot' version '3.3.2'
id 'io.spring.dependency-management' version '1.1.6'
}

group = 'io.dodn.demo'
version = '0.0.1-SNAPSHOT'

java {
toolchain {
languageVersion = JavaLanguageVersion.of(17)
}
}

configurations {
compileOnly {
extendsFrom annotationProcessor
}
}

repositories {
mavenCentral()
}

dependencies {
implementation 'org.springframework.boot:spring-boot-starter-data-jdbc'
implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
//    implementation 'org.springframework.boot:spring-boot-starter-data-r2dbc'
//    runtimeOnly 'io.asyncer:r2dbc-mysql'
annotationProcessor 'org.projectlombok:lombok'
implementation 'org.springframework.boot:spring-boot-starter-jdbc'
implementation 'org.springframework.boot:spring-boot-starter-web'
implementation 'org.liquibase:liquibase-core'
compileOnly 'org.projectlombok:lombok'
runtimeOnly 'com.mysql:mysql-connector-j'
testImplementation 'org.springframework.boot:spring-boot-starter-test'
testImplementation 'io.projectreactor:reactor-test'
testRuntimeOnly 'org.junit.platform:junit-platform-launcher'
}

tasks.named('test') {
useJUnitPlatform()
}
```

application.yml

```yaml
spring:
  #  config:
  #    activate:
  #      on-profile: local
  # DB 연결
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://localhost:3307/liquibase-practice-mysql?useSSL=false&useUnicode=true
    username: admin
    password: 1234qwer!
  # JPA 설정
  jpa:
    database-platform: org.hibernate.dialect.MySQLDialect
    properties:
      hibernate:
        jdbc:
          time_zone: Asia/Seoul
          batch_size: 1000
          order_inserts: true
          order_updates: true
          ddl-auto: create # ⚠️ 절대 none 으로 유지할 것 ⚠️
          auto_quote_keyword: true # 예약어 사용가능
          globally_quoted_identifiers: true # 예약어 사용가능
          show_sql: true # sql 로깅
          generate_statistics: true # 쿼리수행 통계
          format_sql: true # SQL문 정렬하여 출력
          highlight_sql: true # SQL문 색 부여
      default_batch_fetch_size: 1000
    open-in-view: false
  # Liquibase 설정
  liquibase:
    change-log: classpath:db/changelog/db.changelog-master.sql
logging:
  pattern:
    dateformat: yyyy-MM-dd HH:mm:ss.SSS,Asia/Seoul
  level:
    root: info
    com.restApi.restApiSpringBootApp: debug
    org.springframework: WARN
    org:
      springframework:
        web:
          reactive:
            function:
              client: DEBUG
      hibernate:
        orm:
          jdbc:
            bind: TRACE # jdbc bind value 로깅 처리
```

BaseEntity.java

```java
@Getter
@Setter
@MappedSuperclass
@SuperBuilder
@EntityListeners(AuditingEntityListener.class)
@NoArgsConstructor
public abstract class BaseTimeEntity {

  @CreationTimestamp
  @Column(updatable = false)
  @DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
  private LocalDateTime updatedAt;
}
```

User.java

```java
@Entity
@Getter
@Builder
@DynamicUpdate
@DynamicInsert
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "liquibase_user")
public class User extends BaseTimeEntity{

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "user_idx", nullable = false, updatable = false)
  private Long userIdx;

  @Column(name = "user_name", length = 16)
  private String userName;

  @Column(name = "user_email", length = 64)
  private String userEmail;

  @Column(name = "user_password", length = 255)
  private String userPassword;
}

```

db.changelog-master.sql

```sql
--liquibase formatted sql
--changeset admin:sample1_1
ALTER TABLE liquibase_user DROP user_addr

--changeset admin:sample1_2
ALTER TABLE liquibase_user ADD user_addr VARCHAR(255);
```

이에 따라 DATABASECHANGELOG 테이블에 아래와 같이 저장되게 된다.

![](/images/velog/a251e59136fd7b64.png)

# build.gradle 을 통해 snapshot 을 실행해보자.

build.gradle

```sql
import org.liquibase.gradle.LiquibaseTask

plugins {
    id 'java'
    id 'org.springframework.boot' version '3.3.2'
    id 'io.spring.dependency-management' version '1.1.6'
    id 'org.liquibase.gradle' version '2.2.0'
}

group = 'io.dodn.demo'
version = '0.0.1-SNAPSHOT'

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(17)
    }
}

configurations {
    compileOnly {
        extendsFrom annotationProcessor
    }
    liquibaseRuntime.extendsFrom runtimeClasspath
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-data-jdbc'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
//    implementation 'org.springframework.boot:spring-boot-starter-data-r2dbc'
//    runtimeOnly 'io.asyncer:r2dbc-mysql'
    annotationProcessor 'org.projectlombok:lombok'
    implementation 'org.springframework.boot:spring-boot-starter-jdbc'
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.liquibase:liquibase-core'
    compileOnly 'org.projectlombok:lombok'
    runtimeOnly 'com.mysql:mysql-connector-j'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'io.projectreactor:reactor-test'
    testRuntimeOnly 'org.junit.platform:junit-platform-launcher'
    liquibaseRuntime sourceSets.main.output
    liquibaseRuntime 'info.picocli:picocli:4.6.1'
}

tasks.named('test') {
    useJUnitPlatform()
}

liquibase {
    activities {
        main {
            changeLogFile "src/main/resources/db/changelog/db.changelog-master.sql"
            url "jdbc:mysql://localhost:3307/liquibase-practice-mysql"
            username "admin"
            password "1234qwer!"
        }
    }
    runList = 'main'
}

tasks.register('liquibaseSnapshot', LiquibaseTask) {
    changeLogFile 'src/main/resources/db/changelog/db.changelog-master.sql'
    url 'jdbc:mysql://localhost:3307/liquibase-practice-mysql'
    username 'admin'
    password '1234qwer!'
}
```

위와 같이 작성한 뒤, ./gradlew snpashot 을 실행해보자.

아래와 같이 나오는 게 보일 것이다.

```sql
AM 2:56:54: Executing 'snapshot'...

> Task :snapshot
liquibase-plugin: The 'changeLogFile' has been deprecated.  Please use 'changelogFile' in your activity instead.
liquibase-plugin: Running the 'main' activity...
####################################################
##   _     _             _ _                      ##
##  | |   (_)           (_) |                     ##
##  | |    _  __ _ _   _ _| |__   __ _ ___  ___   ##
##  | |   | |/ _` | | | | | '_ \ / _` / __|/ _ \  ##
##  | |___| | (_| | |_| | | |_) | (_| \__ \  __/  ##
##  \_____/_|\__, |\__,_|_|_.__/ \__,_|___/\___|  ##
##              | |                               ##
##              |_|                               ##
##                                                ##
##  Get documentation at docs.liquibase.com       ##
##  Get certified courses at learn.liquibase.com  ##
##                                                ##
####################################################
Starting Liquibase at 02:56:56 (version 4.27.0 #1525 built at 2024-03-25 17:08+0000)
[2024-08-05 02:56:56] INFO [liquibase.ui] ####################################################
##   _     _             _ _                      ##
##  | |   (_)           (_) |                     ##
##  | |    _  __ _ _   _ _| |__   __ _ ___  ___   ##
##  | |   | |/ _` | | | | | '_ \ / _` / __|/ _ \  ##
##  | |___| | (_| | |_| | | |_) | (_| \__ \  __/  ##
##  \_____/_|\__, |\__,_|_|_.__/ \__,_|___/\___|  ##
##              | |                               ##
##              |_|                               ##
##                                                ##
##  Get documentation at docs.liquibase.com       ##
##  Get certified courses at learn.liquibase.com  ##
##                                                ##
####################################################
Starting Liquibase at 02:56:56 (version 4.27.0 #1525 built at 2024-03-25 17:08+0000)
Liquibase Version: 4.27.0
[2024-08-05 02:56:56] INFO [liquibase.ui] Liquibase Version: 4.27.0
WARNING: License service not loaded, cannot determine Liquibase Pro license status. Please consider re-installing Liquibase to include all dependencies. Continuing operation without Pro license.
[2024-08-05 02:56:56] INFO [liquibase.ui] WARNING: License service not loaded, cannot determine Liquibase Pro license status. Please consider re-installing Liquibase to include all dependencies. Continuing operation without Pro license.
[2024-08-05 02:56:56] INFO [liquibase.integration] Starting command execution.
[2024-08-05 02:56:57] INFO [liquibase.snapshot] Creating snapshot
Database snapshot for jdbc:mysql://localhost:3307/liquibase-practice-mysql
-----------------------------------------------------------------
Database type: MySQL
Database version: 9.0.1
Database user: admin@172.18.0.1
Included types:
    liquibase.structure.core.Catalog
    liquibase.structure.core.Column
    liquibase.structure.core.ForeignKey
    liquibase.structure.core.Index
    liquibase.structure.core.PrimaryKey
    liquibase.structure.core.Schema
    liquibase.structure.core.Sequence
    liquibase.structure.core.Table
    liquibase.structure.core.UniqueConstraint
    liquibase.structure.core.View

Catalog: liquibase-practice-mysql
    liquibase.structure.core.Index:
        PRIMARY
            columns:
                ID
            table: DATABASECHANGELOGLOCK
            unique: true
        PRIMARY
            columns:
                user_idx
            table: liquibase_user
            unique: true

    liquibase.structure.core.PrimaryKey:
        PRIMARY
            backingIndex: PRIMARY
            columns:
                ID
            table: DATABASECHANGELOGLOCK
        PRIMARY
            backingIndex: PRIMARY
            columns:
                user_idx
            table: liquibase_user

    liquibase.structure.core.Table:
        DATABASECHANGELOG
            columns:
                AUTHOR
                    nullable: false
                    order: 2
                    type: VARCHAR(255 BYTE)
                COMMENTS
                    nullable: true
                    order: 9
                    type: VARCHAR(255 BYTE)
                CONTEXTS
                    nullable: true
                    order: 12
                    type: VARCHAR(255 BYTE)
                DATEEXECUTED
                    nullable: false
                    order: 4
                    type: DATETIME
                DEPLOYMENT_ID
                    nullable: true
                    order: 14
                    type: VARCHAR(10 BYTE)
                DESCRIPTION
                    nullable: true
                    order: 8
                    type: VARCHAR(255 BYTE)
                EXECTYPE
                    nullable: false
                    order: 6
                    type: VARCHAR(10 BYTE)
                FILENAME
                    nullable: false
                    order: 3
                    type: VARCHAR(255 BYTE)
                ID
                    nullable: false
                    order: 1
                    type: VARCHAR(255 BYTE)
                LABELS
                    nullable: true
                    order: 13
                    type: VARCHAR(255 BYTE)
                LIQUIBASE
                    nullable: true
                    order: 11
                    type: VARCHAR(20 BYTE)
                MD5SUM
                    nullable: true
                    order: 7
                    type: VARCHAR(35 BYTE)
                ORDEREXECUTED
                    nullable: false
                    order: 5
                    type: INT(10)
                TAG
                    nullable: true
                    order: 10
                    type: VARCHAR(255 BYTE)
            default_tablespace: false
        DATABASECHANGELOGLOCK
            columns:
                ID
                    nullable: false
                    order: 1
                    type: INT(10)
                LOCKED
                    nullable: false
                    order: 2
                    type: TINYINT(3)
                LOCKEDBY
                    nullable: true
                    order: 4
                    type: VARCHAR(255 BYTE)
                LOCKGRANTED
                    nullable: true
                    order: 3
                    type: DATETIME
            default_tablespace: false
            indexes:
                PRIMARY
                    columns:
                        ID
                    unique: true
            primaryKey: PRIMARY
                backingIndex: PRIMARY
                columns:
                    ID
        liquibase_user
            columns:
                created_at
                    nullable: true
                    order: 2
                    type: DATETIME
                updated_at
                    nullable: true
                    order: 3
                    type: DATETIME
                user_addr
                    nullable: true
                    order: 7
                    type: VARCHAR(255 BYTE)
                user_email
                    nullable: true
                    order: 5
                    type: VARCHAR(64 BYTE)
                user_idx
                    autoIncrementInformation: GENERATED null AUTO INCREMENT START WITH 1 INCREMENT BY 1
                    nullable: false
                    order: 1
                    type: BIGINT(19)
                user_name
                    nullable: true
                    order: 4
                    type: VARCHAR(16 BYTE)
                user_password
                    nullable: true
                    order: 6
                    type: VARCHAR(255 BYTE)
            default_tablespace: false
            indexes:
                PRIMARY
                    columns:
                        user_idx
                    unique: true
            primaryKey: PRIMARY
                backingIndex: PRIMARY
                columns:
                    user_idx

    [2024-08-05 02:56:58] INFO [liquibase.command] Command execution complete
Liquibase command 'snapshot' was executed successfully.
[2024-08-05 02:56:58] INFO [liquibase.ui] Liquibase command 'snapshot' was executed successfully.

BUILD SUCCESSFUL in 3s
1 actionable task: 1 executed
AM 2:56:58: Execution finished 'snapshot'.

```

그런데 하나 의문이 생겼다.

1.

데이터가 5만건이여도 이런 식으로 나오는지가 의문이고, 2.

스냅샷이 찍힌 데이터는 어디에 저장되는건지를 모르겠다.

이에 대해 추가공부가 필요해보인다 흑흑,,,

# Bytebase 라는 제품도 있더이다,,

[Bytebase vs.

Liquibase: a side-by-side comparison for database schema migration](https://www.linkedin.com/pulse/bytebase-vs-liquibase-side-by-side-comparison-database-schema-laxbc/?trackingId=DxNY8nOzSBS7qvXO08QLfQ==)

- GUI 이라 보다 더 낮은 러닝커브
- CI/CD flow 에서 SQL 을 체크하여 SQL 업데이트문을 검사할 수 있다.
- Gitlab, GitOps 에 친화적인 제품
- MR,PR 과 같이 이슈관리처럼 저장되어 변경사항을 코드처럼 볼 수 있다.
- 특정버전으로의 롤백과 오토롤백을 지원한다.

다만 bytebase 도 단점이 보인다.

- 공식문서 이외에 커뮤니티나 포럼이 없다.
- 구글 트렌드에도 검색이 안 될만큼 인지도가 낮다. (왜인지 모르겠다.

스타는 그렇게 많은데,,,)

- DDL 을 만들고 수행하는 주체권이 사용자가 아니라 Bytebase 에 있다.

이러한 이유로 보안상의 이슈가 우려된다.

- 상용툴이므로 툴의 자유도에 제한이 있어보인다.
