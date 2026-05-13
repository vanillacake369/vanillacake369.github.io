---
title: "Vagrant Tutorial"
description: ""
date: 2025-05-15
tags: [Linux]
category: uncategorized
lang: ko
draft: false
---

# Why? 왜 배움?

---

간혹 nix 설정이 꼬여서 패키지가 제대로 작동이 안 될 때가 있다.
이럴 때 vm 을 켜서 ubuntu 를 깔고 해당 패키지가 제대로 동작하는지 확인하고자 한다.

# What? 뭘 배움?

---

## Vagrant

개발 환경은 코드 작성, 테스트 및 디버깅을 위한 일관된 설정을 제공합니다. 
안정성과 이식성을 보장하여 팀이 보다 효과적으로 협업할 수 있도록 돕고, 구성 편차 및 종속성 문제와 같은 문제를 해결합니다.
Vagrant는 개발자 환경의 생성 및 관리를 간소화하는 해시코프의 도구입니다. 
호스트 머신(로컬 컴퓨터)과 게스트 머신(가상 환경) 사이의 간극을 메워 원활한 통합을 보장합니다.
Vagrant는 Vagrant파일이라는 구성 파일을 사용하여 설정 및 구성 프로세스를 자동화함으로써 팀이 환경 관리가 아닌 개발에 집중할 수 있도록 지원합니다.

Vagrant는 가상 환경을 수동으로 구성하는 것보다 몇 가지 이점을 제공합니다:

- Vagrant는 일관되고 재현 가능한 환경을 보장하여 “내 컴퓨터에서만 작동한다”는 문제를 줄이고 보다 원활한 협업을 가능하게 합니다.
- Vagrant 환경은 이식 및 공유가 가능하므로 팀은 프로젝트와 인프라 전반에서 효율적으로 설정을 복제할 수 있습니다.
- Vagrant는 버전을 감지하고 올바른 플래그를 적용하여 기본 가상화 도구와의 상호 작용을 간소화합니다. 따라서 팀원들이 서로 다른 버전의 동일한 공급자를 사용하는 경우에도 일관된 동작을 보장합니다. Vagrant는 개발을 간소화하도록 설계된 동기화된 폴더, 자동 네트워킹, HTTP 터널링 등의 기능으로 워크플로우를 개선합니다.


Vagrant는 VirtualBox, VMware, Docker 등과 같은 공급자와 함께 작동하므로 인프라 및 애플리케이션 요구사항에 맞게 환경을 유연하게 조정할 수 있습니다.

![](/images/notion/906ce15b07bb4052.png)



# How? 어떻게 씀?

---

## Download vagrant

> 💡 NixOS 가 아닌 독자는 [공식문서](https://developer.hashicorp.com/vagrant/tutorials/get-started/install)를 따라가자.
> 💡 아래를 따라가도 안 된다면 Nix Wiki 를 살펴보자.

```nix
# Edit this configuration file to define what should be installed on
# your system.  Help is available in the configuration.nix(5) man page
# and in the NixOS manual (accessible by running ‘nixos-help’).

{ config, pkgs, ... }:

{
  # ,,,
  
  environment.systemPackages = with pkgs; [
		# ,,,
    vagrant
  ];

  # Enable common container config files in /etc/containers
  virtualisation = {
    containers.enable = true;
    virtualbox.host.enable = true;
    podman = {
      enable = true;
      # Create a `docker` alias for podman, to use it as a drop-in replacement
      dockerCompat = true;
      # Required for containers under podman-compose to be able to talk to each other.
      defaultNetwork.settings.dns_enabled = true;
    };
  };
  
  # ,,,
}

```

> ⚠️ Stderr: VBoxManage: error: VirtualBox can't operate in VMX root mode 에러

## Install VM box

vagrant 는 Vagrantfile 을 통해 VM 을 관리한다. 이 때 docker 와 비슷하게 이미 만들어진 VM 이미지, 즉 box 를 활용한다.
이 Vagrantfile 는 `vagrant init` 을 통해 생성할 수 있다.

```nix
mkdir learn-vagrant-get-started
cd learn-vagrant-get-started

vagrant init hashicorp-education/ubuntu-24-04 --box-version 0.1.0
```

## Start and access to VM

- vagrant up : vm box 를 통해 vm 시작
- vagrant ssh : 가동 중인 vm 에 접속

```nix
$ vagrant up
==> default: Box 'hashicorp-education/ubuntu-24-04' could not be found. Attempting to find and install...
    default: Box Provider: virtualbox
    default: Box Version: 0.1.0
==> default: Loading metadata for box 'hashicorp-education/ubuntu-24-04'
    default: URL: https://vagrantcloud.com/api/v2/vagrant/hashicorp-education/ubuntu-24-04
==> default: Adding box 'hashicorp-education/ubuntu-24-04' (v0.1.0) for provider: virtualbox (arm64)
    default: Downloading: https://vagrantcloud.com/hashicorp-education/boxes/ubuntu-24-04/versions/0.1.0/providers/virtualbox/arm64/vagrant.box
## ...
Bringing machine 'default' up with 'virtualbox' provider...
==> default: Importing base box hashicorp-education/ubuntu-24-04'...
==> default: Machine booted and ready!
```
```nix
$ vagrant ssh
Welcome to Ubuntu 24.04.1 LTS (GNU/Linux 6.8.0-51-generic aarch64)
```

## Stop/Kill VM

> ⚠️ 무조건 box remove 를 호출해야 다운로드한 박스까지 지운다!

- vagrant suspend : disk, ram 을 사용하고 있는 상태로 종료
- vagrant halt : ram 삭제 종료
- vagrant destroy : disk,ram 삭제 종료
- vagrant box remove ${} : 다운로드한 박스를 제거
- vagrant box list : 다운로드한 박스 리스트

```nix
$ vagrant suspend
==> default: Saving VM state and suspending execution...
$ vagrant halt
==> default: Attempting graceful shutdown of VM...
$ vagrant destroy
    default: Are you sure you want to destroy the 'default' VM? [y/N] y
==> default: Destroying VM and associated drives...
```

# Further work

---

## Multi VM

[https://judo0179.tistory.com/entry/%EB%82%98%EB%A7%8C-%EC%95%8C%EA%B3%A0%EC%8B%B6%EC%9D%80-Vagrant-%EC%82%AC%EC%9A%A9%EB%B2%95](https://judo0179.tistory.com/entry/%EB%82%98%EB%A7%8C-%EC%95%8C%EA%B3%A0%EC%8B%B6%EC%9D%80-Vagrant-%EC%82%AC%EC%9A%A9%EB%B2%95) 에 기입된대로 Vagrantfile 을 통해 여러 개의 VM 을 띄워 상호작용할 수 있다. 
지금은 구성하지 할 필요가 없어서 안 하고 있는데 Ansible 배울 때 활용하면 너무나도 좋을 것 같다.

## Boxing My VM Config

[https://www.44bits.io/ko/post/vagrant-tutorial#%EA%B0%80%EC%83%81-%EB%A8%B8%EC%8B%A0%EC%9D%84-%EB%8B%A4%EC%8B%9C-%EB%B0%95%EC%8A%A4%EB%A1%9C-%EB%A7%8C%EB%93%A4%EC%96%B4%EC%A3%BC%EB%8A%94-package](https://www.44bits.io/ko/post/vagrant-tutorial#%EA%B0%80%EC%83%81-%EB%A8%B8%EC%8B%A0%EC%9D%84-%EB%8B%A4%EC%8B%9C-%EB%B0%95%EC%8A%A4%EB%A1%9C-%EB%A7%8C%EB%93%A4%EC%96%B4%EC%A3%BC%EB%8A%94-package) 에서 볼 수 있듯이 내가 구성한 가상머신 환경을 박스로 만들어서 활용할 수 있다.
해당 파일을 깃에 올리면 끝!

# Reference

---

[https://developer.hashicorp.com/vagrant/tutorials/get-started](https://developer.hashicorp.com/vagrant/tutorials/get-started)
[https://developer.hashicorp.com/vagrant/tutorials/get-started/setup-project](https://developer.hashicorp.com/vagrant/tutorials/get-started/setup-project)
[https://judo0179.tistory.com/entry/%EB%82%98%EB%A7%8C-%EC%95%8C%EA%B3%A0%EC%8B%B6%EC%9D%80-Vagrant-%EC%82%AC%EC%9A%A9%EB%B2%95](https://judo0179.tistory.com/entry/%EB%82%98%EB%A7%8C-%EC%95%8C%EA%B3%A0%EC%8B%B6%EC%9D%80-Vagrant-%EC%82%AC%EC%9A%A9%EB%B2%95)
[https://www.44bits.io/ko/post/vagrant-tutorial#%EA%B0%80%EC%83%81-%EB%A8%B8%EC%8B%A0%EC%9D%84-%EB%8B%A4%EC%8B%9C-%EB%B0%95%EC%8A%A4%EB%A1%9C-%EB%A7%8C%EB%93%A4%EC%96%B4%EC%A3%BC%EB%8A%94-package](https://www.44bits.io/ko/post/vagrant-tutorial#%EA%B0%80%EC%83%81-%EB%A8%B8%EC%8B%A0%EC%9D%84-%EB%8B%A4%EC%8B%9C-%EB%B0%95%EC%8A%A4%EB%A1%9C-%EB%A7%8C%EB%93%A4%EC%96%B4%EC%A3%BC%EB%8A%94-package)
[https://rangken.github.io/blog/2015/vagrant-1/](https://rangken.github.io/blog/2015/vagrant-1/)
[https://developer.hashicorp.com/vagrant/docs/cli/box](https://developer.hashicorp.com/vagrant/docs/cli/box)
