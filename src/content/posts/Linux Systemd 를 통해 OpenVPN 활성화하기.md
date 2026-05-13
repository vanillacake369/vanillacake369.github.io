---
title: "Linux Systemd 를 통해 OpenVPN 활성화하기"
description: "사내에서는 vpn 을 사용하여 gitlab 에 연결하는데 이 때 .ovpn 파일을 통해 연결을 할 수 있다."
date: 2025-06-10
tags: [linux]
category: uncategorized
lang: ko
draft: false
---

# Why? 왜 배움?

---

사내에서는 vpn 을 사용하여 gitlab 에 연결하는데 이 때 .ovpn 파일을 통해 연결을 할 수 있다.
linx distro 에서는 흔히 open vpn 에 대해 systemd service 를 선언하여 사용한다.
필자가 사용하는 nixos 환경에서 이를 구축해보았다.

# What? 뭘 배움?

---

## How OpenVPN works

OpenVPN 에서는 내부적으로 TUN/TAP 인터페이스를 활용하여 클라이언트와 호스트 간의 연결을 수행한다.
그렇다면 TUN/TAP 인터페이스는 무엇일까?
간단하게 살펴넘어가보자.

### What is TUN/TAP ?

linux 에서는 virtual device 개념이 있는데 이는 hardware 와 연결되지 않았지만 파일선언, 즉 코드를 통해 실제로 하드웨어 장치가 수행하는 것처럼 할 수 있게 한다.
이 개념이 사용되는 것이 바로 가상 연결을 형성할 수 있는 커널 내의 네트워크 인터페이스인 TUN/TAP 이다.
TUN

- TAP




- OS 측에서의 TUN/TAP 
- 사용자 공간 프로그램에서의 TUN/TAP



### How TUN/TAP being used in OpenVPN

- OpenVPN은 실제 이더넷 인터페이스인 eth0으로 전송하기 전에 tun0과 같은 TUN 인터페이스에서 패킷을 수신하고 암호화
- OpenVPN 클라이언트가 eth0에서 패킷을 수신하고 tun0으로 보내기 전에 암호를 해독

![](/images/notion/ed75ff92b20196a9.png)



## Init Manually

**Install**
필자는 home-manager 를 활용하여 설치하였다.

```nix
{ pkgs, isWsl, ... }: {

  home.packages = with pkgs; [
    claude-code
  ] ++ lib.optionals (!isWsl) [
		,,,
    openvpn
    openvpn3
  ];
}

```

**Run**
필자의 사내에서는 ca certificat 와 private key password 를 요구한다.
ca certificat 는 .ovpn 파일 안에 있으며
private key password 는 각 개발자 별로 부여하게된다.
openvpn 은 private key password 에 대한 파일을 선언, askpass 명령어를 통해 자동으로 기입할 수 있게 한다.
따라서 .ovpn 파일을 아래와 같이 수정하였다.

> ⚠️ **주의점 : 절대경로**

```nix
client
proto tcp-client
remote ${호스트 IP}
dev tun
resolv-retry infinite
,,,,
<ca>
-----BEGIN CERTIFICATE-----
,,,
-----END CERTIFICATE-----
</ca>
<cert>
-----BEGIN CERTIFICATE-----
,,,
-----END CERTIFICATE-----
</cert>
<key>
-----BEGIN ENCRYPTED PRIVATE KEY-----
,,,
-----END ENCRYPTED PRIVATE KEY-----
</key>
<tls-crypt>
#
# 2048 bit OpenVPN static key
#
-----BEGIN OpenVPN Static key V1-----
,,,
-----END OpenVPN Static key V1-----
</tls-crypt>

# Pass private key pasword
askpass ${비밀번호파일 절대경로}/${파일명}
```


OpenVPN 은 내부적으로 TUN or TAP adaptor 를 생성한다고 하였다.
이 때 sudo 권한이 있어야만한다. 따라서 sudo 권한을 획득하여 openvpn 을 호출한다.
이후에 아래와 같이 호출하면 openvpn 연결에 성공하는 걸 볼 수 있다.

> ⚠️ **주의점 : Restart Session**

```nix
# sudo 권한을 주의해라.
~/my-nixos/openvpn main
❯ sudo openvpn ${ovpn파일}
,,,
2025-06-14 13:17:48 Initialization Sequence Completed
2025-06-14 13:17:48 Data Channel: cipher 'AES-128-GCM', peer-id: 0
2025-06-14 13:17:48 Timers: ping 10, ping-restart 120
```

## Declare Systemd

필자는 nix 를 활용하여 아래와 같이 systemd 를 선언하였다.

```nix
services = {
	openvpn.servers.hamaVPN = {
	  autoStart = false;
	  config = ''
	    config ${userHome}/my-nixos/openvpn/lonelynight1026.ovpn
	  '';
	  updateResolvConf = true;
	};
}
```

실제로 작성된 systemd.service 는 아래와 같다.

```nix
[Unit]
After=network.target
Description=OpenVPN instance ‘hamaVPN’

[Service]
Environment="LOCALE_ARCHIVE=/nix/store/wkvhpndx0lxadcbjj18w7k8rf0f6nii2-glibc-locales-2.40-66/lib/locale/locale-archive"
Environment="PATH=/nix/store/wxkbp7kwvpxvjh28rigmf6lfq64zlsyj-iptables-1.8.11/bin:/nix/store/bxznmkg59a4s2p559fmbizc2qcgjr3ny-iproute2-6.14.0/bin:/nix/store/skd9hg5cdz7jwpq1wp38fvzab9y8p0m6-net-tools-2.10/bin:/nix/store/87fck6hm17chxjq7badb11mq036zbyv9-coreutils-9.7/bin:/nix/store/7y59hzi3svdj1xjddjn2k7km96pifcyl-findutils-4.10.0/bin:/nix/store/gqmr3gixlddz3667ba1iyqck3c0dkpvd-gnugrep-3.11/bin:/nix/store/clbb2cvigynr235ab5zgi18dyavznlk2-gnused-4.9/bin:/nix/store/if9z6wmzmb07j63c02mvfkhn1mw1w5p4-systemd-257.5/bin:/nix/store/wxkbp7kwvpxvjh28rigmf6lfq64zlsyj-iptables-1.8.11/sbin:/nix/store/bxznmkg59a4s2p559fmbizc2qcgjr3ny-iproute2-6.14.0/sbin:/nix/store/skd9hg5cdz7jwpq1wp38fvzab9y8p0m6-net-tools-2.10/sbin:/nix/store/87fck6hm17chxjq7badb11mq036zbyv9-coreutils-9.7/sbin:/nix/store/7y59hzi3svdj1xjddjn2k7km96pifcyl-findutils-4.10.0/sbin:/nix/store/gqmr3gixlddz3667ba1iyqck3c0dkpvd-gnugrep-3.11/sbin:/nix/store/clbb2cvigynr235ab5zgi18dyavznlk2-gnused-4.9/sbin:/nix/store/if9z6wmzmb07j63c02mvfkhn1mw1w5p4-systemd-257.5/sbin"
Environment="TZDIR=/nix/store/qyihkwbhd70ynz380whj3bsxk1d2lyc4-tzdata-2025b/share/zoneinfo"
ExecStart=@/nix/store/86xyvi23pmh50y30jl3rygc9w3wfjjnj-openvpn-2.6.14/sbin/openvpn openvpn --suppress-timestamps --config /nix/store/syiisif3rwldm0pn2ln9wacga1xam54s-openvpn-config-hamaVPN
Restart=always
Type=notify
```

이제 systemctl start/stop 를 통해 활성화해주면 시스템 시작/종료 시에 openvpn 을 활성화할 수 있다.

```nix
~/my-nixos/openvpn main 22s
❯ sudo systemctl start openvpn-hamaVPN.service

~/my-nixos/openvpn main
❯ sudo systemctl status openvpn-hamaVPN.service
● openvpn-hamaVPN.service - OpenVPN instance ‘hamaVPN’
     Loaded: loaded (/etc/systemd/system/openvpn-hamaVPN.service; linked; preset: i>
     Active: active (running) since Sat 2025-06-14 13:13:51 KST; 4s ago
 Invocation: e2031b5a4ead4a0cbca9992e9a3c6f35
   Main PID: 123085 (openvpn)
     Status: "Initialization Sequence Completed"
```

# Reference

---

[https://liujunming.top/2022/07/31/Notes-about-TUN-TAP-Interface/](https://liujunming.top/2022/07/31/Notes-about-TUN-TAP-Interface/)
[https://serverfault.com/questions/647231/getting-cannot-ioctl-tunsetiff-tun-operation-not-permitted-when-trying-to-con](https://serverfault.com/questions/647231/getting-cannot-ioctl-tunsetiff-tun-operation-not-permitted-when-trying-to-con)
[https://www.baeldung.com/linux/tun-interface-purpose](https://www.baeldung.com/linux/tun-interface-purpose)
[https://developers.redhat.com/blog/2018/10/22/introduction-to-linux-interfaces-for-virtual-networking#](https://developers.redhat.com/blog/2018/10/22/introduction-to-linux-interfaces-for-virtual-networking#)
[https://en.wikipedia.org/wiki/Virtual_device](https://en.wikipedia.org/wiki/Virtual_device)
[https://nixos.wiki/wiki/OpenVPN](https://nixos.wiki/wiki/OpenVPN)
