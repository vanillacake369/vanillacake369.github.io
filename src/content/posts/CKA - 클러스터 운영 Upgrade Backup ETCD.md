---
title: "CKA - 클러스터 운영 (Upgrade, Backup, ETCD)"
description: "Kubernetes 클러스터 운영: 업그레이드, ETCD 백업/복구, 노드 관리"
date: 2025-12-25
tags: [kubernetes, operations]
category: uncategorized
lang: ko
draft: false
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

[https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/#backing-up-an-etcd-cluster](https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/#backing-up-an-etcd-cluster)
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

---

Mock exam for each



# Reference

---

## ETCD 백업 & 복구

### ETCD 란 ?

쿠버네티스의 모든 상태 정보를 저장하는 **Key-Value 저장소**

### ETCD 와 API 서버의 관계

**유일한 소통 창구.** 
클러스터의 그 어떤 컴포넌트(Scheduler, Controller 등)도 ETCD와 직접 대화하지 못합니다. 
오직 **kube-apiserver**만이 ETCD와 데이터를 주고받습니다.

### ETCD 클러스터 구성

ETCD는 고가용성을 위해 홀수 2n+1 개의 노드로 구성됩니다. 여기서 핵심은 Quorum(정족수) 입니다.

- **공식**: n+1 (전체 노드가 3개라면 2개가 살아있어야 작동)
- **시험 포인트**: 만약 3대 중 2대가 죽으면 ETCD는 Read-only 상태가 되거나 아예 응답을 멈춥니다. 이때는 `etcdctl member list`로 상태를 봐야 합니다.



### 언제 ETCD 가 고장나는가?

- **인증서 만료**: `kube-apiserver` 로그에 `x509: certificate has expired`가 뜨면 ETCD 인증서 문제입니다.
- **DB Size Quota**: 기본값이 2GB인 경우, 데이터가 꽉 차면 `alarm: NOSPACE`가 뜨면서 쓰기가 금지됩니다. (이때는 `compact`와 `defrag`가 필요합니다.)
- **I/O Latency**: 디스크가 느리면 `wal: sync duration of ... is too long` 경고가 뜨며 클러스터가 요동칩니다.



### 어떻게 ETCD 장애부분을 확인하는가?

1. **정적 포드 상태 확인**: `crictl ps | grep etcd` (컨테이너가 반복해서 재시작 중인지 확인)
2. **로그 분석**: `crictl logs [ETCD_ID]` 또는 마스터 노드의 `/var/log/pods/` 확인.
3. **엔드포인트 상태 확인**:



### ETCD 백업이란 ?

단순히 파일을 복사하는 게 아니라, 특정 시점의 데이터베이스 상태(Snapshot) 를 바이너리 파일로 추출하는 것입니다.

- **명령어 핵심**: 반드시 `ETCDCTL_API=3` 환경변수를 선언해야 합니다. (v2와 v3는 명령어 체계가 완전히 다릅니다.)
- **대상**: `/var/lib/etcd` 디렉토리 전체를 백업하는 것이 아니라, `snapshot save` 명령을 통해 `.db` 파일을 만드는 것이 정석입니다.


그렇다면 언제 etcd 백업이 호출될까?
쿠버네티스는 스스로 ETCD 스냅샷(백업)을 정기적으로 저장하지 않는다
따라서 1) 개발자가 백업 명령어를 통해 직접 현재 상태를 백업하던지 2) CronJob 이나 별도 스크립트를 통해 외부 Object Storage 로 정기적 백업을 처리한다


### 어떻게 ETCD 복구하는가?

다음과 같은 방법으로 저장하고 복구한다
[https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/#backing-up-an-etcd-cluster](https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/#backing-up-an-etcd-cluster)
[https://velog.io/@khyup0629/K8S-%ED%81%B4%EB%9F%AC%EC%8A%A4%ED%84%B0-%EC%95%84%ED%82%A4%ED%85%8D%EC%B2%98-%EC%84%A4%EC%B9%98-%EB%B0%8F-%EC%84%A4%EC%A0%95](https://velog.io/@khyup0629/K8S-%ED%81%B4%EB%9F%AC%EC%8A%A4%ED%84%B0-%EC%95%84%ED%82%A4%ED%85%8D%EC%B2%98-%EC%84%A4%EC%B9%98-%EB%B0%8F-%EC%84%A4%EC%A0%95)

1. 백업 저장
2. Restore 실행
3. **권한 부여**:
4. **YAML 업데이트**:
`/etc/kubernetes/manifests/etcd.yaml`에서 아래와 같이 고친다
5. 최종 확인

### 문제** 1 : 외부 ETCD 클러스터 설정에 따른 Core Components 트러블 슈팅**

A kubeadm provisioned cluster was migrated to a new machine. Requires
configuration changes to run successfully.
• We need fix a single-node cluster that got broken during machine migration.
• Identify the broken cluster components and investigate what caused to
break those components.
• The decommissioned cluster used an external etcd server.
• Next, fix the configuration of all broken cluster components.
• Ensure to restart all necessary services and components for changes to
take effect.
• Finally, ensure the cluster, single node and all pods are Ready.

> ⚠️

```bash
# 현 클러스터 파악
kubectl get nodes
kubectl get pods -n kube-system

# static pod 확인
ls /etc/kubernetes/manifests/
journalctl -u kubelet -f

# api server 설정에 etcd endpoint ip 확인
cat /etc/kubernetes/manifests/kube-apiserver.yaml | grep etcd

--etcd-servers=https://<새I>:2379 로 수정

# kubelet 데몬 확인
systemctl restart kubelet
systemctl status kubelet

kubectl get nodes
kubectl get pods -n kube-system
```

### 문제** 2 : ETCD 스냅샷 및 복구**

First, create a snapshot of the existing etcd instance running at [https://127.0.0.1:2379](https://127.0.0.1:2379/) , saving the snapshot to /data/etcdsnapshot.db .
Next, restore an existing, previous snapshot located at /data/etcd-snapshot-previous.db .
The following TLS certificates/key are supplied for connecting to the server with etcdctl:

- CA certificate: /etc/kubernetes/pki/etcd/ca.crt
- Client certificate: /etc/kubernetes/pki/etcd/server.crt
- Client key: /etc/kubernetes/pki/etcd/server.key

> 

```bash
# 공식문서 확인
https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/#snapshot-using-etcdctl-options

# 우선 노드 접속
kubectl config use-context k8s
OR
ssh <node>

# 스냅샷 생성
ETCDCTL_API=3 etcdctl --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key \
  snapshot save /data/etcdsnapshot.db

# 기존에 존재하는 스냅샷.db 로 restore 처리
etcdutl snapshot restore /data/etcd-snapshot-previous.db \
  --data-dir=/var/lib/etcd-new

OR

export ETCDCTL_API=3
etcdctl snapshot restore snapshot.db \
	--data-dir=/var/lib/etcd-new

# 권한 지정
chown -R etcd:etcd /var/lib/etcd-new

# etcd.yaml 을 새롭게 수정
vi /etc/kubernetes/manifests/etcd.yaml
- volumes 의 hostPath : 새로운 경로인 `/var/lib/etcd-new`를 가리켜야 한다.
- volumeMounts : 컨테이너 내부에서 바라보는 경로입니다. (보통 그대로 둡니다.)
- spec.containers.command : ETCD 실행 옵션 중 `--data-dir` 값도 새 경로로 일치시켜야 한다

# 최종 확인
# (watch 는 2초마다 뒤 명령어 실행, SIGINT 보내 종료)
sudo watch crictl pods | grep etcd

OR

sudo docker ps -a | grep etcd
```



---



# 🔒 인증/인가
