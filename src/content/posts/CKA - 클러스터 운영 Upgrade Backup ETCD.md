---
title: "CKA - 클러스터 운영 (Upgrade, Backup, ETCD)"
description: "Kubernetes 클러스터 운영: 업그레이드, ETCD 백업/복구, 노드 관리"
date: 2025-12-25
tags: [kubernetes, journal]
lang: ko
draft: false
series: { id: "Kubernetes CKA", order: 8 }
---

## OS Upgrades

지정한 타임아웃 시간 내에 헬스체크가 실패하면 노드가 죽었다고 판단한다.

- node-monitor-period: 5초마다 노드 상태 체크.
- node-monitor-grace-period: 40초 동안 Heartbeat 없으면 NotReady로 판단.
- pod-eviction-timeout: NotReady 상태가 지속되면 최대 5분 안에 해당 노드의 파드를 Evict

이 때 노드가 NotReady로 판단되면 k8s가 자동으로 Evict+재스케줄링한다

다만 수동으로 설정해야하는 경우가 있는데 OS 업데이트를 해야하거나 노드를 업데이트하는 경우가 그러한 경우다.

이럴 떄 cordon/drain(수동 또는 Draino/Kured 같은 자동화)을 사용하여 파드를 재할당하여 노드를 교체해줄 수있다
[https://velog.io/@_zero_/%EC%BF%A0%EB%B2%84%EB%84%A4%ED%8B%B0%EC%8A%A4-%EC%BB%A4%EB%93%A0Cordon-%EB%B0%8F-%EB%93%9C%EB%A0%88%EC%9D%B8Drain-%EA%B0%9C%EB%85%90%EA%B3%BC-%EC%84%A4%EC%A0%95](https://velog.io/@_zero_/%EC%BF%A0%EB%B2%84%EB%84%A4%ED%8B%B0%EC%8A%A4-%EC%BB%A4%EB%93%A0Cordon-%EB%B0%8F-%EB%93%9C%EB%A0%88%EC%9D%B8Drain-%EA%B0%9C%EB%85%90%EA%B3%BC-%EC%84%A4%EC%A0%95)
[https://kubernetes.io/docs/reference/kubectl/generated/kubectl_drain/](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_drain/)
[https://kubernetes.io/docs/reference/kubectl/generated/kubectl_cordon/](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_cordon/)

```bash
# 특정 노드를 스케줄러에서 제외시켜 파드가 할당되지 않도록 하고, 기존에 배포된 파드를 다른 노드로 이동시킴
kubectl drain ${node-name}
```

## Cluster Upgrade Process

각 컴포넌트 별로 version 이 다를 수 있다.

![](/images/notion/601bc450b56d8230.png)

이에 따라 api-server 가 X 인 경우 아래와 같이 X-1, X-2 범위까지의 컴포넌트 버전을 지원한다
각각에 맞춰서 업데이트를 진행해주면 된다.

![](/images/notion/6229b44ff8734b33.png)

Why and When to Upgrade ?

How to Upgrade ?

- All of them at once → Pod all down & all up
- One node at a time
- Add new upgraded node & remove old node

마스터 노드

```bash
# check available upgrade versions and validate if the current cluster is ready for an upgrade
kubeadm upgrade plan

# kubeadm / kubelet 새로운 버전 설치
apt-get upgrade -y kubeadm=${version}
apt-get upgrade -y kubelet=${version}

# 새로운 버전으로 업그레이드
kubeadm upgrade apply ${version}
systemctl restart kubelet
```

워커 노드

```bash
# 파드를 다른 노드에 할당 & cordon 하여 스케줄링 제거
kubectl drain ${node-name}

# kubeadm / kubelet 새로운 버전 설치
apt-get upgrade -y kubeadm=${version}
apt-get upgrade -y kubelet=${version}

# 새로운 버전으로 업그레이드
kubeadm upgrade node config --kubelet-version ${version}
systemctl restart kubelet

# 다시 스케줄링 허용
kubectl uncordon ${node-name}
```

> ✅ **kubeadm upgrade apply ${version} **vs kubeadm upgrade node config --kubelet-version ${version}

## Backup / Restore Methods

[https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/#backing-up-an-etcd-cluster](https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/#backing-up-an-etcd-cluster[^29])
declaritive 방식 → yaml 로 선언한 것으로 유지
다만 yaml 선언한 것이 아닌 명령형으로 직접 바꾸어 틀어진 경우에는 ?

이런 경우를 위해 resource config 를 백업한다

![](/images/notion/4589e801bcb25f81.png)

resource

![](/images/notion/c5fbe27b5841e956.png)

## etcdctl

etcd cluster 에 클러스터의 상태 정보와 모든 데이터가 여기에 저장된다
따라서 etcd 를 백업하는 것은 중요하다

- 스냅샷 생성
- 스냅샷 확인
- 스냅샷을 통해 restore

# How ?


Mock exam for each

[^29]: https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/#backing-up-an-etcd-cluster <https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/#backing-up-an-etcd-cluster>
[^30]: https://velog.io/@khyup0629/K8S-%ED%81%B4%EB%9F%AC%EC%8A%A4%ED%84%B0-%EC%95%84%ED%82%A4%ED%85%8D%EC%B2%98-%EC%84%A4%EC%B9%98-%EB%B0%8F-%EC%84%A4%EC%A0%95 <https://velog.io/@khyup0629/K8S-%ED%81%B4%EB%9F%AC%EC%8A%A4%ED%84%B0-%EC%95%84%ED%82%A4%ED%85%8D%EC%B2%98-%EC%84%A4%EC%B9%98-%EB%B0%8F-%EC%84%A4%EC%A0%95>
[^66]: https://127.0.0.1:2379 <https://127.0.0.1:2379/>
[^75]: https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/#snapshot-using-etcdctl-options <https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/#snapshot-using-etcdctl-options>
