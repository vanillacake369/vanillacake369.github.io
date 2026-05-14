---
description: "1. **인프라 선언 구조**: `flake.nix`에서 `specialArgs`를 통한 설정 주입 원리. 2. **네트워크 설계**: 브리지(`vmbr`)와 VLAN을 이용한 L2 격리 구조."
date: 2026-01-16
tags: [homelab, nix]
lang: ko
draft: false
series: { id: "NixOS Ecosystem", order: 8 }
---

# Why?

# What?

## 개념

### 추천하는 정리 목차

1. **인프라 선언 구조**: `flake.nix`에서 `specialArgs`를 통한 설정 주입 원리.
2. **네트워크 설계**: 브리지(`vmbr`)와 VLAN을 이용한 L2 격리 구조.
3. **스토리지 전략**: `virtiofs`를 이용한 무상태(Stateless) VM 구성 및 데이터 영속화.
4. **배포 프로세스**: `Colmena` -> `Host` -> `MicroVM`으로 이어지는 프로비저닝 단계.

### 1.

계층화된 구성 (Layered Configuration)

가장 먼저 정리할 개념은 **"Single Source of Truth (단일 진실 공급원)"** 전략입니다.

- **`homelabConstants`\*\*** & \***\*`homelabConfig`**: IP 주소, VLAN ID, CPU/메모리 할당량 등을 한 곳에서 관리하고 이를 `specialArgs`를 통해 모든 VM에 주입합니다.
- **추상화**: `vms/k8s-master.nix` 코드를 보면 하드웨어 스펙은 `vmInfo`에서 가져오고, 실제 로직(Kubernetes 설정)만 선언되어 있습니다.
- **정리할 점**: 환경 변수와 상수를 분리했을 때의 유지보수 이점.

### 2.

가상 네트워크 토폴로지 (Virtual Networking)

작성하신 `network.nix`와 `microvm-network.nix`의 관계를 도식화해서 정리하세요.

- **Bridge (\*\***`vmbr1`\***\*)**: 물리적인 랜선 없이 호스트 내부에서 VM들을 연결하는 가상 스위치 역할.
- **VLAN Tagging**: 하나의 브리지 위에서 `vlan10`(관리용), `vlan20`(서비스용)으로 트래픽을 격리하는 방식.
- **TAP Interface**: 호스트의 브리지와 MicroVM의 가상 NIC를 연결하는 "가상 케이블" 개념.
- **정리할 점**: 왜 `systemd-networkd`를 사용하여 TAP을 브리지에 수동으로 붙이는 방식을 선택했는지(MicroVM의 유연성).

### 3.

공유 파일시스템 (Virtiofs Storage)

코드의 `shares` 부분을 보면 디스크 이미지가 아닌 `virtiofs`를 사용하고 있습니다.

- **`proto = "virtiofs"`**: 무거운 `.qcow2`나 `.raw` 디스크 이미지 대신, 호스트의 특정 디렉토리를 VM에 직접 매핑합니다.
- **State Management**: VM은 일시적(Ephemeral)일 수 있지만, 중요한 데이터는 `source` 경로에 영구 저장됩니다.
- **정리할 점**: 블록 스토리지 방식과 공유 파일시스템 방식의 성능 및 관리 편의성 차이.

### 4.

하이퍼바이저와 시스템 서비스화

`microvm.nix`가 NixOS에서 작동하는 방식입니다.

- **Hypervisor**: `cloud-hypervisor`나 `firecracker` 같은 경량 VMM(Virtual Machine Monitor)의 역할.
- **Systemd Integration**: 각 VM이 독립적인 프로세스가 아니라 호스트의 `systemd` 서비스(`microvm@name`)로 관리되는 라이프사이클.
- **Colmena Deployment**: 로컬에서 빌드한 클로저(Closure)를 타겟 서버로 복사하여 원격에서 VM을 갱신하는 워크플로우.

# How?

어떻게 씀?

## 구현

## 검증

### 1.

서비스 상태 확인 (systemd)

`microvm.nix`는 각 VM을 하나의 **systemd 서비스**로 관리합니다.

서비스 이름은 `microvm@<vm-이름>` 형식입니다.

```nix
# 모든 MicroVM 서비스의 상태 요약 보기
systemctl list-units "microvm@*"

# 특정 VM(예: k8s-master)의 로그 확인 (부팅 오류 디버깅 시 필수)
journalctl -u microvm@k8s-master -f
```

### 2.

가상 인터페이스 및 브리지 연결 확인

`modules/nixos/microvm-network.nix`에서 `tap` 인터페이스를 `vmbr1` 브리지에 붙이도록 설정하셨습니다.

이 연결이 실제로 이루어졌는지 확인해야 합니다.

```nix
# 브리지에 tap 인터페이스들이 속해있는지 확인
ip link show master vmbr1

# 또는 bridge-utils 패키지가 있다면
brctl show vmbr1
```

- `vm-k8s-master`, `vm-vault` 등의 인터페이스가 `vmbr1` 하위에 보여야 합니다.

### 3.

하이퍼바이저 프로세스 확인

설정하신 하이퍼바이저(Cloud-Hypervisor 또는 QEMU 등)가 실제로 실행 중인지 프로세스를 확인합니다.

```nix
# 실행 중인 하이퍼바이저 프로세스 확인
ps aux | grep microvm

# 각 VM이 사용하는 리소스(CPU, MEM) 확인
top -p $(pgrep -d ',' -f microvm)
```

### 4.

네트워크 통신 검증 (가장 중요)

VM 내부에서 고정 IP를 설정하셨으므로, 호스트에서 각 VM의 IP로 핑을 날려 통신 여부를 확인합니다.

```nix
# k8s-master VM으로 핑 테스트
ping -c 3 192.168.x.x  # vmInfo.ip에 해당하는 주소

# 포트 오픈 여부 확인 (예: Kubernetes API 포트)
nc -zv 192.168.x.x 6443
```

### 5.

MicroVM 관리 도구 활용

`microvm.nix`는 제어를 위한 실행 파일을 생성합니다. (경로는 빌드 결과에 따라 다를 수 있지만 보통 아래 명령어로 접근 가능합니다.)

```nix
# 현재 호스트에서 실행 중인 VM 목록과 제어 소켓 확인
microvm -l
```

### 💡 팁: 만약 네트워크가 안 된다면?

현재 `modules/nixos/network.nix`에서 `vmbr1`에 물리 인터페이스를 연결하지 않고 가상 스위치로만 사용하고 계십니다.

- **호스트 <-> VM 통신:** `vlan20`(호스트 측 가상 인터페이스)의 IP와 VM의 IP가 동일한 서브넷에 있고, `vmbr1`이 정상 작동한다면 가능합니다.
- **VM -> 외부 인터넷:** 현재 구성에는 **IP Forwarding**과 **NAT(Masquerade)** 설정이 보이지 않습니다.

VM이 인터넷에 접속해야 한다면 호스트의 `networking.nat` 설정이 추가로 필요할 수 있습니다.

**다음에 어떤 부분을 도와드릴까요?**

- VM에서 외부 인터넷이 가능하도록 NAT 설정을 추가해 드릴까요?
- 특정 VM(예: Vault나 Jenkins)의 세부 설정 검증을 도와드릴까요?
