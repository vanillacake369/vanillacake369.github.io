---
description: "nvim 에서 플러그인 설치나 설정 시에는 lua 언어를 사용한다."
date: 2025-11-11
tags: [neovim]
lang: ko
draft: false
---

# Why?

nvim 에서 플러그인 설치나 설정 시에는 lua 언어를 사용한다.

따라서 필자는 lua 테스트 코드 작성법을 알아야한다고 생각했다.

어느 언어나 설정이든 테스트는 무조건 필요하기 때문이다.

따라서 Lua 언어는 어떻게 테스트하는지 알아보았다.

# What ?

무엇을 배움?

## LuaUnit 사용

```lua
luaunit = require('luaunit')

function add(v1,v2)
    -- add positive numbers
    -- return 0 if any of the numhttps://skillbuilder.aws/learn/94T2BEN85A/aws-cloud-practitioner-essentials-/KEGU7KUPF6bers are 0
    -- error if any of the two numbers are negative
    if v1 < 0 or v2 < 0 then
        error('Can only add positive or null numbers, received '..v1..' and '..v2)
    end
    if v1 == 0 or v2 == 0 then
        return 0
    end
    return v1+v2
end

function testAddPositive()
    luaunit.assertEquals(add(1,1),2)
end

function testAddZero()
    luaunit.assertEquals(add(1,0),0)
    luaunit.assertEquals(add(0,5),0)
    luaunit.assertEquals(add(0,0),0)
end

os.exit( luaunit.LuaUnit.run() )

```

```bash
$$ lua ./lua-test.lua
..
Ran 2 tests in 0.000 seconds, 2 successes, 0 failures
OK

# In nix, luaunit couldn't be interpreted by lua since it's sperated
# Instead use this
# nix-shell -p lua54Packages.lua lua54Packages.luaunit --run "lua ./lua-test.lua"
```

## Busted

> 💡 어떻게 하면 nvim 플러그인들을 제대로 설정했는지 테스트할 수 있을까?
