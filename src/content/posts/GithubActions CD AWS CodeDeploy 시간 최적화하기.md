---
title: "GithubActions CD & AWS CodeDeploy 시간 최적화하기"
description: "GithubActions CD & AWS CodeDeploy 시간 최적화를 해보자!"
date: 2024-03-17
tags: [ci-cd, codedeploy, aws, githubactions]
category: uncategorized
lang: ko
draft: false
---

# Intro
---

### AWS 아키텍처를 수정함에 따른 CI/CD 수정

우리는 아키텍처를 수정함에 따라 CI/CD 파일, 그리고 Secret Key 값과 특정 static value 들을 수정해야만 했다.

이에 따라 CI/CD 에 소모되는 시간을 최적화하는 것 또한 고려해보았다. 

기존에 기능수정사항이 생길 때마다 배포가 느려 개발이 더뎌지는 상황을 겪어봤기 때문이다.

(수정하게 된 배경은 아래를 참고하자)

### 왜 AWS 아키텍처를 수정함?

"할 수 있는 모든 AWS 를 다 때려박아보자!" 라는 취지에서 여러 AWS 기능을 활용해보았다.

CD, ALB, ElastiCache, Multi-AZ 의 RDS Read Replica 까지 사용해보았다.

단점은 언제나 그렇듯 비용이다. 

따라서 아키텍처를 전반적으로 수정하기로 하였고, AWS 의 서비스보다 EC2 를 통해 기능들을 구현하기로 하였다.


# TL;DR
---
- Gradle Dependencies Caching 을 통해 Gradle 의존성 설치속도를 높이자.

- Github Actions Version 을 최신화하여 속도&안전성을 높이자.

- AWS CodeDeploy BlockTraffic/AllowTraffic 값을 프로젝트 상황에 맞게 수정하여 속도 개선을 하자.

# GithubActions CD Optimization
---

### Gradle Dependencies Caching 

Gradle 은 의존성에 대한 캐싱 메커니즘을 제공한다.

2가지 타입의 저장소를 제공하는데, 1) 의존성 관련 바이너리 2) 모듈 메타 데이터 관련 바이너리 를 제공한다.

> 
[gradle-dependency-caching-mechanism](https://stackoverflow.com/questions/35026270/gradle-dependency-caching-mechanism)
> 
The Gradle dependency cache consists of 2 key types of storage:
> 
A file-based store of downloaded artifacts, including binaries like jars as well as raw downloaded meta-data like POM files and Ivy files. The storage path for a downloaded artifact includes the SHA1 checksum, meaning that 2 artifacts with the same name but different content can easily be cached.
> 
A binary store of resolved module meta-data, including the results of resolving dynamic versions, module descriptors, and artifacts. Separating the storage of downloaded artifacts from the cache metadata permits us to do some very powerful things with our cache that would be difficult with a transparent, file-only cache layout.

나는 아래와 같이 작성하여 CI 와 CD 캐싱을 제공하였다.

```yml
- name: Cache Gradle dependencies
  uses: actions/cache@v4
  with:
    path: ~/.gradle/caches
    key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}
    restore-keys: |
    	${{ runner.os }}-gradle-
```

### Check Github Actions Version

아래와 같이 actions warning 이 뜨길래 원인을 찾아보았다.

>
[test](https://github.com/Team-BC-1/gream-backend/actions/runs/8113763403/job/22177835383)
Node.js 16 actions are deprecated. Please update the following actions to use Node.js 20: actions/checkout@v3, actions/setup-java@v3, actions/cache@v3. For more information see: https://github.blog/changelog/2023-09-22-github-actions-transitioning-from-node-16-to-node-20/.

원인은 Node 16 를 더 이상 지원하지 않는 이유였다.

[Github 공식 블로그 글](https://github.blog/changelog/2023-09-22-github-actions-transitioning-from-node-16-to-node-20/)

이에 따라 버전 업데이트 해주었다.

Ex) `actions/cache@v3` -> `actions/cache@v4`

그렇다면 이게 과연 최적화에 도움이 되냐??

찾아보니 Node 18 부터 성능향상이 되어 사실상 Node20 이 Node 16 보다 조금 더 빠르다.

![](/images/velog/bac7e7767bc9a9a7.png)

[nodejs 버전 별 퍼포먼스 벤치마크 정리글](https://blog.rafaelgss.dev/state-of-nodejs-performance-2023)

다만 Github 의 공식 지원이 종료된만큼 안전성을 위해서라도 버전 업데이트를 해줘야한다고 생각한다.

# AWS CodeDeploy Optimization
---

### BlockTraffic/AllowTraffic 수정

CodeDeploy 가 총 8분이 걸리고 있었다. 이전에는 20분씩 걸리고는 했는데 아마도 EC2 의 개수, 성능과 네트워크에 따라 차이가 나는 것 같다.

어느 부분에서 오래 걸리는지 파악해보았다.

![](/images/velog/d3973a9294ad1739.png)

AfterBlockTraffic 에 대한 이벤트들이 오래 걸리는 것을 파악했다.

어떤 이벤트가 오래 잡고 있는지를 확인해보았다.

![](/images/velog/0022d05736383048.png)

BlockTraffic 자체가 5분씩 잡아먹고 있었다.

BlockTraffic이 뭔데 5분씩이나 잡아먹고 있는걸까?

### BlockTraffic : 블루/그린 그룹에 대한 트래픽 대기

ALB 를 사용한 CodeDeploy는 아래와 같이 Traffic 제어를 한다.

![](/images/velog/36e448aee0de6359.png)

여기서 BlockTraffic 이란 현재 트래픽을 서비스 중인 인스턴스에 대한 인터넷 트래픽 액세스를 차단하는 것을 말한다.

따라서 BlockTraffic Time 만큼 Blue Group 의 트래픽을 Green Group 으로 옮기는 이벤트 처리를 하게 된다.

따라서 프로젝트 상황에 맞추어 BlockTraffic Time 을 적절하게 잡는 게 중요하다.

기본값은 5분이다. 따라서 위와 같이 5분씩 잡아먹고 있었던 것이다.

**중요한 것은 BlockTraffic Time 에 대한 수식을 세우는 근거를 잡기가 어렵다는 것이다.**

트래픽을 직접 뜯어보기도 어려울 뿐더러, 트래픽 제어를 하는 주체가 AWS ALB,CodeDeploy 이기 때문이다.

자료도 마땅치가 않았다.

**대용량 트래픽이라면 BlockTraffic Time 에 대해 5분 이상이 적합하다고 보지만, 현재 여러 EC2 를 운영하지 않는 우리의 입장에서는 적합하지 않다고 느꼈다.**

따라서 여러 시도 끝에 1분이 적합하다고 판단했다.

**또한 추가적으로 MSA 구조로 전환하게된다면, 각각의 기능별로 EC2가 마련되기 때문에 5,6개의 EC2 병렬 배포를 할 일이 적다고 생각된다.)*

이에 따라 5분에서 1분대로 줄어든 것을 볼 수 있었다!

![](/images/velog/b53325597c8f24f0.png)


# Reference
---

- [AWS CodeDeploy Event 정리 공식포스트](https://docs.aws.amazon.com/codedeploy/latest/userguide/reference-appspec-file-structure-hooks.html)

- [nodejs 버전 별 퍼포먼스 벤치마크 정리글](https://blog.rafaelgss.dev/state-of-nodejs-performance-2023)

- [gradle-dependency-caching-mechanism | stackoverflow](https://stackoverflow.com/questions/35026270/gradle-dependency-caching-mechanism)
