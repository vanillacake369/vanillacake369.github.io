---
title: "LFCS"
description: ""
date: 2025-12-29
tags: [Linux]
category: uncategorized
lang: ko
draft: false
---

# Why? 왜 배움?

---

홈랩을 운영하면서 리눅스 기초에 대한 공부가 부족하다고 느꼈고
특히 앞으로 일하는데 있어 리눅스 기초를 모르면 아키텍쳐 설계에 한계가 있다고 판단하여
LFCS 를 준비하게 되었다.

<details>
<summary>RHCSA vs LFCS</summary>

RHCSA 가 더 깊은 내용을 다루고 실무적으로 도움이 되었다는 글이 많은데
응시료가 워낙 비싸서 이건 취업 이후 자격증 지원금이 있다면 그걸 활용할 생각이다,,,
확실히 더 다양한 걸 다루기는 한다,,

- SELinux 관리: 컨텍스트 확인/변경(setsebool, restorecon, semanage), 정책 커스텀, 문제 트러블슈팅. LFCS는 기본 보안만, SELinux는 옵션.
- LVM(Logical Volume Manager) 고급: LV 생성/확장/스냅샷/리사이즈, VG/LV 병합. LFCS는 기본 파티셔닝만.
- systemd 심화: 커스텀 서비스/타이머 유닛 작성, 타겟/슬라이스 관리, 부트 프로세스 최적화. LFCS는 기본 서비스 컨트롤.
- firewalld: 존(zone) 관리, rich rules, 서비스/포트 영구 설정. LFCS는 iptables/ufw 기본.
- RHEL 패키징/서브스크립션: dnf 모듈/라이프사이클, AppStream, subscription-manager. LFCS는 범용 패키지 매니저
</details>
<details>
<summary>LFCS 후기</summary>

[https://gasbugs.tistory.com/546](https://gasbugs.tistory.com/546)
[https://velog.io/@mag000225/LFCS-%ED%95%A9%EA%B2%A9-%ED%9B%84%EA%B8%B0](https://velog.io/@mag000225/LFCS-%ED%95%A9%EA%B2%A9-%ED%9B%84%EA%B8%B0)
[https://www.linkedin.com/posts/yongsookim200_lfcs-%EC%9E%90%EA%B2%A9%EC%A6%9D-%EC%B7%A8%EB%93%9D-%EB%B0%8F-%EA%B3%B5%EB%B6%80%EB%B0%A9%EB%B2%95linux-foundation-certified-activity-7103630548123734017-e5Jc/?originalSubdomain=kr](https://www.linkedin.com/posts/yongsookim200_lfcs-%EC%9E%90%EA%B2%A9%EC%A6%9D-%EC%B7%A8%EB%93%9D-%EB%B0%8F-%EA%B3%B5%EB%B6%80%EB%B0%A9%EB%B2%95linux-foundation-certified-activity-7103630548123734017-e5Jc/?originalSubdomain=kr)
[https://status200ok.tistory.com/126](https://status200ok.tistory.com/126)
[https://status200ok.tistory.com/127](https://status200ok.tistory.com/127)
[https://lhoris.tistory.com/151](https://lhoris.tistory.com/151)
[https://www.reddit.com/r/linuxadmin/comments/1k0n0w6/lfcs_or_rhcsa_for_applying_to_sysadmin_jobs/](https://www.reddit.com/r/linuxadmin/comments/1k0n0w6/lfcs_or_rhcsa_for_applying_to_sysadmin_jobs/)
</details>

# What? 뭘 배움?

---

[https://www.udemy.com/course/linux-foundation-certified-systems-administrator-lfcs/](https://www.udemy.com/course/linux-foundation-certified-systems-administrator-lfcs/)

## 속독 1회독


# 02. Essential Commands ⌨️

## **Lab: Logging in and System Documentation **📃

### Change hostname in linux

1. hostnamectl
2. /etc/hosts 수정 

### man page indexing

man page 는 단순 텍스트 파일이 아니라 **검색 가능한 DB 형태로 인덱싱**되어 있다
따라서 명령어가 작동하지 않는다면 `sudo mandb` 를 실행하여 indexing refresh 하자

### hidden file 보기

ls -a 하면 숨긴 파일을 포함한 전체 파일을 확인
ls -A 하면 숨긴 파일만 볼 수 있다.
또한 -l 과 조합하면 리스트 형태로 볼 수 있다.

```bash
~                                                                                                                                                                                         limjihoon@homelab
❯ ls -a
.                   .cache            k8s-worker1.sock  .nix-profile  .ssh             .zcompdump                    .zcompdump-homelab-5.9      .zshenv       .zshrc.backup
..                  .config           .local            .p10k.zsh     supervisord.log  .zcompdump-homelab-1-5.9      .zcompdump-homelab-5.9.zwc  .zsh_history
amd_vbios_dump.rom  ip_discovery.bin  .nix-defexpr      pp_table.bin  tonys-homelab    .zcompdump-homelab-1-5.9.zwc  .zsh                        .zshrc

~                                                                                                                                                                                         limjihoon@homelab
❯ ls -A
amd_vbios_dump.rom  ip_discovery.bin  .nix-defexpr  pp_table.bin     tonys-homelab             .zcompdump-homelab-1-5.9.zwc  .zsh          .zshrc
.cache              k8s-worker1.sock  .nix-profile  .ssh             .zcompdump                .zcompdump-homelab-5.9        .zshenv       .zshrc.backup
.config             .local            .p10k.zsh     supervisord.log  .zcompdump-homelab-1-5.9  .zcompdump-homelab-5.9.zwc    .zsh_history

```

### apropos 명령어

man page DB 를 **키워드로 전문 검색**하는 명령어이다
"이런 기능을 하는 명령어가 뭐지?" 할 때 쓴다

```bash
apropos <keyword>

# 예시
apropos hostname
# hostnamectl (1) - Control the system hostname
# hostname (1)    - show or set the system's host name
# hostname (5)    - Local hostname configuration file

apropos network interface
apropos "disk usage"
```

## **Lab: Files, Directories, Hard and Soft Links **🖇️

### Soft Link / Hard Link

```bash
ln -s /opt/hlink /home/bob/hlink   # soft link (symlink)
ln    /opt/hlink /home/bob/hlink   # hard link
```

## **Lab: File Permissions, Search for Files **🔍

### Sub Shell `( )` & Escape `\` 

Shell 에서 ( ) 은 sub shell 을 의미한다
( ) 안에 들어가는 명령어는 **현재 셸의 자식 프로세스(subshell)** 에서 실행된다
따라서 아래

- 변수값
- 현재 작업 디렉토리
- 환경변수

반면, Shell 이 공유하는 값들 — 커널관리 리소스 — 은 영향을 받는다

- 파일시스템
- 네트워크
- 프로세스 테이블
- 시그널
- IPC 자원

```bash
(cd /tmp && ls)
# subshell 에서 cd 실행
# 현재 셸의 위치는 그대로 유지됨
```


\ 은 특수문자를 일반문자로 취급하는 Escape 이다
즉,`(` 은 그대로 사용하면 Sub Shell 로 처리되지만 `\(` 은 일반문자 `(` 로 처리하게끔 할 수 있다.

```bash
cat ./temp/우리집\(좋아)\.md # ./temp/우리집(좋아).md
```

### Command Substitution `$( )`

현재 쉘의 자식 쉘을 생성하여 $( ) 안에 들어간 명령어를 실행 이후 부모로 반환

```bash
mkdir backup_$(date +%Y%m%d) # backup_20260324 디렉토리 생성
echo "오늘 날짜: $(date)" # 오늘 날짜: Tue Mar 24 12:00:00 KST 2026
```

### find 명령어

`find [path...] [options] [expression]`  형태로 사용되며 아래와 같이 사용할 수 있다.

```bash
# /var/log 산하에 있는 모든 파일과 경로들에 대해
# *.log 정규식에 맞는 것을 찾음
find /var/log -name "*.log"

# /home/bob 산하 모든 파일과 경로들에 대해
# 213k 크기이며 402 권한에 대해
# OR 조건을 통해 처리
find /home/bob -size 213k -o -perm 402 -type f
```
```bash
find ${path} -mmin +5 # last modified less than, more than
find ${path} -cmin +5 # status changed less than, more than
```

<details>
<summary>특정 권한의 파일들을 찾아서 .txt 에 저장</summary>

Find `files/directories` under the `/var/log/` directory that the `group` can `write` to, but `others cannot read or write` to it. Save the list of the files/directories (with complete parent path) in the `/home/bob/data.txt` file.  You can use the redirection to save your command's output in a file i.e `[your-command] > /home/bob/data.txt`
To make this easier to understand, the logic of the command can be broken down like this:  -> Permissions for the `group` have to be at least `w`. If there's also an extra `r or x` in there, it will still match.
-> Permissions for `others` have `not to be r or w`. That means, if any of these two permissions, `r or w`, match for others, the result has to be excluded.

```bash
# 정답
# 팁은 man find 에서 permission 으로 찾아볼 것
find /var/log -perm -g=w ! -perm /o=rw > /home/bob/data.txt
```
</details>
<details>
<summary>특정 파일을 찾아 다른 디렉토리로 복사</summary>

7.
Find the `cats.txt` file under `bob's` home directory and copy it into the `/opt` directory.
풀이

```bash
# xargs 사용
# 1) 인자 넘기되 cp /opt {arg} 로 처리되므로 cp -t 사용 
# 2) -I 로 placeholder 지정
find /home/bob -name cats.txt -type f -print | xargs cp -t /opt
find /home/bob -name cats.txt -type f -print | xargs -I {} cp {} /opt

혹은

cp $(find /home/bob -name cats.txt) /opt
```
</details>



### chmod 명령어

리눅스 파일 권한은 **누구에게** / **무슨 권한을** 으로 구성

```bash
ls -l /home/bob/file.txt
# -rwxr-xr--
#  ↑↑↑↑↑↑↑↑↑
#  │└──┘└──┘└──┘
#  │ owner group others
```

| 권한 | 기호 | 의미 |
| --- | --- | --- |
| read | `r` | 파일 읽기 / 디렉토리 목록 조회 |
| write | `w` | 파일 수정 / 디렉토리 파일 생성·삭제 |
| execute | `x` | 파일 실행 / 디렉토리 진입(`cd`) |


권한 부여 방법은 다음과 같다

- 기호 방식
- 8진수 방식

## **Lab - File Content, Regular Expressions **✍️

### cut 명령어

각 줄에서 특정 부분만 잘라내는 명령어

```bash
cut -d '구분자' -f 필드번호 file
```
```bash
# /etc/passwd 예시
cat /etc/passwd
# root:x:0:0:root:/root:/bin/bash
# bob:x:1000:1000::/home/bob:/bin/bash

cut -d ':' -f 1 /etc/passwd     # 첫 번째 필드 (username)
# root
# bob
```

### sed 명령어

Stream EDitor 로 파일이나 입력을 줄단위로 읽어서 값을 치환하는 명령어다
주로 regex 를 사용하여 변경한다

```bash
sed 's/cat/dog/g' file.txt          # 화면에만 출력, 파일 유지
sed -i 's/cat/dog/g' file.txt       # 파일 직접 수정
```
```bash
# 각 줄의 첫 번째 매칭만 치환
sed 's/cat/dog/' -i file.txt

# 각 줄의 모든 매칭 치환 (global)
# ⭐ 가장 자주 쓰임!! ⭐
sed 's/cat/dog/g' -i file.txt

# 대소문자 무시
sed 's/cat/dog/i' -i file.txt

# 전체 + 대소문자 무시
sed 's/cat/dog/gi' -i file.txt
```

또한 구분자를 / 로 사용하곤 하는데, 이를 바꿀 수 있다
특수문자를 다룰 때 유용하게 사용할 수 있다.

```bash
sed 's/a/b/'      # 기본 구분자 /
sed 's|a|b|'      # 구분자를 | 로 변경 가능
sed 's@a@b@'      # 구분자를 @ 로 변경 가능

sed -i 's|video//other|video//group|g' ./data.txt # video/other -> video/group
```

### grep 명령어

딴 건 없고 자주 나오는 정규식은 외워야 할 것 같다

```bash
# 특정 문자로 시작하는 줄
grep '^Section' file

# 대소문자 무시
grep -i '^section' file

# 정확히 n자리 숫자
grep -E '[0-9]{5}' file

# 특정 숫자로 시작하는 숫자
grep -oE '\b2[0-9]*' file

# 빈 줄
grep '^$' file

# 빈 줄 제외
grep -v '^$' file
```



## **Lab: Archive, Back Up, Compress, IO Redirection 💽**

### tar 명령어

> The `tar` command creates tar files by converting a group of files into an archive. It also extracts tar archives, displays a list of the files included in the archive, adds files to an existing archive, and performs various other operations.

[https://linuxize.com/post/how-to-create-and-extract-archives-using-the-tar-command-in-linux/](https://linuxize.com/post/how-to-create-and-extract-archives-using-the-tar-command-in-linux/)

1. tar 파일 생성
2. gz archive 압축 파일 생성
3. tar 파일 해제
4. tar 파일해제 없이 압축된 내용 보기

### gzip 명령어

압축 후 확장자 `.gz` 생성, 원본 파일은 삭제된다.

```bash
gzip file.txt              # file.txt -> file.txt.gz (원본 삭제)
gzip -d file.txt.gz        # 압축 해제 (gunzip과 동일)

# ⭐ 원본 유지하며 압축 (리다이렉션 사용)
gzip -c file.txt > file.txt.gz
```

### xz / unxz 명령어

`gzip`보다 압축률이 훨씬 높지만 속도가 느리다. 최근 리눅스 배포판에서 많이 사용한다.
압축 후 확장자 `.xz` 생성, **원본 파일은 삭제된다.**

```bash
xz file.txt                # file.txt -> file.txt.xz (원본 삭제)
unxz file.txt.xz           # 압축 해제 (xz -d와 동일)

# ⭐ 원본 유지하며 해제 (Keep)
unxz -k file.txt.xz        # 해제 후에도 .xz 파일 유지
```

### Input, Output 에 대한 파이프라이닝

리눅스에서 모든 명령어는 실행될 때 3개의 가상 통로를 가집니다.

- **0 (stdin):** 입력 (키보드 등)
- **1 (stdout):** **정상 출력** (성공했을 때 나오는 메시지)
- **2 (stderr):** **에러 출력** (실패, 경고, 권한 거부 등)

이런 가상 통로에 대해서 다음과 같은 파이프라이닝을 처리할 수 있다.

1. 리다이렉션 기호 (`>`, `2>`, `&>`)
2. 특수 장치와 기호 (`/dev/null`, `|`)

<details>
<summary>스크립트 실행결과에 대해 정상결과와 에러결과를 각각의 파일로 저장 </summary>

Execute the `/home/bob/script.sh` script and save all `normal output` (except `errors/warnings`) in the `/home/bob/output_stdout.txt` file.
Validate "/home/bob/output_stdout.txt" file.

```bash
/home/bob/script.sh > /home/bob/output_stdout.txt 2> /dev/null
```
</details>
<details>
<summary>스크립트 실행결과에 대해 정상결과, 에러결과 모두를 하나의 파일로 저장 </summary>

Execute the `/home/bob/script.sh` script and save all command output (both `errors/warnings` and `normal output`) in the `/home/bob/output.txt` file.
Validate the "/home/bob/output.txt" file.

```bash
/home/bob/script.sh &> /home/bob/output.txt
```
</details>

### sort / uniq 명령어

```bash
sort file.txt              # 기본 알파벳 순 정렬
sort -r file.txt           # 역순(Reverse) 정렬
sort -n file.txt           # 숫자(Numeric) 크기순 정렬 (2가 10보다 앞에 옴)
sort -f file.txt           # 대소문자 무시 (Fold case)

# ⭐ 정렬과 중복 제거를 동시에
sort -u file.txt           # Unique한 줄만 남기고 정렬
```
```bash
sort file.txt | uniq       # 정렬 후 중복 제거 (기본)
sort file.txt | uniq -i    # 대소문자 무시하고 중복 제거
sort file.txt | uniq -c    # 각 줄이 몇 번 중복되었는지 횟수 표시
sort file.txt | uniq -u    # 중복되지 않은 "유일한 줄"만 출력
```



## **SSL Certificates 🔒 __ ⚠️정리가 필요함 ⚠️ __ **

> 💡

### openssl 명령어

openssl 은 ,,,, 하는 명령어이다.
사용법은 다음과 같다.

1. 개인키 생성
2. 인증 요청서(CSR : Certificate Signing Request) 생성
3. 자가 서명 인증서

```mermaid
graph LR
    A[<b>1. 개인키</b><br/>Private Key] -->|신청서 작성| B[<b>2. CSR</b><br/>신청서]
    B -->|기관 승인/서명| C[<b>3. 인증서</b><br/>Certificate]
    
    subgraph "생성 명령어"
    A --- cmd1["genrsa"]
    B --- cmd2["req -new"]
    C --- cmd3["x509 / req -x509"]
    end
```
```mermaid
sequenceDiagram
    participant B as 브라우저 (사용자)
    participant S as 서버 (Bob)

    Note over B,S: [1단계: 신원 확인]
    S->>B: 나 이 인증서(CRT) 가진 서버야! (공개키 포함)
    B->>B: CA 목록 뒤져서 진짜인지 확인

    Note over B,S: [2단계: 비밀번호 정하기]
    B->>S: (공개키로 암호화된) 우리끼리 쓸 세션키 보낼게!
    S->>S: 내 개인키(Key)로 복구해서 세션키 획득

    Note over B,S: [3단계: 실제 데이터 암호화]
    B->S: 이제 이 세션키로 데이터 주고받자! (고속 암호화)
```

> 






# 03. Operations Deployment

![](/images/notion/de8426ee67122a7a.png)

x.y.z.A/prefix
x,y,z,A 는 사실 이진수인데 십진수로 표현하며
뒤에 /prefix 를 통해 network prefix 명시하여 network 의 주소를 지정
이후 나머지 값을 통해 세부 디바이스 주소를 지정
위 예시는 32bits, 즉 IPv4 임
IPv6 부터는 128 bits 를 사용하기 시작함
또한 IPv6 부터는 decimal 이 아닌 hexadecimal 을 사용하기 시작함
또한 delimiter 구분자를 . 이 아닌 : 으로 구분함

![](/images/notion/059d0905101574bc.png)

> 💡 목표

## 03-1. 네트워크 동작 원리 (L2 → L3 → DNS)

리눅스에서 네트워크는 “명령어 묶음”이 아니라 “커널이 패킷을 어디로 보낼지 결정하는 규칙”이다.
패킷, 즉 데이터는 물리적 NIC 를 거쳐 L2, L3, L4 순으로 지나 Socket 통신을 통해 전달된다.
이에 따라 각각의 섹션인 L2 - interface, L3 - ip table, L4 - ip route 를 순서대로 살펴본다.

```mermaid
flowchart LR
  classDef userspace fill:#E3F2FD,stroke:#1565C0,color:#0D47A1;
  classDef kernel fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20;
  classDef wire fill:#FFF3E0,stroke:#EF6C00,color:#E65100;

  subgraph Userspace["Userspace (L7)"]
    App[Application]
  end

  subgraph Kernel["Kernel networking stack"]
    Sock[Socket]
    subgraph L4Layer["L4 (TCP/UDP)"]
      L4[TCP/UDP]
    end
    subgraph L3Layer["L3 (IP + Routing)"]
      L3[IP + Routing Table]
    end
    subgraph L2Layer["L2 (Link)"]
      L2[Interface :: eth0]
      Drv[Driver]
    end
  end

  subgraph Wire["Hardware / Wire"]
    NIC[Physical NIC]
  end

  App -->|syscall| Sock --> L4 --> L3 --> L2 --> Drv --> NIC

  class App userspace
  class Sock,L4,L3,L2,Drv kernel
  class NIC wire
```

### L2: 인터페이스(`ip link`)는 “전선”이다

IP 설정부터 만지기 전에, 링크가 살아있는지(UP)부터 확인해야 한다.

- 인터페이스가 `DOWN`이면 L3는 의미가 없다.
- MTU mismatch, link flap, 가상 인터페이스(veth/bridge/bond) 같은 “L2 문제”가 L3 문제처럼 보이는 경우가 많다.

```bash
ip -c link
ip -c link show dev ${dev_name}
```

**조치(휘발성)**

```bash
sudo ip link set dev ${dev_name} up
sudo ip link set dev ${dev_name} down
```

### L3: IP/CIDR(`ip addr`)은 “내가 속한 네트워크 범위”를 정의한다

`10.0.0.9/24`는 “내 주소는 `10.0.0.9`이고, 같은 L2로 직접 갈 수 있는 네트워크가 `10.0.0.0/24`다”라는 뜻이다.

- `/24`면 호스트 비트는 8비트 → 총 256개 주소 공간
- 일반적으로 `.0`(network), `.255`(broadcast)는 호스트에 못 씀 → **254개 사용 가능**
- 인터페이스는 IP를 여러 개 가질 수 있다(secondary address)

```mermaid
flowchart LR
  Me["Host 10.0.0.9/24"] -->|same subnet| Peer["10.0.0.20/24 (ARP/ND)"]
  Me -->|not in subnet| GW["Default Gateway"]
```

**진단**

```bash
ip -c addr
ip -c addr show dev ${dev_name}
```

**조치(휘발성)**

```bash
sudo ip addr add ${ipv4_cidr} dev ${dev_name}   # e.g. 10.0.0.9/24
sudo ip addr del ${ipv4_cidr} dev ${dev_name}
```

> 💡 `ip a` / `ip addr` / `ip address`는 같은 계열(shorthand 포함)이다.

### L4 : 라우팅(`ip route`)은 “패킷의 출구(egress)”를 정한다

커널은 패킷이 나가야 할 때, 라우팅 테이블에서 **Longest Prefix Match**로 가장 구체적인 경로를 고른다.

- connected route: `ip addr add 10.0.0.9/24 dev eth0` 같은 설정만으로도 커널이 자동 생성하는 경로가 있다
- default route: 어디에도 매칭되지 않으면 “마지막 비상구”로 `default via ...`를 탄다
- `ip route get X`는 실무에서 가장 강력한 “한 방 확인”이다(출구 인터페이스와 next-hop을 즉시 보여줌)

**진단**

```bash
ip route
ip route get 8.8.8.8
```

**조치(휘발성)**

```bash
sudo ip route add default via ${gw_ipv4}
sudo ip route add 192.168.0.0/24 via ${next_hop_ipv4} dev ${dev_name}
sudo ip route del 192.168.0.0/24
```

### DNS 해석은 “DNS 서버”가 아니라 “resolver 체인”을 탄다

애플리케이션은 보통 직접 DNS 서버에 질의하지 않고, OS의 resolver 체인을 탄다.

- `/etc/hosts`는 가장 강력한 로컬 오버라이드다
- Ubuntu 같은 환경에서는 `systemd-resolved`가 “로컬 stub + 캐시 + 업스트림 전달” 역할을 하는 경우가 많다
- 일반적으로 호스트는 **stub**이고, 업스트림 DNS(예: 회사 DNS, ISP, 공용 resolver)가 **recursive** 역할을 한다

```mermaid
sequenceDiagram
  participant App as App (curl/ping/apt)
  participant Lib as libc resolver
  participant Res as systemd-resolved (stub/cache)
  participant Up as Upstream DNS (recursive)

  rect rgb(227,242,253)
    Note over App,Lib: Userspace (Application + libc)
  end
  rect rgb(232,245,233)
    Note over Res: Local stub/cache
  end
  rect rgb(255,243,224)
    Note over Up: External recursive DNS
  end

  App->>Lib: getaddrinfo("example.com")
  Lib->>Res: query A/AAAA
  Res->>Up: forward query (if cache miss)
  Up-->>Res: response
  Res-->>Lib: response (cache)
  Lib-->>App: IP list
```

Host 상에서 Configured DNS Resolver 를 확인하려면 resolvectl 를 활용할 수 있다.
**DNS Resolver 란 ?? :
DNS Resolver는 클라이언트 측에서 도메인 이름을 IP 주소로 변환
**DNS 서버와의 차이점 ?? :
NS Resolver는 클라이언트 측에서
도메인 이름을 IP로 변환하기 위해 쿼리를 생성하고
여러 DNS 서버를 재귀적으로 탐색
반면 DNS 서버는 루트, TLD, 권한 서버처럼 실제 도메인 정보를 저장·제공

```bash
resolvectl status
resolvectl query example.com
```

**설정 파일(환경에 따라 다름)**

```bash
cat /etc/resolv.conf
readlink -f /etc/resolv.conf
```

**조치(환경에 따라 다름)**

```bash
sudo vim /etc/systemd/resolved.conf
sudo systemctl restart systemd-resolved.service
sudo resolvectl flush-caches
```

**/etc/hosts는 최후의 빠른 우회로**

```bash
sudo vim /etc/hosts

127.0.0.1 localhost
1.2.3.4 example.com
123.98.125.1 hahaho

ping hahaho
```

### 영속 설정: `ip addr`는 휘발성, `netplan`은 영속성

`ip link/addr/route`로 바꾼 건 커널 런타임 상태라 재부팅/네트워크 재시작에 의해 사라질 수 있다.
Ubuntu 계열은 주로 netplan으로 “영속 설정 → renderer → 커널 반영” 흐름을 탄다.

- renderer는 환경에 따라 `systemd-networkd` 또는 `NetworkManager`가 될 수 있다
- 원격 서버에서는 `netplan try`를 우선 사용한다(자동 롤백 가능)

**진단**

```bash
sudo netplan get
ls -la /etc/netplan
```

**패턴: 고정 IP + DNS + default route (예시)**

```yaml
# /etc/netplan/01-netcfg.yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    ${dev_name}:
      dhcp4: false
      dhcp6: false
      addresses:
        - ${ipv4_cidr}  # e.g. 10.0.0.9/24
        - ${ipv6_cidr}  # e.g. 2001:db8::10/64
      nameservers:
        addresses:
          - 8.8.8.8
          - 1.1.1.1
      routes:
        - to: default
          via: ${gw_ipv4}
```

**적용**

```bash
sudo netplan try   # remote 환경이면 이걸 우선
# sudo netplan apply
```

## 03-2. 자가 점검 질문 (공부용)

### 최종 정리 및 자가 점검

최종 점검을 해보자, 다음 질문에 답할 수 있다면 된다.

- 커널은 “링크가 살아있음”을 어떤 상태로 표현하는가?
- `/24`는 내 통신 범위를 어떻게 제한하는가? (같은 서브넷/다른 서브넷의 차이)
- `default via`가 없으면 어떤 패킷이 막히는가?
- `ip route get`이 보여주는 정보(egress iface, next-hop)는 왜 신뢰할 수 있는가?
- “DNS 문제”와 “라우팅 문제”를 30초 안에 분리하는 최소 테스트는 무엇인가?

이제 최종적으로 아래 순서를 확인하여 어떻게 네트워크를 진단하고 상태를 파악하는지 점검해보자.

1. 링크(L2): `ip -c link`
2. 주소(L3): `ip -c addr`
3. 라우팅(L3): `ip route` + `ip route get 8.8.8.8`
4. DNS(Userspace/daemon): `resolvectl status` + `resolvectl query example.com`
5. 포트/프로세스(L4): `ss -tun` (가능하면 `netstat`보다 `ss`)

```bash
sudo ss -tunlp
sudo netstat -tunlp
# -t : tcp connections
# -u : udp connections
# -n : numeric values (port)
# -l : listening
# -p : processes
# 외우기어렵다면 -tunlp(TUNnel Programs) 로 기억하자
# ss 대신 netstat 쓸 수 있으나 미래에 사라질 예정이다
```

# 04. Users / Groups

Lab 이 



# 05. Networking

### Bridge / Bond 사용하여 NIC 에 대한 매니징

Bridge와 Bond는 둘 다 “물리 NIC를 직접 다루기 어렵다”는 문제를 해결하는 **L2 가상 인터페이스**다.

- **Bridge**: 여러 포트를 한 브로드캐스트 도메인으로 묶는 L2 스위치(Forwarding Database 기반 포워딩)
- **Bond**: 여러 NIC를 하나의 링크처럼 묶는 L2 링크 집계/이중화(모드에 따라 동작이 달라짐)

> 💡 핵심 관점

```mermaid
flowchart TB
  classDef l2 fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20;
  classDef l3 fill:#E3F2FD,stroke:#1565C0,color:#0D47A1;
  classDef ext fill:#FFF3E0,stroke:#EF6C00,color:#E65100;
  classDef note fill:#ECEFF1,stroke:#455A64,color:#263238;

  subgraph Host["Linux Host"]
    subgraph L3Layer["L3 (IP address lives here)"]
      BR0[br0 :: bridge]:::l3
      BOND0[bond0 :: bond]:::l3
    end
    subgraph L2Layer["L2 (frames)"]
      P1[NIC enp3s0]:::l2
      P2[NIC enp8s0]:::l2
      S1[NIC enp4s0]:::l2
      S2[NIC enp5s0]:::l2
      VM[vnet/tap/veth]:::l2
    end
  end

  subgraph LAN["External LAN"]
    SW[Switch]:::ext
    GW[Gateway]:::ext
  end

  BR0 --> VM
  BR0 --> P1 --> SW --> GW
  BOND0 --> S1 --> SW
  BOND0 --> S2 --> SW

  Note1["Bridge: L2 switching (FDB)\\nBond: L2 link aggregation / failover (mode-dependent)"]:::note
  Note1 -.-> BR0
  Note1 -.-> BOND0
```

## 05-1. Bridge (리눅스 L2 스위치)

> 개념: br0는 “가상 스위치”, 포트는 NIC/veth/tap

Bridge는 L2 프레임을 “어느 포트로 내보낼지” 결정하기 위해 FDB(Forwarding Database)를 유지한다.
VM/컨테이너 트래픽을 물리 LAN에 붙일 때 가장 흔한 패턴이다.

```mermaid
flowchart LR
  classDef l2 fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20;
  classDef l3 fill:#E3F2FD,stroke:#1565C0,color:#0D47A1;
  classDef ext fill:#FFF3E0,stroke:#EF6C00,color:#E65100;

  VM[VM vnet0]:::l2 --> BR0[br0]:::l3 --> NIC[eno1]:::l2 --> SW[Switch]:::ext --> LAN[LAN]:::ext
```

> 실전 패턴: IP는 `br0`에, 포트(enp3s0/enp8s0)는 “브리지 포트”로만 둔다

**Netplan 예시 (DHCP를 br0에서 받기)**

```yaml
# /etc/netplan/05-bridge.yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    enp3s0: {}
    enp8s0: {}
  bridges:
    br0:
      interfaces:
        - enp3s0
        - enp8s0
      dhcp4: true
      dhcp6: false
      parameters:
        stp: false
        forward-delay: 0
```

**적용(원격이면 try 우선)**

```bash
sudo netplan try
# sudo netplan apply
```

**검증(브리지/포트 상태 + IP 확인)**

```bash
ip -d link show br0
ip -c addr show dev br0
bridge link
bridge fdb show br0
```

---

## 05-2. Bond (NIC 이중화/집계)

> 개념: bond0가 “대표 링크”, slave NIC들은 bond0에 종속된다

- 가장 안전한 기본은 `active-backup` (Mode 1): 스위치 설정 없이도 동작하는 경우가 많고, 장애 대응이 명확하다.
- 대역폭 집계가 목적이면 `802.3ad (LACP)`를 고려하지만, 이건 **스위치 설정이 필요**하다(서버만 바꿔선 안 된다).

```mermaid
flowchart LR
  classDef l2 fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20;
  classDef l3 fill:#E3F2FD,stroke:#1565C0,color:#0D47A1;
  classDef ext fill:#FFF3E0,stroke:#EF6C00,color:#E65100;

  BOND0[bond0]:::l3 --> S1[enp4s0]:::l2 --> SW[Switch]:::ext
  BOND0[bond0]:::l3 --> S2[enp5s0]:::l2 --> SW[Switch]:::ext
```

> 실전 패턴 1: `active-backup` (이중화)

**Netplan 예시 (bond0에 DHCP)**

```yaml
# /etc/netplan/05-bond-active-backup.yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    enp4s0: {}
    enp5s0: {}
  bonds:
    bond0:
      interfaces:
        - enp4s0
        - enp5s0
      dhcp4: true
      dhcp6: false
      parameters:
        mode: active-backup
        primary: enp4s0
        mii-monitor-interval: 100
```

**적용(원격이면 try 우선)**

```bash
sudo netplan try
# sudo netplan apply
```

**검증(본딩 상태는 /proc가 제일 직관적)**

```bash
ip -d link show bond0
cat /proc/net/bonding/bond0
ip -c addr show dev bond0
```

---

### 공통: 런타임으로 임시 조작이 필요하면 `ip`를 쓴다

```bash
# interface up/down
sudo ip link set dev ${device_name} up
sudo ip link set dev ${device_name} down

# IP add/del (보통은 br0/bond0 같은 상위 인터페이스에)
sudo ip addr add ${ipv4_cidr} dev ${device_name}
sudo ip addr del ${ipv4_cidr} dev ${device_name}
```

> 💡 참고

### Firewall 세우기

Firewall은 “패킷이 커널 네트워크 스택을 통과할 때 어떤 트래픽을 허용/차단할지”를 정의하는 정책이다.
Ubuntu 환경에서는 보통 `ufw`(Uncomplicated Firewall)를 통해 netfilter 규칙(iptables/nft)을 관리한다.

## 05-3. UFW / Netfilter 구조

### 개념: 어디에서 필터링이 일어나는가?

커널은 패킷을 처리할 때 “이 패킷이 **로컬로 들어오는가(INPUT)** / **로컬에서 나가는가(OUTPUT)** / **중간을 통과하는가(FORWARD)**”로 나눠서 처리한다.

```mermaid
flowchart TB
  classDef userspace fill:#E3F2FD,stroke:#1565C0,color:#0D47A1;
  classDef kernel fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20;
  classDef ext fill:#FFF3E0,stroke:#EF6C00,color:#E65100;
  classDef hook fill:#ECEFF1,stroke:#455A64,color:#263238;

  subgraph External["External network"]
    Net[Internet/LAN]:::ext
  end

  subgraph Host["Linux host"]
    App[Userspace processes]:::userspace

    subgraph K["Kernel"]
      R[Routing decision]:::kernel
      IN[INPUT chain]:::hook
      OUT[OUTPUT chain]:::hook
      FWD[FORWARD chain]:::hook
      IF[Interface :: eth0/br0/bond0]:::kernel
    end
  end

  Net --> IF --> R
  R -->|to local socket| IN --> App
  App --> OUT --> R --> IF --> Net
  R -->|to another interface| FWD --> IF --> Net
```

> 💡 핵심

### 기본 정책(권장 출발점)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw default deny routed   # 라우터 역할을 의도하지 않는다면 기본 차단
```

### 용어 정리: `from` / `to` / `in` / `out` / `on`

- `from`: 출발지 IP/대역
- `to`: 목적지 IP/대역(로컬 서버 기준으로는 “내 서버의 어떤 주소로 들어오느냐”)
- `in` / `out`: 트래픽 방향(인바운드/아웃바운드)
- `on`: 적용할 인터페이스 제한

## 05-4. 실전 패턴 (규칙 작성 → 적용 → 검증)

### 0) 원격 서버에서 안전하게 시작하는 순서

```bash
sudo ufw app list
sudo ufw allow OpenSSH
sudo ufw enable
sudo ufw status verbose
```

> ⚠️ 주의

### 1) 포트 열기(로컬로 들어오는 트래픽 허용)

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 2) 특정 출발지에서만 SSH 허용(화이트리스트)

```bash
sudo ufw allow from ${ip_cidr} to any port 22 proto tcp   # e.g. 10.0.0.0/24
```

### 3) 인터페이스 단위로 제한하기(예: public NIC로만 허용)

```bash
sudo ufw allow in on ${ifname} from ${ip_cidr} to any port 22 proto tcp
```

### 4) 아웃바운드 제한(예: SMTP 차단)

```bash
sudo ufw deny out 25/tcp
```

### 5) 룰 확인/삭제/우선순위 조정

UFW 룰은 번호로 관리하면 실수하기 쉽지 않다.

```bash
sudo ufw status numbered
sudo ufw delete ${rule_number}
sudo ufw insert 1 deny from 10.0.0.37
```

## 05-5. 운영 팁(검증/로그/롤백)

**상태 확인**

```bash
sudo ufw status
sudo ufw status verbose
```

**로그**

```bash
sudo ufw logging on
```

**롤백(모든 규칙 초기화)**

```bash
sudo ufw reset
```

> 💡 참고

### Port Redirection / NAT

Port forwarding은 “외부에서 들어온 트래픽을 내부의 다른 주소/포트로 전달”하는 패턴이고,
NAT는 그 과정에서 패킷의 주소/포트를 “변환(translation)”하는 기술이다.

## 05-6. Netfilter의 구조: hook → table → chain → rule

리눅스에서 방화벽/NAT은 커널의 netfilter 프레임워크에서 처리된다.

- **hook**: 패킷 처리 파이프라인의 특정 지점(예: PREROUTING/INPUT/FORWARD/OUTPUT/POSTROUTING)
- **table**: 역할별 룰셋(대표적으로 `filter`, `nat`)
- **chain**: table 안에서 hook에 매핑되는 규칙 묶음(예: `nat`의 `PREROUTING`, `POSTROUTING`)
- **rule**: 실제 매칭 조건 + 액션

> 💡 정리

```mermaid
flowchart TB
  classDef hook fill:#ECEFF1,stroke:#455A64,color:#263238;
  classDef nat fill:#EDE7F6,stroke:#5E35B1,color:#311B92;
  classDef filter fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20;
  classDef note fill:#FFF3E0,stroke:#EF6C00,color:#E65100;

  subgraph Hooks["Netfilter hooks (packet path)"]
    PR[PREROUTING]:::hook --> IN[INPUT]:::hook
    PR --> FWD[FORWARD]:::hook --> PO[POSTROUTING]:::hook
    OUT[OUTPUT]:::hook --> PO
  end

  subgraph NatTable["table: nat (주소/포트 변환)"]
    NPR[nat/PREROUTING]:::nat
    NPO[nat/POSTROUTING]:::nat
    NOUT[nat/OUTPUT]:::nat
  end

  subgraph FilterTable["table: filter (허용/차단)"]
    FIN[filter/INPUT]:::filter
    FFWD[filter/FORWARD]:::filter
    FOUT[filter/OUTPUT]:::filter
  end

  PR -. "DNAT here (dst before routing)" .-> NPR
  PO -. "SNAT/MASQ here (src after routing)" .-> NPO
  OUT -. "local generated traffic DNAT" .-> NOUT

  IN -. "inbound allow/deny" .-> FIN
  FWD -. "forward allow/deny" .-> FFWD
  OUT -. "outbound allow/deny" .-> FOUT

  Note1["PREROUTING: routing 결정 전\\nPOSTROUTING: routing 결정 후"]:::note
  Note1 -.-> PR
  Note1 -.-> PO
```

## 05-7. IP forwarding: “통과(FORWARD)”를 가능하게 하는 스위치

포트포워딩/NAT은 대부분 “내 호스트가 라우터처럼 동작”하는 상황이기 때문에, IPv4 forwarding이 꺼져 있으면 패킷이 통과하지 못한다.
**확인**

```bash
sysctl net.ipv4.ip_forward
sysctl net.ipv6.conf.all.forwarding
```

**런타임(휘발성)**

```bash
sudo sysctl -w net.ipv4.ip_forward=1
# sudo sysctl -w net.ipv6.conf.all.forwarding=1
```

**영속화(권장: sysctl.d)**

```bash
sudo vim /etc/sysctl.d/99-forwarding.conf

net.ipv4.ip_forward=1
net.ipv6.conf.all.forwarding=1

sudo sysctl --system
```

> 💡 `/etc/sysctl.conf`는 “모든 설정이 한 파일에 모여서” 리뷰/추적이 어려워지는 경우가 많다.
> 작은 변경은 `/etc/sysctl.d/*.conf`로 분리해두는 편이 운영에서 관리하기 쉽다.

## 05-8. 실전 패턴 1: DNAT(포트포워딩) + FORWARD 허용

### 시나리오

- WAN: `${WAN_IF}`(예: `enp1s0`)에서 `TCP 8080`으로 들어오는 트래픽을
- LAN: `192.168.0.50:80`으로 전달하고 싶다

```mermaid
flowchart LR
  classDef ext fill:#FFF3E0,stroke:#EF6C00,color:#E65100;
  classDef hook fill:#ECEFF1,stroke:#455A64,color:#263238;
  classDef nat fill:#EDE7F6,stroke:#5E35B1,color:#311B92;
  classDef filter fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20;

  Internet:::ext --> WAN["${WAN_IF} (WAN)"]:::ext --> PR[PREROUTING]:::hook --> DNAT[DNAT to 192.168.0.50:80]:::nat
  DNAT --> Route[Routing decision]:::hook --> FWD[FORWARD]:::hook --> Allow[Allow forward]:::filter --> LAN["${LAN_IF} (LAN)"]:::ext --> Svc["192.168.0.50:80"]:::ext
  Svc --> LAN --> PO[POSTROUTING]:::hook --> Internet
```

### 구현 (iptables)

> ⚠️ 주의

```bash
# 1) DNAT: 목적지 포트/주소 변환 (routing 결정 전에)
sudo iptables -t nat -A PREROUTING -i ${WAN_IF} -p tcp --dport 8080 \\
  -j DNAT --to-destination 192.168.0.50:80

# 2) FORWARD: "통과"를 허용 (filter 테이블)
sudo iptables -A FORWARD -i ${WAN_IF} -o ${LAN_IF} -p tcp -d 192.168.0.50 --dport 80 \\
  -m conntrack --ctstate NEW,ESTABLISHED,RELATED -j ACCEPT
sudo iptables -A FORWARD -i ${LAN_IF} -o ${WAN_IF} \\
  -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
```

### 검증

```bash
sudo iptables -t nat -S
sudo iptables -S FORWARD
sudo iptables -vnL FORWARD
```

## 05-9. 실전 패턴 2: SNAT/MASQUERADE (내부망의 인터넷 나가기)

이 패턴은 “LAN → Internet” 트래픽에서 출발지 IP를 변환해서, 응답이 NAT 머신으로 돌아오게 만드는 전형적인 구성이다.

```bash
# SNAT의 가장 흔한 형태: 동적 공인 IP 환경이면 MASQUERADE
sudo iptables -t nat -A POSTROUTING -s 10.0.0.0/24 -o ${WAN_IF} -j MASQUERADE
```

> 💡 PREROUTING vs POSTROUTING

## 05-10. nftables 관점 (개념만 연결)

요즘은 내부적으로 nftables(`nft`)를 쓰는 배포판이 많다. iptables를 쓰더라도 backend가 nft인 경우가 있다.

```bash
sudo nft list ruleset
```
```
table ip nat {
  chain prerouting {
    type nat hook prerouting priority dstnat; policy accept;
    iifname "${WAN_IF}" tcp dport 8080 dnat to 192.168.0.50:80
  }
  chain postrouting {
    type nat hook postrouting priority srcnat; policy accept;
    oifname "${WAN_IF}" ip saddr 10.0.0.0/24 masquerade
  }
}
```

## 05-11. 영속화/롤백

### 영속화

iptables 룰은 커널에 올라가는 런타임 상태라, **재부팅 시 사라지는 게 일반적**이다.
영속화는 배포판/정책에 따라 여러 방법이 있다.

- `iptables-persistent` + `netfilter-persistent` (Debian/Ubuntu에서 흔함)
- `nftables` 서비스로 ruleset 관리

```bash
sudo apt install iptables-persistent
sudo netfilter-persistent save
```

### 롤백(주의해서)

```bash
sudo iptables -t nat -F
sudo iptables -F FORWARD
```

> ⚠️ flush는 즉시 트래픽에 영향을 준다. 원격 환경에서는 적용 순서/롤백 플랜을 먼저 잡고 실행한다.

### Reverse Proxy / Load Balancer

Reverse Proxy와 Load Balancer는 “클라이언트 앞단에서 요청을 받아서, 내부 서버로 전달”하는 역할을 한다.

- **Reverse Proxy**: “대리 응답자”처럼 동작한다. 클라이언트는 프록시만 보고, 내부 서버는 외부에 직접 노출되지 않는다.
- **Load Balancer**: 여러 upstream에 트래픽을 분산한다(알고리즘/가중치/장애 처리 정책 포함).

> 💡 DNS와의 관계(오해 포인트)

```mermaid
flowchart LR
  classDef client fill:#E3F2FD,stroke:#1565C0,color:#0D47A1;
  classDef proxy fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20;
  classDef upstream fill:#FFF3E0,stroke:#EF6C00,color:#E65100;
  classDef note fill:#ECEFF1,stroke:#455A64,color:#263238;

  subgraph C["Client side"]
    B[Browser / Client]:::client
    DNS[DNS]:::client
  end

  subgraph P["Reverse Proxy / LB (Nginx)"]
    N[Nginx]:::proxy
  end

  subgraph U["Upstreams (private)"]
    A1[App#1]:::upstream
    A2[App#2]:::upstream
    IMG[Image service]:::upstream
  end

  B -->|resolve| DNS -->|A/AAAA| B
  B -->|HTTP(S)| N
  N -->|proxy| A1
  N -->|proxy| A2
  N -->|proxy| IMG

  Note1["Client는 프록시만 본다\\nUpstream은 내부에서만 통신"]:::note
  Note1 -.-> N
```

## 05-12. Reverse Proxy (Nginx)

### 개념: “요청을 받아 → upstream으로 전달 → 응답을 다시 반환”

Reverse proxy는 아래 기능들을 함께 맡는 경우가 많다.

- 경로 기반 라우팅(`/`는 app, `/images/`는 image server)
- TLS termination(HTTPS를 프록시에서 종료)
- 공통 헤더 주입(`X-Forwarded-*`) 및 클라이언트 IP 전달

### 실전 패턴: location 기반 라우팅 + 공통 proxy header

```bash
sudo apt install nginx
sudo vim /etc/nginx/sites-available/${name}.conf
```
```
# /etc/nginx/sites-available/${name}.conf
upstream app_backend {
  server 1.1.1.1;
}

upstream img_backend {
  server 1.1.1.2;
}

server {
  listen 80;
  server_name _;

  location / {
    proxy_pass http://app_backend;
    include /etc/nginx/proxy_params;
  }

  location /images/ {
    proxy_pass http://img_backend;
    include /etc/nginx/proxy_params;
  }
}
```

> 💡 `proxy_params`가 하는 일

### 적용/검증

```bash
sudo ln -s /etc/nginx/sites-available/${name}.conf /etc/nginx/sites-enabled/${name}.conf
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t
sudo systemctl reload nginx.service

# 확인(예시)
curl -I <http://127.0.0.1/>
curl -I <http://127.0.0.1/images/>
```

> ⚠️ 주의: `proxy_pass`의 trailing slash

## 05-13. Load Balancing (Nginx upstream)

### 개념: upstream은 “분산 정책 + 장애 처리”를 포함한다

- 기본은 **round-robin**
- `least_conn`: 연결 수가 적은 서버 우선
- `weight`: 가중치 기반 분산
- 오픈소스 Nginx는 보통 “passive health check”(실패하면 일정 시간 제외) 중심으로 운영한다

### 실전 패턴: round-robin / least_conn / weight

```
upstream mywebservers {
  # round-robin (default)
  server 1.2.3.4 max_fails=3 fail_timeout=10s;
  server 5.6.7.8 max_fails=3 fail_timeout=10s;
  keepalive 32;
}

# least_conn
upstream mywebservers_least {
  least_conn;
  server 1.2.3.4;
  server 5.6.7.8;
}

# weight
upstream mywebservers_weighted {
  server 1.2.3.4 weight=5;
  server 5.6.7.8 weight=1;
}
```
```
server {
  listen 80;
  location / {
    proxy_pass <http://mywebservers>;
    include /etc/nginx/proxy_params;
  }
}
```

### 운영 팁

```bash
sudo nginx -t
sudo nginx -T | less
sudo systemctl reload nginx.service
sudo journalctl -u nginx.service -e --no-pager
tail -f /var/log/nginx/access.log /var/log/nginx/error.log
```

### Sync Time Using Time Server

리눅스에서 시간 동기화는 “로그/인증서/TLS/분산 시스템의 신뢰”와 직결된다.
시간이 틀어지면 아래 같은 증상이 흔하다.

- TLS 인증서가 “아직 유효하지 않음 / 만료됨”으로 보임
- 토큰/세션(만료 시간 기반)이 예상과 다르게 동작
- 로그 상관관계(trace)가 깨짐

Ubuntu 계열에서는 `systemd-timesyncd`가 기본 NTP 클라이언트로 사용되는 경우가 많고,
다른 NTP 클라이언트(예: chrony)를 쓰면 timesyncd는 꺼져 있을 수 있다.

## 05-14. systemd-timesyncd 동작 구조

```mermaid
sequenceDiagram
  participant Host as Linux host (timesyncd)
  participant NTP as NTP server

  Host->>NTP: NTP request (UDP/123)
  NTP-->>Host: NTP response (time + offset)
  Host-->>Host: adjust clock (slew/step)
```

## 05-15. 실전 명령어 (설정 → 적용 → 검증)

### 1) 타임존 설정

```bash
timedatectl list-timezones
sudo timedatectl set-timezone Asia/Seoul
```

### 2) NTP 동기화 활성화/상태 확인

```bash
timedatectl
timedatectl timesync-status
timedatectl show-timesync

sudo timedatectl set-ntp true
```

> 💡 참고

### 3) timesyncd 설정(업스트림 NTP 서버 지정)

```bash
sudo vim /etc/systemd/timesyncd.conf
sudo systemctl restart systemd-timesyncd.service
```

### 4) 데몬/로그 검증

```bash
systemctl status systemd-timesyncd.service
journalctl -u systemd-timesyncd.service -e --no-pager
```

> ⚠️ 주의

### SSH

SSH는 “원격 터미널 접속”뿐 아니라, 파일 전송(scp/sftp), 포트 포워딩, 자동화(배포/운영)의 기반이 되는 프로토콜이다.

## 05-16. SSH 구성 요소(클라이언트/서버)

- **서버 데몬**: `sshd` (원격에서 접속을 받아줌)
- **클라이언트**: `ssh` (접속을 시도함)

설정 파일은 “서버용”과 “클라이언트용”이 완전히 분리된다.

- 서버 설정: `/etc/ssh/sshd_config` + (배포판에 따라) `/etc/ssh/sshd_config.d/*.conf`
- 클라이언트 설정: `~/.ssh/config` (유저별) / `/etc/ssh/ssh_config` (글로벌)

> 💡 drop-in 디렉토리는 왜 존재하는가?

## 05-17. 인증 흐름(왜 키 기반이 기본인가?)

```mermaid
sequenceDiagram
  participant C as Client (ssh)
  participant S as Server (sshd)

  rect rgb(227,242,253)
    Note over C,S: 1) 서버 신원 확인(Host key)
  end
  C->>S: TCP connect (22)
  S-->>C: Host public key fingerprint
  C-->>C: known_hosts와 비교/저장

  rect rgb(232,245,233)
    Note over C,S: 2) 사용자 인증(User key / password)
  end
  C->>S: Offer public key
  S-->>C: Challenge (sign this)
  C-->>S: Signature (private key로 서명)
  S-->>S: authorized_keys로 검증
  S-->>C: Auth success
```

> 💡 `known_hosts` vs `authorized_keys`

## 05-18. 실전 명령어 (진단 → 변경 → 검증)

### 1) 서버 상태 확인

```bash
sudo systemctl status ssh.service || sudo systemctl status sshd.service
sudo ss -ltpn | rg ':22' || true
```

### 2) 키 생성/배포

```bash
ssh-keygen -t ed25519 -C "${comment}"

# 서버에 공개키 추가(가능한 환경에서)
ssh-copy-id -i ~/.ssh/id_ed25519.pub ${user}@${host}
```

### 3) 클라이언트 설정(호스트 별 단축/옵션)

```bash
vim ~/.ssh/config
```
```
Host myserver
  HostName 1.2.3.4
  User ubuntu
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes
```

### 4) 서버 설정(예: IPv4만 리슨, 비밀번호 인증 끄기)

> ⚠️ 주의

```bash
sudo vim /etc/ssh/sshd_config.d/10-hardening.conf
```
```
AddressFamily inet
PasswordAuthentication no
PubkeyAuthentication yes
PermitRootLogin no
```

### 5) 설정 검증 후 재시작/리로드

```bash
sudo sshd -t
sudo systemctl reload ssh.service || sudo systemctl reload sshd.service
```

### 6) 접속 디버그(클라이언트)

```bash
ssh -vvv ${user}@${host}
```

### 7) known_hosts 정리

```bash
ssh-keygen -R ${host}
```

> 💡 `ListenAddress`에 대해



# 05. Networking

### Bridge / Bond 사용하여 NIC 에 대한 매니징

Bridge

- Network A - NIC - **bridge** - NIC - Network B
Bond
- Network A - Multi NIC - **bond** - In/Out bound DNS
- 7 bonding modes : Mode 0 ~ 6 [Ref]([https://www.ibm.com/docs/en/linux-on-systems?topic=recommendations-bonding-modes#:~:text=modes:-,mode 0 (balance-rr,addresses for the server.,-For)](https://www.ibm.com/docs/en/linux-on-systems?topic=recommendations-bonding-modes#:~:text=modes:-,mode%200%20(balance%2Drr,addresses%20for%20the%20server.,-For))
- Mode 0 round robin -
- Mode 1 active backup - if one fails, another become active
- Mode 2
- Mode 3 broadcast
- Mode 4
- Mode 5 transmit load balance
- Mode 6 adaptive load balance
- -

bridge could be implemented via netplan

```
Sudo vim /etc/netplan/bridge-example.yaml
```
```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    enp3s0:
      dhcp4: no
    enp8s0:
      dhcp4: no
  bridges:
	   # this is a name of the bridge
    br0:
      dhcp4: yes
      interfaces:
			# add interface to be added
        - enp3s0
        - enp8s0
```
```
ip -c link # MAC 주소와 device interface 상태 확인,-c 는 color option(무조건 중간에)

Sudo netplan try #

Ip -c link
# -c 는 color option(무조건 중간에)
# 이제 bridge 인터페이스인 br0 가 정상적으로 뜨는 것을 볼 수 있다
# ip addr 명령어로 NIC 인터페이스의 MAC 주소 옆에 IPv4 CIDR 주소(예: 10.0.x.x/24)가 표시되면 DHCP가 정상 작동한 걸 확인할 수 있다
# Dhcp 가 정상작동하지 않았다면 동적 ip 할당이 되지 않아 사설네트워크 주소가 아닌 정적 주소 혹은 아무것도 안 뜬다

# 이후 sudo ip link delete br0 을 통해 bridge interface 를 삭제하여 bridge 를 제거할 수 있다
```

Bond 또한 netplan 으로 처리가능하다

```
network:
  version: 2
  renderer: networkd
  ethernets:
    enp3s0: {}
    enp4s0: {}
  bonds:
	   # this is a name of the bond
    bond0:
      dhcp4: yes
      interfaces:
        - enp3s0
        - enp4s0
      parameters:
        mode: active-backup
			# you can check modes in man page with search keyword 'bonding'
			# balance-rr : mode0
       primary: enp3s0
        mii-monitor-interval: 100
```

Bond 는 netplan try 를 하면 경고가 나오는데 이는 실제로 bond 처리가 되면 nic 가 꼬일 수 있다는 경고가 뜬다
따라서 에러가 없이 제대로 처리될 수 있게 apply 전에 확인해봐야한다
bond 나 bridge 는 결국 linux 상엣ㅓ interface 로 돌아간다
따라서 원한다면 sudo ip addr dev ${device-name} addr ${ip/cidr} 을 통해 ip 를 추가하거나 sudo ip set dev ${device-name} ${up 혹은 down} 으로 켜고 끌 수 있다
-> 두 interface 는 가상 interface 인데 어떻게 정상 동작하는가? bond/bridge 에 ip 를 추가하면  IP는 bond/bridge에 있지만, 실제 frame은 연결된 NIC으로 나가게끔 처리된다

- Bond 인터페이스(bond0)에 IP를 추가하면:
발신(Outbound): bond의 bonding mode(balance-rr, active-backup 등)에 따라 slave NIC들로 패킷 분배. 예: mode 1(active-backup)에서는 active slave만 사용.
수신(Inbound): ARP negotiate나 MAC learning으로 active slave가 트래픽 수신, bond의 IP 스택으로 올라감.
Kernel이 bond를 "상위 인터페이스"로 인식해 라우팅 테이블에서 bond0 기준으로 처리.
- Bridge 인터페이스(br0)에 IP 추가 시:
Bridge는 L2 스위치처럼 동작하면서 자체 IP 스택도 가짐. br0의 IP로 들어온 패킷은 bridge의 forwarding database(FDB)를 거쳐 slave 포트(물리 NIC, veth 등)로 전달.
예: VM 패킷 → vnet0 → br0(FDB 조회) → eno1(NIC) → 물리 스위치.
Bridge가 "promiscuous mode"로 NIC 패킷을 캡처해 L2/L3 모두 처리.
- -

### Firewall 세우기

Packet filtering firewall 을 세워서 악성 packet frame 들을 차단하여 공격을 방지할 수 있다.
Ufw(Uncomplicated firewall) 를 사용하여 이러한 packet filtering 을 처리할 수 있다
화이트리스트 방식과 -- 특정 ip 만 허용 -- 블랙리스트 방식 -- 특정 ip 를 차단 -- 중 선택하여 필터링 할 수 있다
UFW에 설정되어 있는 기본 룰은 아래와 같다.
들어오는 패킷에 대해서는 전부 거부(deny)
나가는 패킷에 대해서는 전부 허가(allow)

> Word book
> FROM, ON, OUT, IN 등등 굉장히 헷갈린다
> FROM 은 상대주소지를, ON 은 interface 를, OUT/IN 은 방향을 떠올리면 된다
> FROM: 출발지 IP나 네트워크를 지정. 예: ufw allow from 192.168.1.100 to any port 22 – 특정 IP에서만 SSH 허용.
> IN: incoming(들어오는) 트래픽에만 적용. 기본값이지만 명시 가능. 예: ufw allow in 80/tcp.
> OUT: outgoing(나가는) 트래픽에 적용. 예: ufw deny out 25/tcp – SMTP 나가는 차단.
> ON: 특정 네트워크 인터페이스(eth0 등)에만 적용. 예: ufw allow in on eth0 from 10.0.0.0/8.

```bash
Sudo ufw status # check status of ufw
Sudo ufw status verbose # print detailed status of ufw
sudo ufw status numbered # each ufw rule has number, this shows a ufw rules with number

Sudo ufw allow 22 # enable 22 port which is a tcp port of ssh
sudo ufw allow 22/udp # enalbe only udp 22 port

Sudo ufw allow from ${ip/cidr} to any port 22
# 특정 ip 의 특정 포트인 22 에 대해 허용
# 이런 셋업을 통해 피어 네트워크에서 어떤 주소로든 22 포트로 트래픽을 전송할 수 있게 패킷 필터를 열어서 라우팅 처리가 가능하다
Sudo ufw allow from ${ip/cidr} to any port 22
# 특정 ip 의 모든 포트를 허용


Sudo ufw deny 22 # disable 22 port
Sudo ufw deny 22/tcp # disable only tcp 22 port
Sudo ufw deny on enp0s3 to 8.8.8.8
# enp0s3 에서 8.8.8.8 로 나가는 트래픽 차단
# enp0s3 와 같은 interface 는 ip -c link 를 통해 볼 수 있음, -c 는 colorful 옵션




sudo ufw delete ${ufw rule number}
# this deletes the ufw rule by number
# since firewall processed by rule number order
# if 10.0.0.0/24 is allowed by rule 1, denial 10.0.0.37 by rule 2 is ignored
# to handle this scenario, you can insert rule by number, via 'Sudo ufw insert ${num} ${rule}'

Sudo insert 1 deny from 10.0.0.37
# inserting by number will push down the previous number
# if 3 is inserted, previous 3->4, 4->5, ,,,



``

이외 Ufw 명령어 관련해서 <https://webdir.tistory.com/206> 를 많이 참고하자
```



### Port Redirection / NAT

> 아래 설명들이 틀린 게 있는지 꼭 검토하기

Internet → Publicly Accessible Server (Proxy/Reverse Proxy) → Internal Network
하지만 퍼블릭 포트로 받은 트래픽을 어느 포트의 프라이빗 네트워크로 넘겨야할지 알아야 한다
Internet — public known port —> Publicly Accessible Server (Proxy/Reverse Proxy)
Publicly Accessible Server (Proxy/Reverse Proxy) — WHICH PORT ?? —> Internal Network
이를 위해 포트포워딩이라는 기술이 사용된다

NAT 개념은 위와 같다

> NAT 는 그럼 우리가 설정하는 게 아닌가?
> Port Redirectoin 과 NAT 가 서로 다른 정의인가?

Linux 에서는 대부분의 디스트로에서 아래와 같이 기본적으로 ip forwarding 이 활성화되어있다

> Sysctl.conf 는 왜 위험한가?

`/etc/sysctl.conf : risker`
`/etc/sysctl.d/${name}.conf : safer`
위와 같은 파일 내에서 패킷 포워딩 설정을 아래와 같이 변경할 수 있다

```javascript
net.ipv4.ip_forward = 1
net.ipv6.conf.all.forwarding = 1
```

`sudo sysctl --system` 을 통해 패킷 포워딩 설정을 적용해줘야 영구적으로 처리된다

Linux 에서는 모든 네트워크 관련 처리를 kernel 에서 수행한다
— Ufw 명령어에 따른 firewall, ip addr/link 명령어에 따른 ip routing, sysctl 명령어에 따른 패킷포워딩 규칙 등등
`netfilter framework(nft)` 을 사용하여 port redirection 을 설정할 수 있다  
하지만 nft 는 사용하기 어려워 iptable 을 수정하는 게 조금 더 쉽다

Iptable 은 chain 에 따라 처리된다

> Chain ?? 갑자기 무슨 Chain ?? Chain 을 수정하는건가?
> 아래엣ㅓ 테이블들이 등장하는데 이게 무슨 테이블등ㄹ인지??

`sudo iptables -t nat -A PREROUTING -i enp1s0 -s 10.0.0.0/24 -p tcp --dport 8080 -j DNAT --to-destination 192.168.0.50`
= nat 테이블에 PREROUTING 체인을 추가하는데 
-t : table ${table}
-A : append ${chain}
-i : inputer ${interface}
-s : source ${source ip}
-p : ${protocol}
—dport : ${destination port}
-j : jump nat packet to target
—to-destination : ${destination ip}
여기서 -i 를 빼면 모든 interface 에 대해서 적용된다

> 아래를 활용하면 Port Forwarding 한 패킷의 원래 origin 을 바꿔줄 수 있는건가?
> POSTROUTING ? PREROUTING 이랑 뭐가 다른거지?
> 왜 여기선 -output 옵션 ?

`sudo iptables -t nat -A POSTROUTING -s 10.0.0.0/24 -o enp6s0 -j MASQUERADE`
여기서 -o 를 빼면 모든 interface 에 대해서 적용된다
위 iptables 명령어들을 nft 에서 비슷하게 할 수 있는데 아래 코드와 같이 복잡하게된다

```javascript
sudo nft list ruleset

talbe ip nat {
		chain PREROUTING { 
				type nat hook prerouting priority dstnat; policy accept;
				iifname "enp1s0" meta l4proto tcp ip saddr 10.0.0.0/24 tcp dport 8080 counter packets 0 bytes 0 dnat to 192.168.0.5:80
		}
		chain POSTROUTING {
				type nat hook postrouting priority srcnat; policy accept;
				oifname "enp6s0" ip saddr 10.0.0.0/24 counter packtes 0 bytes 0 masquerade
		}
}
```


Iptables 설정은 영속화되지 않는다
따라서 iptables-persistent 패키지를 설치 이후 `sudo netfilter-persistent save` 를 통해 영속화를 미리 켜두고 iptable 명령어를 호출해줘야한다

```javascript
sudo apt install iptables-persistent
sudo netfilter-persistent save
sudo iptables -t nat -A PREROUTING -i enp1s0 -s 10.0.0.0/24 -p tcp --dport 8080 -j DNAT --to-destination 192.168.0.50
sudo iptables -t nat -A POSTROUTING -s 10.0.0.0/24 -o enp6s0 -j MASQUERADE
```


만약 iptables 의 nat 테이블을 초기화하고 싶다면 다음과 같이 하면 된다
`sudo iptables --flush --table nat`


### Reverse Proxy / Load Balancer

Reverse Proxy 는 중간 서버로 DNS Query 에 대해 설정에 따라 동적으로 IP Resolve 를 지원한다
이를 통해 우리는 새로운 서버를 추가하여 교체할 때 설정만 바꿔주면 DNS Query Client 는 기존 호출하던 DNS 를 그대로 유지하면 된다

Nginx 예시

```javascript
sudo apt install nginx
sudo vim /etc/nginx/sites-availbe/${name}.conf

# / -> 1.1.1.1
server{
		listen 80;
		location / {
				proxy_pass http://1.1.1.1;
		}
}

# /images -> 1.1.1.2
# add headers to get metadata
server{
		listen 80;
		location /images {
				proxy_pass http://1.1.1.2;
				include proxy_params;
		}
}
# adding metadata requires proxy_params config
sudo vim /etc/nginx/proxy_params
proxy_set_header Host $http_host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwareded-For $proxy_add_x_forwareded_for;
proxy_set_header X-Forwareded-Proto $scheme;

# To enable these configs -> soft link to /sites-enabled
sudo ln -s /etc/nginx/sites-availbe/${name}.conf /etc/nginx/sites-enabled/proxy.conf
# To disable these configs -> rm /default
sudo rm /etc/nginx/sites-enabled/default
# To test/check config files -> nginx -t
sudo nginx -t
# Apply these on nginx
sudo systemctl reload nginx.service



```


Load Balancer 는 중간 서버로 트래픽 부하를 여러 서버에 균형적으로 나눠서 처리한다

Nginx 예시


```javascript
sudo apt install nginx
sudo vim /etc/nginx/sites-availbe/${name}.conf

# load balance by round robin 
# / -> mywebservers -> 1.2.3.4 / 5.6.7.8
upstream mywebservers{
		server 1.2.3.4;
		server 5.6.7.8;
}
server{
		listen 80;
		location / {
				proxy_pass http://mywebservers;
		}
}


# load balance by least active order
# / -> mywebservers -> 1.2.3.4 / 5.6.7.8
upstream mywebservers{
		least_conn;
		server 1.2.3.4;
		server 5.6.7.8;
}
server{
		listen 80;
		location / {
				proxy_pass http://mywebservers;
		}
}

# load balance by weight & least active order
# more weight, more handle conn
# default weight is 1
# / -> mywebservers -> 1.2.3.4 / 5.6.7.8
upstream mywebservers{
		least_conn;
		server 1.2.3.4 weight=5;
		server 5.6.7.8; # 
}
server{
		listen 80;
		location / {
				proxy_pass http://mywebservers;
		}
}


# you can mark server as down, then others handle conn
upstream mywebservers{
		least_conn;
		server 1.2.3.4 down; # won't handle
		server 5.6.7.8; # HANDLE THE CONN
}
server{
		listen 80;
		location / {
				proxy_pass http://mywebservers;
		}
}



# you can specify server port
upstream mywebservers{
		least_conn;
		server 1.2.3.4:8081;
		server 5.6.7.8:3308;
}
server{
		listen 80;
		location / {
				proxy_pass http://mywebservers;
		}
}

```



### Sync Time Using Time Server

Systemd-timesyncd 데몬을 통해 time server 에 주기적으로 네트워크 상 시간을 동기화함
Timdatectl list-timezone
Timedatectl set-timezone America/Los-Angles
Sudo timedatectl set-ntp true 를 통해 Systemd-timesyncd 에 의한 동기화작업을 활성화
Systemd-timesyncd 의 설정을 바꾸려면 /etc/systemd/timesyncd.conf를 사용

> 각각의 설정갑이 어떻게 되며 어떻게 ntp 서버를 지정할 수 있는가 ?

![](/images/notion/d608f9f27e70a8aa.png)

Timedatectl show-timesync, 혹은 timesync-status 를 통헤 ntp 서버 설정과 현제 상테를 볼 수 있음


### SSH 

Ssh 가 뭔지 기억이 안 나면 미리 정리해둔 게 있다
__ 다만 해당 글에서는 리눅스에서 설정을 어떻게 하는지 안 나와있어 여기서 따로 정리하고 나중에 해당 글에 기입하겠다 __
[SSH 란? (feat. Nixos SSH 활성화)](https://www.notion.so/20f19c3902908018b512fec4e62ecce1) 

Ssh config 는 /etc/ssh/sshd_config.d
AddressFamily adess family 지정, ipv4만 받고 싶다면 inet, ipv6 는 inet6
listenAddress를 통해 클라이언트 ip 화이트리스트
PasswordAuthentication 을 통해 사용자 비밀번호에 따른 인증 x
sshd_config.d 서 메인설정을 했더라도 sshd_config.d/${config}.conf 에 설정이 있으면 설정을 덮어씌운다 (오버라이드)
따라서 해당 디렉토리 산하에 파일이 있는지 꼭 체크해라

> 어떻게 sshd_config.d 는 디렉토리 역할을 하면서 설장파일 역할을 하는거지?

각 유저 별 ssh config 를 통해 ssh host 를 네이밍 지정할 수 있음 → ~/ssh/.config
추가로 이에 비한 글로벌 ssh config 는 /etc/ssh/Ssh_config 에 있다
ssh-keygen 을 통해 공개키 생성, ssh-keygen -R ${} 을 통해 해당 서버에서 나의 공개키를 지워 known_hosts 에서 제거한다



# 06. Storage

## Partition & Swap

### Partition 이란

1TB → 500GB NTFS Windows OS | 500GB EXT4 Ubuntu 로 사용하게끔 논리적으로 분리하는 것을 파티셔닝이라함
현재 파티셔닝을 확인하려면 `lsblk` 사용

```bash
❮ lsblk
NAME                                           MAJ:MIN RM   SIZE RO TYPE  MOUNTPOINTS
nvme0n1                                        259:0    0 931.5G  0 disk
├─nvme0n1p1                                    259:1    0     1G  0 part  /boot
├─nvme0n1p2                                    259:2    0    16G  0 part
│ └─dev-disk-byx2dpartlabel-diskx2dmainx2dswap 254:12   0    16G  0 crypt [SWAP]
└─nvme0n1p3                                    259:3    0 914.5G  0 part
  ├─homelab_vg-data_thinpool_tmeta             254:0    0   500M  0 lvm
  │ └─homelab_vg-data_thinpool-tpool           254:2    0   300G  0 lvm
  │   ├─homelab_vg-data_thinpool               254:3    0   300G  1 lvm
  │   └─homelab_vg-data                        254:8    0   600G  0 lvm   /data
  ├─homelab_vg-data_thinpool_tdata             254:1    0   300G  0 lvm
  │ └─homelab_vg-data_thinpool-tpool           254:2    0   300G  0 lvm
  │   ├─homelab_vg-data_thinpool               254:3    0   300G  1 lvm
  │   └─homelab_vg-data                        254:8    0   600G  0 lvm   /data
  ├─homelab_vg-vm_thinpool_tmeta               254:4    0     1G  0 lvm
  │ └─homelab_vg-vm_thinpool-tpool             254:6    0   380G  0 lvm
  │   ├─homelab_vg-vm_thinpool                 254:7    0   380G  1 lvm
  │   └─homelab_vg-vms                         254:11   0   800G  0 lvm   /var/lib/libvirt/images
  ├─homelab_vg-vm_thinpool_tdata               254:5    0   380G  0 lvm
  │ └─homelab_vg-vm_thinpool-tpool             254:6    0   380G  0 lvm
  │   ├─homelab_vg-vm_thinpool                 254:7    0   380G  1 lvm
  │   └─homelab_vg-vms                         254:11   0   800G  0 lvm   /var/lib/libvirt/images
  ├─homelab_vg-root                            254:9    0   200G  0 lvm   /nix/store
  │                                                                       /
  └─homelab_vg-vault                           254:10   0    20G  0 lvm   /var/lib/vault
```

s → serial, SATA(Serial ATA) 에 SSD 설치된 경우
nvme → nvme 에 SSD 설치된 경우
Sda, sdb, sdc ,,, sdz 와 같이 알파벳으로 물리 디스크를 구분
sda1, sda2, sda2 ,,,, 와 같이 물리디스크에 추가적으로 번호를 붙여서 논리 파티셔닝을 구분
논리적 파티셔닝은 `/dev/${partion-name}` 에 저장됨
가령 위와 같을 때, 아래와 같이 볼 수 있음

```bash
❮ ll /dev/nvme0n1
brw-rw---- 1 root disk 259, 0 Apr 23 09:00 /dev/nvme0n1
```

Show me a list of partitions on this block device named ${partion-name}
`sudo fdisk --list /dev/${partion-name}`

```bash
❮ sudo fdisk --list /dev/nvme0n1
Disk /dev/nvme0n1: 931.51 GiB, 1000204886016 bytes, 1953525168 sectors
Disk model: CT1000T500SSD8
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disklabel type: gpt
Disk identifier: 10AD83AB-32CD-4DC2-AFD4-E7D477955816

Device            Start        End    Sectors   Size Type
/dev/nvme0n1p1     2048    2099199    2097152     1G EFI System
/dev/nvme0n1p2  2099200   35653631   33554432    16G Linux swap
/dev/nvme0n1p3 35653632 1953523711 1917870080 914.5G Linux filesystem
```

Start 가 2048 에서 시작하는 걸 볼 수 있는데 0~2047(512 × 4 bytes) 는 통상적으로
이것은 boot loader 가 시작될 때 사용하는 공간이라
비워두는 것이 일반적인 룰이다
`cfdisk`는 **리눅스에서 디스크 파티션을 관리하는 curses 기반의 사용자 친화적인 TUI(Text User Interface) 도구이다.**
위와 같은 경우 실제로 실행시켜보면 디스크 파티션들을 관리하는 TUI 가 뜨는 것을 볼 수 있다.

```bash

❮ sudo cfdisk /dev/nvme0n1
```

![](/images/notion/bb37140bcd9a56fc.png)

cfdisk 상에서 조작하는 것은 `Write` 를 선택하기 전까지는 그냥 Plan 일뿐이다.
따라서 실제로 적용하고자 한다면 반드시 `Write` 를 선택해줘야한다

### Swap 이란

메모리(RAM)가 부족할 때 디스크(하드디스크나 SSD)의 일부를 가상 메모리처럼 사용하는 공간이다.
`swapon --show` 를 사용하면 swap 현재 상태를 볼 수있다.

```bash
❮ swapon --show
NAME       TYPE      SIZE USED PRIO
/dev/dm-12 partition  16G   0B   -2

# 또는
❮ free -h
               total        used        free      shared  buff/cache   available
Mem:            27Gi       1.1Gi        25Gi       7.3Mi       892Mi        26Gi
Swap:           15Gi          0B        15Gi
```


특정 디스크에 swap 을 생성하려면 `sudo mkswap /dev/${partition-name}` 을 통해 생성할 수 있다.

```bash
❮ sudo mkswap /dev/vdb3
```

이후 `swapon --verbose ${partition-name}` 을 통해 해당 Swap을 활성화하고, 디스크 I/O에 참여하도록 커널에게 알려주도록 한다

```bash
❮ sudo swapon --verbose /dev/dm-12
swapon: /dev/mapper/dev-disk-byx2dpartlabel-diskx2dmainx2dswap: found signature [pagesize=4096, signature=swap]
swapon: /dev/mapper/dev-disk-byx2dpartlabel-diskx2dmainx2dswap: pagesize=4096, swapsize=17179869184, devsize=17179869184
swapon /dev/mapper/dev-disk-byx2dpartlabel-diskx2dmainx2dswap
swapon: /dev/mapper/dev-disk-byx2dpartlabel-diskx2dmainx2dswap: swapon failed: Device or resource busy
```

하지만 이렇게 manual 하게 설정을 바꾸는 것은 temporary changes 이다.
설정파일을 수정하여 적용해주어야 영구적 적용이된다. 영구적 적용 방법은 나중에 확인할 것이다.

이제 이렇게 활성화한 swap 을 `swapoff` 를 통해 끌 수도 있다.

```bash
❮ sudo swapoff /dev/vdb3
```


위 mkswap 은 기존 파티션을 swap 으로 쓰도록 하는 방식이다.
이와 반대로 `dd` 를 사용하면 직접 swap device file 을 만들고 크기를 지정할 수 있다
`dd`는 원하는 크기의 파일을 디스크에 만드는 “저수준 복사” 도구이다.
다음과 같이 사용할 수 있다.

- `if=/dev/zero` : `/dev/zero`는 무한히 0으로 채워진 장치 → 0으로 채운 파일을 만듬
- `of=/swap` : “/swap”이라는 파일에 씀
- `bs=1M count=128` → 1M × 128 = 128MB 할당
- `status=progress` → 진행 상황을 보여주는 옵션

이후 swap 파일은 root만 읽고 쓸 수 있어야하므로 600 으로 권한을 지정해준다.

```bash
❮ sudo dd if=/dev/zero of=/swap bs=1M count=2048 status=progress

❮ sudo chmod 600 /swap

❮ sudo mkswap /swap

❮ sudo swapon --verbose /swap

```




## File System

### Create/Configure File System

```bash
# sdb1 (SSD b 디스크의 1 파티션) 에 ext4 를 생성해라
sudo mkfs.ext4 /dev/sdb1

# man page 도 볼 수 있다
man mkfs.ext4

# Label 지정하여 xfs 를 /dev/sdb1 에 생성
sudo mkfs.xfs -L "BackupVolume” /dev/sdb1

# inode 512 바이트 지정하여 xfs 를 /dev/sdb1 에 생성
# inode는 파일의 설명서/주소록 같은 메타데이터
# 그 파일의 권한, 소유자, 크기, 생성/수정 시간, 그리고 실제 데이터가 디스크 어디에 있는지 같은 메타데이터를 담는다
# -f 를 통해 force 할 수 있다
sudo mkfs.xfs -i -f size=512 /dev/sdb1

# xfs_admin -l 을 통해 라벨을 확인
# xfs_admin -L 을 통해 라벨을 수정
sudo xfs_admin -l /dev/sdb1
sudo xfs_admin -L “Changed Label" /dev/sdb1

# ext4 를 /dev/sdb1 에 생성
sudo mkfs.ext4 /dev/sdb2

# -N 을 통해 inode 크기를 지정한다 (byte)
# ext4 는 inode 크기가 꽉 차면 더 이상 데이터를 저장하지 못 한다
sudo mkfs.ext4 -N 50000 /dev/sdb2

# tune2fs -l 을 통해 라벨을 확인
# tune2fs -L 을 통해 라벨을 수정
sudo tune2fs -l /dev/sdb2
sudo tune2fs -L “Changed Label" /dev/sdb2
```

### Mount Filesystem

```bash
# To plug directoy on specific disk
# "Mounting" is required
# To mount, we use mount command
# /dev/vdb1(virtual device 인 b 의 1파티션) 을 /mnt/ 라는 임시 디렉토리에 마운트
sudo mount /dev/vdb1 /mnt/

# storage device 확인
lsblk

# mount 취소하려면 umount 사용
sudo umount /mnt/

# system 이 boot up 할 때 /etc/fstab 에 선언된 디렉토리들을 자동으로 마운트한다
# 따라서 boot up mount dir 들은 /etc/fstab 에 저장하여 영속화한다
# 1번째 인자 : 어느 디스크를 마운팅할건지
# 2번째 인자 : 어디에 마운팅 할건지
# 3번째 인자 : 어느 파일시스템을 쓸건지
# 4번째 인자 : 마운트 옵션
# 5번째 인자 : 덤프 백업 (0:false, 1:true)
# 6번째 인자 : 파일시스템 에러 정책(0:에러스캔X,1:이 마운트가 가장 먼저 스캔되어야 함,2:1이 스캔되고 나서 스캔됨)
# swap 에 대해서는 디렉토리를 none, 마운트디렉토리를 swap,덤프백업과 에러정책을 0 으로 세팅한다
sudo vim /etc/fstab
```
/dev/vda2 / ext4 defaults 0 1
/dev/vda3 none swap defaults 0 0
```

# /etc/fstab 을 업데이트 했다먼 daemon-reload 하여 정책을 반영한다
sudo systemctl daemon-reload
```

### Filesystem Feature / Mount Options

```bash
# 어떤 디바이스가 어떤 마운트로 처리되어있느지 상세 확인
# 마운트 중심으로 보려면 findmnt 를
# 디바이스 중심으로 보려면 lsblk 를
# +) 마운트 옵션을 보여주는 findmnt !!
findmnt
lsblk -f

# /dev/vdb2(virtual device 인 b 의 2파티션) 을 /mnt/ 라는 임시 디렉토리에 마운트옵션을 통해 마운트
# 마운트 옵션들은 다음과 같다
# ro : 읽기 전용 (쓰기 X)
# noexec : 바이너리 실행 X
# nosuid : SUID/SGID 무시 (set-uid,set-gid 작동 X)
# rw : 읽기/쓰기 가능
# auto / noauto : 부팅 시 자동 마운트 여부
# user / nouser : 일반 사용자가 마운트/언마운트 가능 여부
# sync / async : I/O 동기/비동기 모드
# nodev : 블록/캐릭터 장치 파일을 무시
# defaults : rw,suid,dev,exec,auto,nouser,async 묶음
# remount : 이미 존재하는 마운트에 새로운 옵션을 추가하여 다시 마운트할 때 적용
sudo mount -o ro,remount,noexec,nosuid /dev/vdb2 /mnt

# XFS 전용 allocsize 옵션을 통해 XFS 사전 할당 크기를 지정
# allocsize 는 remount 로는 바꿀 수 없는 것을 알아두자
sudo mount -o allocsize=32K /dev/vdb1 /mybackups
```



## Remote Filesystem

### NFS

**NFS 는 **Network Filesystem Protocol 을 통해 원격 통신하여 
**파일/디렉터리 단위**로 공유한다
Server 는 공유디렉토리와 설정을 선언하고
Client 는 해당 디렉토리를 본인에게 Mount 하여 처리한다.

```bash
# NFS 서버사이드에서는 
# 아래 패키지를 설치하고
# /etc/exports 를 수정하여
# 공유디렉토리와 그에 대한 공유설정을 선언 및 처리한다
sudo apt install nfs-kernel-server

# export 설정 파일 수정하여
# 공유할 디렉토리와 접근 권한 정의
# 이에 대해서는 man exports 를 통해
# man page 또한 볼 수 있다.
sudo vim /etc/exports

# /etc/exports 설정은 다음과 같은 형식을 따른다
# <공유 디렉토리> <클라이언트>(옵션)
#
# 예시 설명:
# /srv/homes           : NFS로 공유할 서버 디렉토리
# hostname1(rw,...)    : hostname1은 읽기/쓰기 가능
# hostname2(ro,...)    : hostname2는 읽기 전용
# **클라이언트는 hostname 뿐 아니라 ip 를 적어도 된다.
#
# 각 옵션에 대해서는 다음과 같다.
# rw                  : 읽기/쓰기 허용
# ro                  : 읽기 전용
# sync                : 요청 시 디스크에 즉시 반영 (데이터 안정성 ↑, 성능 ↓)
# no_subtree_check    : 서브디렉토리 검사 비활성화 (성능 향상, 일반적으로 권장)
#
# 실제 설정 예시:
/srv/homes hostname1(rw,sync,no_subtree_check) hostname2(ro,sync,no_subtree_check)

# 이루 이렇게 선언한 export 설정은 
# exportfs 를 통해 reload 를 해야한다
# -r                  : re-export, 설정된 내용을 다시 읽고 적용
# -a                  : all, 명시된 모든 공유를 커널 내 export 테이블에 등록
# reload 이후에는 NFS 서비스를 재시작한 뒤
# 상태를 확인한다
# -v                  : verbose, 적용상태 체크
sudo exportfs -ra
sudo systemctl restart nfs-kernel-server
sudo exportfs -v
```
```bash
# NFS 클라이언트 사이드에서는 
# 아래 패키지를 설치하고
# 서버의 NFS 공유 디렉토리를 로컬에 마운트한다
sudo apt install nfs-common
sudo mount ${client-ip}:${file-system} ${local-mount-directory}

# 기존 mount 명령어 사용법과 동일하나
# 서버 IP 가 추가되는 점이 있다
# - 서버 IP: 100.128.28.1
# - 서버 측 공유 디렉토리: /srv/homes (예시)
# - 로컬 마운트 위치: /mnt
sudo mount 100.128.28.1:/srv/homes /mnt

# NFS 마운트 확인
df -h
# 또는
mount | grep nfs

# 만약 재부팅 시에도 자동마운트하게끔 하고자한다면
# /etc/fstab 에 서버IP 에 대한 mount 설정을 추가한다
# 다만 filesystem 의 type 은 nfs 임을 유의한다
sudo vim /etc/fstab
# 예:
# 100.128.28.1:/srv/homes /mnt nfs defaults 0 0
# 서버_IP:/공유_디렉터리  /마운트_위치  nfs  defaults  0  0
```

### Network Block Device

**NBD 는 블록 디바이스(디스크/파티션)** 자체를 네트워크로 공유한다
Server 는 공유할 스토리지 디바이스에 대해 NBD 섹션이름과 NBD 설정을 선언하고
Client 는 nbd-client 명령어를 통해 해당 디바이스를 추가하고 마운트한다

일반적으로 Stroage Block Device 는 `/dev/sda` 를 통해 알파벳으로 디스크를 지칭하고
`/dev/sda1` 을 통해 번호를 붙여 파티션을 지칭한다
Network Block Device 또한 비슷한 이름형식을 따라 `/dev/nbd${number}` 를 따라간다

```bash
├── /dev/sda
│   ├── /dev/sda1
│   ├── /dev/sda2
│   ├── ,,,

*** s → serial, SATA(Serial ATA) 에 SSD 설치된 경우
*** nvme → nvme 에 SSD 설치된 경우
*** v → nvme 에 SSD 설치된 경우
*** Sda, sdb, sdc ,,, sdz 와 같이 알파벳으로 물리 디스크를 구분
*** sda1, sda2, sda2 ,,,, 와 같이 물리디스크에 추가적으로 번호를 붙여서 논리 파티셔닝을 구분


├── /dev/nbda1
```

Server / Client 를 나누어서 어떻게 처리하는지 살펴보자

```bash
# NBD 서버사이드에서는 
# 아래 패키지를 설치하고
# /etc/nbd-server/config 를 수정하여
# 공유할 디바이스 경로 및 공유설정을 선언 및 처리한다
# 이에 대해서는 man nbd-server 를 통해
# man page 또한 볼 수 있다.
sudo apt install nbd-server

sudo vim /etc/nbd-server/config

# 아래는 대표적인 설정 예시
[generic]
user = nbd                # nbd-server를 실행할 사용자
group = nbd               # nbd-server를 실행할 그룹
port = 10809              # 포트 (기본값 10809)
includedir = /etc/nbd-server/conf.d   # 추가 설정 디렉토리
# 섹션 이름은 임의로 정해도 되지만, 
# 클라이언트가 -N로 이름을 지정해 연결할 때 사용
# 이름은 중복되지 않도록 주의
[partition2]
exportname = /dev/sdb2
[partition3]
exportname = /dev/sdb3
                          
# 이후 nbd-server 데몬을 재시작하여
# 설정을 적용해준다
sudo systemctl restart nbd-server
```
```bash
# NBD 클라이언트 사이드에서는 
# 아래 패키지를 설치하고
# 커널 모듈 및 nbd-client 를 실행하여
# 디스크를 추가한다
sudo apt install nfs-common

# nbd 커널 모듈 로드
# - /dev/nbd0, /dev/nbd1 등 블록 장치 사용하기 위해 필요
sudo modprobe nbd

# 부팅 시 자동 로드 설정하기 위해
# /etc/modules-load.d 에 설정파일을 추가한다
# modules.conf 에 nbd 를 적으면
# 이후 재부팅 시 자동으로 modprobe nbd 실행한다
echo "nbd" | sudo tee /etc/modules-load.d/nbd.conf


# nbd-client 를 통해 네트워크 블록 디스크를 추가한다
# 이 때 Server 에서 선언해둔
# 파티션 섹션 이름을 사용해야한다
sudo nbd-client ${server-ip} -N ${export-이름} /dev/nbd0
sudo nbd-client 100.128.28.1 -N partition2 /dev/nbd0

# 이후 장치 추가된 것을 확인해준다
# -l                     : list, 사용가능한 NBD 확인
# lsblk                  : list block devices, 디바이스 마운트 확인
sudo nbd-client -l
lsblk

# 이제 원하는 디렉토리에
# NBD 디렉토리를 마운트한다
sudo mkdir -p /mnt
sudo mount /dev/nbd0 /mnt

# NBD 를 끊는 방법은
# 1. 마운트를 해제하고
# 2. -d 옵션을 통해 NBD 디바이스를 해제
# 3. nbd 커널 모듈을 언로드
sudo umount /mnt
sudo nbd-client -d /dev/nbd0
sudo modprobe -r nbd
```

## Logical Volume Manager

### LVM 이란

[https://www.linux-tips-and-tricks.de/en/general/282-was-kann-lvm-und-warum-sollte-man-lvm-benutzen-what-can-lvm-do-form-me-and-why-should-i-use-lvm-2](https://www.linux-tips-and-tricks.de/en/general/282-was-kann-lvm-und-warum-sollte-man-lvm-benutzen-what-can-lvm-do-form-me-and-why-should-i-use-lvm-2)
[https://greencloud33.tistory.com/41](https://greencloud33.tistory.com/41)
일반 디스크 파티셔닝은 **디스크 주소(섹터)를 순차적으로 나누어서 할당**한다.
그래서 특정 파티션을 확장하거나 축소하려면, **그 뒤에 있는 파티션들이 물리적 위치를 모두 밀고 당겨야 한다**
이로 인해 파티션 구조를 건드리고, 리사이징 작업이 번거롭고 위험하다

이를 극복하고자 LVM 을 사용한다. 
LVM은 물리 디스크를 그대로 파티션으로 나누지 않는다
대신, 물리 디스크를 PV 라는 단위로 쪼개고 하나의 그룹으로 묶은 뒤 ( PV → VG)
이 그룹을 원하는 논리적 단위로 쪼개어 파일 시스템에 할당한다 (VG → LV → FileSystem)
***PE(Physical Extent) : PV를 구성하는 일정한 크기의 Block, 1PE == 4MB
***PV(Physical Volume) : PE 들을 묶어 실제 디스크 장치를 분할한 파티션 단위
***VG(Volume Group) : PV들이 모은 그룹, 이렇게 모인 바이트들을 LV 가 원하는 크기만큼 LV 에게 할당한다
***LV(Logical Volume) : PV 로부터 사용자가 할당받은 볼륨, 해당 볼륨은 LE 로 구성된다
***LE(Logical Extent) :  PV 내의 물리적 저장 영역을 가리키는 LV의 논리적 저장 영역

![](/images/notion/a315d12bfb178e6b.png)
![](/images/notion/42d4e5f0304495c9.png)

> 처리 흐름 순서
> **LV가 특정 마운트를 통해 VG를 가리키는 구조**
> 제거 축소 순서

### 패키지 설치

```bash
# LVM 에 대해서는  
# 아래 패키지를 설치하고,  
# 디스크/디바이스를 LVM PV로 초기화한 뒤  
# VG를 생성하고, 그 안에서 LV를 생성·조정하며,  
# 헷갈리는 부분은 man lvm 을 통해 참고한다.

sudo apt install lvm2
```

### 기존 디바이스/파티션 확인

```bash
# `lvmdiskscan`는 
# LVM이 인식할 수 있는 디바이스/파티션을 확인하는 명령어이다.  
# 출력에서 `/dev/nvme0n1p3`가 LVM PV로 등록되어 있음을 확인할 수 있다.
lvmdiskscan
  /dev/mapper/dev-disk-byx2dpartlabel-diskx2dmainx2dswap [      16.00 GiB]
  /dev/nvme0n1p1                                         [       1.00 GiB]
  /dev/nvme0n1p2                                         [      16.00 GiB]
  /dev/nvme0n1p3                                         [     914.51 GiB] LVM physical volume
  1 disk
  2 partitions
  0 LVM physical volume whole disks
  1 LVM physical volume
```

### PV 초기화

```bash
# pvcreate 는 디바이스 스토리지를 LVM 용 PV 로 초기화하는 명령어다
# pvcreate ${device-path},,,, 으로 사용한다
# 이 디바이스들은 이제 LVM에서 관리 가능한 스토리지 블록으로 간주된다.
sudo pvcreate /dev/sdc /dev/sdd
```

### PV 확인

```bash
# pvs 는 현재 PV 들을 확인
# VG    : 이 PV가 속해 있는 Volume Group 이름
# Fmt   : 어떤 LVM 포맷(형식)으로 관리되는지.
# Attr  : PV의 속성(a: 활성화됨, t: thin-pool ,,,)
# PSize : PhysicalSize, 총 물리 크기
# PFree : PhysicalFree, PV에서 현재 사용 중이지 않는 여유로운 공간
❮ sudo pvs
  PV             VG         Fmt  Attr PSize    PFree
  /dev/nvme0n1p3 homelab_vg lvm2 a--  <914.51g <12.02g
```

### PV 제거

```bash
# pvremove 는 PV 에서 디바이스를 완전히 제거한다
# 이 명령 이후에는 `/dev/sde`는 LVM 관리 대상이 아니며, 
# 일반 디스크/파티션으로 취급된다.
sudo pvremove /dev/sde
```

### VG 생성

```bash
# vgcreate 는 PV 에 대한 VG 으로 묶는다
# vgcreate ${vg-name} ${device-path},,,, 으로 사용한다
# 이 VG는 앞으로 LV(Logical Volume)를 생성할 때 사용되는 스토리지 풀이 된다.
sudo vgcreate my_volume /dev/sdc /dev/sdd
```

### VG 확장 / 제거

```bash
# vgextend 는 존재하는 VG 에 디바이스를 추가하여 풀을 확장하는 명령어다
# vgextend ${vg-name} ${device-path},,,, 으로 사용한다
# 이렇게 하면 이후 LV 생성/확장 시 더 많은 공간을 사용할 수 있다.
sudo vgextend my_volume /dev/sde
```
```bash
# vgreduce 는 존재하는 VG 에 디바이스를 제거하여 풀을 축소하는 명령어다
# vgreduce ${vg-name} ${device-path},,,, 으로 사용한다
# 이 명령은 해당 PV에 LV가 더 이상 사용 중이지 않을 때만
# 안전하게 사용할 수 있다.
sudo vgreduce my_volume /dev/sde
```

### VG 목록 및 상태확인

```bash
# 현재 존재하는 VG 목록과 각 VG의  
# 크기, 사용량, 남은 공간 등을 확인하는 명령어이다.  
sudo vgs
```

### LV 생성 및 조정 & 파일시스템까지 리사이징

```bash
# lvcreate 는 VG 에서 새로운 LV 를 생성하는 명령어이다.
# lvcreate --size <크기> --name <LV 이름> <VG 이름> 으로 사용한다
# 이렇게 하면 VG 안에서 지정한 크기만큼의 LV를 잘라내고
# 이 LV에 파일시스템을 만들고 마운트해서 일반 디스크처럼 사용할 수 있다
lvcreate --size 2G --name partiona1 my_volume
lvcreate --size 2G --name partiona2 my_volume

# lvresize는 기존 LV 의 크기를 조정하는 명령어이다.
# lvresize --size <크기> <LV 경로>
# 혹은
# lvresize --extents <비율/갯수> <LV 경로>
#
# 다만, 이 옵션만 사용하면 파일시스템은 그대로 유지된다 
# 이를 위해 --resizefs 를 통해 LV의 크기를 조정하면서, 
# 연결된 파일시스템까지 자동으로 리사이징하게끔 할 수 있다.
sudo lvresize --extents 100%VG my_volume/partition1
sudo lvresize --size 2G my_volume/partition1
sudo lvresize --resizefs --size 2G my_volume/partition1
```

### LV 상세정보 확인

```bash
# lvs는 현재 존재하는 모든 LV 의 간단한 요약 정보를 보여주는 명령어이다.
# 한 눈에 LV 구성 요약을 볼 수 있다.
❮ sudo lvs
  LV            VG         Attr       LSize   Pool          Origin Data%  Meta%  Move Log Cpy%Sync Convert
  data          homelab_vg Vwi-aotz-- 600.00g data_thinpool        1.74
  data_thinpool homelab_vg twi-aotz-- 300.00g                      3.47   3.66
  root          homelab_vg -wi-ao---- 200.00g
  vault         homelab_vg -wi-a-----  20.00g
  vm_thinpool   homelab_vg twi-aotz-- 380.00g                      20.67  4.33
  vms           homelab_vg Vwi-aotz-- 800.00g vm_thinpool  
```
```bash
# lvdisplay는 LV 하나 하나의 상세 정보를 보여주는 명령어이다.
# 연결된 VG, 크기, 블록 사이즈, 매핑 정보(어떤 PE/디바이스와 연결되어 있는지) 
# 등등 세부 내용을 출력한다.
❮ sudo lvdisplay
  --- Logical volume ---
  LV Name                vm_thinpool
  VG Name                homelab_vg
  LV UUID                5J8GO8-xB4f-vr0q-xqO0-Ftkb-aBpm-J6MSaB
  LV Write Access        read/write (activated read only)
  LV Creation host, time nixos, 2026-01-16 01:49:54 +0900
  LV Pool metadata       vm_thinpool_tmeta
  LV Pool data           vm_thinpool_tdata
  LV Status              available
  # open                 0
  LV Size                380.00 GiB
  Allocated pool data    20.67%
  Allocated metadata     4.33%
  Current LE             97280
  Segments               1
  Allocation             inherit
  Read ahead sectors     auto
  - currently set to     256
  Block device           254:7

  --- Logical volume ---
  LV Name                data_thinpool
  VG Name                homelab_vg
  LV UUID                9VYblk-0Slz-om2G-IWxq-aSef-a523-U0za61
  LV Write Access        read/write (activated read only)
  LV Creation host, time nixos, 2026-01-16 01:49:54 +0900
  LV Pool metadata       data_thinpool_tmeta
  LV Pool data           data_thinpool_tdata
  LV Status              available
  # open                 0
  LV Size                300.00 GiB
  Allocated pool data    3.47%
  Allocated metadata     3.66%
  Current LE             76800
  Segments               1
  Allocation             inherit
  Read ahead sectors     auto
  - currently set to     512
  Block device           254:3

  --- Logical volume ---
  LV Path                /dev/homelab_vg/data
  LV Name                data
  VG Name                homelab_vg
  LV UUID                KKFC25-VvnG-TFdJ-H3WK-TAEU-5EMl-DNCko3
  LV Write Access        read/write
  LV Creation host, time nixos, 2026-01-16 01:49:55 +0900
  LV Pool name           data_thinpool
  LV Status              available
  # open                 1
  LV Size                600.00 GiB
  Mapped size            1.74%
  Current LE             153600
  Segments               1
  Allocation             inherit
  Read ahead sectors     auto
  - currently set to     512
  Block device           254:8

  --- Logical volume ---
  LV Path                /dev/homelab_vg/root
  LV Name                root
  VG Name                homelab_vg
  LV UUID                54vGeW-qeWY-MVBf-0Aq3-4NJY-cqFR-FUw1vv
  LV Write Access        read/write
  LV Creation host, time nixos, 2026-01-16 01:49:55 +0900
  LV Status              available
  # open                 1
  LV Size                200.00 GiB
  Current LE             51200
  Segments               1
  Allocation             inherit
  Read ahead sectors     auto
  - currently set to     256
  Block device           254:9

  --- Logical volume ---
  LV Path                /dev/homelab_vg/vault
  LV Name                vault
  VG Name                homelab_vg
  LV UUID                9cfpkR-2bbP-fAiJ-JY39-Szlt-0kQs-ySaW3P
  LV Write Access        read/write
  LV Creation host, time nixos, 2026-01-16 01:49:55 +0900
  LV Status              available
  # open                 0
  LV Size                20.00 GiB
  Current LE             5120
  Segments               1
  Allocation             inherit
  Read ahead sectors     auto
  - currently set to     256
  Block device           254:10

  --- Logical volume ---
  LV Path                /dev/homelab_vg/vms
  LV Name                vms
  VG Name                homelab_vg
  LV UUID                GpVUsX-pqXj-6qXd-pYh4-DvKc-16zS-Ki3BDm
  LV Write Access        read/write
  LV Creation host, time nixos, 2026-01-16 01:49:55 +0900
  LV Pool name           vm_thinpool
  LV Status              available
  # open                 1
  LV Size                800.00 GiB
  Mapped size            9.82%
  Current LE             204800
  Segments               1
  Allocation             inherit
  Read ahead sectors     auto
  - currently set to     256
  Block device           254:11
```

### LV 삭제

```bash
umount /data
lvremove /dev/my_volume/data_lv
```




## Monitoring Filesystem

```bash
# sysstat 을 설치하여 iostat, pidstat 을 활용
# iostat : i/o data stat
# pidstat : process id stat
sudo apt install sysstat

# iostat 은 historical data since bootstrap 을 보여준다
# tps : ??
# kB_read/s : ??
# kB_wrtn/s : ??
# kB_read : ??
# tps 가 너무 높고 read 가 많으면 ~~ 한 디바이스
# tps 가 너무 높고 write 가 많으면 ~~ 한 디바이스
systat
systat 1 # 숫자를 인자로 넘기면 n 초마다 상태를 업데이트함

# -d : device, 어느 device 에 어떤 process 가 처리 중인지 보여줌 
pidstat -d
pidstat -d 1 # 숫자를 인자로 넘기면 n 초마다 상태를 업데이트함


```

## ACLs

```bash

# ACL 을 통해 특정 권한의 범위를 특정 유저에게 부여할 수 있음
sudo apt install acl 

# sudo setfacl --modify user:${user-name}:${option} ${file}
# option : ---,r, rw, rwx
# group 에 대해 권한지정하고자 한다면
# sudo setfacl --modify group:${group-name}:${option} ${file}
sudo setfacl --modify user:jeremy:rw file3  
sudo setfacl --modify group:sudo:rw file3
# 특정 디렉토리 산하의 모든 디렉토리와 파일들에
# 동일 정책을 할당하고 싶다면
# —recursive 를 사용한다 
sudo setfacl --recursive --modify group:sudo:rw file3

# sudo setfacl --modify user:${user-name}:${option} ${file}
# option : ---,r, rw, rwx
# -remove 를 토
# sudo setfacl --modify group:${group-name}:${option} ${file}
sudo setfacl —-remove group:sudo:rw file3  

# ls -l 보면 맨 뒤에 + 가 붙는데
# 그게 acl 적용된 것이라고 보면 된다
# getfacl 을 통해 파일의 권한에 대한 것을 볼 수 있다
getfacl file3
❮ getfacl pp_table.bin
# file: pp_table.bin
# owner: limjihoon
# group: users
user::rw-
group::r--
other::r--

# 모든 사용자에게 권한을 적용하게 하고싶으면
# 권한마스크를 사용한다
sudo setfacl --modify mask:r file3

# chattr 를 통해 append only 를 지정
sudo chattr +a newfile
# -a 옵션을 통해 제거
sudo chattr -a newfile

# immutable 상태, 즉 아예 수정불가 상태를 지정
sudo chatter -i newfile

# immutable 상태를 보려면 lsattr 사용
lsattr newfile
```




# 07. Mock Exams


Execute the `/home/bob/script.sh` script and save all `normal output` (except `errors/warnings`) in the `/home/bob/output_stdout.txt` file.
Validate "/home/bob/output_stdout.txt" file.




# How? 어떻게 씀?

---



# Reference

---
