---
title: "TTY/PTY 란 (feat. Go PTY 모듈)"
description: "터미널 동작원리인 TTY/PTY 의 정의와 동작원리, 그리고 직접 go 로 PTY 를 생성하는 예제를 살펴보자"
date: 2025-12-22
tags: [journal]
lang: ko
draft: false
---

>
> 💡
> 
> 본 글은 아래 글(들)을 바탕으로 작성하였다.
> 
> 딥다이브 하고자 한다면 직접 읽기를 추천한다.
> 
> https://www.linusakesson.net/programming/tty/

# TTY 란 ?


![](/images/velog/ff8a7f9a1ba619cd.png)

과거의 터미널(Teletype, TTY)은 실제 물리적인 전신기계였다.

사용자 입력은 기계 키보드에서 UART(Universal Asynchronous Receiver and Transmitter)를 통해 컴퓨터로 전송되었고, 출력은 다시 UART를 통해 사용자에게 인쇄되는 방식이었다.

이 장치는 두 개의 선(송신/수신)을 통해 컴퓨터와 연결되었으며, 컴퓨터는 UART 드라이버를 통해 하드웨어와 통신했다.

운영체제는 단순히 UART 드라이버가 수신한 바이트를 바로 애플리케이션에 전달하지 않는다.

대신 그 위에 **TTY 드라이버와 라인 디시플린(line discipline)** 이라는 계층을 두어 다음과 같은 기능을 제공한다

1. **라인 편집(Line editing)**
    
    사용자는 입력 도중 실수할 수 있기 때문에 백스페이스, 단어 삭제, 라인 삭제 같은 편집 기능이 필요하다.

이를 애플리케이션마다 구현하는 대신, 운영체제가 기본적으로 제공한다.
    
    - Canonical(조리) 모드: 기본 모드로, 라인 단위 버퍼링과 편집 기능 제공
    - Raw 모드: 고급 애플리케이션(에디터, 셸 등)이 자체적으로 처리할 때 사용
    
    라인 디시플린은 또한 에코(echo) 처리, CR/LF 변환 같은 기본 기능도 수행한다.
    
2. **세션 관리(Session management)**
    
    사용자는 여러 프로그램을 동시에 실행할 수 있고, 그중 하나와만 상호작용해야 한다.
    
    - 포어그라운드/백그라운드 프로세스 제어
    - 무한 루프에 빠진 프로그램을 중단/종료
    - 백그라운드 프로세스가 터미널에 출력 시도 시 일시 중단
    
    이러한 기능은 TTY 드라이버에서 처리된다.

운영체제에서 TTY 드라이버와 라인 디시플린은 능동적 프로세스가 아니라 **수동적인 객체**에 가깝다.

즉, 이들은 스스로 동작하지 않고, 커널 인터럽트나 프로세스 요청 시에만 동작한다.

요컨대 하나의 **TTY 장치**는

- UART 드라이버
- 라인 디시플린 인스턴스
- TTY 드라이버

세 가지의 조합으로 볼 수 있으며, 이는 `/dev` 아래의 디바이스 파일로 노출된다.

사용자가 로그인하면 해당 TTY 장치 파일의 소유권이 해당 사용자에게 넘어가고, 이후 프로세스는 이를 통해 TTY 동작을 제어할 수 있다.

# 현대 시스템에서의 변화


오늘날 데스크톱 리눅스 콘솔이나 GUI 터미널(xterm, gnome-terminal 등)은 더 이상 물리적인 UART와 전신기를 사용하지 않는다.

대신 **소프트웨어로 구현된 가상 비디오 터미널**이 사용된다.

TTY 드라이버와 라인 디시플린의 동작 방식은 그대로 유지되지만, 입력은 키보드 이벤트로, 출력은 프레임 버퍼에 렌더링된 텍스트로 표현된다.

즉, 원리는 과거 TTY와 동일하지만, 물리적 장치 대신 소프트웨어로 에뮬레이션되는 것이다.

# Linux에서의 TTY 동작 과정


1. **하드웨어 입력/출력**
    - 사용자가 키보드를 통해 입력하면 → **Keyboard driver**가 이를 커널로 전달.
    - 프로그램의 출력은 커널을 거쳐 **VGA driver**로 전달되어 디스플레이에 표시.
2. **터미널 에뮬레이터 (Terminal emulator)**
    - 하드웨어 입력/출력을 추상화해 소프트웨어적으로 터미널 동작을 구현.
    - 키보드 입력 이벤트를 받아 문자 단위로 처리, 디스플레이 출력으로 전달.
3. **라인 디시플린 (Line discipline)**
    - 입력 버퍼링, 백스페이스/삭제/엔터 처리, CR↔LF 변환, 에코 출력 등을 담당.
    - 기본적으로 canonical(조리 모드)이나 raw 모드 등으로 동작 가능.
4. **TTY 드라이버 (TTY driver)**
    - 프로세스와 터미널 간 세션 관리 담당.
    - 포어그라운드 프로세스에만 입력을 전달하고, 백그라운드 프로세스가 터미널에 출력하려 하면 정지시키는 등의 제어 수행.
5. **사용자 프로세스 (User process)**
    - 셸(bash, zsh 등)이나 에디터, 프로그램 등이 여기에 해당.
    - TTY 드라이버를 통해 입력을 받고 출력은 다시 TTY → 라인 디시플린 → 터미널 에뮬레이터 → VGA로 전달된다.

![](/images/velog/5127f7e772d5f7f4.png)

![](/images/velog/c1321d906f9e696c.png)

# PTY ?


우리가 흔히 쓰는 터미널 프로그램, 혹은 그 안에서 호출되는 tmux, screen 과 같은 멀티플렉서들은 커널 공간 밖에서 처리된다.

즉 요컨대 우리가 흔히 쓰는 터미널 에뮬레이터는 userland process, 사용자의 process 이다.

- **Kernel space (커널 공간)**
    - 운영체제의 핵심 부분이 동작하는 영역.
    - 하드웨어 제어, 메모리 관리, 프로세스 스케줄링, 드라이버, 시스템 콜 처리 등이 수행됨.
    - CPU의 **특권 모드(privileged mode)**에서 실행 → 모든 하드웨어 자원에 직접 접근 가능.
- **User space (userland, 사용자 공간)**
    - 일반 애플리케이션(브라우저, 셸, DB, 게임 등)이 실행되는 영역.
    - CPU의 **비특권 모드(unprivileged mode)**에서 실행 → 하드웨어에 직접 접근 불가.
    - 하드웨어 접근이 필요할 때는 **시스템 콜(system call)**을 통해 커널에 요청.

즉 기존 TTY 구조는 지키되 가상의 터미널(pseudo terminal) 을 사용하여 에뮬레이터와 상호작용한다.

이것이 바로 PTY 이다.

PTY 는 master, slave 로 나뉜다.

master 는 터미널 에뮬레이터 프로세스와 입출력을 처리하고, tty driver 와 line discipline 이 slave 로 해당 내용을 중계해준다.

이후 slave 는 shell 에 대해 이를 처리한다.

![](/images/velog/9eec0299e146eca4.png)

# PTY 기반 터미널 에뮬레이터 기본동작과정


1. **하드웨어 입력/출력**
    - 사용자가 **키보드**를 누르면 입력은 **Keyboard driver**를 통해 커널로 전달.
    - 프로그램의 출력은 커널을 거쳐 **VGA/디스플레이 드라이버**로 전달되어 화면에 표시.
    - 하지만 GUI 터미널(Xterm, Gnome-terminal 등)은 직접 VGA를 쓰지 않고, **X 서버/Wayland** 같은 그래픽 시스템을 통해 UI를 처리.
2. **터미널 에뮬레이터 (Terminal emulator)**
    - GUI 터미널(Xterm 등)이 실행되면, OS에 PTY(가상 터미널)를 요청.
    - 동시에 **bash 같은 셸 프로세스**를 자식으로 띄우고, 그 프로세스의 **stdin/stdout/stderr를 PTY 슬레이브**에 연결.
    - 사용자가 키를 누르면 GUI 터미널은 이벤트를 받아 문자 단위로 **PTY 마스터**에 전달.
    - 화면 출력은 **PTY 마스터 → 터미널 에뮬레이터 → 디스플레이**로 처리
3. **라인 디시플린 (Line discipline)**
    - 입력 버퍼링, 백스페이스/삭제/엔터 처리, CR↔LF 변환, 에코 출력 등을 담당.
    - 기본적으로 canonical(조리 모드)이나 raw 모드 등으로 동작 가능.
4. **TTY 드라이버 (TTY driver)**
    - **프로세스와 터미널 간 세션 관리**를 담당.
    - 주요 역할:
        - 입력을 현재 포어그라운드 프로세스에만 전달
        - 백그라운드 프로세스가 출력하려 할 경우 **SIGTTOU**로 정지시키기도 함
    - 사용자가 Enter를 누르면, TTY 드라이버가 **라인 디시플린 버퍼에 쌓인 데이터를 슬레이브로 전달**합니다.
5. **사용자 프로세스 (User process)**
    - bash 같은 셸이 PTY 슬레이브를 표준입출력으로 사용합니다.
    - 예: 사용자가 `ls -la` 입력
        - bash가 이를 읽고 fork/exec로 `ls` 실행
        - `ls` 프로세스 역시 같은 PTY 슬레이브를 사용
    - `ls`의 출력은 슬레이브 → 커널 → 마스터로 전달되고, GUI 터미널이 이를 읽어 화면에 표시합니다.

![](/images/velog/a914ddaceefe9e24.png)

| **방향** | **데이터 흐름** |
| --- | --- |
| **키보드 입력** | 터미널 에뮬레이터 🠪 PTY 마스터 ⬌ 라인 규율 🠪 PTY 슬레이브 🠪 쉘 (stdin) |
| **쉘 출력** | 쉘 (stdout/stderr) 🠪 PTY 슬레이브 ⬌ 라인 규율 🠪 PTY 마스터 🠪 터미널 에뮬레이터 (화면 표시) |

# PTY 프로세스 생성과정


PTY 처리과정을 배웠으니 이제 어떻게 하면 코드로 PTY 를 처리하게 할 수 있는지 알아보자.

프로세스 생성과정이 필요하다.

여기서 부모프로세스와 자식프로세스를 통해 PTY Master 와 PTY Slave 를 처리한다.

부모는 PTY Master 를 가지고 터미널 에뮬레이터에 대한 처리를 하며, 자식은 PTY Slave 를 통해 표준 입출력을 처리한다.

1.

부모 프로세스 시작
2.

RAW 모드 처리 :: Line Discipline 기능을 비활성화하여 커서 출력이나 화살표 및 키 제어
3.

자식 프로세스 생성 및 FD 설정
4.

쉘 생성 및 PTY Slave 연결
5.

시그널에 따른 PTY 처리

### 1.

부모 프로세스 시작

![](/images/velog/a8b4ff19f88a70ff.png)

1.

부모 프로세스 (Go 프로그램, `xterm` 등)가 실행
2. `pty.Open()`과 같은 시스템 호출을 통해 PTY 쌍을 생성
3.

부모 프로세스는 다음 두 개의 파일 디스크립터(FD) 를 갖게 됨
    - **PTY 마스터 FD** (`ptyMaster`)
    - **PTY 슬레이브 FD** (`ptySlave`)

### 2.

RAW 모드 처리

![](/images/velog/9398c9f965dc6730.png)

1.

RAW Mode 를 Line Discipline 기능을 비활성화하여 커서 출력이나 화살표 및 키 제어를 사용자가 직접 처리할 수 있도록 한다
2.

이를 위해 두 가지 방법을 처리할 수 있다.
    1.

사용자가 직접 키보드로 명령어를 전달 → 부모 프로세스 stdin 에 RAW 설정
    2.

프로그 상 Slave 가 PTY 를 통해 명령어 전달 → PTY Slave 의 stdin 에 RAW 설정 
3.

PTY Slave TTY 원래 설정을 저장했다가 PTY Slave 가 종료 시 원래 설정으로 복구시켜 정리한다.

### 3.

자식 프로세스 생성 및 FD 설정

![](/images/velog/f809dd11c0470879.png)

- 부모 프로세스가 fork() 를 통해 자식 프로세스를 생성
- 자식 프로세스는 copy 된 PTY Master / PTY Slave FD 를 갖게 됨
- 이 때 자식 프로세스는 PTY Slave 만 필요하므로 PTY Master FD 를 닫늗다
- PTY Slave FD 는 자식 프로세스의 stdin/stdout/stderr 를 복제/이동한다.

### 4.

쉘 생성 및 PTY Slave 연결

![](/images/velog/6dba6d5476165d57.png)

- 자식 프로세스는 exec() 를 통해 자기 자신을 쉘 프로세스로 교체한다.

이를 통해 PTY Slave 를 쉘에 연결한다.
- 이후 사용자는 연결된 쉘에 명령어들을 처리한다.

### 5.

시그널에 따른 PTY 윈도우 변경

![](/images/velog/8812daa30805e895.png)

- PTY Slave 의 stdin 로부터 SIGINT, SIGTERM 전달 시 자식 프로세스를 종료한다.
- SIGWINCH 전달 시 PTY 윈도우 사이즈를 조정한다.

# Go 로 PTY 구현 예제


https://github.com/creack/pty

pseudo code 를 살펴봤으니 이제 실제 코드를 한 번 살펴보자.

구현은 Go 로 작성할 것이며 내가 찾아본 결과 위 라이브러리를 가장 많이 사용하는 것 같다.

위에서 살펴본 각 단계들에 대해 go 에서 처리할 함수들은 다음과 같다.

1.

부모 프로세스 시작
    
    부모 프로세스는 go run main.go 를 통해 메인 함수 실행에 따라 생성된다.

PTY 쌍(Master, Slave) 은 pty.Open() 를 통해 생성한다.

필자는 더불어 main 함수 종료됨에 따라 ptyMaster 가 종료되도록 defer 문을 추가해주었으며
    
    PTY 크기를 현재 터미널 크기로 설정하였다.
    
	
    > 💡
    > creack/pty 에서의 pty.Open() vs pty.Start()
    > 
    > - pty.Open()
    >     
    >     PTY 쌍만을 생성
    >     
    > - [pty.Start()](https://github.com/creack/pty/issues/79)
    >     
    >     PTY 쌍 생성 & stdin/stdout/stderr 처리 & 쉘 생성 및 호출
    >     
    >     사실상 아래 코드를 하나의 함수로 wrapping 해놨다고 보면 됨
    >     
    >     ```go
    >     master, slave, err := pty.Open()
    >     cmd := exec.Command("bash")
    >     cmd.Stdin = slave
    >     cmd.Stdout = slave
    >     cmd.Stderr = slave
         cmd.Start()
         ```
        
    
    ```go
    // 메인 함수 : 부모 프로세스
    func main() {
    	// PTY 쌍 생성
    	ptyMaster, ptySlave, err := pty.Open()
    	if err != nil {
    		return
    	}
    	defer func(ptyMaster *os.File) {
    		_ = ptyMaster.Close()
    	}(ptyMaster)
    	// PTY 크기를 현재 터미널 크기로 설정
    	winSize, _ := pty.GetsizeFull(os.Stdin)
    	_ = pty.Setsize(ptyMaster, winSize)
    }
    ```
    
2.

RAW 모드 처리 :: Line Discipline 기능을 비활성화하여 커서 출력이나 화살표 및 키 제어
    
    현 예제 프로그램에서는 사용자의 입출력을 그대로 PTY 에 전달하고자 한다.

따라서 os 의 stdin 에 대해 RAW 를 활성화하여 Line Discipline 을 우회하고
    
    이후 defer 를 통해 원래 상태로 다시 원복한다.
    
    ```go
    // 사용자의 입력을 PTY 에 전달하고자 부모의 stdin 에 대해 RAW MODE 활성화
    oldState, err := term.MakeRaw(int(os.Stdin.Fd()))
    if err != nil {
    	panic(err)
    }
    defer func() { _ = term.Restore(int(os.Stdin.Fd()), oldState) }()
    ```
    
3.

자식 프로세스 생성 및 FD 설정
    
    자식 프로세스를 생성하고 — go 에서는 fork 를 사용할 수 없다.

이유는 아래를 참고 — 
    
    자식 프로세스의 stdin, stdout, stderr 를 PTY Slave FD 로 지정한다.

또한 부모 프로세스는 PTY Slave 가 필요없으므로 닫는다.
    
    ```go
    // 자식 프로세스 생성
    // sid 를 지정하여 현재 세션으로부터 분리
    childProcess := exec.Command(os.Getenv("SHELL"))
    childProcess.SysProcAttr = &syscall.SysProcAttr{
    	Setsid:  true,
    	Setctty: true,
    }
    childProcess.Stdin = ptySlave
    childProcess.Stdout = ptySlave
    childProcess.Stderr = ptySlave
    err = childProcess.Start()
    if err != nil {
    	panic(err)
    }
    
    // 부모 프로세스는 PTY Slave 를 닫는다
    _ = ptySlave.Close()
    
    ```
    
    > 💡
    > 
    > go 에서는 linux kernel 혹은 userland 의 fork() 를 사용할 수 없다.
    > 
    > 이유인 즉슨 go 는 OS 단의 multi thread 를 기반으로 go 만의 여러 기능을 제공한다. 
    > 
    > — GC, goroutine, channel, network poller, scheduler, etc,,,
    > 
    > 반면 fork() 는 multi thread 를 copy 하지 않는다.
    > 
    > 대신 부모 프로세스에 대해 호출 시점의 single thread 만을 자식에게 복사한다.
    > 
    > [fork - create a new process](https://man7.org/linux/man-pages/man2/fork.2.html)
    > 
    > 
    > **A process shall be created with a single thread**.

If a multi-threaded process calls fork(), the new process shall contain a replica of the calling thread and its entire address space, possibly including the states of mutexes and other resources.

Consequently, to avoid errors, the child process may only execute async-signal-safe operations until such time as one of the exec functions is called.
    > 
    > 
    > 이에 따라 go code 안에서 처리되는 thread 간 통신 및 다양한 기능이 처리가 불가능하다.
    > 
    > 이를 해결하기 위해 아래와 같이 [우회하는 기법](https://stackoverflow.com/a/79722305)이 존재한다. ~~나 또한 이것 이외 더 좋은 방법이 안 떠오른다~~
    > 
    ```go
    // Fork process as daemon, returns new process PID
    func Fork() (int, error) {
        cmd := exec.Command(os.Args[0], os.Args[1:]...)
        // Add env to run process as daemon
        cmd.Env = append(os.Environ(), "IS_DAEMON=1")
        // Optional: redirect input/outputs
        cmd.Stdin = nil
        cmd.Stdout = os.Stdout
        cmd.Stderr = os.Stderr
        cmd.SysProcAttr = &syscall.SysProcAttr{
        // Setsid is used to detach the process from the parent (normally a shell)
            Setsid: true,
        }
        if err := cmd.Start(); err != nil {
            return 0, err
        }
        return cmd.Process.Pid, nil
    }
    ```
    
    
4.

쉘 생성 및 PTY Slave 연결
    
    PTY Master, PTY Slave 에 대해 다시 간략히 요약하자면
    
    1.

PTY Master 는 사용자의 입출력을 받고
    2.

커널이 PTY Master 와 PTY Slave 간 양방향으로 데이터로 전달하고
    3.

PTY Slave 는 자식 쉘 프로세스에서 이를 처리하는 구조이다.

따라서 사용자의 입출력은 PTY Master 에 연결되어야 한다.

이를 위해 goroutine 을 활용하여 PTY Master 는 현재 세션의 stdout 으로, 현재 세션의 stdin 은 PTY Master 로 처리되도록 한다.
    
    ```go
    // PTY Master -> 현재 세션의 stdout (화면에 표시)
    // 현재 세션의 stdin -> PTY Master (입력을 PTY 에 전달하여 가상의 shell 에 전달)
    go func() {
    	_, _ = io.Copy(os.Stdout, ptyMaster)
    }()
    go func() {
    	_, _ = io.Copy(ptyMaster, os.Stdin)
    }()
    ```
    
5.

자식 종료에 따른 SIGINT, SIGTERM 처리
    
    SIGWINCH 입력 시 PTY 윈도우 크기를 변경하도록 조정한다.

STGINT, SIGTERM 같은 경우 이미 stdin 을 통해 넘기고 있으므로 따로 고루틴을 통해 처리할 필요가 없다.

또한 위 고루틴과 자식 프로세스 종료를 위해 자식 프로세스 종료에 대한 블로킹 함수를 처리한다.
    
    ```go
    // 시그널을 통해 PTY 윈도우 크기 변경
    signalChan := make(chan os.Signal, 1)
    signal.Notify(signalChan, syscall.SIGWINCH)
    defer func() {
    	signal.Stop(signalChan)
    	close(signalChan)
    }()
    go func() {
    	for sig := range signalChan {
    		if sig == syscall.SIGWINCH {
    			if winSize, err := pty.GetsizeFull(os.Stdin); err == nil {
    				_ = pty.Setsize(ptyMaster, winSize)
    			}
    		}
    	}
    }()
    
    // 자식 프로세스가 종료될 때까지 블로킹하며 대기
    err = childProcess.Wait()
    ```
    

최종 코드는 아래와 같다.

```go
package main

import (
	"errors"
	"io"
	"os"
	"os/exec"
	"os/signal"
	"syscall"

	"github.com/creack/pty"
	"golang.org/x/term"
)

// 메인 함수 : 부모 프로세스
func main() {
	// PTY 쌍 생성
	ptyMaster, ptySlave, err := pty.Open()
	if err != nil {
		return
	}
	defer func(ptyMaster *os.File) {
		_ = ptyMaster.Close()
	}(ptyMaster)
	// PTY 크기를 현재 터미널 크기로 설정
	winSize, _ := pty.GetsizeFull(os.Stdin)
	_ = pty.Setsize(ptyMaster, winSize)

	// 사용자의 입력을 PTY 에 전달하고자 부모의 stdin 에 대해 RAW MODE 활성화
	oldState, err := term.MakeRaw(int(os.Stdin.Fd()))
	if err != nil {
		panic(err)
	}
	defer func() { _ = term.Restore(int(os.Stdin.Fd()), oldState) }()

	// 자식 프로세스 생성
	// sid 를 지정하여 현재 세션으로부터 분리
	childProcess := exec.Command(os.Getenv("SHELL"))
	childProcess.SysProcAttr = &syscall.SysProcAttr{
		Setsid:  true,
		Setctty: true,
	}
	childProcess.Stdin = ptySlave
	childProcess.Stdout = ptySlave
	childProcess.Stderr = ptySlave
	err = childProcess.Start()
	if err != nil {
		panic(err)
	}

	// 부모 프로세스는 PTY Slave 를 닫는다
	_ = ptySlave.Close()

	// PTY Master -> 현재 세션의 stdout (화면에 표시)
	// 현재 세션의 stdin -> PTY Master (입력을 PTY 에 전달하여 가상의 shell 에 전달)
	go func() {
		_, _ = io.Copy(os.Stdout, ptyMaster)
	}()
	go func() {
		_, _ = io.Copy(ptyMaster, os.Stdin)
	}()

	// 시그널을 통해 PTY 윈도우 크기 변경
	signalChan := make(chan os.Signal, 1)
	signal.Notify(signalChan, syscall.SIGWINCH)
	defer func() {
		signal.Stop(signalChan)
		close(signalChan)
	}()
	go func() {
		for sig := range signalChan {
			if sig == syscall.SIGWINCH {
				if winSize, err := pty.GetsizeFull(os.Stdin); err == nil {
					_ = pty.Setsize(ptyMaster, winSize)
				}
			}
		}
	}()

	// 자식 프로세스가 종료될 때까지 블로킹하며 대기
	err = childProcess.Wait()
}

```

![](/images/velog/1bfcb3d9c0593d48.gif)

# Reference 📚


https://www.linusakesson.net/programming/tty/

https://dev.to/napicella/linux-terminals-tty-pty-and-shell-192e

https://sudormrf.run/2018/02/22/pseudoterminal/

https://stackoverflow.com/questions/65175134/what-can-you-do-with-a-pty

https://unix.stackexchange.com/questions/31824/how-do-i-attach-a-terminal-to-a-detached-process

https://medium.com/@kaifmunshi697/build-a-simple-terminal-application-in-go-a-step-by-step-guide-for-beginners-002989a04132

https://github.com/creack/pty/issues/79

https://man7.org/linux/man-pages/man2/fork.2.html
