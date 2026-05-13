---
title: "Aerospace :: yabai 의 한계점을 극복한 mac window manager"
description: "불편한 mac 기본 window manager 와 yabai 대신 aerospace 를 사용해보는 건 어떨까?"
date: 2025-12-22
tags: []
category: uncategorized
lang: ko
draft: false
---

![](/images/velog/e27fca0003d9ddec.png)


# Why? 왜 배움?

---

mac 에서는 기본적인 tilling window 처리가 그냥 똥이다.

특히 linux distro 에서는 window manager 들을 바꿀 수 있는데 반면, 

— hyprland, i3, Sway (for Wayland), Awesome, bspwm, Qtile ,,, — 

mac 에서는 mac 전용의 tilling manager 앱과 설정을 따로 구성해주어야 한다.

옛날에는 tilling manager 의 중요성을 모르고 살았지만, 점점 개발하면 할수록 답답하여 공부 및 적용하게 되었다.

# What? 뭘 배움?

---

## yabai, skhd, sketchybar

위 세 가지 프로그램을 설정하여 tilling window / status bar 를 설정할 수 있다.

각각이 어떤 프로그램인지를 알아보자

### yabai

yabai 는 macOS용 i3/bspwm 스타일의 윈도우 매니저로,

윈도우를 자동으로 타일링하고, 포커스 이동, 윈도우 이동/리사이즈, 워크스페이스 관리 등을 처리한다.

BSP 를 통해 floating window, stacking window 레이아웃을 지원하며

working space 를 관리할 수 있다.

다만 치명적인 단점이 명령어에 대해 선언만 할 수 있고, 해당 명령어를 호출할 수 있는 keymapping 설정이 불가능하다는 것이다.

이를 보완하기 위해 skhd 라는 것을 같이 써주어야만 한다.

```bash
#!/bin/bash

# by default, tile all windows
yabai -m config layout bsp

# New window spawns to the right if vertical split, or bottom if horizontal split
yabai -m config window_placement second_child

# padding
yabai -m config top_padding 12
yabai -m config bottom_padding 12
yabai -m config left_padding 12
yabai -m config right_padding 12
yabai -m config window_gap 12

# mouse settings
yabai -m config mouse_follows_focus on

yabai -m config mouse_modifier ctrl
# set modifier + left-click drag to move window (default: move)
yabai -m config mouse_action1 move
# set modifier + right-click drag to resize window (default: resize)
yabai -m config mouse_action2 resize

yabai -m mouse_drop_action swap

yabai -m rule --add app="^System Settings$" layer=above manage=off
yabai -m rule --add app="^Calculator$" manage=off
yabai -m rule --add app="^Karabiner-Elements$" manage=off

yabai -m rule --add app="^Alacritty$" space=^1

# yabai -m config external_bar all:32:0
```

### skhd

skhd 는 macOS용 키보드 단축키 데몬이다.

yabai 개발자가 함께 만든 도구로, yabai와 함께 사용하여 키보드로 윈도우를 제어한다. 

아래와 같이 `~/.skhdrc` 를 생성하여 설정한다.

```bash
# --- Changing Focus ---
# change window focus within space
alt - j : yabai -m window --focus south
alt - k : yabai -m window --focus north
alt - h : yabai -m window --focus west
alt - l : yabai -m window --focus east

# change focus to display left and right
alt - s: yabai -m display --focus west
alt - g: yabai -m display --focus east

# --- Modify Layout ---

# balance out tree 
hyper - e : yabai -m space --balance

# rotate layout clockwise
hyper - r : yabai -m space --rotate 270

# flip along y-axis
hyper - y : yabai -m space --mirror y-axis

# flip along x-axis
hyper - x : yabai -m space --mirror x-axis

# --- Moving Windows Arround ---

# swap windows within space
hyper - j : yabai -m window --swap south
hyper - k : yabai -m window --swap north
hyper - h : yabai -m window --swap west
hyper - l : yabai -m window --swap east

# maximize a window
hyper - m : yabai -m window --toggle zoom-fullscreen

# toggle window float
hyper - t : yabai -m window --toggle float --grid 4:4:1:1:2:2

# move window and split
ctrl + alt - j : yabai -m window --warp south
ctrl + alt - k : yabai -m window --warp north
ctrl + alt - h : yabai -m window --warp west
ctrl + alt - l : yabai -m window --warp east

# move window to display left and right
hyper - s : yabai -m window --display west; yabai -m display --focus west;
hyper - g : yabai -m window --display east; yabai -m display --focus east;

#move window to prev and next space
hyper - p : yabai -m window --space prev;
hyper - n : yabai -m window --space next;

# move window to space #
hyper - 1 : yabai -m window --space 1;
hyper - 2 : yabai -m window --space 2; 
hyper - 3 : yabai -m window --space 3;
hyper - 4 : yabai -m window --space 4;
hyper - 5 : yabai -m window --space 5;
hyper - 6 : yabai -m window --space 6;
hyper - 7 : yabai -m window --space 7;

# stop/start/restart yabai
ctrl + alt - q : brew services stop yabai
ctrl + alt - s : brew services start yabai
ctrl + alt - r : brew services restart yabai
```

### sketchybar

이제 yabai 와 skhd 로 윈도우 매니징 및 워킹 스페이스를 관리할 수 있게되었다.

그렇다면 내가 현재 focus 하고 있는 윈도우는 어디이고, 어느 워킹스페이스에 어떤 앱들이 있는지

상태 체크는 어떻게 할 것인가?

sketchybar 는 이런 기능을 제공하기 위한 것으로, 커스터마이징 가능한 상태바 프로그램이다

hyprland waybar 와 같이 말이다.

- 현재 워크스페이스가 무엇인지

- 각 워크스페이스에 열려있는 앱들이 무엇인지

- 현재 focus 되어 있는 앱은 무엇인지

- 시스템 정보

등등을 표시할 수 있다.

대부분의 sketchybar 는 1) 직접 구현하거나 2) [setups discussions](https://github.com/FelixKratz/SketchyBar/discussions/47) 서 사용자들이 만들어둔 설정을 빌려다가 사용한다.

![](/images/velog/7f6cf52a99a29882.png)

### Critical Issue

그렇게 세팅하던 와중 위 세 가지 조합의 치명적 단점이 거슬렸다.

1. 키 조합이 분산되어 있어 설정 뿐 아니라 관리가 너무 어려웠다.

2. sketchybar 커스터마이징의 학습곡선이 너무 높다

3. 프로세스가 세 개나 활성화되어 있어야 했다.

이 세 가지 조합은 간단한 window manager 를 위해서 몇 날 몇 일의 프로그래밍을 해야하는 지경에 이르르게 된다

또한 세 개의 앱이 계속 background 상태로 돌아가고 있어야 하고, 

안 그래도 ram 관리 때문에 스트레스인데 생각보다 버벅이고 400mb 정도 차지한다.

## aerospace

위와 같은 단점 때문에 쉽게 yabai 스택에 정착하지 못 했다.

그래서 통합 솔루션은 없을까? 찾던 와중 yabai 를 소개해준 유튜버가 aerospace 로 정착한 것을 알게 되었다.

https://github.com/mehd-io/dotfiles/tree/main?tab=readme-ov-file

그렇게 나도 aerospace 로 이관해보았고, 위에서 나열한 모든 단점들이 해소되었다.

yabai 는 mac workspace 에 대해 직접 의존하는 반면, aerospace 는 자체 workspace 에뮬레이션을 구현한다.

aerospace 를 쓴다면 skhd 는 불필요하다. 단축키 설정과 워크스페이스 설정을 하나의 .toml 에서 선언되기 때문이다.

workspace 상태바를 기본 menu bar 에 띄워주기 때문에 sketchybar 가 없어도 된다.

![](/images/velog/35057eb80a6c8029.png)

위처럼 해소된 점들을 나열해보자면 아래와 같다.

|  | Aerospace | Yabai |
| --- | --- | --- |
| **핫키 관리** | 내장 | skhd 별도 설치 필요 |
| **SIP 비활성화** | 불필요 | 일부 기능에 필요 |
| **설정 형식** | `.toml` (단일 파일) | `.yabairc` + `.skhdrc` (복수 파일) |
| **워크스페이스** | 자체 에뮬레이션 | macOS Spaces API 의존 |
| **모니터 핫플러그** | 안정적 | 윈도우 유실, 재시작 필요 [Keyruu](https://oblivion.keyruu.de/MacOS/Window-Management) |
| **모드 표시** | 네이티브 트레이 아이콘 | sketchybar 등 별도 설정 필요 |
| **앱별 규칙** | `on-window-detected` 내장 | 별도 스크립트 작성 필요 |
| **macOS 업데이트 호환** | 높음 (public API 사용) | 낮음 (private API 의존) |
| **학습 곡선** | 낮음 | 높음 |
| **커스터마이징** | 중간 | 높음 (스크립트 자유도) |
| RAM 처리율 | 116M | 380M (세 가지 스택 통합 기준) |

특히 yabai 의 최대 단점인 코드분산 & SIP 활용, 워크스페이스 생성/삭제 한계점을 극복했다는 점과

RAM 사용률이 비교적 낮다는 게 최대 매력 포인트였다.

# How? 어떻게 씀?

---

우선 현재 시점 (25.12) 셋업부터 공유해주자면 아래와 같다.

필자는 아래와 같은 모니터 레이아웃을 활용하고 있다.

```bash
┌─────────────────────────────┐
│      Monitor 1 (Top)        │  ← Docs (문서/아키텍처)
│          Docs               │
└─────────────────────────────┘
┌─────────────────────────────┐
│     Monitor 2 (Middle)      │  ← Code, Web (메인 작업)
│       Code / Web            │
└─────────────────────────────┘
┌─────────────────────────────┐
│     Monitor 3 (Bottom)      │  ← Terminal, Music, Schedule
│  Terminal / Music / Schedule│
└─────────────────────────────┘
```

이에 따라 아래와 같이 구성하였다.

Capslock 은 karabiner 를 통해 hyper key 로 선언해두었다.

| 동작 | 키 조합 | 설명 |
| --- | --- | --- |
| **워크스페이스 이동** | `Caps + 워크스페이스키` | C/D/M/S/T/W |
| **창을 워크스페이스로** | `Caps + Cmd + 워크스페이스키` | 창 이동 후 따라감 |
| **포커스 이동** | `Caps + ←↓↑→` | 같은 워크스페이스 내 |
| **창 위치 swap** | `Caps + Cmd + ←↓↑→` | 타일 위치 교환 |
| **모니터 포커스** | `Caps + 1/2/3` | 상/중/하 모니터 |
| **창을 모니터로** | `Caps + Cmd + 1/2/3` | 창 이동 후 따라감 |
| **이전 워크스페이스** | `Caps + Tab` | back-and-forth |
| **풀스크린 토글** | `Caps + Space` | fullscreen |
| **서비스 모드** | `Caps + ;` | 추가 명령 모드 |
| **리사이즈** | `Caps + -/=` | 축소/확대 (±50) |
| **레이아웃 전환** | `Caps + /` | tiles 전환 |
| **아코디언 전환** | `Caps + ,` | accordion 전환 |

이 셋업의 장점은 아래와 같다.

- **즉각적인 컨텍스트 스위칭**
    - `Caps + C` → 코드, `Caps + D` → 문서, `Caps + T` → 터미널
    - 손가락 하나로 워크스페이스 전환
- **풀스크린 토글** (`Caps + Space`)
    - 집중 모드와 멀티 윈도우 모드 즉시 전환
- **문서 ↔ 코드 워크플로우**
    - 상단 모니터: 공식문서/아키텍처 (읽기 전용)
    - 중앙 모니터: 코드 작성
    - `Caps + 1/2` 로 시선만 이동하며 참조
- **모니터 기반 역할 분리**
    - Monitor 1: 참조용 (Docs)
    - Monitor 2: 작업용 (Code/Web)
    - Monitor 3: 보조용 (Terminal/Music/Schedule)
- **앱 자동 배치**
    - IntelliJ 열면 자동으로 Code 워크스페이스
    - WezTerm 열면 자동으로 Terminal 워크스페이스
    - 수동 정리 불필요

아래 파일을 ~/.config/aerospace/aerospace.toml 에 복사해주면 위와 같은 셋업을 구성할 수 있다

https://github.com/vanillacake369/tonys-nix/blob/main/dotfiles/aerospace/aerospace.toml

만약 본인 입맛에 맞추어 수정하고자 한다면 튜토리얼 영상과 공식문서는 한 번쯤 보기를 권장한다.

https://www.youtube.com/watch?v=-FoWClVHG5g&t=167s

# Reference

---

> yabai
> 

https://www.youtube.com/watch?v=J4SXh8UhiCQ&t=444s

https://www.youtube.com/watch?v=k94qImbFKWE&t=366s

https://github.com/mehd-io/dotfiles/tree/backup-yabai?tab=readme-ov-file

https://www.josean.com/posts/yabai-setup

https://www.reddit.com/r/unixporn/comments/1d8pc0g/yabai_please_recommend_sketchybar_configs_for_me/

https://zackreed.me/posts/aerospace_and_sketchybar_setup_on_macos/

> aerospace
> 

https://www.youtube.com/watch?v=-FoWClVHG5g&t=167s

https://www.youtube.com/watch?v=5nwnJjr5eOo&t=148s
