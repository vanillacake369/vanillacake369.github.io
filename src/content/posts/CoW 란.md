---
title: "CoW 란 ?"
description: ""
date: 2025-12-30
tags: [Linux]
category: uncategorized
lang: ko
draft: false
---

# Why? 왜 배움?

---

책 Modern Linux 를 보다가 CoW 에 대한 개념을 알게 되었다.
그리고 시간이 지나서 ZFS 에서 CoW 기능을 적극 활용하는 것을 보고
이 참에 공부해보고자 아래와 같이 정리해보았다.

- Cow 란 무엇인가?
- Cow 동작원리는 어떻게 되는가?
- Cow 는 언제 호출되는가?
- Cow 를 설치 및 호출하려면 어떻게 하는가?
- Cow 가 호출된 것을 확인하려면 어떻게 하는가?
- Ubuntu 상에서 실습



# What? 뭘 배움?

---

## CoW 란 ?

Copy-on-Write(쓰기 시 복사) 는 자원을 효율적으로 공유하기 위한 최적화 전략이다. 
데이터가 수정되기 전까지는 실제 복사본을 만들지 않고 원본을 공유하다가, 
**수정이 발생하는 시점에만** 해당 부분의 복사본을 만들어 기록하는 방식을 의미한다.

## CoW 동작 원리

CoW는 “데이터를 절대 덮어쓰지 않는다(Never Overwrite)" 는 원칙을 따른다.

![](/images/notion/9b246367f43bdf93.png)

1. 포인터 복사
2. **수정 발생**
3. **업데이트**

## CoW는 언제 호출되는가?

- **파일 복제 시:** `cp --reflink` 명령어를 사용하거나 ZFS/Btrfs 스냅샷을 생성할 때 즉시 호출된다.
- **프로세스 생성 시:** 리눅스 커널에서 `fork()` 시스템 콜이 발생하면 부모 프로세스의 메모리 페이지를 자식과 공유하며 CoW 상태로 설정한다.
- **데이터 수정 시:** 공유된 상태에서 쓰기(Write) 작업이 감지되면 하드웨어 예외(Page Fault)가 발생하고, 커널이 실제 복사 및 수정 작업을 수행한다.

## CoW 설치 및 호출 방법

CoW는 별도의 프로그램 설치가 아니라, 이를 지원하는 파일 시스템(ZFS, Btrfs 등) 을 사용하거나 **커널 시스템 콜**을 이용하는 소프트웨어적 아키텍처다.

- **ZFS에서 호출:** 스냅샷을 생성하면 즉시 CoW 메커니즘이 작동하여 현재 상태를 보존한다.
- **일반 파일 복제 시 (Reflink):** 지원하는 파일 시스템(XFS, Btrfs)에서 실제 데이터 복사 없이 포인터만 복사한다.

## CoW 호출 확인 방법

CoW가 정상적으로 작동했는지 확인하는 가장 확실한 방법은 **실제 디스크 점유량**을 대조하는 것이다.

1. **용량 대조:** 1GB 파일을 CoW 방식으로 복사했을 때, 시스템의 전체 사용 가능한 디스크 용량이 1GB만큼 줄어들지 않는다면 CoW가 성공한 것이다.
2. **파일 시스템 전용 도구:** ZFS의 경우 `zfs list` 명령을 통해 `REFER`(참조 용량)와 `USED`(실제 물리적 점유 용량)의 차이를 확인한다.



# How? 어떻게 씀?

---

## Ubuntu 상에서의 실습

Ubuntu 환경에서 `reflink` 기능을 사용하여 CoW를 직접 체험할 수 있다. (XFS, Btrfs 혹은 ZFS 파티션 권장)

### 실습 시나리오

```bash
# 1. 100MB 크기의 대용량 더미 파일 생성
dd if=/dev/urandom of=original_file bs=1M count=100

# 2. CoW 방식으로 복제 (실제 복사 없이 포인터만 생성)
cp --reflink=always original_file cow_copy

# 3. 디스크 용량 확인 (파일은 두 개지만 실제 점유 공간은 100MB인 것을 확인)
ls -lh original_file cow_copy
df -h .

# 4. 복제본 파일의 내용 수정 (이 시점에 비로소 실제 데이터 복사가 발생)
echo "New Data Added" >> cow_copy

# 5. 결과 확인
# ZFS나 Btrfs라면 전용 도구를 통해 해당 파일이 차지하는 고유 블록 용량을 확인할 수 있다.
```



# Reference

---

1. [ZFS Copy-on-Write Transactions](https://www.google.com/search?q=https%3A%2F%2Fdocs.oracle.com%2Fcd%2FE19253-01%2F819-5461%2Fghfba%2Findex.html)
2. [ZFS Basics - How CoW Works](https://openzfs.github.io/openzfs-docs/Getting%20Started/index.html)
3. [The Linux Kernel - Memory Management (CoW)](https://www.kernel.org/doc/html/latest/admin-guide/mm/concepts.html)
4. **Modern Linux (Book):** *Chapter 4: Filesystems and Storage*
5.  [`man cp`](https://man7.org/linux/man-pages/man1/cp.1.html#:~:text=When%20%2D%2Dreflink%5B%3D,copy%20is%20performed.)[ (Reflink section)](https://man7.org/linux/man-pages/man1/cp.1.html#:~:text=When%20%2D%2Dreflink%5B%3D,copy%20is%20performed.)
