---
title: "Proxmox 설치하기"
description: ""
date: 2025-12-29
tags: [Homelab]
category: uncategorized
lang: ko
draft: false
---

# Why? 왜 배움?

---

proxmox iso 를 설치하여 proxmox 서버 운영해보고자 한다.
 

# What? 뭘 배움?

---

## proxmox iso 설치

1. (Optional) [rufus](https://rufus.ie/en/), [ventoy](https://github.com/ventoy/Ventoy) 를 통해 bootable usb 를 만든다.
2. iso image 를 [다운로드](https://www.proxmox.com/en/products/proxmox-virtual-environment/get-started)한다.
3. bootable usb 를 꼽고 BIOS/Boot 에 들어가 iso 를 설치 및 실행한다.



## 설치 이후 설정을 한 번에

다음 섹션에서 설명될 [non-subscription 처리](https://www.notion.so/2d819c39029080dab270cbc0141661b4#2e019c390290802d9f52f1770688fac2) 부터 시작해서
subscription nag, ha 설정, corosync 설정 등등을 하나의 스크립트를 통해 처리할 수 있다.
[https://community-scripts.github.io/ProxmoxVE/scripts?id=post-pve-install](https://community-scripts.github.io/ProxmoxVE/scripts?id=post-pve-install) 를 들어가면 아래 스크립트를 copy 할 수 있다.
해당 스크립트를 돌리고 끄고 싶은 설정들을 선택하여 끄도록 하자

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/community-scripts/ProxmoxVE/main/tools/pve/post-pve-install.sh)"
```



## non-subscription 처리

Proxmox 는 기본적으로 enterprise repo 로 설정되어있고, enterprise subscription key 를 요구한다.

![](/images/notion/2b601c528ffe9b9f.png)
![](/images/notion/c919c9a3e4af51fe.png)

이에 따라 no-subscription repo 로 변경해주어야한다.
방법은 1) GUI 로 하는 법과 2) CLI 로 하는법이 존재한다.

### 1) GUI 로 하는 법

1. **Updates > Repositories 로 간다.** 

### 2) CLI 로 하는법

아래와 같이 두 파일을 변경해준다.

```bash
#/etc/apt/sources.list.d/pve-enterprise.list

# (이전)deb https://enterprise.proxmox.com/debian/pve bookworm enterprise
# (이후)
deb http://download.proxmox.com/debian/pve bookworm pve-no-subscription
```
```bash
#/etc/apt/sources.list.d/ceph.list

# (이전) deb https://enterprise.proxmox.com/debian/ceph-quincy bookworm enterprise
# (이후)
deb http://download.proxmox.com/debian/ceph-quincy bookworm no-subscription
```



# How? 어떻게 씀?

---

x


# Reference

---

[https://www.virtualizationhowto.com/2022/08/proxmox-update-no-subscription-repository-configuration/](https://www.virtualizationhowto.com/2022/08/proxmox-update-no-subscription-repository-configuration/)
