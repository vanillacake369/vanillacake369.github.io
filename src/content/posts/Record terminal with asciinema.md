---
title: "Record terminal with asciinema"
description: ""
date: 2025-05-12
tags: [Linux]
category: uncategorized
lang: ko
draft: false
---

# Why? 왜 배움?

---

k6 테스트 결과에 대한 녹화본을 생성하기 위해 Terminal 녹화를 도와주는 asciinema 활용에 대해 정리

# What? 뭘 배움?

---

## Install

> Ubuntu

[https://github.com/asciinema/asciinema#building](https://github.com/asciinema/asciinema#building)
[https://github.com/asciinema/agg#building](https://github.com/asciinema/agg#building)

```nix
cargo install --locked --git https://github.com/asciinema/asciinema
cargo install --git https://github.com/asciinema/agg
```

> Nix

```nix
{ pkgs, ... }: {

  home.packages = with pkgs; [
    asciinema
    asciinema-agg
    awscli2
    ssm-session-manager-plugin
    bat
    jq
    k6
    git
    curl
    bash
    vimPlugins.vim-visual-multi
    tree
    ripgrep
    screen
    openssh
    xclip
    neofetch
  ];

  programs = {
    yazi = {
      enable = true;
      enableZshIntegration = true;
      shellWrapperName = "y";
      theme = {
        filetype = {
          rules = [
            { fg = "#7AD9E5"; mime = "image/*"; }
            { fg = "#F3D398"; mime = "video/*"; }
            { fg = "#F3D398"; mime = "audio/*"; }
            { fg = "#CD9EFC"; mime = "application/bzip"; }
          ];
        };
      };
    };
  };
}

```

## Usage

```nix
# 터미널 녹화 (파일명 : ./route-thosand-users-faster.cast)
asciinema rec ./route-thosand-users-faster.cast
# 녹화본 재생
asciinema play ./route-thosand-users-faster.cast
# 녹화본 2배로 재생
asciinema play --speed 2 ./route-thosand-users-faster.cast
```

이제 녹화를 시작하고, 명령어들을 처리한 뒤, ctrl-d 로 녹화를 중지하자.
그럼 아래와 같이 .cast 파일이 생성되었을 것이다.

```nix

limjihoon@HAMA /mnt/c/Users/HAMALAB/Desktop/dev/buster-java-api/scripts feature* 21s
❯ ll
total 500
-rwxrwxrwx 1 limjihoon limjihoon    366 Mar 18 11:20 afterinstall.sh
-rwxrwxrwx 1 limjihoon limjihoon    769 May 12 15:04 route-recommend.js
-rwxrwxrwx 1 limjihoon limjihoon 122044 May 12 15:09 route-thosand-users.cast

```

이제 이것을 notion,obsidian 와 같은 플랫폼에 어울리는 .gif 로 파일 변환을 해주자.

### Agg

.cast 파일에 대해 .gif 파일로 변환하여 공유할 수 있다.

```nix
agg --cols 80 --rows 20 --theme solarized-dark --speed 1.35 ./route-thosand-users.cast ./route-thosand-users.gif
468 / 468 [======================================================================================================================================================] 100.00 % 22.12/s
```

> 💡 Q : 왜 mp4 로 변환하지 않나요?

# Reference

---

[https://nixdaily.com/how-to/record-your-terminal-session-and-convert-it-to-a-gif-image-asciinema/](https://nixdaily.com/how-to/record-your-terminal-session-and-convert-it-to-a-gif-image-asciinema/)
[https://docs.asciinema.org/manual/agg/](https://docs.asciinema.org/manual/agg/)
[https://asciinema.org/](https://asciinema.org/)
[https://discourse.asciinema.org/t/whats-the-best-way-to-convert-to-a-video-file/200](https://discourse.asciinema.org/t/whats-the-best-way-to-convert-to-a-video-file/200)
