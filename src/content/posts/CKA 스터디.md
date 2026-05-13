---
title: "CKA 스터디"
description: "CKA 응시할 때 nvim 설정을 조작할 수 있을까 궁금하여 찾아보았다."
date: 2025-12-25
tags: [kubernetes]
category: uncategorized
lang: ko
draft: false
---

# Why? 왜 배움?

---

- 고가용성 컨테이너 구축을 위해서
- 인프라 엔지니어 전향을 위해서



# What? 뭘 배움?

---

> ☝ [https://www.inflearn.com/studies/1726641/%EC%BF%A0%EB%B2%84%EB%84%A4%ED%8B%B0%EC%8A%A4-cka-%EC%9E%90%EA%B2%A9%EC%A6%9D-%EC%B7%A8%EB%93%9D%EC%9D%84-%EC%9C%84%ED%95%9C-%EC%8A%A4%ED%84%B0%EB%94%94-%EB%AA%A8%EC%A7%91](https://www.inflearn.com/studies/1726641/%EC%BF%A0%EB%B2%84%EB%84%A4%ED%8B%B0%EC%8A%A4-cka-%EC%9E%90%EA%B2%A9%EC%A6%9D-%EC%B7%A8%EB%93%9D%EC%9D%84-%EC%9C%84%ED%95%9C-%EC%8A%A4%ED%84%B0%EB%94%94-%EB%AA%A8%EC%A7%91)
> ☝ 2025.12.15 - 21 1주차 : 섹션 1,2,3

## Manual Scailing / HPA

manual

```bash
# 리소스 사용량 확인
kubectl top pod ${pod-name}.pod
# 수동으로 수평 확장
kubectl scale deployment ${deploy-name} --replicas=3
```

HPA

```bash
# HPA 매니저 활성화
kubectl autoscale ${deploy-name} --cpu-percent=50 --min=1 --max=10
# HPA 매니저 조회
kubectl get hpa
# HPA 매니저 삭제
kubectl delete hpa ${hpa-name}
```

In-Place Pod Resizing
pod 업데이트하고자 한다면 이전 pod 를 죽이고 새 pod 를 시작해야함
최근 베타로 in place update 를 지원할 수 있게 되었음
다만 CPU, memory 사용률만 변경 가능하며, 이외에 Pod Qos (????), Init Containers, Ephermeral Containers 등등은 교체가 불가능함

```bash
FEATURE_GATES=InPlacePodVerticalScailing=true
```

## Installing VPA

vpa manager 가 지속적으로 메트릭을 모니터링한 다음 파드에 할당된 리소스를 자동으로 업스케일함
vpa 는 k8s built-in 이 아님 
[https://github.com/kubernetes/autoscaler/blob/master/vertical-pod-autoscaler/docs/installation.md](https://github.com/kubernetes/autoscaler/blob/master/vertical-pod-autoscaler/docs/installation.md) 에 따라 설치를 진행해야 함
원리는 [https://kubernetes.io/docs/concepts/workloads/autoscaling/vertical-pod-autoscale/#how-does-a-verticalpodautoscaler-work](https://kubernetes.io/docs/concepts/workloads/autoscaling/vertical-pod-autoscale/#how-does-a-verticalpodautoscaler-work) 를 참고할 수 있음
**(강의에서 ****`updateMode:Auto`**** 를 보여주는데 그건 deprecated 됨. 꼭 개념 공부 시 공식문서를 살펴볼 것)**

```bash
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: my-app-vpa
spec:
  targetRef:
    apiVersion: "apps/v1"
    kind: Deployment
    name: my-app
  updatePolicy:
    updateMode: "Recreate"  # Off, Initial, Recreate, InPlaceOrRecreate 
```

## Role Based Access Controls



## Cluster Roles



## (2025 Updates) Custom Controllers



## Layered architecture & Volume

- `/var/lib/docker` 경로에 Docker 모든 데이터가 저장되는 FS 가 마련됨
- layered architecture 를 생각해봐야 함
- 캐시에 따른 빌드 시간 및 사이징 성능 확보 가능
- 이 이미지 레이어는 Read Only, 컨테이너 생성에 대해서는 Read/Write 가능
- Volumes
- volume driver 는 Docker 볼륨을 외부 스토리지나 하드웨어와 연동해 처리하는 드라이버



### Storage Drivers

- AUFS
- ZFS
- Overlay
- Overlay2
- 등등

여러가지 존재
상황과 OS 에 적합한 Storage Drivers 를 선택하여 적용

## Volumes

앞서 설명했다싶이 Volume 은 컨테이너의 데이터를 영속화하기 위한 저장소이다.
이 개념은 k8s 까지 이어진다.

![](/images/notion/bbc2a81849ef4b38.png)

## +) [killer.sh](http://killer.sh/) and more,,,

```yaml

```



# Reference

---

[https://velog.io/@hoonki/%EC%BF%A0%EB%B2%84%EB%84%A4%ED%8B%B0%EC%8A%A4k8s-Persistent-Storage%EB%9E%80](https://velog.io/@hoonki/%EC%BF%A0%EB%B2%84%EB%84%A4%ED%8B%B0%EC%8A%A4k8s-Persistent-Storage%EB%9E%80)
[https://kubernetes.io/docs/concepts/storage/storage-classes/](https://kubernetes.io/docs/concepts/storage/storage-classes/)
[https://kubernetes.io/docs/concepts/storage/dynamic-provisioning/](https://kubernetes.io/docs/concepts/storage/dynamic-provisioning/)

## Cluster Ports

![](/images/notion/d3cdbb5e3e23ac2d.png)

Master node (Control plane)

| Protocol | Direction | Port Range | Purpose | Used By |
| --- | --- | --- | --- | --- |
| TCP | Inbound | 6443 | Kubernetes API server | All |
| TCP | Inbound | 2379-2380 | etcd server client API | kube-apiserver, etcd |
| TCP | Inbound | 10250 | Kubelet API | Self, Control plane |
| TCP | Inbound | 10259 | kube-scheduler | Self |
| TCP | Inbound | 10257 | kube-controller-manager | Self |


Worker node

| Protocol | Direction | Port Range | Purpose | Used By |
| --- | --- | --- | --- | --- |
| TCP | Inbound | 10250 | Kubelet API | Self, Control plane |
| TCP | Inbound | 10256 | kube-proxy | Self, Load balancers |
| TCP | Inbound | 30000-32767 | NodePort Services† | All |
| UDP | Inbound | 30000-32767 | NodePort Services† | All |

## 네트워크 진단 명령어

### 노드 네트워크

노드 자체의 네트워크 설정이나 클러스터 인프라 문제를 진단

- **실행 위치:** Master 노드 또는 Worker 노드의 터미널
- **주요 확인 사항:**

### 파드 내부 

특정 앱(Pod)이 다른 앱과 통신이 안 될 때, 파드 내부의 시점에서 네트워크 확인

- **실행 방법:** `kubectl exec -it <파드명> -- /bin/bash` (또는 `sh`)로 접속 후 실행
- **주요 확인 사항:**

## IPAM Weave

![](/images/notion/d0316885ebd9da71.png)

CNI 는 IP 할당을 자동으로 처리
그렇다면 어떻게 이를 처리할까?
라우팅 테이블을 만들어 스크립트로 관리하는 방법이 있지만 이렇게 구성하면 방대해지고 복잡해진다.
대신 CNI 에서는 IP 주소 관리(IP Address Management, IPAM) 를 사용하여 이를 처리한다.
IPAM 은 네트워크의 IP 주소 할당, 트랙킹 및 관리를 체계적으로 수행하는 프로세스로 
k8s 에서 사용하는 플러그인은 다음 두 가지이다.

- **host-local**
- **dhcp**

## +) [killer.sh](http://killer.sh/) and more,,,

1. 네트워크 솔루션을 어떻게 확인하는가? 
2. 현재 할당된 네트워크 정책을 확인하고 파드에 적용된 네트워크 정책을 확인하려면 ?
3. 얼마나 많은 `agennts/peers`가 있는가?
4. `node01`의 pod schedule의 default gateway의 ip는? 



# Reference

---

> CNI/오버레이

[https://zerojsh00.github.io/posts/CNI-Weave/](https://zerojsh00.github.io/posts/CNI-Weave/)
[https://kubernetes.io/docs/tasks/administer-cluster/network-policy-provider/weave-network-policy/](https://kubernetes.io/docs/tasks/administer-cluster/network-policy-provider/weave-network-policy/)
[https://ykarma1996.tistory.com/179](https://ykarma1996.tistory.com/179)
[https://kimalarm.tistory.com/95](https://kimalarm.tistory.com/95)

## 7주차 : Mock Exams

# Why ? 

---



# What ? 

---

## bashrc, vimrc

.bashrc

```bash
alias k='kubectl'
source <(k completion bash)
complete -F __start_kubectl k

```

.vimrc

```bash
set et
set ts=2
set sw=2
set nu
```

## k8s 서비스에 대한 확인

```shell
# 서비스에 대한 엔드포인트 확인
controlplane ~ ➜  k get endpoints hr-web-app-service 
Warning: v1 Endpoints is deprecated in v1.33+; use discovery.k8s.io/v1 EndpointSlice
NAME                 ENDPOINTS                           AGE
hr-web-app-service   172.17.0.11:8080,172.17.0.12:8080   9s

# 서비스에 매핑한 라벨을 가지고 있는 파드들을 조회
# 위에서 확인한 ip 와 일치하는지 확인
controlplane ~ ➜  k get pods -l app=hr-web-app -o wide
NAME                          READY   STATUS    RESTARTS   AGE   IP            NODE           NOMINATED NODE   READINESS GATES
hr-web-app-7cd748cf58-7jtrg   1/1     Running   0          12m   172.17.0.12   controlplane   <none>           <none>
hr-web-app-7cd748cf58-v5dw8   1/1     Running   0          12m   172.17.0.11   controlplane   <none>           <none>

```

## k8s manifest 수정 이후 강제 재생성

```shell
# orange 파드에 대한 YAML 추출
kubectl get pod orange -o yaml > orange.yaml

# 수정 이후 강제 교체
kubectl replace --force -f orange.yaml
```

## Mock Exam 1

# URL

[https://uklabs.kodekloud.com/topic/mock-exam-1-4/](https://uklabs.kodekloud.com/topic/mock-exam-1-4/)


# 1번문제 ✅📓

Create a Pod mc-pod in the mc-namespace namespace with three containers. The first container should be named mc-pod-1, run the nginx:1-alpine image, and set an environment variable NODE_NAME to the node name. The second container should be named mc-pod-2, run the busybox:1 image, and continuously log the output of the date command to the file /var/log/shared/date.log every second. The third container should have the name mc-pod-3, run the image busybox:1, and print the contents of the date.log file generated by the second container to stdout. Use a shared, non-persistent volume.

- env 주입, 그리고 downward api — `valueFrom.fieldRef.fieldPath`
- volume 과 voulme mounts 처리
- bash script 를 처리하도록 하는 방법 +) while loop & date
- 파일 속 내용을 출력하는 방법 +) echo vs tail

<details>
<summary>정답</summary>

```go
apiVersion: v1
kind: Pod
metadata:
  labels:
    run: mc-pod
  name: mc-pod
  namespace: mc-namespace
spec:
  volumes:
  - name: shared-log
    emptyDir: {}
  containers:
  - image: nginx:1-alpine
    name: mc-pod
    resources: {}
    env:
    - name: NODE_NAME
      valueFrom:
        fieldRef:
          fieldPath: spec.nodeName
  - image: busybox:1
    name: mc-pod-2
    command: ["/bin/sh"]
    args: ["-c", "while true; do date >> /var/log/shared/date.log; sleep 1; done"]
    volumeMounts:
    - name: shared-log
      mountPath: /var/log/shared
  - image: busybox:1
    name: mc-pod-3
    command: ["/bin/sh"]
    args: ["-c", "tail -f /var/log/shared/date.log"]
    volumeMounts:
    - name: shared-log
      mountPath: /var/log/shared
  dnsPolicy: ClusterFirst
```
```go
# Pod 생성
kubectl apply -f mc-pod.yaml

# 로그 출력 확인
kubectl logs mc-pod -c mc-pod-3 -n mc-namespace

# 환경변수 확인
kubectl exec mc-pod -c mc-pod -n mc-namespace -- printenv NODE_NAME
```
</details>

## Downward API

[https://kubernetes.io/docs/concepts/workloads/pods/downward-api/](https://kubernetes.io/docs/concepts/workloads/pods/downward-api/)
[https://kubernetes.io/docs/tasks/inject-data-application/environment-variable-expose-pod-information/](https://kubernetes.io/docs/tasks/inject-data-application/environment-variable-expose-pod-information/)
[https://kubernetes.io/docs/tasks/inject-data-application/downward-api-volume-expose-pod-information/](https://kubernetes.io/docs/tasks/inject-data-application/downward-api-volume-expose-pod-information/)



# 2번 문제 ✅📓

This question needs to be solved on node `node01`. To access the node using SSH, use the credentials below:

```
username: bob
password: caleston123
```

As an administrator, you need to prepare `node01` to install kubernetes. One of the steps is installing a container runtime. Install the `cri-docker_0.3.16.3-0.debian.deb` package located in `/root` and ensure that the `cri-docker` service is running and enabled to start on boot.

- cri(containerd, cri-docker) 설치 및 systemd service 등록

<details>
<summary>정답</summary>

```go
ssh bob@node01
# 비번 입력 caleston123
sudo apt update && sudo apt install /root/cri-docker_0.3.16.3-0.debian.deb
sudo systemctl status cri-docker
sudo systemctl enable cri-docker --now
sudo systemctl status cri-docker
```
</details>



# 3번 문제 ✅📓

On `controlplane` node, identify all CRDs related to VerticalPodAutoscaler and save their names into the file `/root/vpa-crds.txt`.

- k8s CRD

<details>
<summary>정답</summary>

```shell
kubectl get crd | grep -i verticalpodautoscaler | awk '{print $1}' > /root/vpa-crds.txt
```
</details>

## 명령어 비교 : awk vs cat vs tail

- **`cat file.txt`**: 파일 전체를 한눈에 볼 때 씁니다. 파일 여러 개를 하나로 합칠 때도 유용합니다.
- **`tail -f access.log`**: 실시간으로 추가되는 로그를 모니터링할 때 필수입니다. (`f` 옵션)
- **`awk '{print $1}' data.txt`**: 텍스트 파일의 **첫 번째 열**만 뽑아내는 등 프로그래밍적인 처리가 가능합니다.

## >와 >>의 차이점

### `>` (Overwrite: 덮어쓰기)

- 파일이 이미 존재한다면, **기존 내용을 싹 지우고** 새 내용을 씁니다.
- 파일이 없다면 새로 생성합니다.
- *예: **`echo "Hello" > test.txt`** (기존 내용 삭제됨)*

### `>>` (Append: 추가하기)

- 파일이 이미 존재한다면, **기존 내용 끝에** 새 내용을 덧붙입니다.
- 파일이 없다면 새로 생성합니다.
- *예: **`echo "World" >> test.txt`** (기존 내용 뒤에 추가됨)*



# 4번 문제 ✅📓

Create a service named `messaging-service` to expose the `messaging` **pod** within the cluster on port `6379`. The `messaging` pod is running in the `default` namespace.
Use imperative commands.

- service 생성 및 pod 할당

<details>
<summary>정답</summary>

```shell
# 파드 조회
kubectl get pod ${pod명} --show-labels
NAME        READY   STATUS    RESTARTS   AGE     LABELS
messaging   1/1     Running   0          4m55s   tier=msg

# 조회결과로 나온 라벨과 똑같이 함
apiVersion: v1 
kind: Service 
metadata: 
  labels: 
    app: messaging-service 
  name: messaging-service 
spec: 
  ports: 
  - name: 6379-6379 
    port: 6379 
    protocol: TCP 
    targetPort: 6379 
  selector: 
    tier: msg 
  type: ClusterIP 
status: 
  loadBalancer: {} 
  
# 서비스에 대한 엔드포인트 확인
k get endpoints messaging-service

# 서비스에 매핑한 라벨을 가지고 있는 파드들을 조회
# 위에서 확인한 ip 와 일치하는지 확인
k get pods  --show-labels -l tier=msg -n default -o wide
```
</details>

## 서비스란 ?

Kubernetes 에서는 서버의 정확한 IP 주소나 호스트명을 지정하여
각 클라이언트 애플리케이션을 구성하는 방식은 Kubernetes에서는 작동하지 않는다.
다음과 같은 특징 때문이다.

- 포드는 일시적입니다(Pod is ephemeral)
- Kubernetes는 포드가 노드에 스케줄링된 후, 시작되기 전에 IP 주소를 할당합니다. 
- 수평 확장(Horizontal scaling) 은 여러 Pod 가 동일한 서비스를 제공할 수 있음을 의미합니다. 

이러한 문제를 해결하기 위해 쿠버네티스는 Reverse Proxy 역할의 컴포넌트인 서비스(Service) 제공한다.

![](/images/notion/9c4ee8949d9c6240.png)

> 💡 Service API vs Ingress/Gateway API

## 서비스는 실제로 어떻게 동작하는가?

> 💡 마스터노드/워커노드의 컴포넌트 구성도 및 처리관계
> 💡 멀티 마스터 / 멀티 워커 원리



| **구분** | **Append Only Log (AOL)** | **Delta Log** | **BadgerDB (LSM/WiscKey)** |
| --- | --- | --- | --- |
| **주요 용도** | 단순 DB 복구, 캐시 영속화 | 데이터 레이크, 데이터 버전 관리 | 고성능 키-값 저장소, 블록체인 |
| **쓰기 방식** | 단순 추가 (무조건 뒤에 붙임) | 변경분 기록 (버전 관리 중심) | 메모리 버퍼링 후 정렬된 병합 |
| **읽기 성능** | 보통 (전체 로그 스캔 필요 시 느림) | 낮음 (병합 연산 필요) | 높음 (인덱싱 및 블메필터 활용) |
| **쓰기 효율** | 매우 높음 (순차 쓰기) | 높음 (차이점만 기록) | 매우 높음 (Key-Value 분리 저장) |
| **대표 사례** | Redis AOF, Kafka | Delta Lake, Apache Iceberg | Dgraph, 블록체인 노드 데이터베이스 |


************************************************************************
************ 리눅스 커널 수준의 작동원리 체계적으로 이해하려면 **************
************ Kubernetes In Action 를 어떤 순서로 읽어야하는가? ***********
************************************************************************

### ~~**1단계: 네트워크의 대상이 되는 객체 이해 (기초)**~~

~~네트워크가 무엇을 연결하는지 먼저 알아야 합니다.~~

- ~~**제3장. 파드: 쿠버네티스에서 컨테이너 실행하기:**~~~~ 파드의 개념과 리눅스 네임스페이스를 통해 컨테이너들이 어떻게 네트워크를 공유하는지 이해합니다.~~
- ~~**제5장. 서비스: 클라이언트가 파드를 발견하고 통신하게 하기:**~~~~ 서비스가 제공하는 안정적인 IP와 DNS를 통한 서비스 디스커버리 개념을 익힙니다.~~

### **2단계: 하부 계층의 처리 원리 심화 (핵심)**

질문하신 리눅스 커널 및 네트워크 계층 레벨의 처리는 **제11장**에서 집중적으로 다룹니다.

- **11.3 실행 중인 파드란 무엇인가:** '일시 중지(Pause) 컨테이너'가 어떻게 파드의 네트워크 네임스페이스를 유지하는지 배웁니다.
- **11.4 파드 간 네트워킹:** **파드 및 노드 네트워크의 핵심**입니다. 가상 이더넷 쌍(veth pair), 네트워크 브리지 연결, 그리고 노드 간 통신에서 L3 라우팅이나 오버레이 네트워크가 어떻게 패킷을 전달하는지 설명합니다.
- **11.4.3 컨테이너 네트워크 인터페이스(CNI) 소개:** 다양한 네트워크 플러그인이 쿠버네티스에 어떻게 연결되는지 다룹니다.
- **11.5 서비스 구현 방법:** **`kube-proxy`****의 동작 원리**입니다. `userspace` 모드와 현재 표준인 `iptables` 모드의 차이점을 배우고, 리눅스 커널의 **iptables 규칙**이 어떻게 가상 IP 패킷을 가로채 실제 파드 IP로 전달(DNAT)하는지 상세히 분석합니다.

### **3단계: 호스트 수준의 제어와 보안 (확장)**

리눅스 커널 기능과의 상호작용을 더 깊게 보려면 다음 장을 읽어야 합니다.

- **제13장. 클러스터 노드와 네트워크 보안:**

### **4단계: 전체 숲 보기 (종합)**

개별 원리를 이해한 후 다시 돌아와 전체 아키텍처를 복습합니다.

- **11.1 아키텍처 이해:** 컨트롤 플레인(etcd, API 서버, 스케줄러, 컨트롤러 매니저)과 워커 노드(kubelet, kube-proxy)의 상호 관계를 정리합니다.
- **11.2 컨트롤러의 협업 방식:** Deployment 생성부터 실제 파드가 네트워크에 배포되기까지 모든 컴포넌트가 어떻게 유기적으로 춤추듯 작동하는지 종합적인 흐름을 파악합니다.

**요약하자면**, 가장 핵심적인 기술적 원리는 **제11장(11.3~11.5)**에 집중되어 있으므로 이 부분을 반복해서 정독하시는 것이 "전체 숲"을 이해하는 가장 빠른 지름길입니다.


************************************************************************
************************* 급한 불 끄기 ***********************************
************************************************************************

### **1. 서비스 API 처리 순서**

서비스는 파드의 IP가 변경되어도 변하지 않는 안정적인 진입점(Cluster IP)을 제공합니다. 요청 처리 흐름은 다음과 같습니다.

1. **클라이언트 요청:** 클라이언트가 서비스의 가상 IP(Cluster IP)와 포트로 요청을 보냅니다,.
2. **노드 수준 가로채기:** 요청 패킷이 노드에 도달하면, 커널의 **iptables(또는 IPVS) 규칙**이 이 패킷을 가로챕니다,.
3. **파드 선택 (부하 분산):** iptables 규칙에 따라 서비스에 연결된 여러 파드 중 하나가 **무작위로 선택**됩니다.
4. **대상 변경 (DNAT):** 패킷의 목적지 주소가 선택된 **파드의 실제 IP와 포트로 변경**됩니다.
5. **컨테이너 접근:** 파드 네트워크를 통해 해당 파드가 실행 중인 노드로 전달되어 최종적으로 컨테이너 내부 프로세스에 도달합니다.

### **2. 노드에서의 매핑 테이블 관리 및 부하 분산**

- **매핑 테이블 관리 (****`kube-proxy`****):**
- **로드밸런싱 기준:**

### **3. 파드 수준의 관리 및 부하 분산**

- **매핑 관리:** 파드 자체는 로드밸런싱 매핑 테이블을 관리하지 않습니다. 대신, **`Endpoints`**** 컨트롤러**가 파드의 상태(Readiness 등)를 확인하여 준비된 파드의 IP만 `Endpoints` 리소스에 등록합니다,.
- **부하 분산 특이사항:**

### **4. 서비스 디스커버리 (Service Discovery)**

파드가 클러스터 내 다른 서비스를 찾는 방법은 크게 세 가지입니다.

- **환경 변수 (Environment Variables):**
- **DNS A 레코드:**
- **DNS SRV 레코드:**

이 구조를 통해 Kubernetes는 파드가 이동하거나 재생성되더라도 클라이언트가 항상 올바른 대상에 접근할 수 있도록 보장합니다.




************************************************************************
************************ 정리하고 싶은 부분 ******************************
*********** 내부 DNS / Iptable 을 통해 네트워크 토폴로지 처리구조 **********
*********** 어떻게 kube-proxy & 서비스 간 네트워크 처리하는지 ************
*********** 어떻게 노드 로드밸런싱 수행을 하는지 **************************
*********** 어떻게 파드 로드밸런싱 수행을 하는지 **************************
*********** 어떻게 mTLS 처리를 지원하는지 *******************************
*********** 어떻게 TLS 인증서 처리 및 재갱신을 자동화하는지 ***************
************************************************************************



Kube-Proxy
Beside the Kubelet, every worker node also runs the kube-proxy, whose purpose is to
make sure clients can connect to the services you define through the Kubernetes API.
The kube-proxy makes sure connections to the service IP and port end up at one of
the pods backing that service (or other, non-pod service endpoints). When a service is
backed by more than one pod, the proxy performs load balancing across those pods.
WHY IT’S CALLED A PROXY
The initial implementation of the kube-proxy was the userspace proxy. It used an
actual server process to accept connections and proxy them to the pods. To intercept connections destined to the service IPs, the proxy configured iptables rules
(iptables is the tool for managing the Linux kernel’s packet filtering features) to
redirect the connections to the proxy server.
The kube-proxy got its name because it was an actual proxy, but the current, much
better performing implementation only uses iptables rules to redirect packets to a
randomly selected backend pod without passing them through an actual proxy server.
The major difference between these two modes is whether packets pass through the
kube-proxy and must be handled in user space, or whether they’re handled only by
the Kernel (in kernel space). This has a major impact on performance.
Another smaller difference is that the userspace proxy mode balanced connections across pods in a true round-robin fashion, while the iptables proxy mode
doesn’t—it selects pods randomly. When only a few clients use a service, they may not
be spread evenly across pods. For example, if a service has two backing pods but only
five or so clients, don’t be surprised if you see four clients connect to pod A and only
one client connect to pod B. With a higher number of clients or pods, this problem
isn’t so apparent


Pod Network Topology

![](/images/notion/cb149bf77c384728.png)

Before the infrastructure container is started, a virtual Ethernet interface pair (a veth
pair) is created for the container. One interface of the pair remains in the host’s
namespace (you’ll see it listed as vethXXX when you run ifconfig on the node),
whereas the other is moved into the container’s network namespace and renamed
eth0. The two virtual interfaces are like two ends of a pipe (or like two network
devices connected by an Ethernet cable)—what goes in on one side comes out on the
other, and vice-versa.
The interface in the host’s network namespace is attached to a network bridge that
the container runtime is configured to use. The eth0 interface in the container is
assigned an IP address from the bridge’s address range. Anything that an application
running inside the container sends to the eth0 network interface (the one in the container’s namespace), comes out at the other veth interface in the host’s namespace
and is sent to the bridge. This means it can be received by any network interface that’s
connected to the bridge.
If pod A sends a network packet to pod B, the packet first goes through pod A’s
veth pair to the bridge and then through pod B’s veth pair. All containers on a node
are connected to the same bridge, which means they can all communicate with each
other. But to enable communication between containers running on different nodes,
the bridges on those nodes need to be connected somehow.

Service Implmentation
Everything related to Services is handled by the kube-proxy process running on each
node. Initially, the kube-proxy was an actual proxy waiting for connections and for
each incoming connection, opening a new connection to one of the pods. This was
called the userspace proxy mode. Later, a better-performing iptables proxy mode
replaced it. This is now the default, but you can still configure Kubernetes to use the
old mode if you want.
Before we continue, let’s quickly review a few things about Services, which are relevant for understanding the next few paragraphs.
We’ve learned that each Service gets its own stable IP address and port. Clients
(usually pods) use the service by connecting to this IP address and port. The IP
address is virtual—it’s not assigned to any network interfaces and is never listed as
either the source or the destination IP address in a network packet when the packet
leaves the node. A key detail of Services is that they consist of an IP and port pair (or
multiple IP and port pairs in the case of multi-port Services), so the service IP by itself
doesn’t represent anything. That’s why you can’t ping them.

How kube-proxy uses iptables
When a service is created in the API server, the virtual IP address is assigned to it
immediately. Soon afterward, the API server notifies all kube-proxy agents running on
the worker nodes that a new Service has been created. Then, each kube-proxy makes
that service addressable on the node it’s running on. It does this by setting up a few
iptables rules, which make sure each packet destined for the service IP/port pair is
intercepted and its destination address modified, so the packet is redirected to one of
the pods backing the service.
Besides watching the API server for changes to Services, kube-proxy also watches
for changes to Endpoints objects. We talked about them in chapter 5, but let me
refresh your memory, as it’s easy to forget they even exist, because you rarely create
them manually. An Endpoints object holds the IP/port pairs of all the pods that back
the service (an IP/port pair can also point to something other than a pod). That’s
why the kube-proxy must also watch all Endpoints objects. After all, an Endpoints
object changes every time a new backing pod is created or deleted, and when the
pod’s readiness status changes or the pod’s labels change and it falls in or out of scope
of the service.
Now let’s see how kube-proxy enables clients to connect to those pods through the
Service. This is shown in figure 11.17.
The figure shows what the kube-proxy does and how a packet sent by a client pod
reaches one of the pods backing the Service. Let’s examine what happens to the
packet when it’s sent by the client pod (pod A in the figure).
The packet’s destination is initially set to the IP and port of the Service (in the
example, the Service is at 172.30.0.1:80). Before being sent to the network, the
packet is first handled by node A’s kernel according to the iptables rules set up on
the node.
The kernel checks if the packet matches any of those iptables rules. One of them
says that if any packet has the destination IP equal to 172.30.0.1 and destination port
equal to 80, the packet’s destination IP and port should be replaced with the IP and
port of a randomly selected pod.
The packet in the example matches that rule and so its destination IP/port is
changed. In the example, pod B2 was randomly selected, so the packet’s destination
IP is changed to 10.1.2.1 (pod B2’s IP) and the port to 8080 (the target port specified
in the Service spec). From here on, it’s exactly as if the client pod had sent the packet
to pod B directly instead of through the service.
It’s slightly more complicated than that, but that’s the most important part you
need to understand.

파드 내부에는 여러 컨테이너가 존재할 수 있는데, 같은 파드 내에 있는 컨테이너는 동일한 IP 주소를 할당받게 된다. 
따라서 같은 파드의 컨테이너로 통신하려면 localhost로 통신하고, 다른 파드에 있는 컨테이너와 통신하려면 파드의 IP 주소로 통신한다
??? 파드 기동할 때마다 네트워크 토폴로지 구성이 어떻게 되는지 ?? 
??? 파드 기동할 때마다 노드 자체의 resolve.conf 나 /etc/hosts 를 상속받는지 ?? 

![](/images/notion/3c358058810ab763.jpeg)

Node Network Topology

![](/images/notion/9baca2d758e8dbe1.png)

You have many ways to connect bridges on different nodes. This can be done with
overlay or underlay networks or by regular layer 3 routing, which we’ll look at next.
You know pod IP addresses must be unique across the whole cluster, so the bridges
across the nodes must use non-overlapping address ranges to prevent pods on different nodes from getting the same IP. In the example shown in figure 11.16, the bridge
on node A is using the 10.1.1.0/24 IP range and the bridge on node B is using
10.1.2.0/24, which ensures no IP address conflicts exist.
Figure 11.16 shows that to enable communication between pods across two nodes
with plain layer 3 networking, the node’s physical network interface needs to be connected to the bridge as well. Routing tables on node A need to be configured so all
packets destined for 10.1.2.0/24 are routed to node B, whereas node B’s routing
tables need to be configured so packets sent to 10.1.1.0/24 are routed to node A.
With this type of setup, when a packet is sent by a container on one of the nodes
to a container on the other node, the packet first goes through the veth pair, then
through the bridge to the node’s physical adapter, then over the wire to the other
node’s physical adapter, through the other node’s bridge, and finally through the veth
pair of the destination container.
This works only when nodes are connected to the same network switch, without
any routers in between; otherwise those routers would drop the packets because
they refer to pod IPs, which are private. Sure, the routers in between could be configured to route packets between the nodes, but this becomes increasingly difficult
and error-prone as the number of routers between the nodes increases. Because of
this, it’s easier to use a Software Defined Network (SDN), which makes the nodes
appear as though they’re connected to the same network switch, regardless of the
actual underlying network topology, no matter how complex it is. Packets sent
from the pod are encapsulated and sent over the network to the node running the
other pod, where they are de-encapsulated and delivered to the pod in their original form.
쿠버네티스 클러스터의 내부 네트워크를 설명한다. 쿠버네티스 클러스터는 클러스터를 생성하면 노드상에 파드를 위한 내부 네트워크가 자동으로 구성된다. 
내부 네트워크 구성은 사용할 CNI(Container Network Interface)라는 플러그형(Pluggable) 모듈 구현에 따라 다르지만, 기본적으로 노드별로 다른 네트워크 세그먼트를 구성하고 노드 간의 트래픽은 VXLAN이나 L2 Routing 등의 기술을 사용하여 전송함으로써 노드 간 통신이 가능하게 구성한다. 노드별 네트워크 세그먼트는 쿠버네티스 클러스터 전체에 할당된 네트워크 세그먼트를 자동으로 분할해 할당하므로 사용자가 설정하지 않아도 된다

HOW THE DNS SERVER WORKS
All the pods in the cluster are configured to use the cluster’s internal DNS server by
default. This allows pods to easily look up services by name or even the pod’s IP
addresses in the case of headless services.
The DNS server pod is exposed through the kube-dns service, allowing the pod to
be moved around the cluster, like any other pod. The service’s IP address is specified
as the nameserver in the /etc/resolv.conf file inside every container deployed in the
cluster. The kube-dns pod uses the API server’s watch mechanism to observe changes
to Services and Endpoints and updates its DNS records with every change, allowing its
clients to always get (fairly) up-to-date DNS information. I say fairly because during
the time between the update of the Service or Endpoints resource and the time the
DNS pod receives the watch notification, the DNS records may be invalid.

??? 그렇다면 Gateway API 는 어떻게 구동되는지 ???

![](/images/notion/b2a4c40dc6ea30bd.jpeg)

- 처리 순서가 어떻게 되는지 : 노드 로드밸런스 → 파드 로드밸런스 → 컨테이너 접근
- 노드 : 어떻게 매핑테이블관리 & 로드밸런스 하는지
- 노드 : 어떤 기준으로 로드밸런스 ?(라운드 로빈 ?)
- 파드 : 어떻게 매핑테이블관리 & 로드밸런스 하는지
- 파드 : 어떤 기준으로 로드밸런스 ?(라운드 로빈 ?)
- 서비스 디스커버리
- 서비스 디스커버리 시 CNI 는 어떤 역할을 하는지 ? 원래 CNI 가 어떤 걸 처리하는건지 ?
- 파드 혹은 컨테이너가 생성될 때마다 동적 IP 할당 ? 아니면 정적 IP 할당 ?

## 서비스 종류

- **ClusterIP:** Exposes the Service on a cluster-internal IP. Choosing this value makes the Service only reachable from within the cluster. This is the default ServiceType.
- **NodePort:** Exposes the Service on each Node's IP at a static port (the NodePort). A ClusterIP Service, to which the NodePort Service routes, is automatically created. You'll be able to contact the NodePort Service, from outside the cluster, by requesting :.
- **LoadBalancer:** Exposes the Service externally using a cloud provider's load balancer. NodePort and ClusterIP Services, to which the external load balancer routes, are automatically created.
- **ExternalName:** Maps the Service to the contents of the externalName field (e.g. foo.bar.example.com), by returning a CNAME record with its value. No proxying of any kind is set up." (Ref: Kubernetes.io)
- ClusterIp
- ExternalIp
- NodePort
- LoadBalancer
- Headless Service
- ExternalName
- None-Selector

## 서비스 적용 방법 및 확인



## Endpoint vs EndpointSlice

# 5번 문제 ✅📓

Create a deployment named `hr-web-app` using the image `kodekloud/webapp-color` with `2` replicas.

<details>
<summary>정답</summary>

```go

kubectl create deployment hr-web-app --image=kodekloud/webapp-color --replicas=2

k get deployment -o wide

k describe deployments hr-web-app
```
```go
# 만약 replica 크기를 잘못 지정했다면 아래와 같이 변경한다
kubectl scale deployment hr-web-app --replicas=2

# 혹은 아예 manifest 를 수정
kubectl edit deployment hr-web-app
```

[https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#:~:text=Should%20you%20manually%20scale%20a%20Deployment%2C%20example%20via%20kubectl%20scale%20deployment%20deployment%20%2D%2Dreplicas%3DX%2C%20and%20then%20you%20update%20that%20Deployment%20based%20on%20a%20manifest%20(for%20example%3A%20by%20running%20kubectl%20apply%20%2Df%20deployment.yaml)%2C%20then%20applying%20that%20manifest%20overwrites%20the%20manual%20scaling%20that%20you%20previously%20did](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#:~:text=Should%20you%20manually%20scale%20a%20Deployment%2C%20example%20via%20kubectl%20scale%20deployment%20deployment%20%2D%2Dreplicas%3DX%2C%20and%20then%20you%20update%20that%20Deployment%20based%20on%20a%20manifest%20(for%20example%3A%20by%20running%20kubectl%20apply%20%2Df%20deployment.yaml)%2C%20then%20applying%20that%20manifest%20overwrites%20the%20manual%20scaling%20that%20you%20previously%20did)
</details>

## 디플로이먼트란 ?

Deployment는 ReplicaSet의 상위 수준 관리 객체(Wrapper)
Deployment는 직접 Pod를 생성하거나 관리하지 않는다.
대신 내부적으로 ReplicaSet을 생성하고, 그 ReplicaSet이 다시 Pod를 관리하는 계층 구조로 처리된다.
[https://www.baeldung.com/ops/kubernetes-deployment-vs-replicaset](https://www.baeldung.com/ops/kubernetes-deployment-vs-replicaset)

## 디플로이먼트 업데이트 조건 ??



## 디플로이먼트 변경 롤백 및 전략 ??



## 디플로이먼트 어떻게 스케일링 하는가 ??

# 6번 문제 ✅

A new application `orange` is deployed. There is something wrong with it. Identify and fix the issue.

<details>
<summary>정답</summary>

```go
# orange 가 파드인지 디플로이인지 확인
k get deploy -o wide
k get pod -o wide

# orange 상태 확인
k describe pod orange

# orange 의 init service 에서 잘못 작성된 sleeeeep 을 고치기
controlplane ~ ➜  k edit pod orange 
error: pods "orange" is invalid
A copy of your changes has been stored to "/tmp/kubectl-edit-317870372.yaml"
error: Edit cancelled, no valid changes were saved.

# replace 강제로 하기
controlplane ~ ✖ kubectl replace --force -f /tmp/kubectl-edit-317870372.yaml
pod "orange" deleted from default namespace
pod/orange replaced

# orange 상태 재확인
k describe pod orange
```


</details>



# 7번 문제 ✅

Expose the `hr-web-app` created in the previous task as a service named `hr-web-app-service`, accessible on port `30082` on the nodes of the cluster.
The web application listens on port `8080`.

<details>
<summary>정답</summary>

```go
apiVersion: v1
kind: Service
metadata:
  labels:
    app: hr-web-app
  name: hr-web-app-service
spec:
  ports:
  - name: 8080-8080
    nodePort: 30082
    port: 8080
    protocol: TCP
    targetPort: 8080
  selector:
    app: hr-web-app-service
  type: NodePort
status:
  loadBalancer: {}
```
</details>



# 8번 문제 ✅📓

Create a `Persistent Volume` with the given specification: -
**Volume name**: `pv-analytics`
**Storage**: `100Mi`
**Access mode**: `ReadWriteMany`
**Host path**: `/pv/data-analytics`

<details>
<summary>정답</summary>

```go
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-analytics
spec:
  storageClassName: manual
  capacity:
    storage: 100Mi
  accessModes:
    - ReadWriteMany
  hostPath:
    path: "/pv/data-analytics"
```
```go
kubectl get pv
kubectl describe pv pv-analytics
```
</details>

## 볼륨란 ?

- Access Mode ??

## HPA 란 ?

- 동작원리 ?

## HPA 활용방법 ?

# 10번 문제 ✅📓

Deploy a Vertical Pod Autoscaler (VPA) with name `analytics-vpa` for the deployment named `analytics-deployment` in the default namespace.
The VPA should automatically adjust the CPU and memory requests of the pods to optimize resource utilization. Ensure that the VPA operates in **`Recreate`** mode, allowing it to evict and recreate pods with updated resource requests as needed.

<details>
<summary>정답</summary>

```go
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: analytics-vpa
  namespace: default
spec:
  targetRef:
    apiVersion: "apps/v1"
    kind: Deployment
    name: analytics-deployment
  updatePolicy:
    updateMode: "Recreate"
```
```go
k get vpa
k describe vpa analytics-vpa
```
</details>

## VPA 란 ??

- 동작원리 ?

## VPA 활용방법 ??

# 11번 문제 ✅📓

Create a **Kubernetes Gateway** resource with the following specifications:

1. **Name**: `web-gateway`
2. **Namespace**: `nginx-gateway`
3. **Gateway Class Name**: `nginx`
4. **Listeners**:

<details>
<summary>정답</summary>

```go
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: web-gateway
  namespace: nginx-gateway
spec:
  gatewayClassName: nginx
  listeners:
  - name: http
    protocol: HTTP
    port: 80
    allowedRoutes:
      namespaces:
        from: Same
```
```go
kubectl get gateway -n nginx-gateway
kubectl describe gateway web-gateway -n nginx-gateway
```
</details>

## Mock Exam 2

[https://learn.kodekloud.com/user/courses/udemy-labs-certified-kubernetes-administrator-with-practice-tests/module/22051647-8ef0-4f24-8551-caa14ec77d40/lesson/9589df8a-4014-4502-9881-78ad272e6913](https://learn.kodekloud.com/user/courses/udemy-labs-certified-kubernetes-administrator-with-practice-tests/module/22051647-8ef0-4f24-8551-caa14ec77d40/lesson/9589df8a-4014-4502-9881-78ad272e6913)


# 1번 문제 ✅

Create a StorageClass named `local-sc` with the following specifications and set it as the default storage class:

- The provisioner should be `kubernetes.io/no-provisioner`
- The volume binding mode should be `WaitForFirstConsumer`
- Volume expansion should be enabled



- Is the StorageClass local-sc created?
- Is Provisioner kubernetes.io/no-provisioner used?
- Is the volume binding set to WaitForFirstConsumer?
- Is local-sc set to the default storage class?


StorageClass 생성

- Kubernetes에서 특정 StorageClass를 기본값으로 인식
- 이외에는 allowVolumeExpansion 과 volmeBindingMode 를 공식문서 참고하여 활성화

[https://kubernetes.io/docs/concepts/storage/storage-classes/](https://kubernetes.io/docs/concepts/storage/storage-classes/)

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: local-sc
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"
provisioner:  kubernetes.io/no-provisioner
parameters:
  type: pd-standard
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
```
```yaml
controlplane ~ ➜  k apply -f local-sc.yaml 
storageclass.storage.k8s.io/local-sc created

controlplane ~ ➜  k get sc
NAME                 PROVISIONER                    RECLAIMPOLICY   VOLUMEBINDINGMODE      ALLOWVOLUMEEXPANSION   AGE
local-sc (default)   kubernetes.io/no-provisioner   Delete          WaitForFirstConsumer   true                   4s

controlplane ~ ➜  k describe sc local-sc 
Name:            local-sc
IsDefaultClass:  Yes
Annotations:     kubectl.kubernetes.io/last-applied-configuration={"allowVolumeExpansion":true,"apiVersion":"storage.k8s.io/v1","kind":"StorageClass","metadata":{"annotations":{"storageclass.kubernetes.io/is-default-class":"true"},"name":"local-sc"},"parameters":{"type":"pd-standard"},"provisioner":"kubernetes.io/no-provisioner","volumeBindingMode":"WaitForFirstConsumer"}
,storageclass.kubernetes.io/is-default-class=true
Provisioner:           kubernetes.io/no-provisioner
Parameters:            type=pd-standard
AllowVolumeExpansion:  True
MountOptions:          <none>
ReclaimPolicy:         Delete
VolumeBindingMode:     WaitForFirstConsumer
Events:                <none>
```

## 아예 몰라요 아예

CSR ??
ClusterRole ??
선언방법 ??
적용방법 ??
확인방법 ??

```yaml
# /root/CKA/john.csr 파일의 내용을 base64로 인코딩한 값
cat /root/CKA/john.csr | base64 | tr -d '\n'

# CSR 선언
# john-csr.yaml
# <BASE64_ENCODED_CSR_CONTENT_HERE> 에 위 base64 인코딩 값 선언
apiVersion: certificates.k8s.io/v1
kind: CertificateSigningRequest
metadata:
  name: john-developer
spec:
  request: <BASE64_ENCODED_CSR_CONTENT_HERE>
  signerName: kubernetes.io/kube-apiserver-client
  expirationSeconds: 86400
  usages:
  - client auth
  
# Role 선언
# developer-role.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: development
  name: developer
rules:
- apiGroups: [""] # core API 그룹은 따옴표("")로 표시합니다.
  resources: ["pods"]
  verbs: ["create", "list", "get", "update", "delete"]
  
# developer-rolebinding.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: developer-binding-john
  namespace: development
subjects:
- kind: User
  name: john # 문제에서 지정한 사용자 이름
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: developer # 위에서 만든 Role 이름
  apiGroup: rbac.authorization.k8s.io

# CSR 생성 및 승인
kubectl apply -f john-csr.yaml
kubectl certificate approve john-developer

# Role 생성
kubectl apply -f developer-role.yaml

# RoleBinding 생성
kubectl apply -f developer-rolebinding.yaml
```



# 6번 문제

Create an nginx pod named `nginx-resolver` using the `nginx` image and expose it internally using a `ClusterIP` service called `nginx-resolver-service`.
From within the cluster, verify:

1. DNS resolution of the service name
2. Network reachability of the pod using its IP address

Use the **busybox:1.28** image to perform the lookups.
Save the service DNS lookup output to `/root/CKA/nginx.svc` and the pod IP lookup output to `/root/CKA/nginx.pod`.

- Pod: nginx-resolver created
- Service DNS Resolution recorded correctly
- Pod DNS resolution recorded correctly

```yaml
# 1. 기존 리소스 정리
kubectl delete pod nginx-resolver --force --grace-period=0 2>/dev/null
kubectl delete svc nginx-resolver-service 2>/dev/null

# 2. 포드 및 서비스 생성
kubectl run nginx-resolver --image=nginx
kubectl expose pod nginx-resolver --name=nginx-resolver-service --port=80 --target-port=80 --type=ClusterIP

# 3. Pod IP가 할당될 때까지 잠시 대기 (Pod가 Running이어야 IP가 나옵니다)
sleep 5
POD_IP=$(kubectl get pod nginx-resolver -o jsonpath='{.status.podIP}')

# 4. 서비스 DNS 조회 ( -i 옵션 추가! )
kubectl run test-nslookup --image=busybox:1.28 --rm -i --restart=Never -- \
  nslookup nginx-resolver-service > /root/CKA/nginx.svc

# 5. 포드 DNS 조회 ( -i 옵션 추가! )
kubectl run test-nslookup-pod --image=busybox:1.28 --rm -i --restart=Never -- \
  nslookup ${POD_IP//./-}.default.pod.cluster.local > /root/CKA/nginx.pod
```

## 아예 몰라요 아예

명령어 ??
서비스 DNS 조회 명령어 ?
파드 DNS 조회 명령어 ?
서비스 DNS 와 파드 DNS 가 뭐가 다른겨?


# 7번 문제

Create a static pod on `node01` called `nginx-critical` with the image `nginx`. Make sure that it is recreated/restarted automatically in case of a failure.
For example, use `/etc/kubernetes/manifests` as the static Pod path.

- Is the static pod configured under /etc/kubernetes/manifests?
- Is pod `nginx-critical-node01` up and running?

## 아예 몰라요 아예

### static 파드란 ?

보통의 Pod는 **API Server**가 "이 노드에 실행해!"라고 명령을 내려서 생성
하지만 **Static Pod**는 API Server의 간섭 없이, 특정 노드의 **Kubelet이 직접 관리하는 Pod**
이에 따라 kubelet 이 감시하는 디렉토리인 /etc/kubernetes/manifest 산하에 직접 pod manifest 를 선언할 수 있음
[https://kubernetes.io/docs/tasks/configure-pod-container/static-pod/#configuration-files](https://kubernetes.io/docs/tasks/configure-pod-container/static-pod/#configuration-files)

```yaml
# 노드 접속
ssh my-node1

# 1. 디렉토리 생성 후 매니페스트 생성
mkdir -p /etc/kubernetes/manifests
vim /etc/kubernetes/manifests/nginx-critical.yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-critical
spec:
  containers:
    - name: nginx
      image: nginx
EOF
# 2. kubelet 설정 파일 확인,staticPodPath 제대로 설정
# (--config=/var/lib/kubelet/config.yaml 같은 부분)
ps -ef | grep kubelet | grep config
vi /var/lib/kubelet/config.yaml # staticPodPath: /etc/kubernetes/manifests
# 3. kubelet 재시작
systemctl daemon-reload
systemctl restart kubelet


# 제대로 생성되었는지 확인
# 노드 내부
crictl ps | grep nginx  # 컨테이너가 떠 있는지 확인
# 컨트롤 플레인
kubectl get pods -A | grep nginx-critical-node01
```

# 8번 문제

Create a Horizontal Pod Autoscaler with name `backend-hpa`
for the deployment named `backend-deployment`
in the **backend namespace **with the `webapp-hpa.yaml`
file located under the root folder.
Ensure that the HPA scales the deployment based on **memory utilization **, maintaining an average memory usage of **65% **across all pods.
Configure the HPA with a minimum of 3 replicas and a maximum of 15.

- Is `backend-hpa` HPA deployed in backend namespace?
- Is deployment configured for metrics memory utilization?


사전 조건 두 개가 선행되어있어야 HPA 가 작동할 수 있다

- **Metrics Server:** 클러스터에 Metrics Server가 떠 있어야 한다 (`kubectl top nodes`가 되는지 확인).
- **Resources Requests:** 대상이 되는 `backend-deployment` 포드 설정에 **`resources.requests.memory`**  가 반드시 명시되어 있어야 한다

```bash
# metrics server 확인
kubectl top nodes

# Resources Requests 확인
# (resources 쪽을 확인한다)
kubectl get deploy backend-deployment -n backend -o yaml
```


공식문서 뒤질 때 HPA walk through 에 들어가서 HorizontalPodAutoscaler 검색하여 찾는다
[https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/)

```yaml
# /root/webapp-hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
  namespace: backend
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend-deployment
  minReplicas: 3
  maxReplicas: 15
  metrics:
  - type: Resource
    resource:
      name: memory
      target:
        type: AverageUtilization
        averageUtilization: 65
```
```bash
# apply 이후 아래를 확인하여 TARGETS 부분을 화인
kubectl get hpa -n backend
```



# 9번 문제

Modify the existing `web-gateway` on `cka5673` namespace to handle **HTTPS traffic** on port `443` for `kodekloud.com`, using a **TLS certificate** stored in a **secret** named `kodekloud-tls`.

- Is the web gateway configured to listen on the hostname kodekloud.com?
- Is the HTTPS listener configured with the correct TLS certificate?

## 몰라요 아예 몰라요

이 문제는 Gateway API 를 활용하는 문제
Gateway API 는 클러스터의 입구(Entry point)를 정의
여기서 **"어떤 포트를 열 것인가"**, **"어떤 호스트를 허용할 것인가"**, **"TLS 인증서는 무엇을 쓸 것인가" **를 결정한다

- **Gateway:** 인프라 계층의 입구 (포트, 프로토콜, TLS 설정)
- **HTTPRoute:** 서비스 계층의 경로 (어떤 URL을 어떤 서비스로 보낼지)



```yaml
# TLS 인증서가 시크릿 안에 있다고 하니 
# 시크릿을 먼저 확인
kubectl get secret kodekloud-tls -n cka5673

# 기존 설정 확인
kubectl get gateway web-gateway -n cka5673 -o yaml > web-gateway.yaml

# 게이트웨이에 대한 yaml 수정
# 포트 443 과 TLS 설정을 추가
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: web-gateway
  namespace: cka5673
spec:
  gatewayClassName: nginx # 또는 문제 환경에 맞는 클래스 이름
  listeners:
  - name: https
    protocol: HTTPS
    port: 443
    hostname: "kodekloud.com"
    tls:
      mode: Terminate # TLS를 Gateway에서 복호화함
      certificateRefs:
      - name: kodekloud-tls # Secret 이름
        group: ""           # Core API 그룹 (Secret은 "" )
        kind: Secret
    allowedRoutes:
      namespaces:
        from: Same
        
# 적용 이후 상태 확인
kubectl apply -f web-gateway.yaml
kubectl describe gateway web-gateway -n cka5673
```




# 10번 문제

On the cluster, the team has installed multiple helm charts on a different namespace. By mistake, those deployed resources include one of the vulnerable images called `kodekloud/webapp-color:v1`. Find out the release name and uninstall it.

- Is helm release uninstalled?

## 몰라요 아예 몰라요

이 문제는 Helm Release 를 활용하는 문제
핵심 두 개념은 Chart 와 Release 로 

- **Chart:** 앱을 설치하기 위한 설계도(설치 파일 묶음)
- **Release:** 그 설계도를 보고 실제로 클러스터에 설치된 **실행 상태** (이름이 랜덤하게 붙거나 지정됨)


다음과 같은 순서로 진행됨

1. helm 설치 목록 확인
2. 릴리스 확인
3. helm 릴리스 삭제





# 11번 문제

You are requested to create a NetworkPolicy to allow traffic from frontend apps located in the `frontend` namespace, to backend apps located in the `backend` namespace, but not from the databases in the `databases` namespace. There are three policies available in the `/root` folder. Apply the most restrictive policy from the provided YAML files to achieve the desired result. Do not delete any existing policies.

- Correct NetworkPolicy applied
- Incorrect NetworkPolicy is not applied
- Second incorrect NetworkPolicy is not applied


Trial

```yaml
# net-policy-1.yml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: net-policy-1
  namespace: backend
spec:
  podSelector: {}
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          access: allowed
    ports:
    - protocol: TCP
      port: 80

# net-policy-2.yml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: net-policy-2
  namespace: backend
spec:
  podSelector: {}
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: frontend
    - namespaceSelector:
        matchLabels:
          name: databases
    ports:
    - protocol: TCP
      port: 80

# net-policy-3.yml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: net-policy-3
  namespace: backend
spec:
  podSelector: {}
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: frontend
    ports:
    - protocol: TCP
      port: 80
```


NetworkPolicy는 **"영향을 받는(보호받는) Pod가 있는 네임스페이스" **에 생성해야 한다

- 우리는 지금 **`backend`** 네임스페이스에 있는 앱들을 보호하고 트래픽을 제어하려는 것
- 따라서 정책은 반드시 **`backend`** 네임스페이스에 들어가야한다



```yaml
kubectl apply -f /root/net-policy-3.yml -n backend

혹은 이미 매니페스트에 네임스페이스 지정되어있으므로

kubectl apply -f /root/net-policy-3.yml
```
```yaml
# 적용 이후 front 네임스페이스에 name: frontend 라벨이 있어야 함
kubectl get ns --show-labels
```

## Mock Exam 3

[https://uklabs.kodekloud.com/topic/mock-exam-3-3/](https://uklabs.kodekloud.com/topic/mock-exam-3-3/)


# 1번 문제

You are an administrator preparing your environment to deploy a Kubernetes cluster using kubeadm. Adjust the following network parameters on the system to the following values, and make sure your changes persist reboots:
net.ipv4.ip_forward = 1
net.bridge.bridge-nf-call-iptables = 1

- net.ipv4.ip_forward is set to 1
- net.bridge.bridge-nf-call-iptables is set to 1

### 아예 몰라요,,,

개념 : kubeadm 원리와 modprobe 셋업 및 network 셋업
리눅스 부팅 과정에서 **systemd-modules-load.service**라는 서비스가 /etc/modules-load.d 를 확인

- 이 서비스는 디렉토리 안에 있는 `.conf` 파일을 읽어서 그 안에 적힌 **커널 모듈들을 자동으로 로드**
- 우리가 수동으로 `modprobe br_netfilter`를 하면 재부팅 시 사라지지만, 이 폴더에 등록해두면 **재부팅 후에도 자동으로 유지**

```yaml
# /etc/modules-load.d/${k8s커널모듈}.conf
vi /etc/modules-load.d/k8s.conf
overlay
br_netfilter

# modprobe 셋업
sudo modprobe br_netfilter
sudo modprobe overlay

# /etc/sysctl.d/${k8s커널모듈}.conf
vi /etc/sysctl.d/k8s.conf
net.ipv4.ip_forward = 1
net.bridge.bridge-nf-call-iptables = 1

# 시스템 적용
sudo sysctl --system

# ip_forward 확인
sysctl net.ipv4.ip_forward
# bridge-nf-call-iptables 확인
sysctl net.bridge.bridge-nf-call-iptables
```



# 2번 문제

Create a new service account with the name `pvviewer`. Grant this Service account access to `list` all PersistentVolumes in the cluster by creating an appropriate cluster role called `pvviewer-role` and ClusterRoleBinding called `pvviewer-role-binding`.
Next, create a pod called `pvviewer` with the image: `redis` and serviceAccount: `pvviewer` in the default namespace.

- ServiceAccount: pvviewer
- ClusterRole: pvviewer-role
- ClusterRoleBinding: pvviewer-role-binding
- Pod: pvviewer
- Is the pod configured to use ServiceAccount pvviewer?

### 아예 몰라요,,,

ServiceAccount
ServiceAccount 가 뭐길래 Pod 생성 시 지정할 수 있지 ? 관계가 뭐지 ??
Role
ClusterRole
RoleBinding
ClusterRoleBinding
CertificateSigningRequest

일단 이렇게 푸는 게 맞는갑?

```yaml
vi ~/pvviewer-serivce-account.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: pvviewer
  namespace: default

vi ~/pvviewer-role.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  # "namespace" omitted since ClusterRoles are not namespaced
  name: pvviewer-role
rules:
- apiGroups: [""]
  #
  # at the HTTP level, the name of the resource for accessing Secret
  # objects is "secrets"
  resources: ["persistentvolumes"]
  verbs: ["list"]

## CSI

### CSI 란 ?

외부 스토리지 시스템을 쿠버네티스 볼륨으로 연동하는 표준 인터페이스다. (Container Storage Interface)
이 표준 덕분에 AWS, GCP, Ceph 등 각 벤더가 쿠버네티스 코드를 건드리지 않고 자체 드라이버만 만들면 된다.

![](/images/notion/98593227470ad993.png)

실질적으로 CSI 는 PV, PVC 에서 사용되므로 해당 섹션에서 구현체를 지정하여 사용되는 모습을 볼 수 있다
[PV / PVC / StorageClass](https://www.notion.so/31e19c3902908083aad7e5b1db707218#31e19c3902908097a901fc4e888b0df4) 
CSI 드라이버는 세 가지 플러그인으로 나뉜다.
**Controller Plugin** (Deployment)은 스토리지 API를 호출해서 볼륨을 만들고 지운다. 노드와 무관하게 클러스터에 하나만 떠 있어도 된다.
**Node Plugin** (DaemonSet)은 각 노드에 반드시 있어야 한다. 실제로 디스크를 노드에 붙이고(`NodeStageVolume`), 파드가 쓸 수 있게 마운트(`NodePublishVolume`)한다.
**Identity Plugin**은 드라이버 이름, 버전 등 메타 정보를 쿠버네티스에 알려주는 역할이다.

## Kubeadm

### kubeadm 이란 ?

`kubeadm`은 쿠버네티스 클러스터를 **빠르게 구축하고 관리**하기 위한 도구입니다.

- **역할**: 클러스터의 생성(`init`), 노드 추가(`join`), 그리고 가장 중요한 업그레이드(`upgrade`) 를 담당합니다.
- **특징**: 컨트롤 플레인 컴포넌트(API Server, Scheduler 등)를 Static Pod 형태로 구성하며, 인증서 생성 및 설정을 자동화해줍니다.

### Drain 이란 ?

노드를 유지보수(커널 업데이트, 하드웨어 교체, 쿠버네티스 업그레이드)할 때 사용하는 명령어들입니다.
**Drain (비우기)**

- **역할**: 해당 노드에서 실행 중인 모든 Pod를 **안전하게 종료(Evict)**시키고 다른 노드로 옮기도록 명령합니다.
- **효과**: 자동으로 해당 노드에 `SchedulingDisabled` 표시(Cordon)를 남깁니다.
- **옵션**:

> 💡 **Static Pod는 Drain되지 않는다**
> 💡 drain 명령어 안 되는 경우



### Uncordon 이란 ?

- **역할**: 유지보수가 끝난 노드에 **다시 Pod가 스케줄링될 수 있도록** 허용합니다.
- **주의**: `uncordon`을 한다고 해서 이미 다른 노드로 떠난 Pod들이 자동으로 돌아오지는 않습니다. 이후에 생성되는 새로운 Pod들만 이 노드에 배치될 수 있습니다.

> **참고 (Cordon이란?):** 

### kubeadm 업그레이드 순서는 어떻게 될까?

업그레이드는 **[Control Plane Node] → [Worker Node 1] → [Worker Node 2]** 순서로 진행

1. Control Plane Node 업그레이드
2. Worker Node 들을 순차적으로 업그레이드

> 💡 마스터노드와 워커노드 간에 kubeadm upgrade 명령어가 다른 이유 ?
> 💡 **버전 건너뛰기 불가능**

## Role / ClusterRole / RoleBinding / ClusterRoleBinding

### Role

- **namespace 내에서의 권한을 선언**
- 특정 네임스페이스 안에서만 유효
- 네임스페이스가 없는 리소스(Node, PV 등)에는 사용 불가

### ClusterRole

- **클러스터 전체 범위의 권한을 선언**
- 다음 3가지에 대한 권한 선언 가능

> ⭐ **Node, PV에 ClusterRole이 필수인 이유**
> Node, PV는 네임스페이스 자체가 없는 리소스.
> Role은 특정 네임스페이스 안에서만 동작하므로, 네임스페이스 없는 리소스에는 권한 부여 자체가 불가능.
> ClusterRole만 가능.

### RoleBinding

- **특정 네임스페이스 내에서** User, Group, ServiceAccount에게 Role을 바인딩
- Role 또는 ClusterRole 모두 바인딩 가능
- ClusterRole을 RoleBinding으로 바인딩하면 → **해당 네임스페이스에서만 권한 제한 적용**

### ClusterRoleBinding

- **모든 네임스페이스에 걸쳐** User, Group, ServiceAccount에게 ClusterRole을 바인딩



### 4가지 조합 — 절대 헷갈리면 안 됨

| Role 종류 | Binding 종류 | 결과 |
| --- | --- | --- |
| Role | RoleBinding | 특정 네임스페이스 권한 |
| ClusterRole | ClusterRoleBinding | 클러스터 전체 권한 |
| ClusterRole | RoleBinding | ClusterRole을 특정 네임스페이스로 제한 ✅ |
| Role | ClusterRoleBinding | ❌ 불가능 |


> ⭐ **ClusterRole + RoleBinding 패턴이 유용한 이유**
> 여러 네임스페이스에서 같은 권한 패턴을 재사용하면서도,
> 각 네임스페이스로 범위를 제한하고 싶을 때 사용



### 권한 부여 대상 (Subject)

> User

- k8s에서 User 리소스는 **존재하지 않음**
- 외부 시스템(SSO, LDAP, OIDC) 또는 **클라이언트 인증서(Certificate)** 로 관리
- 인증서의 `CN(Common Name)` 값을 보고 API 서버가 사용자를 인식
- 인증 플러그인이 요청을 검사하여 API 서버에 사용자 정보를 전달

> Group

- k8s에서 Group 리소스는 **존재하지 않음**
- 인증 시점에 인증 플러그인이 "이 사용자는 'dev-team' 그룹 소속"이라고 선언

> ServiceAccount

- **Pod 안에서 실행되는 앱이 API 서버에 접근할 때 사용하는 로봇 계정**
- k8s 리소스로 존재함 (`kubectl get sa`)
- Pod spec의 `serviceAccountName` 필드에 지정
- 지정하지 않으면 해당 네임스페이스의 `default` SA 자동 할당

## kubectl 명령어 (시험장 핵심 패턴)

### ServiceAccount 생성

```bash
kubectl create serviceaccount <sa-name> -n <namespace>
# 또는
kubectl create sa <sa-name> -n <namespace>
```

### Role 생성

```bash
kubectl create role <role-name> \
  --verb=get,list,watch \
  --resource=pods \
  -n <namespace>
```

### ClusterRole 생성

```bash
kubectl create clusterrole <cr-name> \
  --verb=list \
  --resource=nodes
```

### RoleBinding 생성

```bash
# User 바인딩
kubectl create rolebinding <rb-name> \
  --role=<role-name> \
  --user=<username> \
  -n <namespace>

# ServiceAccount 바인딩
kubectl create rolebinding <rb-name> \
  --role=<role-name> \
  --serviceaccount=<namespace>:<sa-name> \
  -n <namespace>
```

### ClusterRoleBinding 생성

```bash
# User 바인딩
kubectl create clusterrolebinding <crb-name> \
  --clusterrole=<cr-name> \
  --user=<username>

# ServiceAccount 바인딩
kubectl create clusterrolebinding <crb-name> \
  --clusterrole=<cr-name> \
  --serviceaccount=<namespace>:<sa-name>
```

## 권한 검증 — 시험장 필수

```bash
# User 권한 확인
kubectl auth can-i <verb> <resource> --as=<username> -n <namespace>

# ServiceAccount 권한 확인
kubectl auth can-i <verb> <resource> \
  --as=system:serviceaccount:<namespace>:<sa-name> \
  -n <namespace>

# 예시
kubectl auth can-i list nodes \
  --as=system:serviceaccount:audit-ns:audit-sa
# → yes

kubectl auth can-i list pods -n audit-ns \
  --as=system:serviceaccount:audit-ns:audit-sa
# → yes

kubectl auth can-i list pods -n default \
  --as=system:serviceaccount:audit-ns:audit-sa
# → no
```



### 문제 1 : 

> Q

```bash
kubectl create clusterrole deployment-clusterrole \
	 --verb=create --resource=deployment,statefulset,daemonset
kubectl get clusterrole deployment-clusterrole

kubectl create serviceaccount cicd-token --namespace=app-team1
kubectl get serviceaccounts --namespace app-team1

kubectl create clusterrolebinding deployment-clusterrolebinding \
	 --clusterrole=deployment-clusterrole \
	 --serviceaccount=app-team1:ci
kubectl describe clusterrolebindings deployment-clusterrolebinding
```



# ⭐ 워크로드

## 클러스터

> 💡 실제 문제는 출제되지 않는데 이 개념을 모르면 문제를 못 푸는 거나 마찬가지라

### 클러스터란 ??
### 클러스터 구성요소 ??
### 클러스터 작동원리 ??
### 문제 : 클러스터 업데이트

Given an existing Kubernetes cluster running version 1.22.4 ,upgrade all of the Kubernetes control plane and node components on the master node only to version 1.23.3 .
Be sure to drain the master node before upgrading it and uncordon it after the upgrade

> ⚠️

```bash
# kubeadm 업그레이드
sudo yum install -y kubeadm-1.23.3-0 --disableexcludes=kubernetes
kubeadm version

# node components 업그레이드
sudo kubeadm upgrade plan v1.23.3
sudo kubeadm upgrade apply v1.23.3

# 노드 드레인
kubectl drain hk8s-m --ignore-daemonsets

# kubelet과 kubectl 업그레이드
sudo yum install -y kubelet-1.23.3-0 kubectl-1.23.3-0 --disableexcludes=kubernetes
sudo systemctl daemon-reload
sudo systemctl restart kubelet

# 노드 uncordon
sudo kubectl uncordon hk8s-m
```

## Pod 란?

### Node 란 ?

## Pod

### Pod 란 ?
### **downward api**

## Node

### Node 란 ?
### status 와 allocatable 필드
### [문제 1 : Node 자원 n 등분해서 Pod 생성](https://sunrise-min.tistory.com/entry/2025-CKA-%EC%8B%9C%ED%97%98-%EC%A4%80%EB%B9%84-%ED%95%B5%EC%8B%AC-%EC%9A%94%EC%95%BD#Service_&_Network:~:text=sleep%201%3B%20done%22-,Node%20%EC%9E%90%EC%9B%90%203%EB%93%B1%EB%B6%84%ED%95%B4%EC%84%9C%20pod%20%EC%83%9D%EC%84%B1,-%EB%AC%B8%EC%A0%9C%0A%0AYou%20manage)

A WordPress application with 3 replicas in the relative-fawn namespace
consists of: cpu 1 memory 1024Mi
Adjust all Pod resource requests as follows:
• Divide node resources evenly across all 3 pods.
• Give each Pod a fair share of CPU and memory.
• Add enough overhead to keep the node stable.
Use the exact same requests for both containers and init containers. 
You are not required to change any resource limits.
It may help to temporarily scale the WordPress Deployment to 0 replicas while updating the resource requests.
After updates, confirm:
• WordPress keeps 3 replicas.
• All Pods are running and ready

> ⚠️
> ⚠️

```bash
# 노드 리소스 확인
kubectl describe node | grep -A5 "Allocatable"

# deploy 스케일 in
kubectl scale deployment wordpress -n relative-fawn --replicas=0

kubectl edit deploy wordpress -n relative-fawn

resources:
  requests:
    cpu: "300m"
    memory: "300Mi"

# 다시 deploy 스케일 out
kubectl scale deployment wordpress -n relative-fawn --replicas=3

# pod 들 상태 확인
kubectl get pods -n relative-fawn
kubectl describe pods -n relative-fawn | grep -A4 Requests
```

## Namespace

### Namespace 란 ??
### Namespace vs Non-Namespace (Global) 리소스

- **Namespace 리소스:** 특정 논리적 격리 구역 안에 존재합니다. (예: `Pod`, `Service`, `Deployment`, `ConfigMap`, `Secret`)
- **Non-Namespace (Cluster-wide) 리소스:** 클러스터 전체에 영향을 미치며 네임스페이스에 구애받지 않습니다. (예: `Node`, `PersistentVolume`, `ClusterRole`, `Namespace` 그 자체)

> 

### Namespace 에서 리소스 제한 설정방법

**ResourceQuota & LimitRange:** 네임스페이스 레벨에서의 리소스 제한 설정. 

### 문제 1 :

## QoS Class

### QoS 란 ??
### `Guaranteed`, `Burstable`, `BestEffort`의 차이
### 각 모드에 대한 리소스 부족 시 삭제 우선순위는 ?
### 문제 1 :

## VPA

### VPA 란 ??

VPA 는 Pod에 할당된 CPU/Memory의 `requests`와 `limits`를 실제 사용량에 맞춰 동적으로 수정한다.
VPA 가 설정을 변경할 때 Pod 는 재시작 될 수 있다.

### [원리](https://kubernetes.io/docs/concepts/workloads/autoscaling/vertical-pod-autoscale/#how-does-a-verticalpodautoscaler-work)

![](/images/notion/54f3b01a023b0f5b.svg)

1. **Recommender:** `Metrics Server`로부터 Pod의 실제 리소스 사용 이력을 수집하고 분석하여 최적의 `requests` 값을 계산(추천)한다.
2. **Updater:** 현재 실행 중인 Pod의 리소스 설정이 추천값과 다를 경우, 해당 Pod를 삭제(Evict)한다.
3. **Admission Controller:** Pod가 재시작될 때(Deployment 등에 의해), 실제 배포되기 직전에 Recommender가 추천한 리소스 값으로 `spec`을 변조하여 적용한다.

> ⚠️

### 적용 & 확인

**updateMode 종류을 통해 Pod 처리에 대한 정책을 처리한다.**

- `Auto`: VPA가 직접 Pod를 재시작시키며 리소스를 업데이트함.
- `Recommender`: 추천만 하고 실제 적용은 하지 않음 (모니터링 용도).
- `Off`: 아무 작업도 하지 않음.

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: my-app-vpa
spec:
  # 어떤 대상을 모니터링할지 지정
  targetRef:
    apiVersion: "apps/v1"
    kind: Deployment
    name: my-app
  # 업데이트 정책 설정
  updatePolicy:
    updateMode: "Auto" # Auto, Recommender, Off 중 선택
  # 리소스 제한 범위 설정 (선택 사항)
  resourcePolicy:
    containerPolicies:
      - containerName: '*'
        minAllowed:
          cpu: 100m
          memory: 128Mi
        maxAllowed:
          cpu: 1
          memory: 500Mi
```
```yaml
# 이후 적용 한 다음 확인을 아래와 같이 한다.
# 1) VPA 상태를 확인한다.
# 2) 실제로 Pod의 requests 를 확인한다.
kubectl get vpa -n ${namespace명}

kubectl describe vpa my-app-vpa -n ${namespace명}

kubectl get pod <deploy-name> -o yaml

kubectl get pod <pod-name> -o yaml | grep -A 5 resources
```

## HPA

### HPA 란 ??

앞서 VPA 는 사용량에 따라 Pod 에 할당된 사용량을 수정해주었다.
HPA 는 사용량에 따라 Pod 에 대한 동적 스케일링 인/아웃을 처리해주는 역할이다.

### 원리

1. **메트릭 수집:** `Metrics Server`로부터 대상 Pod들의 리소스 사용량을 주기적으로 조회한다
2. **계산:** 현재 사용량과 목표 사용량을 비교하여 필요한 Pod 수를 계산한다.

$$
desiredReplicas = \lceil currentReplicas \times \frac{currentMetricValue}{targetMetricValue} \rceil
$$

1. **조절:** 계산된 결과에 따라 Deployment나 ReplicaSet의 `replicas` 값을 수정한다.

### 적용 & 확인

1. kubectl 로 확인
2. manifest 로 적용

이후 확인은 아래와 같이 진행한다.

```yaml
# hpa 확인
# TARGETS 열에 우리가 선언한 수치가 표시
kubectl get hpa ${hpa-이름} -n ${namespace-이름}
kubectl describe hpa ${hpa-이름} -n ${namespace-이름}

# metric server 확인
# 1) Pod들의 실시간 리소스 사용량 확인
# 2) 특정 Deployment에 속한 Pod들만 확인
kubectl top pod -n ${namespace-이름}
kubectl top pod -l app=${deploy-이름} -n ${namespace-이름}

```

### 문제 1 : HPA 생성을 통해 기존 Deployment 스케일링

Create a new HorizontalPodAutoscaler (HPA) named apache-server in the autoscale namespace. This HPA must target the existing Deployment called apache-server in the autoscale namespace. 
● Set the HPA to target for 50% CPU usage per pod. 
● Configure hpa to have at min 1 Pod and no more than 4 Pods[max]. 
● Also, we have to set the downscale stabilization window to 30 seconds.

> 

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: apache-server
  namespace: autoscale
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: apache-server
  minReplicas: 1
  maxReplicas: 4
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 50
  # 보완: Stabilization Window 설정 (v2 버전 필수)
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 30
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
```
```yaml
# HPA 확인
kubectl get hpa apache-server -n autoscale

# 메트릭 서버 확인
kubectl top pod -n autoscale
kubectl top pod -l app=apache-server -n autoscale
```




---



# 🌐 Service & Network

## EndpointSlice

### EndpointSlice 란 ??
### 문제 1: EndpointSlice

## ⭐ PSI 브라우저에서 복붙 ⭐

요령을 몰라서 계속 Command + C 이후에 마우스 오른쪽 클릭 이후 일일이 Paste 를 눌렀다,,,
복사 → 
붙여넣기 → 

### JSONPath 필터링 문법

시험 시간 단축의 핵심입니다.

- **정렬:** `kubectl get pods -A --sort-by=.metadata.name`
- **추출:** `kubectl get nodes -o jsonpath='{.items[*].status.addresses[?(@.type=="InternalIP")].address}'`
- **헤더 설정:** `kubectl get nodes -o custom-columns=NAME:.metadata.name,IP:.status.addresses[0].address`
