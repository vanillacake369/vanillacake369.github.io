---
title: "fzf 활용법"
description: "아래와 같이 zshrc 에 구축해둠"
date: 2025-04-25
tags: [linux]
category: uncategorized
lang: ko
draft: false
---

# Why? 왜 배움?

---

- fzf 에 대해 알게 되어 공부하게 되었음
- fzf 를 활용하여 alias command 를 맘대로 사용할 수 있을 거 같음



# What? 뭘 배움?

---

> 항상 느끼는 거지만 툴을 제대로 쓸 줄 알아야 개선을 할 수 있는 거 같음

- fzf 는 명령어 호출의 결과값을 파싱할 수 있다. 
- 특정 키를 눌렀을 때에 대한 biding 을 지원한다.

# How? 어떻게 씀?

---

아래와 같이 zshrc 에 구축해둠

```go
# ** Add REPL of fzf [Reference](https://sbulav.github.io/kubernetes/using-fzf-with-kubectl/)**
# Get manifest of k8s resources :: e.g.) kgjq deploy nginx
kube-manifest() {
  kubectl get $* -o name | \
      fzf --preview 'kubectl get {} -o yaml' \
          --bind "ctrl-\:execute(kubectl get {+} -o yaml | nvim )" \
          --bind "ctrl-r:reload(kubectl get $* -o name)" --header 'Press CTRL-R to reload' \
          --bind "ctrl-]:execute(kubectl edit {+})";
 }
# Git log with preview
gitlog() {
  (
    git log --oneline | fzf --preview 'git show --name-only {1}'
  )
}
# Show proccess
pslog() {
  (
    ps axo pid,rss,comm --no-headers | fzf --preview 'ps o args {1}; ps mu {1}'
  )
}
# Show package dependencies
pckg-dep() {
  (
    apt-cache search . | fzf --preview 'apt-cache depends {1}'
  )
}
```



# Further work 🔍

---

- 현재 호스트 내의 모든 Alias — zshrc, oh-my-zsh, 외부 alias ,,, — 에 대한 검색
- 특정 단어 검색에 대해 모든 파일 검색
- gitlog 호출했을 때 해당 커밋의 파일 중 하나를 선택하여 nvim 으로 호출



# Reference

---

[https://www.baeldung.com/linux/fzf-command](https://www.baeldung.com/linux/fzf-command)
[https://sbulav.github.io/kubernetes/using-fzf-with-kubectl/](https://sbulav.github.io/kubernetes/using-fzf-with-kubectl/)
[https://junegunn.github.io/fzf/reference/](https://junegunn.github.io/fzf/reference/)
