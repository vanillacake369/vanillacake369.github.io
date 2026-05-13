---
title: "NixOS K8S Master / Worker 노드 구축"
description: ""
date: 2026-01-20
tags: [Homelab, Nix]
category: uncategorized
lang: ko
draft: false
---

# Why? 왜 배움?

---



# What? 뭘 배움?

---

[https://joshrosso.com/c/nix-k8s/](https://joshrosso.com/c/nix-k8s/) 에 잘 나와있어서 참고하면 좋을듯하다!

| **구성 요소** | **역할** | **비유** |
| --- | --- | --- |
| **Token** | 워커 노드가 마스터에 처음 접근할 때 사용하는 **임시 통행증** | 신입 사원의 임시 출입증 |
| **CA / Certs** | 클러스터 내 모든 통신을 암호화하고 신원을 증명하는 **인증서** | 정식 사원증 (지문 인식 등) |
| **Kubeconfig** | 관리자나 컴포넌트가 API 서버에 접속하기 위한 **접속 정보 세트** | 출입문 열쇠 + 보안 카드 |
| **CNI (Flannel)** | 노드 간, 포드(Pod) 간 통신을 가능하게 하는 **가상 네트워크망** | 사무실 내 전화선/내선 번호 공사 |




## Cluster Join 상세 프로세스 및 원리

1. Master 초기화 (`kubeadm init`)
2. CNI (Flannel) 설치
3. Join 토큰 생성 및 검증 준비
4. Worker 노드 합류 (The "Join" Magic)



## 왜 CNI 가 활성화 되어있어야지만 될까?

### ① 통신 인프라 준비 (Physical/Virtual Network)

CNI가 없어도 노드 간의 **기본적인 IP 통신**(L3 네트워크)은 가능해야 합니다. 워커 노드가 마스터 노드의 IP(예: `10.0.20.10`)로 패킷을 보낼 수 있어야 `kubeadm join` 요청을 보낼 수 있기 때문입니다.

### ② 토큰 기반 인증 및 TLS Bootstrap (인증 단계)

워커 노드가 토큰을 들고 마스터에게 접근하여 인증서를 발급받는 과정입니다. 이 시점에서는 아직 **CNI가 작동하지 않습니다.** 노드는 `NotReady` 상태로 보이지만, 제어 평면(Control Plane)과는 인증서를 통해 안전하게 연결된 상태입니다.

### ③ CNI 포드 배포 및 활성화 (네트워크 단계)

인증이 완료되어 노드가 정식으로 등록되면, 마스터는 해당 노드에 **CNI(Flannel 등)용 포드**를 스케줄링합니다.

- CNI 포드가 워커 노드에 설치되고 나서야 노드 내부의 가상 네트워크(veth, bridge 등)가 뚫립니다.
- 이때 비로소 노드의 상태가 `NotReady`에서 **`Ready`*로 변합니다.



# How? 어떻게 씀?

---

## The NixOS Way

nixos 에서는 easyCert 를 통해 인증서 생성 및 CSR 승인과정을 자동으로 처리하는 서비스를 지원한다
[https://wiki.nixos.org/wiki/Kubernetes](https://wiki.nixos.org/wiki/Kubernetes) 를 참고해서 구현해보자
다만 해당 참고문서에서 유의해야할 부분들을 모두 유의해서 구현해야만 작동한다


## The Vanilla K8S Way

Host

```shell
# 1. 호스트 배포
just deploy

# 2. VM 재시작 (배포 후)
sudo systemctl restart microvm@k8s-master
sudo systemctl restart microvm@k8s-worker-1
sudo systemctl restart microvm@k8s-worker-2

```

Master

```shell
# k8s-master VM에 SSH 접속 후 kubeadm init
ssh root@10.0.20.10

# (만에 하나) etcd 경로에 이미
# 데이터가 있는 경우를 방지
# 1) kubelet 중지
sudo systemctl stop kubelet
# 2) containerd(혹은 docker) 중지 및 삭제
sudo crictl ps -q | xargs -r sudo crictl stop
sudo crictl ps -a -q | xargs -r sudo crictl rm
sudo docker stop $(sudo docker ps -q)
sudo docker rm $(sudo docker ps -aq)
# 3) 마운트 해제
mount | grep etcd
sudo umount /var/lib/etcd
# 4) 강제 초기화 & 삭제
sudo kubeadm reset -f
sudo rm -rf /etc/kubernetes/*
sudo rm -rf /var/lib/kubelet/*
sudo rm -rf /var/lib/etcd/*



# k8s-master 내에서 실행:
sudo kubeadm init \
  --apiserver-advertise-address=10.0.20.10 \
  --pod-network-cidr=10.244.0.0/16 \
  --service-cidr=10.96.0.0/12 \
  --node-name=k8s-master
# ,,,
# [bootstrap-token] Configured RBAC rules to allow the csrapprover controller automatically approve CSRs from a Node Bootstrap Token
# [bootstrap-token] Configured RBAC rules to allow certificate rotation for all node client certificates in the cluster
# [bootstrap-token] Creating the "cluster-info" ConfigMap in the "kube-public" namespace
# [kubelet-finalize] Updating "/etc/kubernetes/kubelet.conf" to point to a rotatable kubelet client certificate and key
# [addons] Applied essential addon: CoreDNS
# [addons] Applied essential addon: kube-proxy
#
# Your Kubernetes control-plane has initialized successfully!
# 
# To start using your cluster, you need to run the following as a regular user:
#  
#   mkdir -p $HOME/.kube
#   sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
#   sudo chown $(id -u):$(id -g) $HOME/.kube/config
# 
# Alternatively, if you are the root user, you can run:
# 
#   export KUBECONFIG=/etc/kubernetes/admin.conf
# 
# You should now deploy a pod network to the cluster.
# Run "kubectl apply -f [podnetwork].yaml" with one of the options listed at:
#   https://kubernetes.io/docs/concepts/cluster-administration/addons/
# 
# Then you can join any number of worker nodes by running the following on each as root:
# 
# kubeadm join 10.0.20.10:6443 --token 80tcfb.95z7ww2mbiihle1z \
#         --discovery-token-ca-cert-hash sha256:f246478788b18bf1dde0eef4bb8657fe3e99a6530479415e9f9f3d07e89a786b



# kubeconfig 설정
mkdir -p $HOME/.kube
sudo cp /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config



# Flannel CNI 설치
kubectl apply -f https://raw.githubusercontent.com/flannel-io/flannel/master/Documentation/kube-flannel.yml



# join 토큰 생성 (이 출력을 복사해서 worker에서 사용)
kubeadm token create --print-join-command
# kubeadm join 10.0.20.10:6443 --token 9w66nv.ro1c6n8nuyggqrxt --discovery-token-ca-cert-hash sha256:f246478788b18bf1dde0eef4bb8657fe3e99a6530479415e9f9f3d07e89a786b
```

Worker

```shell
# (만에 하나) 깨져있는 기존의 cert 삭제를 위해
# 한 번 초기화 과정
sudo kubeadm reset -f
sudo rm -rf /etc/cni/net.d


# 토큰으로 join
root@k8s-worker1:~/ > kubeadm join 10.0.20.10:6443 --token 3vchjq.fdkfgo301t2za33x \
        --discovery-token-ca-cert-hash sha256:1627c7a7babd01e60938a90ad8456e7a45c302d78aed6c991166ea845a865525
# [preflight] Running pre-flight checks
# [preflight] Reading configuration from the "kubeadm-config" ConfigMap in namespace "kube-system"...
# [preflight] Use 'kubeadm init phase upload-config kubeadm --config your-config-file' to re-upload it.
# [kubelet-start] Writing kubelet configuration to file "/var/lib/kubelet/instance-config.yaml"
# [patches] Applied patch of type "application/strategic-merge-patch+json" to target "kubeletconfiguration"
# [kubelet-start] Writing kubelet configuration to file "/var/lib/kubelet/config.yaml"
# [kubelet-start] Writing kubelet environment file with flags to file "/var/lib/kubelet/kubeadm-flags.env"
# [kubelet-start] Starting the kubelet
# [kubelet-check] Waiting for a healthy kubelet at http://127.0.0.1:10248/healthz. This can take up to 4m0s
# [kubelet-check] The kubelet is healthy after 502.281226ms
# [kubelet-start] Waiting for the kubelet to perform the TLS Bootstrap
# 
# This node has joined the cluster:
# * Certificate signing request was sent to apiserver and a response was received.
# * The Kubelet was informed of the new secure connection details.
# 
# Run 'kubectl get nodes' on the control-plane to see this node join the cluster.
```



## 트러블슈팅 : 확인순서 및 처리방법

1. 노드 연결 및 등록 상태 확인 (`Ready` 여부)
2. Kubelet 서비스 엔진 상태 분석
3. 클러스터 핵심 컴포넌트(System Pods) 생존 확인
4. 개별 포드 장애 심층 분석
5. 커널 및 하드웨어 레벨 장애 검증



## 실제 겪어봤던 문제와 해결법

1. /var/lib/kubelet을 virtiofs로 마운트하면 안 됨
2. KUBELET_KUBEADM_ARGS="" 빈 문자열 에러
3. kubelet PATH에 mount가 없음
4. br_netfilter 커널 모듈 미로드 (MicroVM)
5. VM 스토리지 shares 중복
6. DNS nameserver 초과 경고



# Reference

---
