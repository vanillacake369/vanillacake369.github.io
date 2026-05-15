---
description: "ECC(Error Correcting Code) 메모리의 개념, 역할, 그리고 내 시스템에서 ECC 지원 여부를 확인하고 활성화하는 방법을 정리한다."
date: 2025-12-29
tags: [infra]
lang: ko
draft: false
---

# Why?

토발즈님이 자신의 개인 PC 를 조립하는 영상이 피드에 떴다. 보다보니 토발즈님이 ECC 메모리를 사달라고 요청했는데, 왜 사람들이 안 쓰는지 모르겠다며 강조하신다. (8:06 초부터)

왜일까? ECC 메모리란 무엇이고, 어떤 역할을 하며 내 메모리가 ECC 를 지원하는지에 대해서 어떻게 확인할까? 하나씩 알아보자.

# What?

## ECC 메모리란? 💾

**ECC(Error Correcting Code)** 메모리는 데이터 오류를 자동으로 감지하고 수정할 수 있는 메모리다. 일반 메모리(Non-ECC)가 64비트 데이터만 저장하는 반면, ECC 메모리는 **72비트**(64비트 데이터 + 8비트 ECC 코드)를 저장한다. 이 추가 8비트가 오류 검출과 수정에 사용된다.

## ECC 메모리의 역할 🛡️

### 1.

비트 플립(Bit Flip) 오류 수정

메모리의 비트가 0에서 1로, 또는 1에서 0으로 뒤바뀌는 현상을 **비트 플립**이라고 한다.

이는 다음과 같은 원인으로 발생한다:

- 우주 방사선 (cosmic rays)
- 전기적 노이즈
- 하드웨어 결함

### 2.

오류 감지 및 수정 능력

| 오류 유형            | ECC 메모리 대응       |
| -------------------- | --------------------- |
| 단일 비트 오류 (SBE) | 자동 감지 + **수정**  |
| 다중 비트 오류 (MBE) | 감지 가능 (수정 불가) |

### 3.

왜 Torvalds가 강조했을까?

- **데이터 무결성**: 커널 개발 시 단 1비트 오류도 치명적인 버그로 이어질 수 있음
- **Silent corruption 방지**: Non-ECC 메모리는 오류가 발생해도 사용자가 모름
- **장시간 안정성**: 서버처럼 24/7 가동되는 시스템에서 필수

## 내 메모리가 ECC를 지원하는지 확인하는 방법 🔍

### Windows

```powershell
# PowerShell에서 실행
wmic memorychip get DataWidth, TotalWidth

# 결과 해석:
# DataWidth=64, TotalWidth=72 → ECC 지원
# DataWidth=64, TotalWidth=64 → Non-ECC

```

또는 **CPU-Z** 프로그램 → Memory 탭에서 확인

### Linux

```bash
# dmidecode 사용 (root 권한 필요)
sudo dmidecode -t memory | grep -i "error correction"

# 결과 예시:
# Error Correction Type: Single-bit ECC → ECC 지원
# Error Correction Type: None → Non-ECC

```

```bash
# 또는 edac-utils 사용
sudo apt install edac-utils
edac-util --status

```

### 주의사항

ECC 메모리를 사용하려면 **CPU와 메인보드 모두** ECC를 지원해야 한다:

- Intel: 주로 Xeon 프로세서에서 지원
- AMD: Ryzen도 비공식적으로 ECC 지원 (메인보드에 따라 다름)

# How?

?

## ECC 메모리 사용을 위한 3가지 조건 확인 ✅

ECC 메모리를 사용하려면 **CPU, 메인보드, 메모리** 세 가지가 모두 ECC를 지원해야 한다. 하나라도 지원하지 않으면 ECC 기능이 작동하지 않는다.

### CPU / 마더보드&칩셋 / 메모리 확인

```bash
# CPU 모델명 확인
cat /proc/cpuinfo | grep "model name" | head -1
# 또는 lscpu 사용
lscpu | grep "Model name"
```

```bash
# 메인보드 정보 확인
dmidecode -t baseboard | grep -E "Manufacturer|Product Name"
```

```bash
# 메모리 확인
dmidecode -t memory | grep -E "Type:|Size:|Total Width:|Data Width:|Error Correction"
```

### Intel

- **Xeon 프로세서**: 공식 지원
- **Core i 시리즈**: 미지원 (Torvalds가 비판한 부분)
- **필요 칩셋**: W680, C246 등 워크스테이션/서버용

### AMD

- **Ryzen**: 비공식 지원 (메인보드에 따라 다름)
- **Threadripper / EPYC**: 공식 지원
- **확인 필요**: 메인보드 제조사 스펙시트에서 "ECC Support" 여부

## BIOS 에서 ECC 활성화 ⚙️

- 시스템 부팅 시 BIOS/UEFI 진입 (DEL 또는 F2)
- **Advanced** → **Memory Configuration** 또는 **AMD CBS** 메뉴 찾기
- **ECC Mode** 또는 **DRAM ECC Enable** 옵션을 **Enabled**로 설정
- 저장 후 재부팅

## **OS에서 ECC 모니터링하기** 📊

### **Linux**

```bash
# EDAC (Error Detection And Correction) 상태 확인
sudo dmesg | grep -i EDAC

# 오류 카운트 확인
cat /sys/devices/system/edac/mc/mc0/ce_count   # 수정된 오류
cat /sys/devices/system/edac/mc/mc0/ue_count   # 수정 불가 오류

# rasdaemon 설치 (실시간 모니터링)
sudo apt install rasdaemon
sudo systemctl enable rasdaemon
sudo ras-mc-ctl --summary
```

### Windows

```bash
# 이벤트 뷰어에서 WHEA 오류 확인
Get-WinEvent -LogName System | Where-Object {$_.ProviderName -eq "Microsoft-Windows-WHEA-Logger"}
```

[^1]: <https://www.geeksforgeeks.org/computer-organization-architecture/what-is-ecc-memory/>
[^2]: ECC 메모리는 일반적으로 Non-ECC 대비 약 2~3% 성능 오버헤드가 발생하나, 데이터 무결성이 중요한 서버·워크스테이션 환경에서는 이를 감수할 만하다. <https://en.wikipedia.org/wiki/ECC_memory>
[^3]: AMD Ryzen에서의 ECC 비공식 지원 여부는 메인보드 제조사(ASUS, ASRock 등)의 펌웨어 구현에 따라 달라지며, 공식 지원이 아니므로 안정성 보장이 없다. <https://www.phoronix.com/news/AMD-Ryzen-ECC-Memory>
[^4]: Linux EDAC(Error Detection And Correction) 서브시스템은 커널 2.6.16부터 포함되었으며, 하드웨어 메모리 오류를 커널 로그와 sysfs로 노출한다. <https://www.kernel.org/doc/html/latest/driver-api/edac.html>
