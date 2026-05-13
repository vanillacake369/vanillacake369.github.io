---
title: "Basics of Docker"
description: ""
date: 2024-04-20
tags: [System Design]
category: uncategorized
lang: ko
draft: false
---

# 가상화 기술 이전과 이후

## 가상화 이전

- 한 대의 서버를 하나의 용도로만 사용
- 남는 서버 공간을 그대로 방치

## 가상화 이후

- 논리적으로 공간을 분할
- VM 이라는 가상환경의 서버 이용
- 하이퍼바이저라는 중간관리자를 통해 VM 구동

## 하이퍼바이저

- 호소트시스템에 다수의 게스트 OS 를 구동할 수 있게 하는 소프트웨어
- 네이티브 하이퍼바이저와 하이브리드 하이퍼바이저로 나눠진다.

### 네이티브 하이퍼바이저

- 직접 하드웨어 제어
- 별도의 호스트 OS X

### 하이브리드 하이퍼바이저

- 호스트 OS 위에서 실행
- 하드웨어 자원을 VM 내부의 게스트 OS에 에뮬레이트

## 도커 vs VM

- VM 과 비교했을 때 컨테이너는 하이퍼바이저와 게스트 OS X
- 도커 컨테이너는 서로 다른 컨테이너를 사용하지만, 동일 커널을 공유한다.
- 반면, VM 은 서로 다른 OS, 하이퍼바이저를 사용하므로 분리되어있다.

## 어떻게 도커 컨테이너를 격리하나?

[컨테이너를 위한 리눅스 기능: cgroup, namespace, union mount](https://velog.io/@whattsup_kim/Linux-Kernel-%EC%BB%A8%ED%85%8C%EC%9D%B4%EB%84%88%EB%A5%BC-%EC%9C%84%ED%95%9C-%EB%A6%AC%EB%88%85%EC%8A%A4%EC%9D%98-%ED%94%84%EB%A1%9C%EC%84%B8%EC%8A%A4-%EA%B2%A9%EB%A6%AC-%EA%B8%B0%EB%8A%A5-cgroup-namespace-union-mount)
Linux 의 C Group 과 Namespace 를 사용

### C Group

```
- 프로세스들이 사용하는 시스템의 자원의 사용 정보를 수집하고, 제한시키고, 격리시키는 리눅스 커널 기능

```

### Namespace

```
- 프로세스별로 별도의 커널 자원을 분할하는 리눅스 커널의 기능

```

# Docker Container vs Docker Image vs Docker Volume

- Docker image
***pre-packaged, read-only template that contains everything needed to run an application,***
including the application code, dependencies,
and any system libraries or configuration files
- Docker Container
***running instance of a Docker image.***
Containers are isolated environments that run an application and its dependencies,
but with their own isolated file system, network, and resources.
Containers are created from Docker images, and multiple containers can run from the same image.
- Docker Volume
***persistent data storage area*** that can be used by one or more containers.
Volumes are used to store data that needs to persist beyond the life of a container,
such as application configuration files or user data.
Volumes can be created and managed independently of containers
and can be shared between containers.

# Docker 사용 흐름

![](/images/notion/525df9760342fcf8.png)

- 도커 CLI 에 커맨드 입력
- Docker Client(Docker CLI)
- Docker Server(Docker Daemon)
- Docker Image Cache Storage
- Docker Hub

# 도커 컨테이너 생명주기

> create -> start -> running -> stopped -> deleted

- `docker run` == `docker create` & `docker start`
- `docker stop` vs `docker kill`

# 도커 컨테이너에 명령어 전달

`docker exec <컨테이너 아이디>`

- 옵션

> E.G.
