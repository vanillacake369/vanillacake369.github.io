---
title: "로컬 Nvim 통해 SSH 접속 서버에서 코딩하기"
description: "로컬 Nvim 설정을 그대로 원격 서버에서 쓰고 싶었다."
date: 2026-01-11
tags: [linux, tools, neovim]
category: uncategorized
lang: ko
draft: false
---

# Why? 왜 배움?

---

로컬 Nvim 설정을 그대로 원격 서버에서 쓰고 싶었다.
그대로 SSH 접속한 경우 원격서버에 깔린 nvim 과 설정을 바라보게된다. 
어떻게하면 SSH 를 사용하면서 로컬 nvim 설정을 그대로 사용하여 코딩할 수 있을까?

# What? 뭘 배움?

---

> 💡 [https://github.com/nosduco/remote-sshfs.nvim](https://github.com/nosduco/remote-sshfs.nvim)

## SSHFS

- SFTP(Secure FTP)를 기반으로 작동하는 **네트워크 파일 시스템 클라이언트**입니다.
- 원격 서버의 디렉토리를 로컬 머신의 특정 폴더(Mount Point)에 **'거울'처럼 연결**해 주는 도구입니다.

## Mac 에서는 macfuse 지원 제한

mac 이슈에 따라 아래를 참고하여 설치하도록 하자

```bash
# From github.com/macos-fuse-t
brew install macos-fuse-t/homebrew-cask/fuse-t
brew install macos-fuse-t/homebrew-cask/fuse-t-sshfs
```

> ⚠️ 핵심 이슈: macFUSE 사용 불가

# How? 어떻게 씀?

---

### **설치 (Installation)**

`macos-fuse-t` 레포지토리를 탭하여 **fuse-t** 기반의 sshfs를 설치

```bash
# 1. macos-fuse-t 탭 추가
brew tap macos-fuse-t/cask

# 2. fuse-t 및 fuse-t-sshfs 설치
brew install fuse-t
brew install macos-fuse-t/homebrew-cask/fuse-t-sshfs
```

### **사용법 (Usage)**

1. **마운트 (연결하기)**
2. **언마운트 (연결 끊기)**



### **주의점 (Caveats)**

- **네트워크 의존성:** 네트워크가 끊기면 연결된 폴더도 응답을 멈춥니다.
- **성능 제한:** 대량의 작은 파일을 한꺼번에 읽거나(LSP 인덱싱 등), 기가비트급 속도가 필요한 작업에는 네트워크 지연(Latency) 때문에 느릴 수 있습니다.
- **권한 문제:** 마운트 시 `o allow_other` 옵션이 필요할 수 있으며, macOS 시스템 설정에서 '전체 디스크 접근 권한'을 요구할 수 있습니다.

### **삭제 (Uninstallation)**

더 이상 필요하지 않을 경우 `brew`를 통해 깨끗하게 삭제합니다.

```bash
# 1. 설치된 패키지 삭제
brew uninstall fuse-t-sshfs
brew uninstall fuse-t

# 2. 탭 제거 (선택 사항)
brew untap macos-fuse-t/cask
```

---

# Reference

---
