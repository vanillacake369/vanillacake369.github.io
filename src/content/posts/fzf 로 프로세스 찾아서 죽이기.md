---
description: "쇼츠 내리다가 본 것인데 너무 신기해서 적어봄"
date: 2025-06-03
tags: [linux]
lang: ko
draft: false
---

# Why?

쇼츠 내리다가 본 것인데 너무 신기해서 적어봄

# What?

kill -9 \*\* 치고 tab 누르면
fzf 가 무슨 프로세스를 죽일지 찾아준다.

대신 본인이 사용하고 shell 에 fzf auto completion 이 적용되어있어야 한다.

자는 ~/.zshrc 에 `eval $(fzf ---zsh)` 가 로 적용되어있다. )

```bash
source $ZSH/oh-my-zsh.sh

,,,

if [[ $options[zle] = on ]]; then
  eval "$(/nix/store/z3ayhjslz72ldiwrv3mn5n7rs96p2g8a-fzf-0.62.0/bin/fzf --zsh)"
fi
```

# How?

어떻게 씀?

![](/images/notion/49040d1a2de0ebb8.gif)

[^1]: https://www.youtube.com/shorts/iUHfq_JN4G8 <https://www.youtube.com/shorts/iUHfq_JN4G8>
