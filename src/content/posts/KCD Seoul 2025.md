---
title: "KCD Seoul 2025"
description: ""
date: 2025-05-21
tags: [Kubernetes, Conference]
category: uncategorized
lang: ko
draft: false
---

# 📚 Prerequisites

<details>
<summary>ovn ✅</summary>

> Why need it

[https://ubuntu.com/blog/data-centre-networking-what-is-ovn](https://ubuntu.com/blog/data-centre-networking-what-is-ovn)
SW & 멀티코어 CPU 성능 향상에 따라 오늘날의 네트워크 구축은 거의 대부분 VM 으로 이루어진다.
이를 활용하여 더 쉬운 수평적 확장을 지원할 수 있게 되었다.
이에 따라 근래의 네트워크의 엔드포인트는 더 이상 물리적 장비가 아니라 물리적 장비에서 실행되는 수백 개의 VM과 수천 개의 컨테이너가 되었고,
각각 개별 네트워크 서비스 및 정책 요구사항이 존재한다.
그렇다면 하나 이상의 물리적 머신에서 수천 개의 엔터티에 대한 네트워크 서비스 및 정책을 어떻게 효과적으로 관리할 수 있을까?
바로 여기에서 OVN이 등장한다.

> What is it

모든 머신에서 실행되는 수많은 컨테이너와 가상 머신을 관리하려면 Kubernetes, LXD/MicroCloud, OpenStack과 같은 관리 소프트웨어가 필요하다.
“클라우드 관리 소프트웨어(CMS)”라고 통칭되는 이러한 솔루션의 공통점은 컨테이너와 VM의 네트워킹 구현을 OVN에 위임할 수 있다는 것이다.
OVN은 포워딩 기능을 프로그래밍 확장 및 제어에 개방하는 프로덕션 품질의 다계층 스위치 플랫폼인 OVS를 사용하며, 
여러 데이터 경로 공급자와 플로우 API를 지원하여 하드웨어 가속까지 통합할 수 있습니다. 
여기에는 커널 레벨에서는 SwitchDev / TC를, 사용자 공간에서는 eBPF XDP 및 DPDK rte_flow가 포함됩니다.
** OVS(OpenVSwitch): Virtual 스위치로 VM들 간의 트래픽 통합, 격리, 보안을 위한 기능을 제공하는 SW

> How it works

> 💡 구체적인 동작원리는 아래 포스트에 잘 나와있다. 

![](/images/notion/523b9d82adde419a.png)
![](/images/notion/36703e938984ad22.png)

> 참고한 포스트 및 보면 좋은 포스트

[https://www.jacobbaek.com/739](https://www.jacobbaek.com/739)
[https://ubuntu.com/blog/data-centre-networking-what-is-ovn](https://ubuntu.com/blog/data-centre-networking-what-is-ovn)
[https://junyharang.tistory.com/475](https://junyharang.tistory.com/475)
[https://lilo.tistory.com/134](https://lilo.tistory.com/134)
</details>
<details>
<summary>kube-ovn ❌</summary>

> Why need it
> What is it
> How it works
> 참고한 포스트 및 보면 좋은 포스트
</details>
<details>
<summary>neutron ❌</summary>

> Why need it
> What is it
> How it works
> 참고한 포스트 및 보면 좋은 포스트
</details>
<details>
<summary>openstak ❌</summary>

> Why need it
> What is it
> How it works
> 참고한 포스트 및 보면 좋은 포스트
</details>
<details>
<summary>cluster APl ❌</summary>

> Why need it
> What is it
> How it works
> 참고한 포스트 및 보면 좋은 포스트
</details>
<details>
<summary>Kubespray ❌</summary>

> Why need it
> What is it
> How it works
> 참고한 포스트 및 보면 좋은 포스트
</details>
<details>
<summary>CAPO(Kubernetes Cluster API Provider OpenStack) ❌</summary>

> Why need it
> What is it
> How it works
> 참고한 포스트 및 보면 좋은 포스트
</details>
<details>
<summary>k8s addon ❌</summary>

> Why need it
> What is it
> How it works
> 참고한 포스트 및 보면 좋은 포스트
</details>
<details>
<summary>operator pattern ❌</summary>

> Why need it
> What is it
> How it works
> 참고한 포스트 및 보면 좋은 포스트
</details>
<details>
<summary>management cluster ❌</summary>

> Why need it
> What is it
> How it works
> 참고한 포스트 및 보면 좋은 포스트
</details>
<details>
<summary>cellium ❌</summary>

> Why need it
> What is it
> How it works
> 참고한 포스트 및 보면 좋은 포스트
</details>
<details>
<summary>vault ❌</summary>

> Why need it
> What is it
> How it works
> 참고한 포스트 및 보면 좋은 포스트
</details>
<details>
<summary>reconciler ❌</summary>

> Why need it
> What is it
> How it works
> 참고한 포스트 및 보면 좋은 포스트
</details>
<details>
<summary>nodeLocalDns ❌</summary>

> Why need it
> What is it
> How it works
> 참고한 포스트 및 보면 좋은 포스트
</details>
<details>
<summary>multicluster-runtime project ❌</summary>

> Why need it
> What is it
> How it works
> 참고한 포스트 및 보면 좋은 포스트
</details>
<details>
<summary>config server ❌</summary>

> Why need it
> What is it
> How it works
> 참고한 포스트 및 보면 좋은 포스트
</details>
<details>
<summary>fluentd ❌</summary>

> Why need it
> What is it
> How it works
> 참고한 포스트 및 보면 좋은 포스트
</details>
<details>
<summary>falco ❌</summary>

> Why need it
> What is it
> How it works
> 참고한 포스트 및 보면 좋은 포스트
</details>
<details>
<summary>service mesh ❌</summary>

> Why need it
> What is it
> How it works
> 참고한 포스트 및 보면 좋은 포스트

- istio
- linerd
- treafik
- kong
- consul
</details>

# 💡 Topics

> MixIn of Baremetal & VM

kt cloud, kakao, hyundai 모두 비슷한 주제의 세션을 진행했다.
바로 VM, 베어메탈 클러스터들을 응집하는 것이다.
세 회사(?) 모두 여러 IaaS 클러스터 및 내부 Machine 을 구성하면서 
어떤 상황과 어떤 구현안을 제시하였고, 앞으로의 숙제가 무엇인지를 제시하였다.
확실히 내부적으로 AI 를 활용하거나 다양한 클라우드 서비스를 제공하는 회사이니만큼
멀티 클러스터의 중요성을 강조하였다.

> Deep dive into helm chart

hyundai 와 삼성SDS 모두 특이점을 발견할 수 있었는데, 두 회사 모두 자체 helm chart 를 구축하고 내부 저장소에서 (valut) 이를 활용하고 있다는 것이다.
삼성SDS 에서는 helm chart 장단점과 개발방법 및 구조를 소개해주셨고,
hyundai 에서는 helm chart 구성을 통한 내부 소스코드 구축에 대해 소개해주셨다.

> K8S Security

Splunk 에서는 k8s 운영 시 취약점 시나리오와 그에 따른 방지안 및 솔루션 스택을 소개해주셨다.
특히 취약점 시나리오들을 나열해주셔서 인상깊게 보았다.

# 💭 Sessions

## OVN과 Openstack on Kubernetes을 통한 오픈소스 기반의 Cloud 구현


## Helm Chart 개발과 GitHub · ArtifactHub 사용기


## 99.999%를 향한 집착: 하이브리드 & 멀티로 살아남기


## Kubernetes 환경에서 보안 위협 탐지하기


## Apps Simplified: Use a Mesh from Day 0


## Private 환경에서의 하이브리드 워커노드의 탄생: VM과 베어메탈을 한 클러스터에 담다


## 멀티 클러스터 환경에서 컨트롤러 개발하기
