---
title: "tmux vs screen vs zellij"
description: "화면 분할 및 여러 세션 관리를 위해 tmux 와 screen 을 사용해보고자 소개 및 장단점 비교를 해보았다."
date: 2025-05-25
tags: [linux]
category: uncategorized
lang: ko
draft: false
---

# Why? 왜 배움?

---

화면 분할 및 여러 세션 관리를 위해 tmux 와 screen 을 사용해보고자 소개 및 장단점 비교를 해보았다.


# What? 뭘 배움?

---

- 터미널 멀티플렉서 터미널에서 여러 개의 쉘 세션을 한 번에 관리할 수 있도록 해주는 도구
- 각 툴은 역사와 철학, 기능면에서 차이 존재
- 공통적으로 “세션 분리·재접속”, “창(윈도우)/패인 분할”, “키 바인딩을 통한 직관적 제어”를 제공.

## Screen

- **역사 & 특징**
- **주요 사용법**

## Tmux

- **역사 & 특징**
- **주요 사용법**

## Zellij

- **역사 & 특징**
- **주요 사용법**

## Tmux vs Screen vs Zellij

| **기능(Function)** | **Screen** | **Tmux** | **Zellij** |
| --- | --- | --- | --- |
| 세션 시작 (이름 지정) | `screen -S session_name` | `tmux new -s session_name` | `zellij --session session_name` ([zellij.dev](https://zellij.dev/documentation/commands?utm_source=chatgpt.com)) |
| 새 창(탭) 생성 | `Ctrl+a c` | `Ctrl+b c` | `Ctrl+p t` ([zellij.dev](https://zellij.dev/documentation/keybindings?utm_source=chatgpt.com)) |
| 다음 창(탭) 전환 | `Ctrl+a n` | `Ctrl+b n` | `Ctrl+p n` ([GitHub](https://github.com/zellij-org/zellij/issues/1399?utm_source=chatgpt.com)) |
| 이전 창(탭) 전환 | `Ctrl+a p` | `Ctrl+b p` | `Ctrl+p p` ([GitHub](https://github.com/zellij-org/zellij/issues/1399?utm_source=chatgpt.com)) |
| 세션 재접속 | `screen -r [ID/NAME]` | `tmux attach -t session_name` | `zellij attach --session session_name` ([zellij.dev](https://zellij.dev/documentation/commands?utm_source=chatgpt.com)) |
| 창(세션) 이름 변경 | `Ctrl+a :sessionname 새이름` | `Ctrl+b $` | (기본 제공 없음
→ session-manager 활용) |
| 수직 분할 | `Ctrl+a | ` | `Ctrl+b %` |
| 수평 분할 | `Ctrl+a S` (혹은 `Ctrl+a -`) | `Ctrl+b "` | `Ctrl+p d` ([Reddit](https://www.reddit.com/r/zellij/comments/17p04cr/how_to_control_new_pane/?utm_source=chatgpt.com)) |
| 패인 간 이동 | `Ctrl+a ←/→/↑/↓` | `Ctrl+b ←/→/↑/↓` | `Ctrl+p ←/↑/↓/→` ([zellij.dev](https://zellij.dev/documentation/keybindings?utm_source=chatgpt.com)) |
| 세션 분리(detach) | `Ctrl+a d` | `Ctrl+b d` | `Ctrl+o d` ([TMPDIR](https://community.tmpdir.org/t/zellij-notes/1325?utm_source=chatgpt.com)) |

| **특징(Features)** | **Screen** | **Tmux** | **Zellij** |
| --- | --- | --- | --- |
| 기본 설치(native package) | ✅ | ❌ | ❌ |
| 키 바인딩 지원 | ✅ | ✅ | ✅ |
| 세션 저장·전환 | ✅ | ✅ | ✅ |
| 스크롤(Scrollback) | ✅ | ✅ | ✅ |
| 다중 연결(multi-attach) | ✅ | ✅ | ✅ |


# 결국 무엇을 쓰기로 하였나?

---

필자는 zellij 의 장점을 높게 사서 한동안 zellij 에 정착하기로 하였다.

- 키 바인딩의 변화점을 한 눈에 볼 수 있음
- 레이아웃에 대한 내장 플러그인 탑재
- tmux 키바인딩 또한 지원
- session resurrection : 죽였던 session 들에 대해서 볼 수 있고 살릴 수 있음


기존에 tmux 사용 중이고, 이미 여러 플러그인을 탑재했다면 tmux 에 정착할 것 같다.
하지만 tmux 의 learning curve 보다 좀 더 단순한 zellij 를 사용해보기로 하였다.

# Reference

---

[https://rrmartins.medium.com/zellij-vs-tmux-complete-comparison-or-almost-8e5b57d234ae](https://rrmartins.medium.com/zellij-vs-tmux-complete-comparison-or-almost-8e5b57d234ae)
[https://www.youtube.com/watch?v=ZPfQS5FHNYQ&pp=ygUGemVsbGlq](https://www.youtube.com/watch?v=ZPfQS5FHNYQ&pp=ygUGemVsbGlq)
[https://www.youtube.com/watch?v=ZndhImXIGlg&ab_channel=DevOpsToolkit](https://www.youtube.com/watch?v=ZndhImXIGlg&ab_channel=DevOpsToolkit)
