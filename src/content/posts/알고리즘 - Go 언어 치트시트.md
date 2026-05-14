---
title: "알고리즘 - Go 언어 치트시트"
description: "Go 언어 알고리즘 풀이 치트시트: 슬라이스, 맵, 정렬, 변환"
date: 2025-12-19
tags: [algorithm, journal]
lang: ko
draft: false
---

## 시험 전 치트시트 Go 언어

# 알고리즘 유의사항

## 2차원 슬라이스 / 최대최소 초기화

```bash
// 2차원 슬라이스 초기화 (n x m)
grid := make([][]int, n)
for i := range grid {
    grid[i] = make([]int, m)
}

// 최대/최소값 초기화
import "math"
maxVal := math.MinInt64
minVal := math.MaxInt64
```


## Map & Struct

Map

```bash
// 생성: make(map[Key타입]Value타입)
m := make(map[string]int)

m["apple"] = 10    // 삽입/갱신
val := m["apple"]  // 조회
delete(m, "apple") // 삭제

// 존재 여부 확인 (중요!)
if val, ok := m["banana"]; ok {
    fmt.Println("존재함:", val)
}
```

Struct

```bash
type Item struct {
    priority int
    index    int
}

// 초기화 방법
item1 := Item{priority: 3, index: 0}
item2 := Item{5, 1} // 필드 순서대로 주입
```

---

## 배열 → 문자열

```bash
import "strings"

strSlice := []string{"A", "B", "C"}
result := strings.Join(strSlice, ",") // "A,B,C"

// int 슬라이스를 문자열로 합칠 때 (자주 나옴)
// 각 숫자를 문자열로 바꾼 뒤 Join 해야 함
```


## 시험 전 치트시트 Java 17

# 알고리즘 유의사항

## 백트래킹 시 방문 여부에 따른 배열 선언

# Why?

왜 배움?

---

---

백트래킹 문제 풀이 시 문제 유형에 따라 배열을 몇 개 선언해야하는지에 대해
유형과 차이점을 notation 하고자 한다. 

# What?

뭘 배움?

---

---

> 💡 TL;DR;

**백트래킹은 기본적으로 recursive call 에 따른 모든 경우의 수 탐색이다.**
**대표적인 예시문제로 **[**N과 M (1)**](https://www.acmicpc.net/problem/15649)** 와 **[N-Queen](https://www.acmicpc.net/problem/9663) 가 있다.
**다만 차이점은 **[**N과 M (1)**](https://www.acmicpc.net/problem/15649)** 은 배열을 두 개로 필요로하고**
[N-Queen](https://www.acmicpc.net/problem/9663) 은 하나만 있어도 된다는 점이다.

### [**N과 M (1)**](https://www.acmicpc.net/problem/15649)** **

중복된 숫자 없는 순열에서 중요한 것은 다음 탐색 대상이 새로운 수여야 한다는 것이다.

즉 이전 탐색했던 숫자의 목록을 기억(memo) 해야한다.

이에 따라 1) 탐색 상태 저장공간 2) 탐색했던 숫자 목록을 기억해두는 저장공간 이
별도로 필요하다.

```go
package main

import (
	"bufio"
	"fmt"
	"os"
)

// 🤔 여기서 왜 arr, isUsed 를 10 길이의 배열로 삼음 ??
// 최대 범위 8 에서 +1 만큼의 배열을 선언해둬야
// IndexError 가 발생하지 않음
// 통상적으로 최대범위 +1, +2 만큼의 배열을 잡는 편임
var (
	n, m   int
	arr    [10]int
	isUsed [10]bool
	// 입력을 위한 리더와 출력을 위한 라이터 설정
	reader = bufio.NewReader(os.Stdin)
	writer = bufio.NewWriter(os.Stdout)
)

func main() {
	defer writer.Flush()
	fmt.Fscanf(reader, "%d %d
", &n, &m)

	permutation(0)
}

func permutation(index int) {
	// 📓 재귀 호출구조이니 반드시 base case 있어야 함
	// 모든 경우의 수를 출력하는 것이니
	// 재귀를 통해 순열 길이의 끝까지 탐색했다면
	// 출력하도록 함
	if index == m {
		for i := 0; i < m; i++ {
			fmt.Fprintf(writer, "%d ", arr[i])
		}
		fmt.Fprint(writer, "
")
		return
	}

	// 📓 순열 탐색 시작
	// Note :: 순열의 시작은 1 , 끝은 n 임
	for i := 1; i <= n; i++ {
		// 만약 탐색하지 않았다면 탐색 시작
		// 탐색을 완료한 숫자는 무시하도록 함
		if !isUsed[i] {
			// 순열의 순서인 index 에 해당하는 배열 값에
			// 탐색값을 삽입
			arr[index] = i
			// 탐색하였으므로 해당 숫자는 사용됨을 표시
			isUsed[i] = true
			// 현재 순열 순서의 다음 순번인
			// index + 1 에 대해서 탐색 시작
			permutation(index + 1)
			// i 로 시작한 순열 탐색이 끝나면
			// i + 1 로 시작한 순열 탐색에서 i 에 대한 사용표시를 위해
			// i 의 사용 표시를 제거
			// e.g. 1 로 시작한 순열 탐색 이후 2 로 시작한 순열탐색의 1 사용을 위해 1 사용표시 제해
			isUsed[i] = false
		}
	}
}

```

### [N-Queen](https://www.acmicpc.net/problem/9663)

반면 N-Queen 의 경우, 다르다.

체스판의 row 를 조건에 따라 탐색해나가는 이 문제는
이전 탐색 목록을 기억해둘 필요가 없다
단지 조건에 따라 배제하면 된다.

따라서 1) 탐색 상태 저장공간 만 필요하다.

```go
package main

import (
	"bufio"
	"fmt"
	"math"
	"os"
)

var (
	// 입력을 위한 리더와 출력을 위한 라이터 설정
	reader = bufio.NewReader(os.Stdin)
	writer = bufio.NewWriter(os.Stdout)

	// 체스판 크기(input), 모든 경우의 수 결과개수(output)
	n        int
	possible int
)

func main() {
	defer writer.Flush()
	fmt.Fscanf(reader, "%d
", &n)

	// 탐색 state machine dynamic array 선언
	// 이미 이전 행에 대한 탐색 체크로 인해
	// 탐색 완료 여부를 별도로 체크할 필요 X
	board := make([]int, n)
	calcChessCase(0, board)

	fmt.Fprintf(writer, "%d", possible)
}

func calcChessCase(row int, board []int) {
	// Base case
	if row == n {
		possible++
		return
	}

	// Find all cases by recursive call tracking
	// Follow up untill i hits the bottom row
	for col := 0; col < n; col++ {
		if isNotQueenPath(row, col, board) {
			// 퀸 배치
			board[row] = col
			// 다음 행에 대한 탐색 시작
			calcChessCase(row+1, board)
		}

	}
}

// 퀀 경로에 있는지 확인
// 1) 같은 열 여부
// 2) 대각선 여부
func isNotQueenPath(row int, col int, board []int) bool {
	for i := 0; i < row; i++ {
		if board[i] == col || math.Abs(float64(i-row)) == math.Abs(float64(board[i]-col)) {
			return false
		}
	}
	return true
}

```

# How?

어떻게 씀?

---

x
