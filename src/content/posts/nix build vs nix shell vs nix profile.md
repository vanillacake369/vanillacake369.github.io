---
title: "nix build vs nix shell vs nix profile"
description: "vagrant 패키지 설치가 안 되는 것 같아 테스트용도로 받아보려고 했다."
date: 2025-05-22
tags: [nix]
lang: ko
draft: false
series: { id: "NixOS Ecosystem", order: 17 }
---

# Why?

왜 배움?

---

---

vagrant 패키지 설치가 안 되는 것 같아 테스트용도로 받아보려고 했다.

설치를 위해 어떤 명령어를 써야할지 헷갈려서 알아보았다.

# What?

뭘 배움?

---

---

-  `nix shell`
- `nix run`
- `nix build`
- `nix develop`

# How?

어떻게 씀?

---

필자는 vagrant 가 제대로 설치 되는지를 확인해보기 위해 nix build 를 호출하였다.

다만 설치하고자 하는 pkgs 가 unfree pckgs 인 경우 아래와 같은 경고가 뜨면서 호출할 수 없게된다.

```nix
~/my-nixos main
❯ nix build nixpkgs#vagrant
error:
       … in the condition of the assert statement
         at /nix/store/wkjmkjrfr9ik1blw8zmv9g5xjl412py8-source/lib/customisation.nix:419:9:
          418|       drvPath =
          419|         assert condition;
             |         ^
          420|         drv.drvPath;

       … while evaluating the attribute 'handled'
         at /nix/store/wkjmkjrfr9ik1blw8zmv9g5xjl412py8-source/pkgs/stdenv/generic/check-meta.nix:643:9:
          642|         # or, alternatively, just output a warning message.
          643|         handled = (
             |         ^
          644|           if valid == "yes" then

       (stack trace truncated; use '--show-trace' to show the full, detailed trace)

       error: Package ‘vagrant-2.4.3’ in /nix/store/wkjmkjrfr9ik1blw8zmv9g5xjl412py8-source/pkgs/by-name/va/vagrant/package.nix:135 has an unfree license (‘bsl11’), refusing to evaluate.

       a) To temporarily allow unfree packages, you can use an environment variable
          for a single invocation of the nix tools.

            $ export NIXPKGS_ALLOW_UNFREE=1

          Note: When using nix shell, nix build, nix develop, etc with a flake,
                then pass --impure in order to allow use of environment variables.

       b) For nixos-rebuild you can set
         { nixpkgs.config.allowUnfree = true; }
       in configuration.nix to override this.

       Alternatively you can configure a predicate to allow specific packages:
         { nixpkgs.config.allowUnfreePredicate = pkg: builtins.elem (lib.getName pkg) [
             "vagrant"
           ];
         }

       c) For nix-env, nix-build, nix-shell or any other Nix command you can add
         { allowUnfree = true; }
       to ~/.config/nixpkgs/config.nix.
~/my-nixos main
```

따라서 이를 위해 home.nix 에서 ~/.config/nixpkgs/config.nix 에 대한 dotfile 을 만들어 symbolic link 로 연결하게끔 하였다.

```nix

{ lib, pkgs, config, ... }: 
{
  # Enable Home Manager
  programs.home-manager.enable = true;
 
  # Set env automatically
  targets.genericLinux.enable = true;

  # Import dotfiles
  home.file = {
    ".config/nix".source = ./dotfiles/nix;
    ".config/nixpkgs".source = ./dotfiles/nixpkgs;
    ".config/nvim".source = ./dotfiles/nvim;
  };

  # Import all modularized configurations
  imports = [
    # Infra
    ./modules/infra.nix
    
    # Dev
    ./modules/language.nix

    # Shell
    ./modules/apps.nix
    ./modules/nvim.nix
    ./modules/zsh.nix
    ./modules/shell.nix
  ];
}

```

이후 아래와 같이 호출하면 설치가 가능하다.
~~하지만 모종의 이유로 아직도 rubyGem installPhase 에서 5MB 를 남겨둔 채 설치가 안 되고 있다,,,~~

```nix
nix --impure build nixpkgs#vagrant
```

[^1]: https://nixos-and-flakes.thiscute.world/development/intro#nix-build <https://nixos-and-flakes.thiscute.world/development/intro#nix-build>
[^2]: https://nixos-and-flakes.thiscute.world/other-usage-of-flakes/the-new-cli#nix-shell <https://nixos-and-flakes.thiscute.world/other-usage-of-flakes/the-new-cli#nix-shell>
[^3]: https://nixos-and-flakes.thiscute.world/other-usage-of-flakes/the-new-cli#nix-run <https://nixos-and-flakes.thiscute.world/other-usage-of-flakes/the-new-cli#nix-run>
