---
title: "Nix 패키지에 대한 의존성을 인식이 안 돼요"
description: ""
date: 2025-06-06
tags: [Nix]
category: uncategorized
lang: ko
draft: false
---

# Why? 왜 배움?

---

flake/home-manager 환경에서 lua, luaunit 을 설치했다. 

```nix
# lua, luaunit 모두 잘 설치되어있다.
~/my-nixos main*
❯ home-manager packages | grep lua
lua-5.4.7
lua5.4-luaunit-3.4-1
```

luaunit 의존성을 추가하여 lua 를 실행하고자 하였다.
근데 luaunit 이 실행이 안 되었다.

```lua
-- luaunit
luaunit = require('luaunit')
os.exit( luaunit.LuaUnit.run() )
```
```nix
# luaunit 을 못 찾아서 실행이 안 된다.
~/my-nixos main*
❯ lua ./lua-test.lua
lua: ./lua-test.lua:1: module 'luaunit' not found:
	no field package.preload['luaunit']
	no file '/nix/store/arrsxaxmy6wxqlrd6dcqzpzp2pf06k1l-lua-5.4.7/share/lua/5.4/luaunit.lua'
	no file '/nix/store/arrsxaxmy6wxqlrd6dcqzpzp2pf06k1l-lua-5.4.7/share/lua/5.4/luaunit/init.lua'
	no file '/nix/store/arrsxaxmy6wxqlrd6dcqzpzp2pf06k1l-lua-5.4.7/lib/lua/5.4/luaunit.lua'
	no file '/nix/store/arrsxaxmy6wxqlrd6dcqzpzp2pf06k1l-lua-5.4.7/lib/lua/5.4/luaunit/init.lua'
	no file './luaunit.lua'
	no file './luaunit/init.lua'
	no file '/nix/store/arrsxaxmy6wxqlrd6dcqzpzp2pf06k1l-lua-5.4.7/lib/lua/5.4/luaunit.so'
	no file '/nix/store/arrsxaxmy6wxqlrd6dcqzpzp2pf06k1l-lua-5.4.7/lib/lua/5.4/loadall.so'
	no file './luaunit.so'
stack traceback:
	[C]: in function 'require'
	./lua-test.lua:1: in main chunk
	[C]: in ?
```

이에 대해 이유를 찾아보고 해결기를 정리해보았다.

# Why? 왜?

---

> [https://nixos.wiki/wiki/FAQ/I_installed_a_library_but_my_compiler_is_not_finding_it._Why%3F](https://nixos.wiki/wiki/FAQ/I_installed_a_library_but_my_compiler_is_not_finding_it._Why%3F)

nix 는 profile 에 해당하는 application 을 가져오지만, 의존성을 필요로 하는 library 들에 대한 compile enviroment 는 제공하지 않는다.
왜냐하면 이렇게 해야지 package 들에 대해 bulid 시 의존성 체인을 최대한 방지할 수 있기 때문이다.
따라서 이를 해결하고자 nix 는  `nix-shell` 을 통해 이를 제공한다.
여기서는 -p (packages) 로 넘겨받은 라이브러리들에 대해 의존성을 쉘을 제공한다.
이 쉘을 통해 원하는 compilation 혹은 script 를 실행할 수 있다.

# How? 어떻게 고침?

---

nix 자체적으로 이렇게 되어있기에 mkShell, mkDerivation 등등 별짓거리를 해도 소용없다.
`nix-shell` 을 좀 더 편하게 하기 위해 의존성을 선언해둔 아래 nix 모듈을 추가해주고,
`nix-shell ${의존성모듈}` 을 실행하여 shell 에 들어가서 script 를 실행해주었다.

```nix
# Module for lua compilation
{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  name = "lua-dev-env";

  buildInputs = [
    pkgs.lua54Packages.lua
    pkgs.lua54Packages.luaunit
  ];
}


```

이후에 shell 창에 들어가서 luaunit 을 실행해주었고, 성공할 수 있었다.
(~~굳이 꼭 이렇게까지 다 가져가야만,,, 속이 후련했냐,,,~~)

![](/images/notion/7338539b8d8fc244.gif)

# Reference

---

[https://discourse.nixos.org/t/autotools-works-via-nix-shell-but-not-via-home-manager/42581](https://discourse.nixos.org/t/autotools-works-via-nix-shell-but-not-via-home-manager/42581)
[https://nixos.wiki/wiki/FAQ/I_installed_a_library_but_my_compiler_is_not_finding_it._Why%3F](https://nixos.wiki/wiki/FAQ/I_installed_a_library_but_my_compiler_is_not_finding_it._Why%3F)
