---
title: "네임스페이스와 cgroup은 무엇이며 어떻게 작동합니까?"
description: "뭐든지 일단 만들고자 하는 것을 만들려고 하고,"
date: 2025-05-20
tags: [linux]
lang: ko
draft: false
---

# Why?

왜 배움?

---

---

뭐든지 일단 만들고자 하는 것을 만들려고 하고, 
뚜따뚜따 맞으면서 배우는 게 제일 빠르게 배우고 확실하게 기억이 남았다.

다만 k8 만은 이론적인 배경이 필수적인 것 같았다.

가이드라인이 있을까 싶어 [Kubernetes(쿠버네티스)를 처음 공부하려면 무엇을 공부해야 할까?](https://devocean.sk.com/blog/techBoardDetail.do?ID=165905&boardType=techBlog#:~:text=Docker%20%EB%85%B8%ED%8A%B8%EB%B6%81%EC%97%90%20%EC%84%A4%EC%B9%98-,%EB%A6%AC%EB%88%85%EC%8A%A4%20%EB%84%A4%EC%9E%84%EC%8A%A4%ED%8E%98%EC%9D%B4%EC%8A%A4%20%26%20cgroup,-dockerfile%20%EC%9E%91%EC%84%B1%20%EB%B0%8F) 를 참고했었고
네임스페이스와 cgroup 에 대해서 선행지식이 필요하다고 나와있었다.

얄팍하게 알고 있고, 실제로 사용해본 적이 없어서 이번 기회에 제대로 익혀보고자 정리해본다.

# What?

뭘 배움?

---

---

> 💡 사실상 본 글은 아래 포스트를 그대로 가져온 것

## namespace

> 기능

- 프로세스를 서로 격리

> 종류

1. **마운트(mnt)**: 독립적인 파일 시스템 환경을 위한 마운트 지점 격리
2. **프로세스 ID(pid)**: 컨테이너 내부의 프로세스를 독립적으로 관리하기 위한 PID 공간 분리
3. **네트워크(net)**: IP 주소와 포트 등 독립적인 네트워크 스택 제공
4. **IPC**: 프로세스 간 통신(IPC) 자원의 격리
5. **UTS**: 호스트 이름과 도메인 이름의 격리
6. **사용자(user)**: 사용자와 그룹 ID의 격리, 호스트 시스템에서 root 권한 제한
7. **cgroup**: 자원 제어 그룹 계층 구조 격리
8. **타임(time)**: 시스템 시간을 독립적으로 설정하도록 지원

> 사용

- unshare 명령어
- ip netns 명령어
- lsns 명령어

### **네트워크 네임스페이스 생성, veth 인터페이스 구성 실습**

> ☝ [https://insight.infograb.net/blog/2025/04/09/linux-container/#%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC-%EB%84%A4%EC%9E%84%EC%8A%A4%ED%8E%98%EC%9D%B4%EC%8A%A4-%EC%83%9D%EC%84%B1-veth-%EC%9D%B8%ED%84%B0%ED%8E%98%EC%9D%B4%EC%8A%A4-%EA%B5%AC%EC%84%B1-%EC%8B%A4%EC%8A%B5](https://insight.infograb.net/blog/2025/04/09/linux-container/[^4]#%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC-%EB%84%A4%EC%9E%84%EC%8A%A4%ED%8E%98%EC%9D%B4%EC%8A%A4-%EC%83%9D%EC%84%B1-veth-%EC%9D%B8%ED%84%B0%ED%8E%98%EC%9D%B4%EC%8A%A4-%EA%B5%AC%EC%84%B1-%EC%8B%A4%EC%8A%B5) 에 나와있는 실습을 통해 구성 
> ☝ veth 란 ? [https://www.44bits.io/ko/keyword/veth](https://www.44bits.io/ko/keyword/veth)

1. **네트워크 네임스페이스 생성**: 독립적인 네트워크 환경을 테스트하기 위해 두 개의 네임스페이스(ns1, ns2)를 생성합니다.
2. **veth 쌍 생성, 네임스페이스 연결**: 네임스페이스 간에 연결할 veth 쌍을 만들고, 각 네임스페이스에 인터페이스를 할당합니다.
3.

네트워크 설정 : 네임스페이스 내부에 veth 인터페이스 활성화, IP 주소, 기본 라우트 설정
4.

브리지 생성
5. veth 와 브리지 연결, 활성화
6.

네트워크 구조 동작 여부 확인 :: 통신 테스트

## cgroup

- 프로세스 모음의 리소스 사용량(CPU, 메모리, 디스크 I/O, 네트워크 등)을 제한, 설명 및 격리하는 Linux 커널 기능
- 

## How docker use namespace/cgroup

- 도커의 컨테이너 기술은 리눅스의 컨테이너 (LXC)를 활용

![](/images/notion/92067edae4d85c6c.png)

> ❓ 네임스페이스로 각 컨테이너 별 독립적 공간을 만들어주고, 의존성 충돌을 방지한다고 하는데,

# How?

어떻게 씀?

---

[^1]: https://velog.io/@vinto1819/%EB%82%98%EB%A7%8C%EC%9D%98-%EA%B0%80%EC%83%81%ED%99%94-%EC%BB%A8%ED%85%8C%EC%9D%B4%EB%84%88-%EB%A7%8C%EB%93%A4%EA%B8%B0-4-PID-%EB%84%A4%EC%9E%84%EC%8A%A4%ED%8E%98%EC%9D%B4%EC%8A%A4 <https://velog.io/@vinto1819/%EB%82%98%EB%A7%8C%EC%9D%98-%EA%B0%80%EC%83%81%ED%99%94-%EC%BB%A8%ED%85%8C%EC%9D%B4%EB%84%88-%EB%A7%8C%EB%93%A4%EA%B8%B0-4-PID-%EB%84%A4%EC%9E%84%EC%8A%A4%ED%8E%98%EC%9D%B4%EC%8A%A4>
[^2]: https://man7.org/linux/man-pages/man1/unshare.1.html <https://man7.org/linux/man-pages/man1/unshare.1.html>
[^3]: https://man7.org/linux/man-pages/man7/namespaces.7.html <https://man7.org/linux/man-pages/man7/namespaces.7.html>
[^4]: https://insight.infograb.net/blog/2025/04/09/linux-container/ <https://insight.infograb.net/blog/2025/04/09/linux-container/>
