---
title: "CKA - CRD와 확장 (CRD, CRI, Operator)"
description: "Kubernetes 확장: CRD, CRI, Operator 패턴"
date: 2025-12-25
tags: [kubernetes, extensibility]
category: uncategorized
lang: ko
draft: false
---

## (2025 Updates) Operator Framework

# How ?

---

Mock exam for each



# Reference

---

## CRD 란 ?

Kubernetes API 는 본래 API Object 로 선언된 resource 들만 알고 있다
Deployment, Pod, Service 등등과 같이 말이다.
여기서 **사용자가 직접 정의하여 추가한 유형이 Custom Resource 이다.**
해당 리소스는 여타 k8s 리소스와 같이 클러스터 수준의 리소스로, 특정 네임스페이스에 속하지 않는다
만약 Custom Resource 를 추가하려고 한다면 Custom Resource Definition 라는 선언문을 통해  
선언할 수 있다.
이렇게 사용자가 유형을 추가하면 아래와 같은 기능을 수행할 수 있다.

- CRD를 등록하면 Kubernetes API 서버가 해당 커스텀 객체를 인식하고, 이를 **저장, 조회, 삭제**
- Custom Controller 와 함께 사용하여 특정 커스텀 객체가 생성될 때 필요한 하위 리소스(Pod, Deployment 등)를 자동으로 구성하는 자동화 역할을 수행

예시로 istio 와 같은 서비스 매시가 직접 CR/CRD 를 선언해서 처리하는 형태이다.

CRD 매니페스트에 반드시 정의해야 하는 필수 필드들은 다음과 같다.
[https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/)

1. **기본 필드 (Root Fields)**
2. **사양 필드 (spec)**

> 💡 Custom Controller 란 ??

## CRD 적용 및 확인방법 ?

1. CRD 매니페스트 작성
2. `kubectl create -f <crd-파일>.yaml` 명령을 통해 Kubernetes 클러스터에 새로운 리소스 유형을 등록
3. CRD가 등록된 후, 정의된 `kind`와 `apiVersion`을 사용하여 실제 리소스 인스턴스를 작성
4. `kubectl get <리소스 복수형 이름>` 명령을 사용하여 생성된 커스텀 객체들의 목록을 확인
5. `kubectl describe <리소스 종류> <이름>` 명령으로 해당 객체의 상태와 설정값 확인
6. `kubectl get <리소스 종류> <이름> -o yaml`을 사용하면 API 서버가 관리 중인 전체 JSON/YAML 정의를 확인

## CRI

### CRI 란 ?

CRI는 **Kubelet **이 다양한 컨테이너 런타임(Docker, containerd, CRI-O 등)과 통신하기 위해 사용하는 표준 인터페이스입니다.

### CRI 설치방법

보통 containerd 가 표준이 되어가고 있으며 아래와 같이 설치할 수 있다
`containerd`

```bash

```

> 💡 `podman` 은 k8s 의 CRI 를 구현하고 있지 않는다. 따라서 podman 은 kubelet 과 직접 통신할 수 없다

### system parameter

[https://kubernetes.io/ko/docs/setup/production-environment/container-runtimes/#ipv4%EB%A5%BC-%ED%8F%AC%EC%9B%8C%EB%94%A9%ED%95%98%EC%97%AC-iptables%EA%B0%80-%EB%B8%8C%EB%A6%AC%EC%A7%80%EB%90%9C-%ED%8A%B8%EB%9E%98%ED%94%BD%EC%9D%84-%EB%B3%B4%EA%B2%8C-%ED%95%98%EA%B8%B0](https://kubernetes.io/ko/docs/setup/production-environment/container-runtimes/#ipv4%EB%A5%BC-%ED%8F%AC%EC%9B%8C%EB%94%A9%ED%95%98%EC%97%AC-iptables%EA%B0%80-%EB%B8%8C%EB%A6%AC%EC%A7%80%EB%90%9C-%ED%8A%B8%EB%9E%98%ED%94%BD%EC%9D%84-%EB%B3%B4%EA%B2%8C-%ED%95%98%EA%B8%B0)
해당 값들은 어디에 쓰이는가? 왜 활성화하며 어떻게 활성화하는가? 

- **`br_netfilter`**** & ****`bridge-nf-call-iptables`**: 리눅스 브리지를 통과하는 패킷이 iptables 설정(필터링, 포트 포워딩 등)을 따르게 하기 위함입니다. 이게 안 되면 **Service(ClusterIP) 통신**이 제대로 안 될 수 있습니다.
- **`ip_forward`**: 노드가 수신한 패킷을 다른 곳(Pod 등)으로 전달하는 라우터 역할을 하기 위해 필수입니다.

```bash
cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
overlay
br_netfilter
EOF

sudo modprobe overlay
sudo modprobe br_netfilter

# 필요한 sysctl 파라미터를 설정하면, 재부팅 후에도 값이 유지된다.
cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv6.conf.all.forwarding = 1
net.ipv4.ip_forward                 = 1
EOF

# 재부팅하지 않고 sysctl 파라미터 적용하기
sudo sysctl --system
```

### 자동 활성화

Q: 워커 노드에서 컨테이너 런타임 서비스(예: `cri-docker`)가 중지되었을 때, 이를 다시 활성화하고 **재부팅 후에도 자동으로 시작**되게 하려면 어떤 명령어를 써야 합니까?
A: 아래와 같은 데몬 서비스를 활성화한다.

```bash
# 상태 확인
systemctl status containerd

# 서비스 재시작 및 자동 시작 설정
sudo systemctl daemon-reload
sudo systemctl enable --now containerd  # --now는 start와 enable을 동시에 함
```

### API 서버 우회한 CRI 기반 로그 확인

Q: API 서버를 거치지 않고 노드에서 직접 컨테이너 상태를 확인하거나 로그를 보려면 어떤 도구를 사용해야 합니까?
A: `kubectl`은 API 서버와 통신하지만, `crictl`은 노드 로컬의 런타임 엔드포인트와 직접 통신합니다. **API 서버가 터졌을 때 컨테이너 상태를 볼 수 있는 유일한 방법**입니다.

```bash
# 1. 엔드포인트 설정 (보통 시험 환경엔 되어있지만 안 되어있다면)
cat <<EOF | sudo tee /etc/crictl.yaml
runtime-endpoint: unix:///run/containerd/containerd.sock
image-endpoint: unix:///run/containerd/containerd.sock
timeout: 2
debug: false
EOF

# 2. API 서버 없이 컨테이너/이미지 확인
crictl ps              # 실행 중인 컨테이너 목록
crictl images          # 로컬 이미지 목록
crictl logs [태그ID]    # 컨테이너 로그 확인 (kubectl logs 대용)
```

### 문제 1 :  `containerd`나 `cri-dockerd`를 설치하고 서비스를 구동

```bash
Question No: 11

Complete these tasks to prepare the system for Kubernetes:
Set up cri-dockerd:

- Install the Debian package:
  ~/cri-dockerd_0.3.9.3-0.ubuntu-focal_amd64.deb
- Start the cri-dockerd service.
- Enable and start the systemd service for cri-dockerd.

Configure these system parameters:

- Set net.bridge.bridge-nf-call-iptables to 1.
- Set net.ipv6.conf.all.forwarding to 1.
- Set net.ipv4.ip_forward to 1.
```
```bash
# dpkg 설치
$ dpkg -i ~/cri-dockerd_0.3.9.3-0.ubuntu-focal_amd64.deb

# 실행
$ sudo systemctl enable --now cri-docker 
$ sudo systemctl status cri-docker

# 시스템 관련 매개변수 구성
<https://kubernetes.io/docs/setup/production-environment/container-runtimes/>

# sysctl params required by setup, params persist across reboots
cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.ipv4.ip_forward = 1
EOF

# Apply sysctl params without reboot
sudo sysctl --system
```

### 문제 2 : NotReady 노드

`kubectl get nodes`에서 노드가 `NotReady`일 때, `journalctl -u kubelet`이나 `crictl`을 활용해 런타임 연결 문제를 해결

> 💡 노드가 NotReady 인 상태인 이유 ??

```bash
# 1) kubelet 문제인지 확인
kubectl describe node <node명>
ssh <node명>
journalctl -u kubelet

# 2) CRI 끊기면 kubelet 을 통해 
# Node 상태 보고가 안 되므로
# CRI 확인, 재가동 시 kubelet 재가동
sudo systemctl status containerd
sudo systemctl enable --now containerd
sudo systemctl enable --now kubelet

exit

# 3) CNI Pod 상태 확인
kubectl get pods -n kube-system -o wide
# CNI 에 문제가 생기면 kubelet 이 "네트워크 플러그인 준비 안 됨"으로 판단하여
# API 서버에 NotReady 보고
# 3-0) CNI 없으면 설치
k apply -f <https://github.com/flannel-io/flannel/releases/download/v0.26.1/kube-flannel.yml>
k get pod -n kube-flannel
# 3-1) CNI Pod 가 CrashLoopBackOff 상태 확인
# 로그 확인
kubectl logs -n kube-system [CNI_POD_NAME]
# Pod CIDR 불일치 확인 :  CNI 설정 서브넷, 클러스터 Pod CIDR, 노드 CIDR 모두 일치해야함
kubectl cluster-info dump | grep podCIDR
kubectl get node -o jsonpath='{.items[*].spec.podCIDR}'
# CNI ConfigMap 확인 후 불일치 시 수정
kubectl edit cm -n kube-system [CNI_CONFIG_MAP]
{
  "Network": "10.244.0.0/16",  // ← 이게 클러스터 Pod CIDR과 달라?
  "Backend": {
    "Type": "vxlan"
  }
}
kubectl rollout restart daemonset -n kube-system kube-flannel-ds
```

## CRD

### CRD 란 ?

Kubernetes는 Pod, Service, Deployment 같은 기본 리소스를 제공하지만, 실제 서비스를 운영하다 보면 이것만으로는 부족한 경우가 생긴다. 
CRD는 쿠버네티스 API를 확장해서 **우리만의 리소스 타입을 직접 정의**할 수 있게 해주는 메커니즘이다.

![](/images/notion/a1f830275eb4d8c4.png)


CRD 는 다음과 같은 구조를 가진다

- [metadata.name](http://metadata.name/) : 
- spec.scope

```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: websites.example.com   # <plural>.<group> 형식 필수
spec:
  group: example.com
  names:
    plural: websites     # API 경로에 사용: /apis/example.com/v1/websites
    singular: website    # kubectl get website 처럼 단수로 쓸 때
    shortNames: ["ws"]   # kubectl get ws 처럼 단축어로 쓸 때
    kind: Website        # YAML 작성 시 kind: 에 들어가는 이름
  scope: Namespaced      # 또는 Cluster
  versions:
    - name: v1
      served: true
      storage: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                url:
                  type: string
                replicas:
                  type: integer
                  minimum: 1
                  maximum: 10
```

이후 해당 선언문(Custom Resource Defininition) 를 통해 리소스를 사용할 수 있다(Custom Resource)

```yaml
apiVersion: example.com/v1      # CRD의 group/version
kind: Website                   # CRD의 names.kind
metadata:
  name: my-website
  namespace: default            # scope: Namespaced 이므로 namespace 필요
spec:                           # CRD schema에서 정의한 필드만 쓸 수 있음
  url: "https://example.com"
  replicas: 3
```

### **Custom Controller (Operator)**

CRD는 데이터 스키마를 정의할 뿐이다. `Website` 리소스를 만들었다고 해서 자동으로 웹사이트가 뜨지는 않는다. 
CR 오브젝트를 감시하다가 실제 액션을 취하는 **Custom Controller**가 세트로 있어야 의미가 있다.
이 패턴을 **Operator 패턴**이라고 부르며, Prometheus, Cert-manager, ArgoCD 등 대부분의 쿠버네티스 생태계 툴이 이 방식으로 만들어져 있다.
보통 Custom Controller 는 일반 Pod 형태로 처리하게끔 한다. 
즉, Deployment로 배포하고, 내부 코드가 API 서버를 Watch하면서 CR 변화에 반응하는 방식입니다.

```yaml
CR 생성/변경 감지
      ↓
Controller가 Reconcile 루프 실행
      ↓
현재 상태(actual) vs 원하는 상태(desired) 비교
      ↓
차이가 있으면 실제 리소스 생성/수정/삭제

apiVersion: apps/v1
kind: Deployment
metadata:
  name: website-controller
spec:
  template:
    spec:
      containers:
      - name: controller
        image: my-website-controller:v1   # 직접 만든 컨트롤러 이미지
      serviceAccountName: website-controller-sa  # CR을 watch할 권한 필요
```

### Validation

CRD 상 스키마 제약을 선언하여 특정 타입을 막거나 할 수 있는데 이를 validation 이라고 한다.
`openAPIV3Schema`로 필드 타입과 제약 조건을 선언할 수 있으며, 없으면 아무 값이나 들어가도 API 서버가 그냥 저장해버린다.
아래와 같이 CRD 선언하면 CR 선언 시 spec.url 에는 string 만, spec.replicas 에는 최대 10 까지만 저장할 수 있다.

```yaml
  versions:
    - name: v1
      served: true
      storage: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                url:
                  type: string
                replicas:
                  type: integer
                  minimum: 1
                  maximum: 10
```

### 버전 관리 (Versions)

CRD는 `v1alpha1 → v1beta1 → v1` 처럼 버전을 여러 개 운영할 수 있다. 
`served: true`면 API 서버가 해당 버전으로 요청을 받고, `storage: true`인 버전 하나만 etcd에 실제로 저장된다.

```yaml
versions:
  - name: v1
    served: true
    storage: true    # etcd 저장은 이 버전으로
  - name: v1beta1
    served: true     # 요청은 아직 받아주지만
    storage: false   # 저장은 안 함 (하위 호환용)
```

### CRD 명령어 : 생성 & 조회 & 관리

```bash
# 클러스터에 설치된 모든 CRD 목록
kubectl get crd

# 특정 CRD 상세 확인 (schema, versions 등)
kubectl describe crd websites.example.com

# API 서버가 인식하는 리소스 확인 (단축어, 그룹 포함)
kubectl api-resources | grep example.com

# CR 인스턴스 조회 (세 가지 모두 같은 결과)
kubectl get websites
kubectl get website
kubectl get ws
```

### 문제 1 : 특정 기능에 대한 CRD를 찾아 그 이름을 파일에 저장

특정 기능(예: `cert-manager` 또는 `VerticalPodAutoscaler`)과 관련된 모든 CRD를 찾아 그 이름을 파일에 저장

```bash
kubectl get crd | grep cert-manager > /tmp/cert-manager-crds.txt
kubectl get crd | grep VerticalPodAutoscaler > /tmp/cert-manager-crds.txt
cat /tmp/cert-manager-crds.txt
```

### 문제 2 : CRD 생성

제공된 YAML을 수정하여 CRD 인스턴스(Custom Resource)를 생성하거나 필드를 추가

1. CRD 가 이미 있고 CR 생성
2. CRD 자체를 새로 생성
