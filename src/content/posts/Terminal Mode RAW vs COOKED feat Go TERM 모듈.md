---
title: "Terminal Mode : RAW vs COOKED  (feat. Go TERM 모듈)"
description: "터미널에는 입력 방법이 두 가지가 있다. 하나는 우리가 흔히 쓰는 Cooked 모드이고, 하나는 Raw 모드이다. 각각의 정의와 차이점에 대해 알아보자"
date: 2025-12-22
tags: [journal]
lang: ko
draft: false
---

![](/images/velog/8263281746625f5c.png)

# Cooked Mode ?

Raw Mode ?

---

터미널에는 입력 방법이 두 가지가 있다.

하나는 우리가 흔히 쓰는 Cooked 모드이고, 하나는 Raw 모드이다.

### Canonical Mode (Cooked Mode)

터미널은 기본적으로 **Canonical Mode**로 동작한다.

이 모드는 흔히 **라인 버퍼링(Line Buffering)** 모드라고도 불리운다.

- 사용자가 키보드를 입력하면 즉시 프로그램으로 전달되지 않습니다.
- **Enter 키**를 눌러야 비로소 입력된 한 줄 전체가 프로그램에 전달됩니다.
- 사용자는 입력 중간에 **Backspace** 등을 활용해 내용을 수정할 수 있습니다.

즉, 간단한 명령어 입력이나 줄 단위 처리가 필요한 경우에 유용하다.

하지만, 텍스트 에디터나 게임처럼 즉각적인 키 입력 반응이 필요한 경우에는 한계가 있다.

우리는 입력 하나하나마다 enter 를 누르는 게 아니라 각 입력 별로 넘어가기를 원한다.

이를 지원하는 모드가 바로 Raw mode 이다.

### Raw Mode

Raw Mode는 키 입력을 즉시 프로그램으로 전달한다..

- 입력 버퍼링이 비활성화되어 Enter 없이도 키 입력이 곧바로 처리됩니다.
- Ctrl+C, Ctrl+Z 같은 시그널 처리도 다르게 동작할 수 있습니다.
- 에코(Echo) 모드가 꺼져서 입력한 값이 화면에 표시되지 않을 수도 있습니다.

즉, Raw 모드는 키보드 이벤트 기반 프로그램(예: vim, nano, 게임 엔진, CLI 툴)에 필수적인 모드이다.

# Go 에서의 term 모듈


https://github.com/golang/term

하지만 터미널이 입력을 처리하는 방식에는 **두 가지 모드**가 있다.

바로 Canonical Mode(=Cooked Mode) 와 Raw Mode 이다.

## Golang 에서 Raw Mode 활성화하기

다행히도 Go 표준 라이브러리 외부 패키지인 [`golang.org/x/term`](https://pkg.go.dev/golang.org/x/term)을 사용하면 터미널을 Raw Mode로 바꿀 수 있다.

```go
package main

import (
    "fmt"
    "os"
    "golang.org/x/term"
)

func main() {
    // 현재 터미널 상태 저장
    oldState, err := term.MakeRaw(int(os.Stdin.Fd()))
    if err != nil {
        panic(err)
    }
    defer term.Restore(int(os.Stdin.Fd()), oldState) // 종료 시 원상복구

    buf := make([]byte, 1)
    for {
        n, err := os.Stdin.Read(buf)
        if err != nil {
            panic(err)
        }
        if n > 0 {
            c := buf[0]
            fmt.Printf("입력된 키: %q (%d)
", c, c)
            if c == 'q' { // q 입력 시 종료
                break
            }
        }
    }
}

```

- `term.MakeRaw()`를 통해 터미널을 Raw Mode로 변경한다.
- 키 입력이 발생할 때마다 즉시 `os.Stdin.Read()`가 값을 읽음.
- `q` 키를 누르면 루프를 종료하고, `defer` 구문을 통해 터미널을 원래 상태로 복구.

**중요한 것은  term.Restore 을 사용하여 원래 상태로 복구해야한다는 것이다.** 

이유는 term.MakeRaw 동작 원리에 있다.

다음과 같이 작동한다.

```go
func makeRaw(fd int) (*State, error) {
	termios, err := unix.IoctlGetTermios(fd, ioctlReadTermios)
	if err != nil {
		return nil, err
	}

	oldState := State{state{termios: *termios}}

	// This attempts to replicate the behaviour documented for cfmakeraw in
	// the termios(3) manpage.
	termios.Iflag &^= unix.IGNBRK | unix.BRKINT | unix.PARMRK | unix.ISTRIP | unix.INLCR | unix.IGNCR | unix.ICRNL | unix.IXON
	termios.Oflag &^= unix.OPOST
	termios.Lflag &^= unix.ECHO | unix.ECHONL | unix.ICANON | unix.ISIG | unix.IEXTEN
	termios.Cflag &^= unix.CSIZE | unix.PARENB
	termios.Cflag |= unix.CS8
	termios.Cc[unix.VMIN] = 1
	termios.Cc[unix.VTIME] = 0
	if err := unix.IoctlSetTermios(fd, ioctlWriteTermios, termios); err != nil {
		return nil, err
	}

	return &oldState, nil
}
```

- 입력 처리 끔: `IGNBRK|BRKINT|PARMRK|ISTRIP|INLCR|IGNCR|ICRNL|IXON` 제거
- 출력 후처리 끔: `OPOST` 제거
- 로컬(라인) 기능 끔: `ECHO|ECHONL|ICANON|ISIG|IEXTEN` 제거
- 8비트 모드: `CSIZE|PARENB` 제거 후 `CS8` 설정
- 즉시 읽기: `Cc[VMIN]=1`, `Cc[VTIME]=0`
- 원래 `termios` 에 대한 주소를 반환

이후 term.Restore 는 원래의 termios 를 받아서 기존 상태로 복구해놓는다.

만약 복구하지 않는다면 화면출력(ECHO) 도 꺼지고 시그널(ISIG) 도 꺼놨기 떄문에 그냥 먹통이 되어버린다

```go
func restore(fd int, state *State) error {
	return unix.IoctlSetTermios(fd, ioctlWriteTermios, &state.termios)
}
```

# Reference 📚


https://viewsourcecode.org/snaptoken/kilo/02.enteringRawMode.html

https://blog.huny.dev/golang-termmakeraw-c-fgetcstdin

https://tip.golang.org/src/cmd/vendor/golang.org/x/term/term_unix.go
