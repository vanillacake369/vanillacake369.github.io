---
title: "NixOS Colmena 설정하기"
description: "Colmena는 NixOS 기반 인프라를 SSH 원격에서 선언적으로 배포할 수 있게 해주므로,"
date: 2026-01-22
tags: [homelab, nix]
lang: ko
draft: false
series: { id: "NixOS Ecosystem", order: 5 }
---

# Why?

왜 배움?

---

---

Colmena는 NixOS 기반 인프라를 SSH 원격에서 선언적으로 배포할 수 있게 해주므로,

- 호스트/VM을 한 번에 관리하고
- 변경 사항을 안전하게 롤백하며
- 운영 환경을 코드로 재현 할 수 있습니다.

Colmena 는 홈랩 운영 및 배포를 위한 핵심 도구입니다.

# What?

뭘 배움?

---

---

Colmena는 다음 구조로 구성될 수 있다.

1.

호스트(homelab) + VM 전체를 Hive로 묶음
2.

호스트 배포 기준
3.

VM 노드 자동 구성

# How?

어떻게 씀?

---

### Colmena Hive 정의

`nix/flake/colmena.nix`에서 호스트/VM 배포 구성을 합칩니다.

```nix
inputs.colmena.lib.makeHive (baseHive // vmHive)

```

- `baseHive` → 물리 호스트
- `vmHive` → `homelabConstants.vms` 기반 자동 생성

### 호스트 배포 방식

```nix
homelab = {
  deployment = {
    targetHost = ...;
    targetUser = ...;
    buildOnTarget = true;
    tags = ["physical" "homelab"];
  };
  imports = hostModules;
};

```

### VM 배포 방식

```nix
vmHive = lib.mapAttrs (name: vmInfo: {
  deployment = {
    targetHost = vmInfo.ip;
    targetUser = vmInfo.deployment.user;
    buildOnTarget = true;
    tags = vmInfo.deployment.tags;
  };
  imports = vmModules ++ [ ./../../vms/${name}.nix ... ];
})

```

### 실제 배포 명령

```bash
# 특정 노드
colmena apply --on @homelab

# 특정 VM 태그 그룹
colmena apply --on @k8s

```

[^1]: https://github.com/Mic92/sops-nix?tab=readme-ov-file#usage-example <https://github.com/Mic92/sops-nix?tab=readme-ov-file#usage-example>
[^2]: https://michael.stapelberg.ch/posts/2025-08-24-secret-management-with-sops-nix/ <https://michael.stapelberg.ch/posts/2025-08-24-secret-management-with-sops-nix/>
