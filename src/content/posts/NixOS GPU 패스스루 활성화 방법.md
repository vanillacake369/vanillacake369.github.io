---
title: "NixOS GPU 패스스루 활성화 방법"
description: "GPU 패스스루는 호스트 OS 가 사용하던 그래픽 카드 하드웨어를 가상 머신(VM)이 직접 완전히 점유하도록 통로를 열어주는 기술이다."
date: 2026-01-26
tags: [homelab, nix]
lang: ko
draft: false
series: { id: "NixOS Ecosystem", order: 6 }
---

# Why?

왜 배움?

---

---

# What?

뭘 배움?

---

---

## GPU 패스스루란 ?

GPU 패스스루는 호스트 OS 가 사용하던 그래픽 카드 하드웨어를 가상 머신(VM)이 직접 완전히 점유하도록 통로를 열어주는 기술이다.

보통 일반적으로 가상화를 통해 VM 을 선언한 경우, 가상의 그래픽 카드(가상 드라이버)를 통해 호스트의 자원을 나눠쓴다
이는  속도가 매우 느리고 게임이나 복잡한 연산이 어렵다
이를 해결하고자 GPU 패스스루를 통해 VM이 실제 하드웨어 주소에 직접 접근하게 하여  VM 내부에서도 호스트와 거의 동일한 네이티브 성능(95~99%) 을 처리할 수 있게한다.

이를 통해 VM 내부에서도 고사양 게임, 영상 편집, AI 연산을 수행하게 한다.

> 💡 왜 100% 지원은 안 될까?

## GPU 패스스루 동작원리 ?

### GPU 패스스루 핵심

GPU 패스스루의 핵심은 IOMMU(Input-Output Memory Management Unit) 라는 하드웨어 기능에 있다
CPU와 RAM 사이의 메모리 주소를 관리하는 MMU처럼, 
IOMMU 는 PCI 장치(GPU)와 RAM 사이의 주소를 관리한다.

IOMMU를 활성화하면 특정 PCI 장치가 호스트의 메모리 영역을 침범하지 않고, 
자신에게 할당된 VM의 메모리 영역에만 직접 데이터를 쓰고 읽을 수 있게 격리된 통로를 만들어 준다

### 왜 VBIOS 혹은 GOP 드라이버가 필요한가 ?

VBIOS(Legacy)와 GOP(UEFI)는 BIOS 에 의해 컴퓨터가 시작될 때 GPU 를 연결짓는 드라이버이다.

PC 는 부팅 시 메인보드 BIOS 가 본인의 GPU 드라이버를 사용하여 GPU 를 연결짓지만
VM 은 가짜 BIOS 를 사용하기 때문에 실제 GPU 를 어떻게 매핑하는지 모른다.

이 때 GOP 드라이버(.rom 파일) 을 VM 설정에 매핑하면 VM 부팅 시 해당 드라이버를 실행해 IOMMU 를 통해 직접 GPU 와 매핑할 수 있다.

다만 IOMMU 가 활성화되어있지 않다면 직접 접근이 불가능하기 때문에 반드시 활성화되어있어야 한다.
 (그렇기 때문에 IOMMU 활성화가 그만큼 중요한 것이다)

### 왜 호스트에서 PGU 활성화되어있으면 VM 에게 GPU 할당을 못 하는가?

이것은 **"소유권" **과 **"충돌" **의 문제이다
그래픽 카드는 설계 구조상 한 번에 하나의 OS 커널(Kernel)만 하드웨어 레지스터와 메모리에 접근할 수 있게 되어있다
호스트(NixOS)가 이미 GPU 드라이버(amdgpu 등)를 로드해서 화면을 출력하고 있다면, 
GPU의 상태(레지스터, 메모리 등)를 호스트 커널이 꽉 쥐고 있는 상태이다
이 상태에서 VM이 GPU를 뺏으려 하면 
호스트 드라이버와 VM 드라이버가 동일한 하드웨어 자원에 동시에 명령을 내리게 된다
결과는 시스템 프리징(커널 패닉) 이나 **하드웨어 오류**로 이어지게 될 수 있다.

그래서 호스트 부팅 시 `video=efifb:off`나 `vfio-pci`를 사용하여 호스트 커널이 GPU 근처에도 못 가게 막아야 한다
쉽게 설명하자면 “호스트 너는 이거 쓰지 마, 나중에 VM 줄 거니까!"라고 미리 찜해두는 과정이 필요한 것이다

## GPU 패스스루 처리 방법

### IOMMU 활성화

1.

BIOS 설정 (하드웨어 수준)
2.

커널 iommu 활성화

### GPU 드라이버 활성화

iommu 활성화를 완료하였다면 이제 GPU 드라이버가 필요하다
VM 이 호스트의 GPU 를 사용하려면 호스트처럼 해당 GPU 에 대한 드라이버가 필요하다.

먼저 본인의 BIOS 가 VBIOS 인지 GOP 인지를 확인해야한다.

아래 명령어를 호출하여 확인해보자

```shell
# 이 디렉토리가 존재하면 UEFI 모드
# UEFI 모드라면 GOP 드라이버를 사용하고 있을 확률이 높다
[ -d /sys/firmware/efi ] && echo "UEFI 모드 (GOP 사용 중)" || echo "Legacy 모드 (VBIOS 사용 중)"

# GOP 관련 로그 확인
dmesg | grep -i "gop"
dmesg | grep -i "efi"
dmesg | grep -i "vga"
# VBIOS 관련 로그 확인
dmesg | grep -i "vgaarbit"

# GPU 의 주소 확인
lspci -vnn | grep -A 15 "VGA"
```

필자는 확인해보니 GOP 드라이버를 사용 중인걸 알 수 있었다.

이제 아래 방법 중 하나를 택해 드라이버를 추출해야한다.
1) 제조사에서 제공하는 BIOS 다운로드, 이후 BIOS 에서 직접 추출
혹은 
2) AMD 드라이버 페이지를 통해 다운로드

필자는 서버를 미니PC 인 SER8 8845 를 사용 중이다. 
[레딧](https://www.reddit.com/r/MiniPCs/comments/1hnzxi4/ser8_beelink_driver_web_page/?tl=ko), 그리고 클로드에 물어보니 Beelink 측에서 BIOS 를 제공 중인 것을 알 수 있었다.

이것이 가장 정확하여 해당 방법으로 접근했다.

1.

BIOS 다운로드
2.

ROM 파일 준비 및 권한 설정
3.

Libvirt XML 편집 / QEMU 명령어 수정
4.

이후 ROM 매핑이 성공했는지 dmesg 확인하여 admgpu 드라이버가 정상적으로 인식되었는지 확인한다.

## k8s GPU 사용 선언

### amd gpu 인 경우

AMD GPU를 쿠버네티스에서 사용하기 위해서는 `k8s-device-plugin`을 배포해야 하며, 리소스 이름으로 `amd.com/gpu`를 사용합니다.

- 🛠️ 선언 방법 (DaemonSet 배포)
- 📄 파드(Pod) 예시 매니페스트

### nvidia 인 경우

NVIDIA는 `nvidia-device-plugin`을 사용하며, 리소스 이름으로 `nvidia.com/gpu`를 사용합니다.

최근에는 Helm을 통한 **GPU Operator** 설치를 권장하는 추세입니다.

- 🛠️ 선언 방법 (DaemonSet 배포)
- 📄 파드(Pod) 예시 매니페스트

# How?

어떻게 씀?

---

x

[^2]: https://github.com/ROCm/k8s-device-plugin <https://github.com/ROCm/k8s-device-plugin>
[^3]: https://instinct.docs.amd.com/projects/k8s-device-plugin/en/latest/ <https://instinct.docs.amd.com/projects/k8s-device-plugin/en/latest/>
[^5]: https://github.com/NVIDIA/k8s-device-plugin <https://github.com/NVIDIA/k8s-device-plugin>
[^6]: https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/latest/index.html <https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/latest/index.html>
