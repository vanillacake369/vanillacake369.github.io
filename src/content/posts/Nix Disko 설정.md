---
description: "싱글 SSD 환경에서 ZFS/BTRFS 대신 ext4 + LVM Thin Provisioning을 선택하고, disko로 파티셔닝을 선언적으로 구성한 과정을 정리한다."
date: 2026-01-14
tags: [homelab, nix]
lang: ko
draft: false
series: { id: "NixOS Ecosystem", order: 1 }
---

# Why?

# What?

## Why ZFS, BTRFS are overkill ? 🤔

무슨 파일시스템을 구성할지 고민되었다.

만약 ZFS 혹은 BTRFS 를 사용하게되면 RAID 및 스냅샷, 무결성을 보장할 수 있다. 다만 이것은 싱글 스토리지인 현재 스펙에선 어울리지 않는 선택이다.

Write Amplification 에 따른 SSD warn out 현상이 발생할 수 있고 RAID 구성을 할 수 없어 의미가 없기 때문이다.

따라서 ext & LVM 기반으로 진행한 뒤 추가 스토리지 확장하게 되면 그 때 마이그레이션 작업을 이어나가기로 하였다.

## How do I configure disk partition ? 🗂️

위 사항들로 인해 ZFS,BTRFS 대신 ext4 를 사용하기로 결정하였다. 다만 ext4 에 대한 설정에 앞서 아래와 같은 기준점을 정리해보았다.

- 자동 복구 지원할 수 있는가
- 데이터 백업 및 스냅샷 처리는 어떻게 할 것인가?
- 데이터 보호가 가능한가
- OS 영역과 데이터 영역을 분리할 수 있는가
- Write Amplification 에 따른 SSD warnout 현상이 있는가?

위 기준에 따라 아래와 같이 스왑, LVM Thin Provisioning, SSD 최적화를 구성하였다. 만약 해당 내용에 있어 모르는 부분이 있다면 아래를 살펴보길 바란다.

> 💡 스왑이란 ??
> 💡 LVM ?
> 💡 SSD 최적화

이후 계층 별로 파티셔닝 구성도를 그려보았다.

| **계층 (Layer)** | **구분 (LV/Pool)** | **물리적 크기 (Real)** | **논리적 크기 (Virtual)** | **상세 용도**                   | **마운트 포인트 (Mount)** |
| ---------------- | ------------------ | ---------------------- | ------------------------- | ------------------------------- | ------------------------- |
| **Boot**         | `ESP` (Partition)  | 1 GB                   | 1 GB                      | UEFI 부팅 및 커널 커널 저장     | `/boot`                   |
| **Memory**       | `swap` (Partition) | 16 GB                  | 16 GB                     | RAM 부족 시 보험 (암호화)       | `-`                       |
| **Tier 1: OS**   | `root` (Thick LV)  | **200 GB**             | 200 GB                    | NixOS 시스템 + `/nix/store`     | `/`                       |
| **Tier 2: VM**   | `vm_thinpool`      | **400 GB**             | **800 GB**                | 가상 머신 이미지 전용 풀        | `/var/lib/libvirt/images` |
| └ _Sub-VMs_      | _(qcow2 files)_    | _(공유 사용)_          | _(오버커밋)_              | OPNsense, K8s Nodes, Jenkins VM | (디렉터리 관리)           |
| **Tier 3: Data** | `data_thinpool`    | **300 GB**             | **600 GB**                | 서비스 데이터 및 저장소 풀      | `/data`                   |
| └ _Sub-Data_     | _(Directories)_    | _(공유 사용)_          | _(오버커밋)_              | Registry, Jenkins Home, K8s PV  | `/data/{service}`         |
| **Security**     | `vault` (Thick LV) | 20 GB                  | 20 GB                     | 보안 격리가 필요한 비밀 관리    | `/var/lib/vault`          |
| **Reserve**      | `Free Space`       | **~83 GB**             | -                         | **긴급 확장용 (LVM VG 여유)**   | `-`                       |
| **합계**         | **Physical Disk**  | **~1,020 GB**          | **~1,637 GB**             | **약 160% 효율 달성**           | -                         |

# How?

위 파티셔닝 구성도에 따라 아래와 같이 [disko](https://github.com/nix-community/disko) 를 구성하였다.
(해당 파일은 nixos-anywhere 을 통해 파일시스템 구축을 한다)
각 모듈 별로 어떤 값들을 선언했는지 자세히 살펴보자

```nix
disko.devices = {
  disk.main = {
    type = "disk";
    device = "/dev/nvme0n1";
    content = {
      type = "gpt";
      partitions = {
        # ==========================================
        # 부팅 영역
        # ==========================================
        ESP = {
          size = "1G";
          type = "EF00";
          content = {
            type = "filesystem";
            format = "vfat";
            mountpoint = "/boot";
            mountOptions = ["defaults" "umask=0077"];
          };
        };

        # ==========================================
        # 스왑
        # ==========================================
        swap = {
          size = "16G";
          content = {
            type = "swap";
            randomEncryption = true;
          };
        };

        # ==========================================
        # LVM Physical Volume
        # ==========================================
        lvm = {
          size = "100%";
          content = {
            type = "lvm_pv";
            vg = "homelab_vg";
          };
        };
      };
    };
  };

  lvm_vg.homelab_vg = {
    type = "lvm_vg";
    lvs = {
      # ==========================================
      # Tier 1: 시스템 (Thick - 절대 보호)
      # ==========================================
      root = {
        size = "200G"; # ⭐ NixOS + /nix/store 통합
        content = {
          type = "filesystem";
          format = "ext4";
          mountpoint = "/";
          mountOptions = [
            "noatime"
            "errors=remount-ro"
          ];
        };
      };

      # ==========================================
      # Tier 2: VM Thin Pool (유연한 오버커밋)
      # ==========================================
      vm_thinpool = {
        size = "400G"; # 실제 물리 할당
        lvm_type = "thin-pool";
        # Thin Pool 설정
        extraArgs = [
          "--chunksize"
          "64K" # SSD 최적화
          "--poolmetadatasize"
          "1G" # 메타데이터
        ];
      };

      # Thin LV: VM 통합 볼륨
      vms = {
        size = "800G"; # ⚠️ 논리적 크기 (오버커밋 2배)
        lvm_type = "thinlv";
        pool = "vm_thinpool";
        content = {
          type = "filesystem";
          format = "ext4";
          mountpoint = "/var/lib/libvirt/images";
          mountOptions = [
            "noatime"
            "lazytime" # 메타데이터 쓰기 지연
          ];
        };
      };

      # ==========================================
      # Tier 3: Data Thin Pool (앱 데이터)
      # ==========================================
      data_thinpool = {
        size = "300G"; # 실제 물리 할당
        lvm_type = "thin-pool";
        extraArgs = [
          "--chunksize"
          "128K"
          "--poolmetadatasize"
          "500M"
        ];
      };

      # Thin LV: 통합 데이터 볼륨
      data = {
        size = "600G"; # 논리적 크기 (오버커밋 2배)
        lvm_type = "thinlv";
        pool = "data_thinpool";
        content = {
          type = "filesystem";
          format = "ext4";
          mountpoint = "/data";
          mountOptions = [
            "noatime"
            "lazytime"
          ];
        };
      };

      # ==========================================
      # Vault 전용 (보안 격리)
      # ==========================================
      vault = {
        size = "20G"; # Thick - 중요 데이터
        content = {
          type = "filesystem";
          format = "ext4";
          mountpoint = "/var/lib/vault";
          mountOptions = [
            "noatime"
            "data=ordered" # 무결성 우선
          ];
        };
      };
    };
  };
};
```

### LVM Volume Group 선언 🧱

1. **시스템 (\*\***`root`\***\*)**
2. **VM Thin Pool & LV (\*\***`vms`\***\*)**
3. **Data Thin Pool & LV (\*\***`data`\***\*)**
4. Vault 전용 구역 (`vault`)

```nix
    lvm_vg.homelab_vg = {
      type = "lvm_vg";
      lvs = {
        # ==========================================
        # Tier 1: 시스템 (Thick - 절대 보호)
        # ==========================================
        root = {
          size = "200G"; # ⭐ NixOS + /nix/store 통합
          content = {
            type = "filesystem";
            format = "ext4";
            mountpoint = "/";
            mountOptions = [
              "noatime"
              "errors=remount-ro"
            ];
          };
        };

        # ==========================================
        # Tier 2: VM Thin Pool (유연한 오버커밋)
        # ==========================================
        vm_thinpool = {
          size = "400G"; # 실제 물리 할당
          lvm_type = "thin-pool";
          # Thin Pool 설정
          extraArgs = [
            "--chunksize"
            "64K" # SSD 최적화
            "--poolmetadatasize"
            "1G" # 메타데이터
          ];
        };

        # Thin LV: VM 통합 볼륨
        vms = {
          size = "800G"; # ⚠️ 논리적 크기 (오버커밋 2배)
          lvm_type = "thinlv";
          pool = "vm_thinpool";
          content = {
            type = "filesystem";
            format = "ext4";
            mountpoint = "/var/lib/libvirt/images";
            mountOptions = [
              "noatime"
              "lazytime" # 메타데이터 쓰기 지연
            ];
          };
        };

        # ==========================================
        # Tier 3: Data Thin Pool (앱 데이터)
        # ==========================================
        data_thinpool = {
          size = "300G"; # 실제 물리 할당
          lvm_type = "thin-pool";
          extraArgs = [
            "--chunksize"
            "128K"
            "--poolmetadatasize"
            "500M"
          ];
        };

        # Thin LV: 통합 데이터 볼륨
        data = {
          size = "600G"; # 논리적 크기 (오버커밋 2배)
          lvm_type = "thinlv";
          pool = "data_thinpool";
          content = {
            type = "filesystem";
            format = "ext4";
            mountpoint = "/data";
            mountOptions = [
              "noatime"
              "lazytime"
            ];
          };
        };

        # ==========================================
        # Vault 전용 (보안 격리)
        # ==========================================
        vault = {
          size = "20G"; # Thick - 중요 데이터
          content = {
            type = "filesystem";
            format = "ext4";
            mountpoint = "/var/lib/vault";
            mountOptions = [
              "noatime"
              "data=ordered" # 무결성 우선
            ];
          };
        };
      };
    };
  };

```

### SSD 수명 관리 💾

SSD에 더 이상 사용하지 않는 데이터 블록이 어디인지 알려주는 TRIM 명령어를 주마다 실행한다.

```nix
  # ==========================================
  # 2. fstrim 자동화
  # ==========================================
  services.fstrim = {
    enable = true;
    interval = "weekly";
  };

```

### LVM 자동 확장 📈

Thin Provisioning 의 최대 단점은 실제 물리 공간이 꽉 차면 파일 시스템이 깨질 수 있다는 점이다. 이를 방지하기 위해 아래와 같은 설정 파일을 선언하여 관리할 수 있다.

- **Threshold :** Thin Pool 의 물리적 사용량이 n %에 도달하면 자동으로 확장을 시도한다
- **Percent :** 확장 시 현재 크기의 n %만큼 더 늘린다. (단, VG에 남은 물리 공간이 있어야 가능하다)

```nix
  # ==========================================
  # 3. LVM 자동 확장
  # ==========================================
  environment.etc."lvm/lvm.conf".text = ''
    activation {
      thin_pool_autoextend_threshold = 80
      thin_pool_autoextend_percent = 20
    }
  '';
```

또한 systemd 의 lvm2-monitor 서비스를 활성화하였는데, 이 서비스는 thin pool 사용량을 모니터링하여 자동확장을 수행하는 dmeventd 에 매핑시킨다. 만약 이 서비스가 꺼져 있으면 80%가 넘어도 자동 확장이 일어나지 않기 때문에 중요하다.[^lvm2-monitor][^dmeventd-arch][^dmeventd-man7]

[^lvm2-monitor]: [lvm2-monitor.service — Red Hat 공식 문서](https://docs.redhat.com/ko/documentation/red_hat_enterprise_linux/9/html/using_systemd_unit_files_to_customize_and_optimize_your_system/ref_a-guide-to-selecting-services-that-can-be-safely-disabled_optimizing-systemd-to-shorten-the-boot-time#:~:text=%EC%84%A4%EC%B9%98%EC%97%90%EC%84%9C%20%EC%8B%9C%EC%9E%91%EB%90%98%EC%A7%80%20%EC%95%8A%EC%8A%B5%EB%8B%88%EB%8B%A4.-,lvm2%2Dmonitor.service,-%EC%A0%9C%EA%B3%B5%EB%90%A8)
[^dmeventd-arch]: [dmeventd(8) — Arch Linux man page](https://man.archlinux.org/man/core/device-mapper/dmeventd.8.en#:~:text=Monitors%20how%20full%20a%20VDO,tools%20like%20lvs(8))
[^dmeventd-man7]: [dmeventd(8) — man7.org](https://man7.org/linux/man-pages/man8/dmeventd.8.html)

```nix
  systemd.services.lvm2-monitor.enable = true;

```

### 메모리 기반 임시 디렉토리 🚀

- **기능:** `/tmp` 경로를 실제 SSD가 아닌 **RAM(메모리)**에 할당한다.
- **장점:**
- **크기:** 전체 RAM의 30%를 최대치로 설정하여, 메모리 부족(OOM) 현상을 방지하면서 넉넉한 공간을 확보했다.[^tmpfs-nixos]

[^tmpfs-nixos]: NixOS의 `boot.tmp.useTmpfs` 옵션은 `/tmp`를 tmpfs로 마운트한다. `tmpfsSize`로 상한을 지정하지 않으면 RAM 전체를 소진할 수 있으므로 반드시 설정해야 한다.

```nix
  # ==========================================
  # 4. tmpfs for /tmp
  # ==========================================
  boot.tmp = {
    useTmpfs = true;
    tmpfsSize = "30%"; # 9.6GB
  };

```
