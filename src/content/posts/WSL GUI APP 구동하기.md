---
title: "WSL GUI APP 구동하기"
description: "모든 환경을 nix 에서 관리하는 편이다."
date: 2025-11-27
tags: [tools]
lang: ko
draft: false
---

# Why?

왜 배움?

---

---

모든 환경을 nix 에서 관리하는 편이다.
jdk, nvim, env 등등을 말이다.

따라서 회사 컴퓨터인 win11 / wsl 에서도 동일하게 구성 중인데
이 놈의 win11 만 intellij 가 wsl 경로를 인식하지 못 하고 자꾸 ide sync 가 되지 않았다
너무 답답한 나머지 그냥 wsl 에서 gui 를 구동하기로 하였다.

# What?

뭘 배움?

---

---

### VcXsrv (XServer) 설치

[https://medium.com/actived/how-to-start-gui-on-wsl-1-2-on-windows-11-10-8-7-62f1ae1c00fd](https://medium.com/actived/how-to-start-gui-on-wsl-1-2-on-windows-11-10-8-7-62f1ae1c00fd[^1]) 을 따라서 VcXsrv 를 설치한다

### Intellij 설치

필자는 nix 를 통해 intellij 설치

```nix
{
  lib,
  pkgs,
  isWsl,
  isDarwin,
  isLinux,
  ...
}: {
  home.packages = with pkgs;
    [
      # General apps
      claude-code
      jetbrains.idea-ultimate
    ]
    ++ lib.optionals (!isWsl) [
      # Non WSL apps
      google-chrome
      obsidian
      jetbrains.idea-ultimate
      jetbrains.goland
      jetbrains.datagrip
    ]
    ++ lib.optionals (isLinux && !isWsl) [
      # Linux-specific apps
      firefox
      slack
      ticktick
      ytmdesktop
      libreoffice
      hunspell
      hunspellDicts.en_US
      hunspellDicts.ko_KR
      hunspellDicts.ko-kr
    ]
    ++ lib.optionals isDarwin [
      # MacOs Apps
      aldente
      yabai
      skhd
      raycast
      jankyborders
      appcleaner
      hidden-bar
      discord
      wezterm
    ];
}

```

### 한글 폰트 설치

```bash
sudo apt-get install fonts-nanum-coding
```

### 실행

wsl 환경에서 아래와 같이 앱을 실행한다.

```bash
idea-ultimate &
```

[^1]: https://medium.com/actived/how-to-start-gui-on-wsl-1-2-on-windows-11-10-8-7-62f1ae1c00fd <https://medium.com/actived/how-to-start-gui-on-wsl-1-2-on-windows-11-10-8-7-62f1ae1c00fd>
[^2]: https://kimchki.blogspot.com/2017/11/vcxsrv-windows-x-server.html <https://kimchki.blogspot.com/2017/11/vcxsrv-windows-x-server.html>
