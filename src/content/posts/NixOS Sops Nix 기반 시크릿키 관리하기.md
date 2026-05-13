---
title: "NixOS Sops Nix 기반 시크릿키 관리하기"
description: "먼저 본인이 파일을 암호화하고 수정할 때 쓸 키를 만듭니다."
date: 2026-01-15
tags: [homelab, nix]
category: uncategorized
lang: ko
draft: false
---

# Why? 왜 배움?

---



# What? 뭘 배움?

---

### 1. 클라이언트: 본인 전용 키 생성 (최초 1회)

먼저 본인이 파일을 암호화하고 수정할 때 쓸 키를 만듭니다. 요즘은 GPG보다 가벼운 **age**를 많이 씁니다.
대신 운영체제에 따라 기본경로를 주의해서 생성한다.

| **운영체제** | **기본 경로 (Default Path)** |
| --- | --- |
| **Linux** | `~/.config/sops/age/keys.txt` |
| **macOS** | `~/Library/Application Support/sops/age/keys.txt` |


> 💡 만약 age key 파일에 대해 특정 경로를 지정하고 싶다면 ?

```shell
~/dev/tonys-homelab main !8 ?2
❯ mkdir -p ~/.config/sops/age

~/dev/tonys-homelab main !8 ?2
❯ age-keygen -o ~/.config/sops/age/keys.txt
Public key: age1q4lfv04ytr7d7s8g0l9pnpewpzhhw4fxlx7jn2txwr47tyjn8d3qnl0wa0
```

### 2. 서버: 공개키(Public Key) 추출

서버를 새로 만들면 자동으로 생성되는 SSH 호스트 키를 이용합니다. 서버에 접속해서 다음 명령어를 칩니다.

```shell
~/dev/tonys-nix main !6                                   1m 30s
❯ ssh root@192.168.45.82 "cat /etc/ssh/ssh_host_ed25519_key.pub" | ssh-to-age
root@192.168.45.82's password:
age1dq8yn4y4cr5q4c7nyqq989c2htg2dypk7a795cve4dct7q460ehsepymec
```

### 3. 클라이언트: `.sops.yaml` 설정

프로젝트 루트 폴더에 설정 파일을 만듭니다. 여기에 **내 키**와 **서버 키**를 모두 등록합니다.

```yaml
keys:
  # 내 공개키
  - &admin_user age1q4lfv04ytr7d7s8g0l9pnpewpzhhw4fxlx7jn2txwr47tyjn8d3qnl0wa0
  # 서버 공개키
  - &target_server age1dq8yn4y4cr5q4c7nyqq989c2htg2dypk7a795cve4dct7q460ehsepymec
creation_rules:
  - path_regex: secrets/[^/]+\.(yaml|json|env|ini)$
    key_groups:
      - pgp:
          - *admin_user
        age:
          - *target_server

```

### 4. 클라이언트: 비밀 파일 생성 및 암호화

이제 `sops` 명령어로 파일을 만듭니다. 저장하는 순간 자동으로 암호화됩니다.

```yaml
# 시크릿 키 지정할 파일 생성
mkdir secrets
sops secrets/secrets.yaml

# 저장 이후 edit
sops secrets/secrets.yaml
# 저장 이후 edit
sops -d secrets/secrets.yaml
```

### 5. NixOS 설정 (sops.nix) 적용

NixOS 설정 파일에 암호화된 파일을 복호화하도록 경로를 지정합니다.

```yaml
{
  sops.defaultSopsFile = ./secrets.yaml;
  sops.age.sshKeyPaths = [ "/etc/ssh/ssh_host_ed25519_key" ]; # 서버의 개인키로 복호화하겠다는 설정
  
  sops.secrets.password = { }; # secrets.yaml 안의 'password' 키를 사용
}
```

### 6. 배포 (Deploy)

`nixos-rebuild switch --flake .` 등을 실행하여 서버에 반영합니다. 서버는 본인의 `/etc/ssh/ssh_host_ed25519_key`를 사용하여 `secrets.yaml`을 실시간으로 복호화해 사용합니다.

# How? 어떻게 씀?

---



# Reference

---

[https://github.com/Mic92/sops-nix?tab=readme-ov-file#usage-example](https://github.com/Mic92/sops-nix?tab=readme-ov-file#usage-example)
[https://michael.stapelberg.ch/posts/2025-08-24-secret-management-with-sops-nix/](https://michael.stapelberg.ch/posts/2025-08-24-secret-management-with-sops-nix/)
