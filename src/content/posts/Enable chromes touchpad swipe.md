---
description: "터치패드를 통해 이전 페이지로 돌아가는 편이다."
date: 2025-05-17
tags: [linux]
lang: ko
draft: false
---

# Context

터치패드를 통해 이전 페이지로 돌아가는 편이다.

Gnome/Wayland 환경에서 자꾸 안 되길래 해결해보았다.

# Core Reason

찾아보니 해당 터치패드 스와이프에 대한 옵션이 linux 에 대해서는 기본값으로 꺼져있음을 알게 되었다.
[https://chromium.googlesource.com/chromium/src/%2B/7eb8cf6bb4b6196119901213ac829ce60e540b14/content/public/common/content_features.cc?utm_source=chatgpt.com#743](https://chromium.googlesource.com/chromium/src/%2B/7eb8cf6bb4b6196119901213ac829ce60e540b14/content/public/common/content_features.cc?utm_source=chatgpt.com#743[^3])

```nix
// Allows swipe left/right from touchpad change browser navigation. Currently
// only enabled by default on CrOS.
const base::Feature kTouchpadOverscrollHistoryNavigation {
  "TouchpadOverscrollHistoryNavigation",
#if BUILDFLAG(IS_CHROMEOS_ASH) || defined(OS_WIN)
      base::FEATURE_ENABLED_BY_DEFAULT
#else
      base::FEATURE_DISABLED_BY_DEFAULT
#endif
```

ChromeOS, WindowsOS 가 아닌 OS 들은 TouchpadOverscrollHistoryNavigation 옵션이 기본적으로 꺼져있다.

> ⚠️ 그럼 Mac 은 어떻게 동작하는 건데?

# Solution

방법은 간단하다.

해당 플래그를 활성화해주면 된다.

> 시작 시 활성화

```nix
google-chrome-stable --ozone-platform-hint=auto --enable-features=TouchpadOverscrollHistoryNavigation
```

> 플래그 영속화

1. override .desktop file
2. set flag with sed command

> NixOS Overlay

> 💡 Nix Overlay 에 대해서는 아래 두 포스트가 잘 설명해주고 있으니 잘 모르겠다면 참고하자!

[https://github.com/vanillacake369/tonys-nix/blob/11524f80aa16c48e4fc371cf83cc57674eb73e9e/flake.nix](https://github.com/vanillacake369/tonys-nix/blob/11524f80aa16c48e4fc371cf83cc57674eb73e9e/flake.nix)

```nix
{
  description = "Custom basic linux configuration";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    nixos-wsl.url = "github:nix-community/NixOS-WSL/main";
    home-manager = {
      url = "github:nix-community/home-manager";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    system-manager = {
      url = "github:numtide/system-manager";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, home-manager, system-manager, nixos-wsl, ... }:
    let
      lib = nixpkgs.lib;
      system = "x86_64-linux";
      pkgs = import nixpkgs {
        inherit system;
        overlays = [(final: prev: {
            google-chrome = prev.google-chrome.override {
              commandLineArgs =
                "--ozone-platform-hint=auto --enable-wayland-ime --enable-features=TouchpadOverscrollHistoryNavigation --wayland-text-input-version=3";
            };
        })];
        config.allowUnfree = true;
      };
    in {
      packages.${system}.google-chrome = pkgs.google-chrome;
      # Define nixos configuration
      nixosConfigurations = {
        nixos = nixpkgs.lib.nixosSystem {
          inherit system;
          inherit pkgs;
          modules = [
            ./configuration.nix
          ];
        };
      };
      # Define the home-manager configuration
      homeConfigurations = {
        hama = home-manager.lib.homeManagerConfiguration {
          inherit pkgs;
          modules = [
            ./home.nix
            ./limjihoon-user.nix
          ];
        };
        limjihoon = home-manager.lib.homeManagerConfiguration {
          inherit pkgs;
          modules = [
            ./home.nix
            ./limjihoon-user.nix
          ];
        };
        nixos = home-manager.lib.homeManagerConfiguration {
          inherit pkgs;
          modules = [
            ./home.nix
            ./nixos-user.nix
          ];
        };
      };
      # Define system manager to cope with linux distro system
      systemConfigs.default = system-manager.lib.makeSystemConfig {
        modules = [
          ./modules
        ];
      };
    };
}

```

[^1]: https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/EventOverview/HandlingTouchEvents/HandlingTouchEvents.html <https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/EventOverview/HandlingTouchEvents/HandlingTouchEvents.html>

[^2]: https://medium.com/@nikitavoloboev/take-control-of-your-trackpad-on-macos-45c581f542e0 <https://medium.com/@nikitavoloboev/take-control-of-your-trackpad-on-macos-45c581f542e0>

[^3]: https://chromium.googlesource.com/chromium/src/%2B/7eb8cf6bb4b6196119901213ac829ce60e540b14/content/public/common/content_features.cc?utm_source=chatgpt.com#743 <https://chromium.googlesource.com/chromium/src/%2B/7eb8cf6bb4b6196119901213ac829ce60e540b14/content/public/common/content_features.cc?utm_source=chatgpt.com#743>

[^4]: https://www.reddit.com/r/gnome/comments/td8irt/touchpad_gestures_in_chromechromium/ <https://www.reddit.com/r/gnome/comments/td8irt/touchpad_gestures_in_chromechromium/>

[^5]: https://askubuntu.com/questions/1503214/how-to-make-flag-enable-features-vaapivideoencoder-persistent-in-google-chrome?utm_source=chatgpt.com <https://askubuntu.com/questions/1503214/how-to-make-flag-enable-features-vaapivideoencoder-persistent-in-google-chrome?utm_source=chatgpt.com>
