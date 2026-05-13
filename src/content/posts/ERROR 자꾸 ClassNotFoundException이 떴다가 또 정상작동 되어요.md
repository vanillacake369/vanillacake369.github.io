---
title: "ERROR : 자꾸 ClassNotFoundException이 떴다가 또 정상작동 되어요"
description: ""
date: 2024-01-30
tags: [Java]
category: uncategorized
lang: ko
draft: false
---

# Episode 📜

---

> Shift + F10의 마법의 명령어로 IntelliJ에게 실행을 시킨다.

# Reason of Err🤷‍♂️

---

초반 빌드 시, 아래와 같은 오류가 생기면, 실행 시에 잘 되었다가 오류가 생겼다가 할 수 있다!

- 설정이 꼬이거나,
- 다른 영역에 에러가 있으나 실행 상 문제가 없는 부분이거나,
- JPA 상 에러가 존재하는 경우 
- 등등

# How to fix 🔧

---

“Clean and Rebuild”
말 그대로 한 번 밀고 다시 리빌드 해보는 것이다.
이렇게 해보니 실제로 에러가 있는데 실행 상 문제가 없는 코드가 존재하였고, 다시 보기에도 어처구니가 없는 코드였다.
(id값에 null을 집어넣고 save를 돌렸다는,,,말도 안 되는 이야기이다,,,)

항상,,,나만 보든 말든 주석을 신경써서 달아주도록,,하자 ^^


[https://timotimo.tistory.com/99](https://timotimo.tistory.com/99)
[https://ppiyo5.tistory.com/30](https://ppiyo5.tistory.com/30)
