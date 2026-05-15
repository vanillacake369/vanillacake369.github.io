---
description: "현대적인 홈랩 구성에서 NixOS로 VLAN을 선언적으로 설정하는 방법과 Router-on-a-Stick 구성을 다룬다."
date: 2026-01-15
tags: [homelab, nix]
lang: ko
draft: false
series: { id: "NixOS Ecosystem", order: 12 }
---

# Why? 🤔

현대적인 홈랩 구성에서 **NixOS**는 시스템의 상태를 코드로 관리(Declarative)할 수 있는 최고의 플랫폼이다.

- **보안:** OPNsense 방화벽을 가상화하여 모든 트래픽을 통제하고, VLAN을 통해 관리망(Management)과 서비스망(K8s)을 물리적으로 분리한 것과 같은 효과를 낸다.
- **효율:** 포트가 하나뿐인 하드웨어에서도 **"Router-on-a-Stick"** 구성을 통해 WAN과 다수의 가상 LAN을 논리적으로 격리하여 운영할 수 있다.

# What? 📋

[최종 Blueprint](https://www.notion.so/24619c3902908001851fec43ece63aef#2e019c3902908030aa94e5b1b983cdb3) 에 맞춰서 설정하고자 한다.

처리 순서는 다음과 같다.

1. 대상 서버 식별
2. NixOS 설정
3. 가상화 VM 활성화
4. 최종 점검

우선 개념부터 짚고 그 다음 대상 서버 식별 단계부터 하나씩 살펴보자.

## 가볍게 지나가는 VLAN 개념 🌐

- **bridges (vmbr):** 가상 스위치다. 물리 포트(`enp1s0`)를 `vmbr0`에 꽂으면 외부망 전용 스위치가 되고, 인터페이스 없이 만든 `vmbr1`은 내부 전용 가상 스위치가 된다.[^1]
- **vlans:** 하나의 선 위로 여러 네트워크 패킷이 흐를 때, 꼬리표(Tag ID)를 붙여 서로 섞이지 않게 분리하는 기술이다.[^2]
- **interfaces:** NixOS 호스트(물리 서버 자체)가 각 네트워크 대역에서 가질 주소표다.
- **defaultGateway:** 서버가 모르는 외부 주소(예: google.com)를 찾을 때 나가는 "출구" 주소다.
- **nameserver:** 도메인(google.com)을 IP(142.250...)로 바꿔주는 전화번호부 서비스다.

## 대상 서버 식별 🔎

가장 먼저 `ip addr` 명령어를 통해 물리 NIC의 이름을 확인한다. 이를 통해 NIC 이름 에 따른 VLAN 매핑을 할 수 있다.

아래와 같이 현재 서버 상에서는 enp1s0 이더넷 포트 하나만 인식되고 있다. 따라서 이 포트가 외부(WAN)와 내부(VLAN Trunk) 트래픽을 모두 처리하는 통로가 된다.

```nix
@homelab
❯ ip addr
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host noprefixroute
       valid_lft forever preferred_lft forever
2: enp1s0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    link/ether xxxxxxxxxxxxx brd ff:ff:ff:ff:ff:ff
    altname enx7070fc0735cb
    inet xxxxxxxxxxxxx brd xxxxxxxxxxxxx scope global dynamic noprefixroute enp1s0
       valid_lft 20455sec preferred_lft 20455sec
    inet6 fe80::b340:603e:8996:58bc/64 scope link noprefixroute
       valid_lft forever preferred_lft forever
3: wlp2s0: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc noqueue state DOWN group default qlen 1000
    link/ether xxxxxxxxxxxxx brd ff:ff:ff:ff:ff:ff permaddr a8:59:5f:fa:c9:68
    altname wlxa8595ffac968
```

> 💡 만약 서버 확장 혹은 물리포트를 늘리고 싶다면 Managed Switch 장치를 고려해봐야한다.

## DHCP를 끄는 이유 🔒

네트워크 설정 시 DHCP 를 끄고 정적 IP 를 활용하고자 한다. 서버 환경에서 `useDHCP = false`를 권장하는 이유는 **안정성** 때문이다.[^3]

1. **고정성:** 부팅 시마다 IP가 바뀌면 내부 서비스(K8s 등)가 깨진다.
2. **속도:** IP를 할당받기 위해 기다리는 시간 없이 즉시 네트워크가 활성화된다.
3. **명확성:** `configuration.nix` 파일 자체가 네트워크 설계도가 되어 관리가 쉬워진다.

## NixOS 네트워크 설정 (Blueprint) 💻

```nix
# Network configuration for homelab server
{homelabConfig, ...}: {
  networking = {
    # 호스트명, 시스템 기본 네트워크 서비스 지정
    hostName = homelabConfig.hostname;
    networkmanager.enable = false;
    useDHCP = false;

    firewall = {
      enable = true;
      allowedTCPPorts = [
        22
      ];
    };

    # 브리지 생성 (vmbr0: WAN용, vmbr1: LAN/VLAN용)
    # vmbr0 : WAN 인터페이스
    # vmbr1 : VLAN 스위치 역할
    # 물리 포트 없이 가상 스위치로만 생성
    bridges = {
      "vmbr0" = {interfaces = ["enp1s0"];};
      "vmbr1" = {interfaces = [];};
    };

    # VLAN 설정 (vmbr1 기반으로 가상 격리)
    vlans = {
      "vlan10" = {
        id = 10;
        interface = "vmbr1";
      };
      "vlan20" = {
        id = 20;
        interface = "vmbr1";
      };
    };

    # IP 주소 할당
    interfaces = {
      # WAN: ISP에서 예약한 정적 IP 설정
      "vmbr0".ipv4.addresses = [
        {
          address = "192.168.45.82";
          prefixLength = 24;
        }
      ];

      # 관리용(VLAN 10) 호스트 IP
      "vlan10".ipv4.addresses = [
        {
          address = "10.0.10.5";
          prefixLength = 24;
        }
      ];

      # 서비스용(VLAN 20) 호스트 IP
      "vlan20".ipv4.addresses = [
        {
          address = "10.0.20.5";
          prefixLength = 24;
        }
      ];
    };

    # 게이트웨이 설정 (ISP 공유기/모뎀 주소)
    defaultGateway = "192.168.45.1";
    nameservers = ["8.8.8.8" "1.1.1.1"];
  };

  services.openssh = {
    enable = true;
    settings = {
      PermitRootLogin = "prohibit-password";
      PasswordAuthentication = false;
    };
  };
}

```

## 가상화 및 OPNsense 설정 🛠

- **가상화:** `microvm.nix`나 `libvirtd`를 사용하여 OPNsense VM을 생성한다.[^4]
- **인터페이스 연결:**
- **OPNsense 내부:** 웹 GUI(10.0.10.1 등)에 접속하여 각 VLAN 대역의 DHCP 서버를 켜고 방화벽 규칙(VLAN 10 -> 20 접근 허용 등)을 설정한다.

## 최종 점검 가이드라인 ✅

설정 적용 후 다음 명령어들로 계층 구조를 검증한다.

1. **브리지 확인:** `bridge link show` -> `enp1s0`이 `vmbr0`에 속했는지 확인.
2. **VLAN 태깅 확인:** `ip -d link show vlan10` -> `vlan protocol 802.1Q id 10` 확인.
3. **통신 테스트:**

```shell
~/dev/tonys-homelab main +3                                                        58m 2s
❯ ssh homelab
Last login: Sat Jan 17 00:01:36 2026 from 192.168.45.126
/home/limjihoon/.zshrc:.:97: no such file or directory: /home/limjihoon/.nix-profile/etc/p
~                                                                       limjihoon@homelab
❯ clear

~                                                                       limjihoon@homelab
❯ ip link show
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN mode DEFAULT group def
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
2: enp1s0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel master vmbr0 state UP
    link/ether 70:70:fc:07:35:cb brd ff:ff:ff:ff:ff:ff
    altname enx7070fc0735cb
3: wlp2s0: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc noqueue state DOWN mode DEFA
    link/ether a8:59:5f:fa:c9:68 brd ff:ff:ff:ff:ff:ff
    altname wlxa8595ffac968
4: vmbr1: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UNKNOWN mode DEFA
    link/ether 52:14:af:16:8f:e6 brd ff:ff:ff:ff:ff:ff
5: vmbr0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP mode DEFAULT g
    link/ether 70:70:fc:07:35:cb brd ff:ff:ff:ff:ff:ff
6: vlan20@vmbr1: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP mode DE
    link/ether 52:14:af:16:8f:e6 brd ff:ff:ff:ff:ff:ff
7: vlan10@vmbr1: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP mode DE
    link/ether 52:14:af:16:8f:e6 brd ff:ff:ff:ff:ff:ff

~                                                                       limjihoon@homelab
❯ bridge link
2: enp1s0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 master vmbr0 state forwarding priori

~                                                                       limjihoon@homelab
❯ bridge link show
2: enp1s0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 master vmbr0 state forwarding priori

~                                                                       limjihoon@homelab
❯ ip addr show vmbr0
5: vmbr0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default
    link/ether 70:70:fc:07:35:cb brd ff:ff:ff:ff:ff:ff
    inet 192.168.45.82/24 scope global vmbr0
       valid_lft forever preferred_lft forever
    inet6 fe80::7270:fcff:fe07:35cb/64 scope link proto kernel_ll
       valid_lft forever preferred_lft forever

~                                                                       limjihoon@homelab
❯ ip addr show vmbr1
4: vmbr1: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UNKNOWN group def
    link/ether 52:14:af:16:8f:e6 brd ff:ff:ff:ff:ff:ff
    inet6 fe80::5014:afff:fe16:8fe6/64 scope link proto kernel_ll
       valid_lft forever preferred_lft forever

~                                                                       limjihoon@homelab
❯ ip addr show vlan10
7: vlan10@vmbr1: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group d
    link/ether 52:14:af:16:8f:e6 brd ff:ff:ff:ff:ff:ff
    inet 10.0.10.5/24 scope global vlan10
       valid_lft forever preferred_lft forever
    inet6 fe80::5014:afff:fe16:8fe6/64 scope link proto kernel_ll
       valid_lft forever preferred_lft forever

~                                                                       limjihoon@homelab
❯ ip addr show vlan20
6: vlan20@vmbr1: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group d
    link/ether 52:14:af:16:8f:e6 brd ff:ff:ff:ff:ff:ff
    inet 10.0.20.5/24 scope global vlan20
       valid_lft forever preferred_lft forever
    inet6 fe80::5014:afff:fe16:8fe6/64 scope link proto kernel_ll
       valid_lft forever preferred_lft forever

~                                                                       limjihoon@homelab
❯ ip route | grep default
default via 192.168.45.1 dev vmbr0 proto static
default via 192.168.45.1 dev enp1s0 proto dhcp src 192.168.45.82 metric 100

~                                                                       limjihoon@homelab
❯ ping -c 3 192.168.45.1
PING 192.168.45.1 (192.168.45.1) 56(84) bytes of data.
64 bytes from 192.168.45.1: icmp_seq=1 ttl=64 time=0.430 ms
64 bytes from 192.168.45.1: icmp_seq=2 ttl=64 time=1.64 ms
64 bytes from 192.168.45.1: icmp_seq=3 ttl=64 time=1.63 ms

--- 192.168.45.1 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2033ms
rtt min/avg/max/mdev = 0.430/1.232/1.637/0.567 ms

~                                                                       limjihoon@homelab
❯ ping -c 3 google.com
PING google.com (142.250.76.142) 56(84) bytes of data.
64 bytes from kix07s06-in-f14.1e100.net (142.250.76.142): icmp_seq=1 ttl=117 time=36.7 ms
64 bytes from kix07s06-in-f14.1e100.net (142.250.76.142): icmp_seq=2 ttl=117 time=38.4 ms
64 bytes from kix07s06-in-f14.1e100.net (142.250.76.142): icmp_seq=3 ttl=117 time=36.5 ms

--- google.com ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2005ms
rtt min/avg/max/mdev = 36.525/37.201/38.354/0.819 ms

~                                                                       limjihoon@homelab
❯ ping -c 3 10.0.10.5
PING 10.0.10.5 (10.0.10.5) 56(84) bytes of data.
64 bytes from 10.0.10.5: icmp_seq=1 ttl=64 time=0.024 ms
64 bytes from 10.0.10.5: icmp_seq=2 ttl=64 time=0.088 ms
64 bytes from 10.0.10.5: icmp_seq=3 ttl=64 time=0.117 ms

--- 10.0.10.5 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2065ms
rtt min/avg/max/mdev = 0.024/0.076/0.117/0.038 ms

~                                                                       limjihoon@homelab
❯ ip -d link show vlan10
7: vlan10@vmbr1: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP mode DEFAULT group default qlen 1000
    link/ether 52:14:af:16:8f:e6 brd ff:ff:ff:ff:ff:ff promiscuity 0 allmulti 0 minmtu 0 maxmtu 65535
    vlan protocol 802.1Q id 10 <REORDER_HDR> addrgenmode eui64 numtxqueues 1 numrxqueues 1 gso_max_size 65536 gso_max_segs 65535 tso_max_size 65536 tso_max_segs 65535 gro_max_size 65536 gso_ipv4_max_size 65536 gro_ipv4_max_size 65536

~                                                                       limjihoon@homelab
❯
```

# How? 🛠

?

[^1]: NixOS 공식 위키 — Networking, VLANs 항목: <https://nixos.wiki/wiki/Networking#:~:text=duid%0A%27%27%3B-,VLANs,-Refer%20to%20networking>
[^2]: IEEE 802.1Q VLAN 표준: <https://en.wikipedia.org/wiki/IEEE_802.1Q>
[^3]: NixOS 공식 매뉴얼 — networking.useDHCP 옵션: <https://nixos.org/manual/nixos/stable/options#opt-networking.useDHCP>
[^4]: microvm.nix 프로젝트: <https://github.com/astro/microvm.nix>
[^5]: OPNsense 공식 문서 — VLAN 설정 가이드: <https://docs.opnsense.org/manual/other-interfaces.html#vlan>
