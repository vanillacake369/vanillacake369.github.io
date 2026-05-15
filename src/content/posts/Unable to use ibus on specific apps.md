---
description: "NixOS에서 Electron 기반 앱(Slack, VSCode 등)에 ibus 한글 입력이 안 되는 원인 분석과 --wayland-text-input-version=3 플래그를 통한 해결 과정"
date: 2025-05-11
tags: [linux]
lang: ko
draft: false
---

# Context

> 💡 갑자기 잘 쓰고 있던 앱들에서 ibus 가 작동하지 않았다.

## Context@1 : Electron apps could not take ibus 🔍

현재 확인된 app 들은 slack, ticktick, youtube-music, vscode 인데 모두 electron 기반 앱들이였다. 그렇다면 왜 electron 앱들만 ibus 가 작동하지 않을까,,?

관련 이슈들

1. [https://github.com/korean-input/issues/issues/6](https://github.com/korean-input/issues/issues/6)
2. [https://github.com/korean-input/issues/issues/18](https://github.com/korean-input/issues/issues/18)
3. [https://github.com/korean-input/issues/issues/11](https://github.com/korean-input/issues/issues/11)
4. [https://github.com/electron/electron/issues/33662#issuecomment-1401965053](https://github.com/electron/electron/issues/33662#issuecomment-1401965053)
5. [https://github.com/electron/electron/issues/41551](https://github.com/electron/electron/issues/41551)

# Thesis

## Thesis@1 : [glib version is diffrent](https://nixos.org/manual/nixos/stable/index.html#module-services-input-methods-troubleshooting) 🔬

[Ibus setup in nixos manual](https://nixos.org/manual/nixos/stable/index.html#module-services-input-methods-troubleshooting) 에 따르면 glib 버전이 맞지않으면 ibus 가 제대로 동작하지 않는다고 한다. 하지만 직접 확인해본 결과 작동되지 않는 앱 세 개 모두 glib 버전이 다 일치하였다.

```bash
/my-nixos main ⇡
❯ nix-store -q --requisites $(which ibus) | grep glib
/nix/store/g3s0z9r7m1lsfxdk8bj88nw8k8q3dmmg-glibc-2.40-66
/nix/store/ysm6ybv02ms2v6lzsx7fnqi2cy937l9x-glib-2.82.5
/nix/store/935fzq1zhx9y7jlcvbcxky0zx4j22dax-glibc-2.40-66-getent
/nix/store/xzir46k5dphql8vfhny9qv2yhmpcsmng-getent-glibc-2.40-66
/nix/store/xlp5f2wdxgh166zc9cwzdwgdn4n7xbcv-json-glib-1.10.6
/nix/store/karjjgkcqic6h7j48la4cga72h8jpfmm-glibmm-2.66.7
~/my-nixos main ⇡
❯ nix-store -q --requisites $(which ticktick) | grep glib
/nix/store/g3s0z9r7m1lsfxdk8bj88nw8k8q3dmmg-glibc-2.40-66
/nix/store/935fzq1zhx9y7jlcvbcxky0zx4j22dax-glibc-2.40-66-getent
/nix/store/xzir46k5dphql8vfhny9qv2yhmpcsmng-getent-glibc-2.40-66
/nix/store/ysm6ybv02ms2v6lzsx7fnqi2cy937l9x-glib-2.82.5
/nix/store/xlp5f2wdxgh166zc9cwzdwgdn4n7xbcv-json-glib-1.10.6
~/my-nixos main ⇡
❯ nix-store -q --requisites $(which youtube-music) | grep glib
/nix/store/g3s0z9r7m1lsfxdk8bj88nw8k8q3dmmg-glibc-2.40-66
/nix/store/ysm6ybv02ms2v6lzsx7fnqi2cy937l9x-glib-2.82.5
/nix/store/935fzq1zhx9y7jlcvbcxky0zx4j22dax-glibc-2.40-66-getent
/nix/store/xzir46k5dphql8vfhny9qv2yhmpcsmng-getent-glibc-2.40-66
/nix/store/xlp5f2wdxgh166zc9cwzdwgdn4n7xbcv-json-glib-1.10.6
/nix/store/karjjgkcqic6h7j48la4cga72h8jpfmm-glibmm-2.66.7
~/my-nixos main ⇡
❯ nix-store -q --requisites $(which slack) | grep glib
/nix/store/g3s0z9r7m1lsfxdk8bj88nw8k8q3dmmg-glibc-2.40-66
/nix/store/935fzq1zhx9y7jlcvbcxky0zx4j22dax-glibc-2.40-66-getent
/nix/store/xzir46k5dphql8vfhny9qv2yhmpcsmng-getent-glibc-2.40-66
/nix/store/ysm6ybv02ms2v6lzsx7fnqi2cy937l9x-glib-2.82.5
/nix/store/xlp5f2wdxgh166zc9cwzdwgdn4n7xbcv-json-glib-1.10.6
/nix/store/s3insilxvj11miid5pf1mbp4fawykaal-glib-2.82.5-bin
/nix/store/karjjgkcqic6h7j48la4cga72h8jpfmm-glibmm-2.66.7
~/my-nixos main ⇡
❯

```

## Thesis@2 : electron version update 에 따른 ibus ime 인식 불가 🔬

최근에 nix flake update 를 실행하여 전체 패키지 버전 업데이트를 했는데 그 이후부터 ibus 인식이 안 되는 것 같았다. 이를 실험하기 위해 [https://lazamar.co.uk/nix-versions/](https://lazamar.co.uk/nix-versions/) 에서 예전 버전의 electron 앱을 실행해보았다. 실행해보니 동일하게 한글로 토글이 안 되는 것을 확인하였다. 이로써 electron 버전이 문제가 아님을 추정할 수 있다.

## Thesis@3 : ibus 프로토콜 자체의 문제 🔬

더 공부를 해봐야겠지만 [https://github.com/korean-input/issues/issues/6](https://github.com/korean-input/issues/issues/6) 에 따르면 ime 동작구조는 아래와 같다.

```shell
기본적으로 클라이언트 <-> 컴포지터 <-> 입력기 구조
클라이언트 <-> 컴포지터 사이에 text-input 프로토콜이 사용됨
컴포지터 <-> 입력기 사이에 input-method 프로토콜이 사용됨
GNOME 쪽에선 자체 프로토콜을 사용해서 input-method 프로토콜을 무시
```

```shell
[ Client Application ]
        ⬇
  text-input protocol (Wayland or X11)
        ⬇
[ IBus Input Method Framework (acts like a "Composer") ]
        ⬇
  input-method protocol (D-Bus communication)
        ⬇
[ Input Engine / Input Method (e.g., ibus-pinyin, ibus-anthy) ]
```

즉, ibus 의 input, output protocol 의 구현방법이 핵심이라고 볼 수 있다. 이에 따라 ibus 의 input, output protocol 문제가 있을 거 같았고, 다른 프로토콜로 변경해보았다.

1. fcitx 로 변경
2. kime 로 변경

## Thesis@4 : boot.kernel 에 의한 gpu 제어 🔬

nvidia gpu 를 사용 중인데 intel / amd 를 위한 모듈이 gpu 를 방해할 수 있다고 한다. [이를 위한 nix 설정](https://nixos.wiki/wiki/Nvidia#Optimus:~:text=option%3A%20%5B2%5D-,Black%20Screen%20or%20Nothing%20Works%20on%20Laptops,-The%20kernel%20module) 을 처리했다가 지웠는데 혹시나 이게 문제가 아닐까 싶다.

```shell
commit a5167e55614b2fc93710c84a90467148ee649e61
Author: limjihoon <lonelynight1026@gmail.com>
Date:   Thu May 8 08:31:35 2025 +0900

    fix : diisable the integrated GPU by blacklisting the module

diff --git a/configuration.nix b/configuration.nix
index 496c1f2..b0aedbd 100644
--- a/configuration.nix
+++ b/configuration.nix
@@ -143,6 +143,8 @@
     };
   };

+  boot.kernelParams = [ "module_blacklist=i915" ];
```

예상대로 해당 이슈가 문제가 아니였다. 더군다나 IME 에 대한 input/output 처리가 intel intergrated gpu 로 인해 안 된다는 게 말이 안 된다. 실제로 해당 옵션을 처리한 결과, gpu 가 아예 작동하지 않는 현상을 발견할 수 있었다. 😅

## Thesis@5 : chrome-sandbox 권한 이슈 🔬

[https://lazyartisan.tistory.com/5](https://lazyartisan.tistory.com/5) 에 따르면 chrome-sandbox 권한이 없으면 문제가 발생할 수 있다고 한다. 그러나 나의 경우 snap 이나 AppRun 을 쓰지 않고 바로 bin 을 호출하고 있다. 따라서 이건 나의 해당 사항이 아니다.

```bash
~ 34s
❯ cat $(which obsidian)
#! /nix/store/xg75pc4yyfd5n2fimhb98ps910q5lm5n-bash-5.2p37/bin/bash -e
exec "/nix/store/kqv91gd6jy83v2918bq1p90lzkir7y5n-electron-35.2.1/bin/electron"
/nix/store/x26vs89knv3jpjqhwqlmmq8cwwsszf58-obsidian-1.8.10/share/obsidian/app.asar
${NIXOS_OZONE_WL:+${WAYLAND_DISPLAY:+--ozone-platform=wayland
--enable-wayland-ime=true}}  "$@"
~
❯
```

# Core Reason

## Ibus Input protocol 🎯

또한 electron 은 내부적으로 Chromium 을 사용하여 IME 지원을 하는데, 문제는 이놈의 Chromium 이 native wayland support 를 개똥같이 해놨다는 것이다. electron 은 ibus 의 experimental protocol 인 [text-input-version3](https://wayland.app/protocols/text-input-unstable-v3) 를 지원하게끔 되어있다. [https://wiki.archlinux.org/title/Chromium#:~:text=Xwayland%2Drelated%20crashes.-,Native%20Wayland%20support,-Since%20version%2097](https://wiki.archlinux.org/title/Chromium#:~:text=Xwayland%2Drelated%20crashes.-,Native%20Wayland%20support,-Since%20version%2097) 를 보면 알 수 있듯이, 아래와 같은 flag 들을 나열해야만 제대로 동작한다.
~~심지어 ~~[~~hyprland wiki~~](https://wiki.hyprland.org/0.21.0beta/Getting-Started/Master-Tutorial/#force-apps-to-use-wayland)~~ 에서는 보란듯이 wayland 에서의 chromium flag 들에 대해 문서화를 해놓았다.~~

```bash
❯ $(elctron 앱) --ozone-platform=wayland --enable-wayland-ime --wayland-text-input-version=3
# 혹은
❯ $(elctron 앱) --ozone-platform-hint=auto --enable-wayland-ime --wayland-text-input-version=3
```

## Merged recently, but not enabled in nix yet 🎯

해당 플래그가 최근에서야 기본적으로 활성화되게끔 merge 가 된 것 같다. [https://chromium.googlesource.com/chromium/src/+/e48954bdc391fcba2fd20a5a40a8a16332cf1638%5E!/](https://chromium.googlesource.com/chromium/src/+/e48954bdc391fcba2fd20a5a40a8a16332cf1638%5E!/)
하지만 Nix 는 사정이 다르다. 아직까지 electron app 내에 대해서는 `--wayland-text-input-version=3` 플래그가 기본적으로 활성화가 안 되어있다.

```nix
~/my-nixos main
❯ cat $(which slack)
# ,,,
exec "/nix/store/3v9rijwxdkc3wh0l62p1chrbq7rb6r32-slack-4.42.120/lib/slack/slack"  ${NIXOS_OZONE_WL:+${WAYLAND_DISPLAY:+--ozone-platform-hint=auto --enable-features=WaylandWindowDecorations,WebRTCPipeWireCapturer --enable-wayland-ime=true}} "$@"
```

# Solution

## Solution@1 : start app with flags 🛠️

```bash
❯ $(elctron 앱) --ozone-platform=wayland --enable-wayland-ime --wayland-text-input-version=3
# 혹은
❯ $(elctron 앱) --ozone-platform-hint=auto --enable-wayland-ime --wayland-text-input-version=3
```

![](/images/notion/f5ae420500cbe878.gif)

flag 와 같은 이음매 없이 매끄럽게 처리를 하려면 아래 방법들을 사용해보자.

## Solution@2 : NixOS PR 이 해결될 때까지 기다린다 🛠️

- [https://github.com/NixOS/nixpkgs/issues/394395](https://github.com/NixOS/nixpkgs/issues/394395) 이슈가 올라왔다.
- 메인테이너들의 움직임이 궁금하다.

## Solution@3 : Nix Overlay 를 활용한다 🛠️

> 💡 [https://discourse.nixos.org/t/ibus-not-working-with-electron-apps/64128](https://discourse.nixos.org/t/ibus-not-working-with-electron-apps/64128) 에서 제시된 방법이다.
> ❓ 오잉 그냥 `electron-flags.conf` 를 활용하면 안 돼?

# Further work 💭

- nix 에서 어떤 패키지든 공통 dotfile/config 를 공유할 수 있게끔 해보자.

[^1]: ibus 는 D-Bus 를 통해 입력 엔진과 통신한다. Wayland 환경에서는 `text-input-unstable-v3` 프로토콜을 통해 컴포지터와 클라이언트 사이의 입력을 중계하는데, 이 프로토콜이 아직 "unstable" 상태이므로 앱마다 지원 여부가 다르다.
[^2]: `--ozone-platform=wayland` 플래그는 Chromium/Electron 이 Xwayland 를 거치지 않고 네이티브 Wayland 백엔드를 직접 사용하도록 강제한다. 이 플래그 없이는 `--enable-wayland-ime` 가 의미 없다.
[^3]: NixOS 에서 패키지의 wrapper 스크립트는 `/nix/store/…-<app>/bin/<app>` 형태로 생성되며, `NIXOS_OZONE_WL` 환경변수가 설정된 경우에만 Wayland 관련 플래그가 자동으로 주입된다. `--wayland-text-input-version=3` 은 아직 이 자동 주입 목록에 포함되어 있지 않다.
[^4]: fcitx5 는 Wayland `input-method-unstable-v2` 프로토콜을 지원하므로 ibus 보다 Wayland 호환성이 높다. NixOS 에서는 `i18n.inputMethod.enabled = "fcitx5"` 로 간단히 전환할 수 있다.
[^5]: `nix flake update` 는 `flake.lock` 의 모든 입력을 최신 커밋으로 갱신한다. 패키지 버전이 한꺼번에 바뀌므로 회귀(regression) 원인 추적 시 `git bisect` 와 함께 특정 nixpkgs revision 을 고정하는 방법이 유용하다.
