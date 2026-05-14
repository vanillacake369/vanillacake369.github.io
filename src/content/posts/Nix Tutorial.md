---
title: "Nix Tutorial"
description: "회사컴퓨터, 게이밍컴퓨터, 홈서버, 클라우드 서버의 모든 환경설정을 하나의 파일로 획일화해서 관리할 수 없을까?"
date: 2025-03-20
tags: [journal]
lang: ko
draft: false
series: { id: "NixOS Ecosystem", order: 2 }
---

# Episode 📜


>
💡
>
Nix 를 알게된 계기는 아래와 같다.
>
“회사컴퓨터, 게이밍컴퓨터, 홈서버, 클라우드 서버의 모든 환경설정을
>
하나의 파일로 획일화해서 관리할 수 없을까?”
>
그러던 도중 Nix 를 찾게되었고, 이에 대해 소개를 해보고자 한다.

보통 서버를 구성 시, 흔히 linux distro 위에 환경설정을 해야하는 경우가 있다.

linux 가 현존하는 OS 중에 가장 가볍고, 사용자 풀이 넓기 때문이다.

linux distro 는 서로 다른 distro family system 을 가진다.

가령 debian 에서 패키지를 설치하려면 apt 를 사용해야하지만 fedora 에서는 dnf 를 사용한다.

즉, 체계가 다르다.

![](/images/velog/1fe3c7f698f20a3b.png)

문제는 이러한 다양한 distro 간 패키징 통합이 어렵다는 것이다.

즉, 같은 패키징을 처리해야하는데 너와 나의 linux distro 는 서로 다르다.

이렇다 보니 `오 내 컴퓨터에서는 돌아가는데?` 아래와 같은 상황이 발생할 수가 있다.

이를 위해 하나의 패키지에 대해 distro 별로 다른 처리를 해줘야한다.

~~docker,k8s 와 같은 가상컨테이너라면 문제가 없겠지만 여기선 kernel 환경 그 자체를 말하고자 한다~~

![](/images/velog/d79b89c75e84a0c8.png)

nix 는 이러한 문제를 해결하기 위한 DSL 로 

자체 패키지를 만들어 시스템 환경과 독립적인 곳에 의존성을 처리한다.

이를 통해 어느 linux distro 이든 패키지 의존성을 설치 및 관리할 수 있게된다.

또한 .sh 을 통해 명령형으로 패키징되는 것들과 달리, yaml 과 같이 선언형으로 파일을 선언한다.

이를 활용하여 멱등적 패키징 — 내가 만든 말이다.

실제로는 reproducible build 라고 일컫는다. — 을 할 수 있다.

~~후술하겠지만 이러한 이유로 시스템 권한이 필요한 패키지들은 관리자 권한으로 따로 처리해줘야한다,,~~

# About 💁‍♂️


> 
💡
> 
Nix 의 내부 코어 컴포넌트들에 대해서 소개하고자한다.
> 
여기서 중요한 부분만 간략하게 설명했고, 디테일한 개념들을 생략하였다.
> 
하지만 필자는 아래를 보기보다 해당 튜토리얼을 스텝바이스텝으로 따라가보길 추천한다.
> 
그러면 아래를 볼 필요도 없이 모든 게 이해될 것이다.
> 
https://zero-to-nix.com/start/
> 
https://github.com/evertras/simple-homemanager
> 

## Nix is funtional language

nix 는 flake.nix 를 통해 패키지 매니저에 대한 구성을 처리한다.

**`flake.nix` 파일**은 기본적으로 `inputs`와 `outputs` 두 개의 속성을 가진 **속성 집합(attribute set)** 이다.

nix 는 `조금 더 명세된 json` 이라고 할만큼 json 과 유사한 함수형 언어이다.

즉 입력, 바디, 출력으로 구성된다.

`js` 와 같이 `let` 으로 입력값을 구성하고 `in` 으로 함수를 람다형태로 선언한다.

대충 보다보면 `아 이렇게 굴러가겠구나` 싶을 것이다.

```go
x: x + 1
# value => <LAMBDA>
```

```go
let
  f = x: x + 1;
in f
# value => <LAMBDA>
```

```go
let
  f = x: x + 1;
in f 1
# value => 2
```

```go
let
  f = x: x.a;
in
f { a = 1; }
# value => 1
```

```go
let
  a = 1;
in
a + a
# value => 2
```

```go
let
  b = a + 1;
  a = 1;
in
a + b
# value => 3
```

## Flake

nix 에서는 npm 의 package.json and package-lock.json 와 같은 설정파일이 존재한다.

그것이 바로 flake 이다.

flake 는 nix 가 패키징 매니징 설정을 참고하는 설정 파일이다.

이 파일은 함수형으로 선언되며, inputs, outputs 속성으로 처리된다.

### inputs 속성

- `inputs`는 패키지 매니저인 home-manager 에 대한 세팅의 입력값이다.
- GitHub 등의 URL을 통해 세팅입력값들을 가져온다.
```shell
# ./flake.nix
{
  description = "Custom basic linux configuration";

  inputs = {
	nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";

	home-manager = {
	  url = "github:nix-community/home-manager";
	  inputs.nixpkgs.follows = "nixpkgs";
	};
  };
  ,,,
}
```
   
### outputs 속성

- `outputs`는 함수(function)이며, Nix가 `inputs`의 내용을 가져온 후 실행된다.
- 즉, Nix는 `inputs`에 있는 다른 Flake들의 `flake.nix` 파일을 불러온 후, `outputs` 함수를 실행하고 그 결과를 반환한다.
- `outputs`의 반환값은 Flake가 원하는 어떤 형태든 될 수 있다.
```shell
# ./flake.nix
{
  description = "Custom basic linux configuration";

  inputs = {
	,,,
  };

  outputs = { self, nixpkgs, home-manager, system-manager, ... }:
	let
	  lib = nixpkgs.lib;
	  system = "x86_64-linux";
	  pkgs = import nixpkgs { inherit system; };
	  pkgsAllowUnfree = import nixpkgs {
		inherit system;
		config.allowUnfree = true;
	  };
	in {
	  # Define the home configuration
	  homeConfigurations = {
		$USER = home-manager.lib.homeManagerConfiguration {
		  inherit pkgs;
		  modules = [ ./home.nix ];
		};
	  };
	};
}
```
       

## Home Manager

**Home Manager**는 **Nix 패키지 매니저**를 이용해 **사용자 환경을 관리**하는 시스템이다.

1. **소프트웨어를 선언적으로 설치**
    - **사용자 프로필에 직접 소프트웨어를 선언적 방식으로 설치**해준다.
2. **Dotfile 관리**
    - 사용자 홈 디렉토리에 있는 **설정 파일(dotfiles)**을 관리할 수 있다.

## Home Manager is subset of NixOS

Home Manager 는 flake & nix 를 기반으로 패키지들을 처리하는 매니저이다.

여러 linux distro 에 대한 패키지 매니징을 처리해주는 NixOS 산하의 컴포넌트이다.

여기서 system level 로 controll 하지 않는 것에 유의해주어야한다.

왜냐면 Home Manager 는 linux distro kernel 과 독립적으로 패키지를 관리하기 때문이다.

즉, system config 에 대한 권한을 요구하지도 관리하지도 부여받지도 않는다.

따라서 system level 로 패키징을 관리하고 싶다면 NixOS 로 발을 넓혀보도록 하자 🙂

최근 [system-manager](https://github.com/numtide/system-manager) 와 같이 여러 linux distro 에 대한 system level control 도 지원하는 시도되고 있다.

## Install Nix

[공식문서](https://nixos.org/download/)를 참고하여 wsl 에서 nix 를 다운로드한다.

> 설치 시 나오는 Single-User vs Multi-User 차이점
> 
> *TL;DR; 웬만하면 Multi-User 를 사용하자*
> 
> | Feature | **Single-User** | **Multi-User** |
> | --- | --- | --- |
> | **Best for** | Personal use, WSL | Multi-user systems, shared use |
> | **Security** | Less secure | More secure (privilege separation) |
> | **System-Wide Installation** | ❌ No | ✅ Yes |
> | **Users Can Share Packages** | ❌ No | ✅ Yes |
> | **Requires Root to Install** | ❌ No | ✅ Yes |
> | **Requires nix-daemon** | ❌ No | ✅ Yes |
> | **Recommended for Nix Flakes** | ⚠️ Not ideal | ✅ Yes |
> | **`nix.conf` Location** | `~/.config/nix/nix.conf` | `/etc/nix/nix.conf` |

```bash
$ sh <(curl -L https://nixos.org/nix/install) --daemon
```

flakes 를 사용하기 위해 아래 conf 파일에서

```bash
sudo vi /etc/nix/nix.conf
```

```bash
build-users-group = nixbld

# Enable experimental features
experimental-features = nix-command flakes ca-derivations recursive-nix
```

이후에 nix-daemon 과 shell 을 재시작한다.

```bash
sudo systemctl restart nix-daemon
exec $SHELL
```

잘 설치되었는지 확인해본다.

```bash
$ nix shell nixpkgs#hello --command hello
Hello, world!
```

## Install Home Manager

아래 문서를 통해 설치한다.

https://nix-community.github.io/home-manager/index.xhtml#ch-installation

이 때 아래를 본인이 사용하는 shell 의 설정파일 -- ~/.bashrc, ~/.zshrc -- 에 넣어주는 걸 꼭 기억하자.

```bash
# This must be sourced in your .bashrc or whatever shell you're using.
# In the future we can get home-manager to do this for us, but bootstrapping for now...
source $HOME/.nix-profile/etc/profile.d/hm-session-vars.sh
```

## Hello World with flake.nix & home.nix

우선 아래 파일들을 선언하고 Hello World 를 돌려본다.

이게 뭐지 찾아볼 생각 하지 말자.

Nix 는 생각보다 복잡하고 관련된 개념과 다양하고 깊다.

도커,쿠버네티스 공부하는 거다 생각하고 일단은 따라해보자.

`flake.nix`

```go
{
  description = "very basic flake";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";

    home-manager = {
      url = "github:nix-community/home-manager";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, home-manager, ... }:
    let
      lib = nixpkgs.lib;
      system = "x86_64-linux";
      pkgs = import nixpkgs { inherit system; };
    in {
      homeConfigurations = {
	      # Replace ${username} your linux username
        **${username}** = home-manager.lib.homeManagerConfiguration {
          inherit pkgs;
          modules = [ ./home.nix ];
        };
      };
    };

}
```

`home.nix`

```go
{ lib, pkgs, ... }: 
{
  # Enable home-manager after install
  programs.home-manager.enable = true;

  home = {
    # Install packages from https://search.nixos.org/packages
    packages = with pkgs; [
      # Says hello.  So helpful.
      hello
    ];
    
    # This needs to be set to your actual username.
    # Replace ${username} your linux username
    username = ${username};
    homeDirectory = "/home/${username}";

    # Don't ever change this after the first build.
    # It tells home-manager what the original state schema
    # was, so it knows how to go to the next state.  It
    # should NOT update when you update your system!
    stateVersion = "23.11";
  };
}

```

`Makefile`

```bash
# Write in hand, do what I've told to do LOL
# Cp/Pst is easy but is poison when learning things
.PHONY: update
update:
		home-manager switch --flake .#limjihoon
.PHONY: clean
clean:
		nix-collect-garbage -d
```

주의점은 — 반드시 지켜야한다 — 아래와 같다.

- flake.nix, home.nix 의 username 을 실제 linux username 으로 치환해주자
    - 그렇지 않으면 해당 username 에 해당하는 경로를 찾지 못 하고, 패키징을 설치하지 못 한다.
- flake.nix 에서 linux distro architecture (eg “x86_64-linux” ) 를 지정해줄 것
    - 그렇지 않으면 어떤 target system 인지 모르기 때문에 깨져버린다.
- home.nix 에서 `stateVersion` 을 지우지 말 것
    - 초기에 한 번 설정된 stateVersion 은 변경하면 안 된다.
    - 설치된 다른 패키지들과 같이 버저닝을 처리하기 위함이기 때문이다. [What is stateVersion](https://github.com/nix-community/home-manager/issues/5794)
    - 최신 버전은 [여기서 확인 가능하다.](https://nix-community.github.io/home-manager/release-notes.xhtml)
- home.nix 에서 `programs.home-manager.enable = true;` 을 지우지 말 것
    - home-manager 의존성을 추가해주어야만 기존 home-manager 를 유지한다.
    - home-manager switch 를 실행하면 home.nix의 패키지가 설치된 상태로만 유지되는데, home-manager 가 추가되지 않으면 고아 패키지가 되므로 GC 중에 제거된다.

이제 Makefile 을 호출하여 hello 가 나오는 것을 기다려보자

## git 에 추가해주어야 nix 가 동작한다.

아마 여기까지 따라온 사람은 위 파일만 가지고는 동작이 안 된다는 것을 알 수 있을 것이다.

Nix 는 git 저장소에 추가되지 않은 모든 것을 완전히 무시한다.

이것은 사실 좋은 점인데, 모든 것을 git 에 동기화하게끔 하여 멱등적 패키징을 — reproducible build — 보장할 수 있다.

따라서  모든 것을 git에 추가하고 shell 에 `make` 명령어를 통해 nix 패키지를 받아오도록 하자.

이제 make command 를 통해 Makefile 을 호출해보자. (필자는 just 를 사용했다,,ㅎㅎ)

제대로 나오는 것을 볼 수 있을 것이다!

![](/images/velog/40f0c0c11d5804d7.png)

# Apply 🧑‍💻


>
이제 Hello 까지 출력해봤으니 응용을 해볼 차례이다.
>
필자는 선호하는 설정에 따라 아래와 같이 구성해주었다.
>
- just
- fzf
- zsh
    - power10k
- neovim
    - spacevim
- podman (~~docker)~~
    - podman-tui
- kubernetes
    - minikube
    - k9s
>
예제는 https://github.com/vanillacake369/nix-tutorial 에 찾아볼 수 있다.

## zsh

### 기본쉘 지정

nix 는 system level 패키지 설치가 아닌 별도의 공간에서 패키지 매니징을 처리한다.

따라서 zsh 의존성을 추가해주더라도 기본쉘로 zsh 설정되지 않는다.

기본 쉘로 운영되려면 `chsh -s` 가 필요하다.

따라서 이를 위해 `justfile` 에 해당 step 을 넣어줬다.

```shell
# Apply zsh
apply-zsh:
  exec zsh
  chsh -s /home/limjihoon/.nix-profile/bin/zsh

```

### 테마 지정

테마를 위해 `power10k` 를 가져오려면 nix 에서 가져온 `power10k` 를 `zsh` 안에 추가되도록 해줘야한다.

이를 위해 script 에서 가져온 `power10k` 를 의존하게끔 처리해주었다.

### shell 변경에 따른 loginctl 호출

nix 를 통해 shell 을 강제로 바꿔버리면 [user logs out 했다고 판단하여 session 값을 날린다.](https://unix.stackexchange.com/questions/162900/what-is-this-folder-run-user-1000)

이 때, 시스템 프로세스와 user 관련 정보를 담고 있는 /run/user/1000 를 날리게된다.

이로 인해 패키지들이 제대로 돌아가지 않게된다.

따라서 script 를 통해 session 이 없으면 `loginctl`을 호출하도록 해줬다.

```go
{ pkgs, ... }: {
  home.packages = with pkgs; [
    # zsh
    # oh-my-zsh
    zsh-autoenv
    zsh-powerlevel10k
    # zsh-syntax-highlighting
    # zsh-fzf-tab
    # zsh-autosuggestions
  ];
  programs = {

    # Setup for zsh
    zsh = {
      enable = true;
      enableCompletion = true;
      autosuggestion.enable = true;
      syntaxHighlighting.enable = true;

      shellAliases = {
          ll = "ls -l";
          kctx = "kubectx";
          kns = "kubens";
          k = "kubectl";
          ka = "kubectl get all -o wide";
          ks = "kubectl get services -o wide";
          kap = "kubectl apply -f ";
      };

      oh-my-zsh = {
        enable = true;
        plugins = [
          "git"
          "kubectl"
          "kube-ps1"
        ];
        theme = "powerlevel10k/powerlevel10k";
      };

      # Source zsh-autoenv manually
      initExtra = ''
        # Enable Powerlevel10k instant prompt. Should stay close to the top of ~/.zshrc.
        # Initialization code that may require console input (password prompts, [y/n]
        # confirmations, etc.) must go above this block; everything else may go below.
        if [[ -r "''${XDG_CACHE_HOME:-''$HOME/.cache}/p10k-instant-prompt-''${(%):-%n}.zsh" ]]; then
          source "''${XDG_CACHE_HOME:-''$HOME/.cache}/p10k-instant-prompt-''${(%):-%n}.zsh"
        fi

        # Apply zsh-autoenv
        source ${pkgs.zsh-autoenv}/share/zsh-autoenv/autoenv.zsh

        # Apply zsh-powerlevel10k
        source ${pkgs.zsh-powerlevel10k}/share/zsh-powerlevel10k/powerlevel10k.zsh-theme

        # Enable home & end key
        case $TERM in (xterm*)
        bindkey '^[[H' beginning-of-line
        bindkey '^[[F' end-of-line
        esac

        # Avoid for Home Manager to manage your shell configuration
        . "$HOME/.nix-profile/etc/profile.d/hm-session-vars.sh"

        # Enable session managed by systemd
        if ! loginctl show-user "$USER" | grep -q "Linger=yes"; then
          loginctl enable-linger "$USER"
        fi
      '';
    };

    # Setup for fzf
    fzf = {
      enable = true;
      enableZshIntegration = true;
      enableBashIntegration = true;
      defaultOptions = [
        "--info=inline"
        "--border=rounded"
        "--margin=1"
        "--padding=1"
      ];
    };

  };
}

```

## neovim

여타 설명과 예제가 많아서 설명은 패스하겠다.

따로 설정이 필요가 없기도 하고.

```go
{ pkgs, ... }: 
{
  programs = {
    neovim = {
      enable = true;
      defaultEditor = true;
      viAlias = true;
      vimAlias = true;
      vimdiffAlias = true;
      plugins = with pkgs.vimPlugins; [
        nvim-lspconfig
        nvim-treesitter.withAllGrammars
        plenary-nvim
        gruvbox-material
        mini-nvim
      ];
    };
  };
}

```

## spacevim

인기가 부족한 탓인지 (?) nix 의 neovim 플러그인으로 지원되지 않고 있었다.

즉, neovim 내에서 github fetch 하더라도 제대로 설정되지 않는다.

따라서 기존 spacevim 설치방법과 같이 외부에서 .sh 를 받아서 호출하여 설치하도록 설정해주었다.

```go
{ pkgs, lib, ... }:
{
  home.packages = with pkgs; [
    git
    curl
    bash
  ];

  # install spacevim if not installed
  home.activation.installSpaceVim = lib.hm.dag.entryAfter [ "writeBoundary" ] ''
    if [ ! -d "$HOME/.SpaceVim" ]; then
      echo "Installing SpaceVim..."
      export PATH=${pkgs.git}/bin:$PATH
      ${pkgs.curl}/bin/curl -sLf https://spacevim.org/install.sh | ${pkgs.bash}/bin/bash
    else
      echo "SpaceVim already installed, skipping..."
    fi
  '';

  programs = {
    neovim = {
      enable = true;
      defaultEditor = true;
      viAlias = true;
      vimAlias = true;
      vimdiffAlias = true;
      plugins = with pkgs.vimPlugins; [
        nvim-lspconfig
        nvim-treesitter.withAllGrammars
        plenary-nvim
        gruvbox-material
        mini-nvim
      ];
    };
  };
}

```

## Podman & Minikube

### Docker support : install only , not booting it

도커는 의존성 추가만 가능하고, 도커 데몬 실행은 불가능하다.

왜냐면 도커 데몬 자체가 linux kernel 과 강결합되어있기 때문이다.

https://nixos.wiki/wiki/Docker

![](/images/velog/85a1d40451cb8b9d.png)

https://discourse.nixos.org/t/how-to-run-docker-daemon-from-nix-not-nixos/43413

![](/images/velog/f44f40d1af32b240.png)

따라서 필자는 Rootless Podman 을 사용하여 workaround 해주도록 설정하였다.

### 설치 시 필요한 패키지

podman 은 기본적으로 아래와 같은 의존성을 필요로 한다. ([참고](https://nixos.wiki/wiki/Podman))

- qemu

- virtiofsd

- newuidmap, newgidmap 

하지만 newuidmap 의 setuid, setgid 는 system level 권한이 필요하므로 nix 의 권한 밖이다.

따라서 명령어를 통해 newuidmap, newgidmap 을 설치해줘야한다.

- `which newuidmap newgidmap || sudo apt update && sudo apt install -y uidmap`
- `sudo dnf install -y shadow-utils`

필자는 이를 해결하기 justfile 안에 넣어주었다. 

```shell
# Run nix home-manager
setup-nix: install-uidmap install clean
# setup-nix: remove-nvim remove-spacevim remove-zsh install-uidmap install clean apply-zsh


# Enable
install-uidmap:
  which newuidmap newgidmap || sudo apt update && sudo apt install -y uidmap

# Remove nvim
remove-nvim:
  rm -rf ~/.config/nvim
  rm -rf ~/.local/share/nvim
  rm -rf ~/.cache/nvim

# Remove spacevim
remove-spacevim:
  rm -rf ~/.nix-profile/bin/spacevim
  rm -rf ~/.SpaceVim*

# Remove zsh
remove-zsh:
  rm -rf ~/.zshrc
  sudo apt-get --purge remove zsh

# Install packages by nix home-manager
install:
  home-manager switch --flake .#limjihoon

# Clean redundant packages by nix gc
clean:
  nix-collect-garbage -d

# Apply zsh
apply-zsh:
  exec zsh
  chsh -s /home/limjihoon/.nix-profile/bin/zsh

```

~~다른 linux family 에 대해서는, 아마 justfile 을 따로 만들어줘야 하지 않을까 😭~~

~~이쯤부터 nix 라고 모든 걸 해결해주지는 않고, 이런 문제점 때문에 nixOS 가 좋다고들 하는 거 아닐까 싶었다~~

~~모든 linux distro 를 지원하기 시작한 valve 는 미친 놈들이다,,,~~

### httpd 를 사용한 podman 테스트

위와 같이 세팅했다면 아래를 통해 podman 이 잘 설치되었는지를 볼 수 있을 것이다.

![](/images/velog/510106cc4a210eb5.png)

필자는 podman 공식문서에 나온 것과 같이 httpd 를 통해 podman 이 정상수행되는 것을 확인하였다.

![](/images/velog/ca4b812c90ed4906.png)

이를 통해 이제 root 권한이 없더라도 rootless podman 을 통해 원하는 이미지를 컨테이너화하는 것이 가능해졌다!

어느 linux distro 이든 말이다 :-)

### podman-tui

podman-tui 는 podman 컨테이너에 대한 모니터링 CLI 툴이다.

podman-tui 는 내부적으로 podman api 를 통해 통신하며 모니터링을 하는데, 이를 사용하려면 run/user/podman 경로의 podman.socket 이 필요하다.

하지만 기본적으로 rootless podman 을 설치하게되면 podman.socket 이 없는 상태이다.

![](/images/velog/b75fd1735ffa5d8f.png)

이를 위해  `podman system service --time=0 &`을 실행하여 podman.socket 을 생성해주자.

필자는 podman.nix 에서 `lib.hm.dag.entryAfter`를 통해 설정해주었다.

```go
{ pkgs, lib, ... }: {

  # Configure Podman setting
  home.activation.configPodman = lib.hm.dag.entryAfter [ "writeBoundary" ] ''
    podman system service --time=0 &
  '';

  home.packages = with pkgs; [
    qemu # required for `podman machine init`
    virtiofsd # required for `podman machine init`
    podman-tui
    dive
    podman
    podman-compose
  ];
}

```

### minikube

minikube 에 대해서는 wiki 나 기타 설정에 대한 문서가 보이지 않지만,

필자의 경험상 특별한 추가설정이 필요하지 않았다.

따라서 아래와 같이 의존성 추가만 해준다.

```go
{ pkgs, ... }: {

  home.packages = with pkgs; [
    kubectl
    kubectx
    k9s
    stern
    kubernetes-helm
    kubectl-tree
    minikube
  ];
}
```

### minikube on rootless podman

## Just : A improved command runner

![](/images/velog/e5cdde160d780f91.png)

nix 포스트들을 찾아다니다 [just 를 권장하는 글](https://www.reddit.com/r/devops/comments/1axj8t2/command_runners_make_vs_scripts_vs_just_vs/) 을 보게되었고,

어느 정도의 장단점이 있는지 궁금해서 뒤져본 결과 도끼파, 망치파처럼 취향이 갈리는 것 같다.

just 를 써본 결과 rust 가 필요하다는 것 이외에 단점이 안 보여서 당분간 just 를 써볼 생각이다.

make 와 크게 다를 게 없지만 장점은

- 크로스 플랫폼
    - mac, win, 다양한 linux distro 지원 중 [distro 모음](https://github.com/casey/just#packages)
- Phony targets 가 필요없다는 것 [.PHONY란?](https://jusths.tistory.com/226)
- 무엇이 `command` 이고 `argument` 인지 헷갈리는 `make` 에 비해 인자값 선언이 깔끔하다
    
    ```bash
    # ./Makefile
    # Backend directory
    BACKEND_DIR = backend

    # Frontend directory
    FRONTEND_DIR = frontend

    .PHONY: backend frontend

    # Start the backend (Laravel)
    backend:
            cd $(BACKEND_DIR) && php artisan serve

    # Start the frontend (Node)
    frontend:
            cd $(FRONTEND_DIR) && pnpm run dev

    ```
    
    ```bash
    # ./justfile
    # Backend directory
    BACKEND_DIR := 'backend'
    
    # Frontend directory
    FRONTEND_DIR := 'frontend'
    
    # Start the backend (Laravel)
    backend:
        cd {{BACKEND_DIR}} && php artisan serve
    
    # Start the frontend (Node)
    frontend:
        cd {{FRONTEND_DIR}} && pnpm run dev
    ```
    
- 프로그래밍 언어 기반 람다를 선언 및 처리 [Shebang Recipes](https://github.com/casey/just#shebang-recipes)
- .env 를 활용할 수 있다.
    
    ```bash
    # .env
    SECRET = "secret key"
    ```
    
    ```bash
    # justfile
    display:
    		echo "Show secret : $SECRET"
    ```

- parallel execution 이 가능하다는 것

단점은 universal parallel 이 아직까지 불가능하다는 것

https://stackoverflow.com/questions/77245762/run-multiple-just-rules-in-parallel

https://github.com/casey/just/issues/626

물론 이슈에서 명시된 것처럼 [workaround 가 존재](https://github.com/casey/just/issues/626#issuecomment-2716525321)한다.

# Nix Package 검색 방법

> 
꽤나 긴 호흡으로 여기까지 따라온 당신.
> 
축하한다!
> 
이쯤되면 `어라 나도 nix 기반으로 이것저것 해보고 싶다` 라는 생각이 들 것이다.
> 
해당 포스트를 마치고 Nix 를 조금 더 딥다이브하고 싶다면
> 
여기서 다루지 못 한 Nix 기초부터 보기를 추천한다. 
> 
(최하위 Reference 쪽에 기입해두었다)
> 
하지만 Nix Package 들을 설정하려고 할 때 아무리 구글링을 해도 나오지가 않을 것이다.
> 
그럴 때는 아래 단계들을 통해 패키지들에 관련된 내용들을 학습하길 권한다. 
> 
(개인적인 권장이니 더 좋은 방법이 있으면 댓글로 남겨주시길 바란다)

1. [search.nixos.org](https://search.nixos.org/packages) 에서 의존하고자 하는 패키지를 검색한다. 

2. [위키](https://nixos.wiki/wiki) 에서 권장하는 가이드라인을 따라간다.
   
	a.

대부분 nixOS 에 대한 설명이나 non nix shell 에 대한 설명도 있으니 참고하면 좋다.
    
3.

Nix 에서 기본적으로 패키지 옵션을 제공할 때가 있다.

관련해서 어떤 옵션들이 있는지를 알고자 한다면 
   
	a.

옵션에 대해 설명을 해주는 [가이드라인 문서](https://nix-community.github.io/home-manager/options.xhtml) 를 본다. nix official 문서가 아니므로 100% 신봉은 하지 말자
   
	b. [Nix Github](https://github.com/nix-community/home-manager/tree/master/modules/programs) 를 살펴본다.

4.

여기까지도 막혔다면 축하한다.

이제 빙산에 망치질을 할 차례이다.

하지만 여기에도 가이드라인이 있으니,,
	
    a. [discourse.nixos.org](https://discourse.nixos.org/t/rootless-podman-setup-with-home-manager/57905/2) 에 Nix 신앙자들의 깔끔한 답변들을 찾아보자.
   
    b. [reddit](https://www.reddit.com/r/NixOS/) 에도 Nix 신앙자들을 찾아볼 수 있다.
   
	c.

위 단계에서도 모르겠다면 예제 github 나 nix 패키지 자체를 뒤져보는 수 밖에 없다.

# 의문점 🤔


- os, username 이 다른 여러 호스트가 있다면 어떻게 해야할까,,,?
    - 당장에 내 회사컴 linux username 과 개인 노트북 linux username 이 다르다,,
    - 만약 다른 os 아키텍처, 다른 username 의 호스트가 있다면 어떻게 해야할까?
- Neovim 에 Nix LSP 은 없을까?
- 같은 변수 두 번 선언은 Nix 에서 금지일까?
- 매 번 zsh 적용을 하려면 power10k 설정을 해줘야한다.

그냥 github 에 ~/.p10k.zsh 파일 박아두고 가져오게끔 할 수는 없을까?

# Reference 📚


> About linux distro
> 

https://www.youtube.com/watch?v=CSARhHLEmP4&t=382s&ab_channel=%EA%B0%9C%EB%B0%9C%EC%9E%90%EB%B0%A916

https://www.youtube.com/watch?v=5D3nUU1OVx8&ab_channel=Surma

https://unix.stackexchange.com/questions/162900/what-is-this-folder-run-user-1000

> What is Nix
> 

https://nixos.org/guides/how-nix-works/

https://www.reddit.com/r/NixOS/comments/1iaiqsu/benefits_of_running_nixos_vs_other_distro_nix/

https://news.ycombinator.com/item?id=23251754

https://nixos-and-flakes.thiscute.world/introduction/advantages-and-disadvantages

https://discourse.nixos.org/t/a-practical-kickstart-to-home-manager/40180

https://discourse.nixos.org/t/your-favorite-intro-tutorial-to-nix/36829/3

> Nix tutorial
> 

https://zero-to-nix.com/start/

https://github.com/evertras/simple-homemanager

https://nix.dev/tutorials/nix-language.html#let-in

https://www.reddit.com/r/NixOS/comments/131fvqs/can_someone_explain_to_me_what_a_flake_is_like_im/

https://www.youtube.com/watch?v=hLxyENmWZSQ&ab_channel=nixhero

https://www.youtube.com/watch?v=JCeYq72Sko0&ab_channel=Vimjoyer

https://velog.io/@todd/Nix-%EC%8B%9C%EC%9E%91%ED%95%98%EA%B8%B0

> Nix document
> 

https://nixos.wiki/wiki/Zsh

https://search.nixos.org/

https://mynixos.com/

> Zsh in home-manager
> 

https://nix.dev/manual/nix/2.24/

https://discourse.nixos.org/t/help-configuring-zsh-in-home-manager/40013

https://discourse.nixos.org/t/setup-zsh-oh-my-zsh-powerlevel10k-nixos-without-home-manager/58868

https://www.reddit.com/r/NixOS/comments/fenb4u/zsh_with_ohmyzsh_with_powerlevel10k_in_nix/

> Docker on Nix
> 

https://discourse.nixos.org/t/how-to-run-docker-daemon-from-nix-not-nixos/43413
