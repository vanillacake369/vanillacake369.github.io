---
title: "API 변경점에 대한 슬랙 공지봇 구축기"
description: "API 변경점이 생기면 개발팀에게 변경점 요약을 해줄 수 있게끔 해보자"
date: 2025-03-02
tags: [journal]
lang: ko
draft: false
---

![](/images/velog/0b1979820c49e838.png)

# Episode 📜


BE API 는 수정이 잦을 수밖에 없다.

만약 기획 변경이나 잘못된 설계가 진행된 경우, API 의 필드값, 스키마 혹은 로직 자체가 수정되어야 한다.

특히 바쁜 일정과 변경점이 잦은 프로젝트일수록 API 는 자주 변화하고 자주 수정된다.

현재 사내에서는 백엔드 완성 이전에 프론트가 작업을 착수하고 있는데, 프론트 개발 도중 API 가 수정되는 일이 발생한다.

문제점은 프론트팀에서 이를 탐지하지 못 한다는 것이다.

즉, 본인은 기존 API 스펙에 맞게 구현하였음에도, 변경된 API 스펙을 인지하지 못 해 장애가 발생하는 상황이 생기는 것이다.

실제로 아래와 같은 슬랙을 주고받았다.

![](/images/velog/3a08a22420f3f32f.png)

이러한 문제점이 생각보다 심각함을 알게되었고, 내부설문조사를 해보았다.

아래는 프론트팀에서 제기한 문제점들을 나열한 것이다.

- 데이터 타입 변경건 (eg 문자열 → 리스트)
- 변수명 변경건 (eg meName → memberName)
- 구현된 API 가 사라지는 건
- 미구현된 API 가 새로 업데이트 되는 건
- 에러수정에 대해 탐지할 수 없는 건

그렇다면 이를 해결할 수는 없을까?

필자는 변경점이 존재할 때 프론트팀에 공지할 수 있도록 하고자 한다.

API 스펙 변경 시 swagger diff 오픈소스들을 활용하여 배포 파이프라인에서 변경점을 감지하고,

이를 slack 에 notify 될 수 있도록 구현해보고자 한다.

# About 💁‍♂️


아래와 같은 설계로 접근해보고자 한다.

> 💡
>
> 1.

기존 서버의 swagger json(혹은 yaml) 을 다운로드
    a. curl 명령어를 사용하여 다운
>        
>        ```bash
>        curl -o swagger.json ${api-path}
>        
>        ```
>        
> 2.

배포할 코드의 swagger json(혹은 yaml) 을 다운로드
>    a.

서버 실행 후 localhost 내의 swagger.json 을 다운로드
> 3.

파이프라인에서 diff 지원 오픈소스 실행
>    b. diff 지원 오픈소스 다운로드
>    c.

변경점 분석결과 가져오기
>    d.

만약 변경점 분석결과 존재 시 슬랙에 dm 전송
>

### swagger diff 를 지원하는 오픈소스들

#### [Sayi/swagger-diff](https://github.com/Sayi/swagger-diff#usage)

- 이 놈,, v1,v2 만 지원하다가 2020 부터 개발 중단됨
- json 파일을 읽을 수가 없음

#### [civisanalytics/swagger-diff](https://github.com/civisanalytics/swagger-diff)

- Swagger 팀에서 오피셜로 밀어주다가 이 친구도 어느 순간 개발 중단됨
- 얘도 json 파일 읽어오기 실패

#### [atlassian/openapi-diff](https://bitbucket.org/atlassian/openapi-diff/src/master/)

- json 읽기도 잘 되고, diff 도 처리되는 것 확인됨
- 그러나,, ㅠ
  - npm / node 둘 다 필요함.

특히 node 는 14 버전 이상이였어야 했음
  - 이상하게 변수명 하나 바꿨음에도 장문의 diff 설명이 나오는 것을 확인
   - 이는 내가 원하는 것이 아님,,,
  - html, md 출력포맷 미지원
  
#### [OpenAPITools/openapi-diff](https://github.com/OpenAPITools/openapi-diff)

- 아래를 통해 docker image pull 및 container 실행하여 명령어 실행

```bash
docker run --rm --name openapi-diff   -v ~/:/specs   openapitools/openapi-diff:latest   /specs/swagger-sample-01.yaml /specs/swagger-sample-02.yaml

```

- 잘 읽어오는 듯 함 !!

```bash
Status: Downloaded newer image for openapitools/openapi-diff:latest
==========================================================================
==                            API CHANGE LOG                            ==
==========================================================================
					  Swagger Petstore - OpenAPI 3.0
--------------------------------------------------------------------------
--                            What's Changed                            --
--------------------------------------------------------------------------
- PUT    /pet
  Request:
		- Changed application/json
		  Schema: Broken compatibility
		  Missing property: photoUrls (array)
		- Changed application/xml
		  Schema: Broken compatibility
		  Missing property: photoUrls (array)
		- Changed application/x-www-form-urlencoded
		  Schema: Broken compatibility
		  Missing property: photoUrls (array)
  Return Type:
	- Changed 200 OK
	  Media types:
		- Changed application/json
		  Schema: Broken compatibility
		  Missing property: photoUrls (array)
		- Changed application/xml
		  Schema: Broken compatibility
		  Missing property: photoUrls (array)
- POST   /pet
  Request:
		- Changed application/json
		  Schema: Broken compatibility
		  Missing property: photoUrls (array)
		- Changed application/xml
		  Schema: Broken compatibility
		  Missing property: photoUrls (array)
		- Changed application/x-www-form-urlencoded
		  Schema: Broken compatibility
		  Missing property: photoUrls (array)
  Return Type:
	- Changed 200 OK
	  Media types:
		- Changed application/json
		  Schema: Broken compatibility
		  Missing property: photoUrls (array)
		- Changed application/xml
		  Schema: Broken compatibility
		  Missing property: photoUrls (array)
- GET    /pet/findByStatus
  Return Type:
	- Changed 200 OK
	  Media types:
		- Changed application/json
		  Schema: Broken compatibility
		  Missing property: [n].photoUrls (array)
		- Changed application/xml
		  Schema: Broken compatibility
		  Missing property: [n].photoUrls (array)
- GET    /pet/findByTags
  Return Type:
	- Changed 200 OK
	  Media types:
		- Changed application/json
		  Schema: Broken compatibility
		  Missing property: [n].photoUrls (array)
		- Changed application/xml
		  Schema: Broken compatibility
		  Missing property: [n].photoUrls (array)
- GET    /pet/{petId}
  Return Type:
	- Changed 200 OK
	  Media types:
		- Changed application/json
		  Schema: Broken compatibility
		  Missing property: photoUrls (array)
		- Changed application/xml
		  Schema: Broken compatibility
		  Missing property: photoUrls (array)
--------------------------------------------------------------------------
--                                Result                                --
--------------------------------------------------------------------------
				 API changes broke backward compatibility
--------------------------------------------------------------------------

```

- `openapi-diff --help` 에서 볼 수 있듯이 다양한 기능을 제공한다.

```shell
openapi-diff --help
사용법: openapi-diff <old> <새>
	--asciidoc <파일> 지정된 파일에 asciidoc으로 diff를 내보냅니다.
	--debug 디버깅 정보를 인쇄합니다.
	--error 오류 정보 인쇄
 -h,--help 이 메시지를 인쇄합니다.
	--header <property=값> 권한 부여를 위해 지정된 헤더 사용
	--html <파일> 지정된 파일에서 diff를 html로 내보내기
	--info 추가 정보 인쇄
	--json <파일> 지정된 파일에서 diff를 json으로 내보내기
 -l,--log <레벨> 로그에 지정된 레벨을 사용합니다(TRACE, DEBUG,
								정보, 경고, 오류, 꺼짐). 기본값입니다: ERROR
	--markdown <파일> 지정된 파일에서 diff를 마크다운으로 내보내기
	--off 정보 출력 안 함
	--query <property=value> 권한 부여를 위해 쿼리 매개변수 사용
	--state diff 상태만 출력 상태: no_changes,
								호환되지 않음, 호환 가능
	--fail-on-incompatible API 변경으로 인해 이전 버전과의 호환성이 깨진 경우에만 실패합니다.
	--fail-on-changed API가 변경되었지만 이전 버전과 호환되는 경우 실패합니다.
	--config-file 기본 동작을 재정의하는 구성 파일. 지원되는 파일 형식 .yaml
	--config-prop 키:값 형식으로 기본 동작을 재정의하는 구성 속성(예: my.prop:true)
	--trace 추가 상세 정보 표시
	--버전 버전 정보를 인쇄하고 종료
	--warn 경고 정보를 인쇄합니다.

```
        
#### [Tufin/oasdiff](https://github.com/Tufin/oasdiff)

- go 로 작성되었으며 docker 가 따로 필요없이 binary 기반으로 돌아가서 빠름 !
( 물론 docker 설치도 가능하다 )
- curl 명령어를 통해 설치

```bash
sudo curl -fsSL <https://raw.githubusercontent.com/tufin/oasdiff/main/install.sh> | sudo sh

```

- 아래 명령어를 통해 실행
- `oasdiff -h` 를 통해 볼 수 있듯이 아래 기능들을 지원한다.

```bash
사용 가능한 명령:
  breaking 변경 내용 표시
  변경 로그 변경 로그 표시
  checks 검사 표시
  완료 지정된 셸에 대한 자동 완성 스크립트를 생성합니다.
  diff 차이점 보고서 생성
  평탄화 allOf 병합
  도움말 모든 명령에 대한 도움말
  qr oasdiff 리포지토리의 QR 코드 표시
  요약 diff 요약 생성

```

- 만든 사람의 포스트를 참고해보니 html 형식도 지원하였다.

```java
jihoon@HAMA:~$ oasdiff changelog swagger-sample-01.yaml swagger-sample-02.yaml -f html
<html>

<head>
	<style>

		@import url(//fonts.googleapis.com/css?family=Nunito);

		* {
			font-family: 'Nunito','Helvetica Neue',Helvetica,Arial,sans-serif;
		}

		.title {
			margin: 1em 0 0.5em 0;
			font-size: 36px;
		}

		.path {
			color: #016BF8;
,,,,

```
        

### 무엇을 쓰기로 결정했고 왜 그런 선택을 했는지?

[Tufin/oasdiff](https://github.com/Tufin/oasdiff) 를 사용하기로 결정했다.

이유인 즉슨,,

1.

변화점에 대해 비교나열을 해준다.
    1. changelog 를 통해 `변경 전 값 → 변경 후 값` 으로 분석해줬다.
    2.

다른 오픈소스들은 지원해주지 않는다.
2.

CLI 태그를 통해 다양한 format 을 지원한다.
    1. md
    2. html
    3. text
3.

다양한 기능을 지원한다.
    1. changelog
    2. diff
    3. summary 등등
4. java 로 구현되어있는 다른 친구들에 비해 go 로 구현되어 있어 가볍다.
    1. docker 이미지 또한 지원된다.
    2.

실행파일이 가볍고 커스텀이 쉽다. (document 에 예제가 없고 설명이 똥 같은게 단점,,)

# Apply 🧑‍💻


필자는 GitLab 의 파이프라인에 통합하여 CI/CD 과정에서 처리될 수 있게끔 하고자 하였다.

대충 프로세스는 아래와 같다.
    
1.

빌드 스테이지에서 자바애플리케이션을 컴파일(빌드) 하여 결과물 app.jar 를 얻는다.

2.

배포 스테이지에서 app.jar 를 서버에 배포(앱 실행)한다.

3. oas-diff 스테이지에서 배포된 버전의 oas(latest.json)를 얻고, oasdiff 로 옛날 버전의 origin.json 파일과 비교하여 변경점을 깃랩서버에 저장한다.
(최초 실행시 origin.json 이 없다.

캐시되기 전이므로, 두번째 배포부터 비교되기 시작한다.)

4. oas-cache 스테이지에서 배포된 버전의 oas(origin.json)를 얻고, 러너에 캐시한다.

5.

위 과정을 다음 파이프라인에서 반복한다.

반복되면 oas-diff 스테이지에서 이전 파이프라인의 캐시된 origin.json 과 현재 배포중인 latest.json 을 반복적으로 비교하게된다.

6.

비교한 파일은 changelog_slack.md 로 저장되는데 이것을 슬랙봇의 특정 채널 웹훅으로 전송한다.

이에 따른 CI 는 아래와 같다.

```yaml
...
build:
  ...

deploy:
  ...
  environment:
	name: development
	url: **$DEV_OAS_URL**
  ...

oas-diff:
  image: python:3.10
  stage: Diff
  before_script:
	- curl -fsSL <https://raw.githubusercontent.com/tufin/oasdiff/main/install.sh> | sh
  script:
	- |
	  for i in {1..20}; do
		if curl -s -o /dev/null -w '%{http_code}' $DEV_OAS_URL | grep -q "200"; then
		  **curl -o latest.json $DEV_OAS_URL**
		  echo "$i"
		  break
		fi
		echo "Wating for API server to be ready... Retry $i"
		sleep 4
	  done
	- **oasdiff changelog origin.json latest.json -f markup > changelog.md**
	- bash mrkdwn_parser.sh
  **artifacts:
	paths:
	  - ./changelog_slack.md**
	expire_in: 3 days
  needs: [deploy]
  allow_failure: true
  **cache:
	key: shared-cache
	paths:
	  - ./origin.json**
  rules:
	- if: $CI_COMMIT_REF_NAME == "develop"

oas-cache:
  image: python:3.10
  stage: Diff
  script:
	- |
	  for i in {1..20}; do
		if curl -s -o /dev/null -w '%{http_code}' $DEV_OAS_URL | grep -q "200"; then
		  **curl -o origin.json $DEV_OAS_URL**
		  echo "epoch $i"
		  break
		fi
		echo "Wating for API server to be ready... Retry $i"
		sleep 2
	  done
  artifacts:
	paths:
	  - ./origin.json
	expire_in: 3 days
  needs: [oas-diff]
  **cache:
	key: shared-cache
	paths:
	  - ./origin.json**
	**policy: push**
  rules:
	- if: $CI_COMMIT_REF_NAME == "develop"
	  when: always

post-slack-message:
  image: python:3.10
  stage: Slack
  before_script:
	- apt-get update && apt-get install -y jq
  script:
	- line_number_of_changelog_result=$(wc -l changelog_slack.md | awk '{print $1}')
	- |
	  if [ "$line_number_of_changelog_result" -gt 3 ]; then
		**curl -H "Content-type: application/json" \
		  --data "$(cat ./changelog_slack.md | jq -Rs --arg channel "$SLACK_CHANNEL_ID" '{"channel":$channel,"blocks":[{"type":"section","text":{"type":"mrkdwn","text":.}}]}')" \
		  -X POST $POST_API_URL**
	  fi
  allow_failure: true
  needs: [oas-diff, oas-cache]
  rules:
	- if: $CI_COMMIT_REF_NAME == "develop"

```

위 구조를 통해 아래와 같이 슬랙 메세지가 오는 것을 확인할 수 있었다.

![](/images/velog/78d1004abafd15d9.png)

다만 oasdiff 결과물인 영어로 처리되어 나오는 것을 볼 수 있었다. 😭

Devops/AI 팀의 지원을 통해 이를 해결할 수 있었다.

n8n 워크플로우 기반으로 한글로 번역, 요약되어 볼 수 있게끔 처리해주셨다.

(Special Thx to 오대리님,,)

1.

GitLab 파이프라인에서 비교결과파일([changelog.md](http://changelog.md/))을 슬랙으로 바로 전송하지 않고 n8n 웹훅 노드에 전송(POST)한다.

2.

전송된 [changelog.md](http://changelog.md/) 를 AI 프롬프트를 통해 파싱하고 전처리한다.

3.

다시 HTTP Request(POST)로 슬랙 API 를 호출해 채널에 전송하는 식이다.

위 구조를 통해 한글 요약본을 받아볼 수가 있었다 :-)

![](/images/velog/12de1038a66681b3.png)

# To Be Improved ,,, 🤔


- 굳이 n8n & ML model 의 도움이 필요할까?
  - 요약결과값에 대해 번역 파일을 추가하여, 깃허브에 issue 를 올려보는 건 어떨까?
  - 아니면 직접 한글번역본을 추가하여 사내 프로젝트로 올려놓고, docker image 로 따로 빼두는 건 어떨까?

- API 변경점 추적이 어렵다
  - 현재 구조 상으로는 API A 에 대해 어떤 변경내역이 있었고, 누가 이 변경점을 처리했었는지 추적이 어렵다.
  - 만약 개선이 가능하다면 커밋 히스토리와 묶일 수 있으면 좋겠다는 생각이 든다.

# Reference 📚


https://github.com/tinohager/swagger-diff

https://github.com/Sayi/swagger-diff#usage

https://github.com/civisanalytics/swagger-diff

https://bitbucket.org/atlassian/openapi-diff/src/master/

https://github.com/OpenAPITools/openapi-diff

https://github.com/Tufin/oasdiff

https://findstar.pe.kr/2018/05/13/upload-file-on-curl/

https://stackoverflow.com/questions/63480282/how-to-send-a-message-to-slack-using-curl-from-gitlab-ci-yml

https://mrdevx.medium.com/step-by-step-guide-integrating-slack-with-gitlab-ci-for-seamless-ci-cd-notifications-be76a54d3038
