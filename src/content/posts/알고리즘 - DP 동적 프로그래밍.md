---
title: "알고리즘 - DP 동적 프로그래밍"
description: "동적 프로그래밍(DP) 패턴 정리 및 풀이"
date: 2025-12-19
tags: [algorithm, algorithm]
category: uncategorized
lang: ko
draft: false
---

## DP

- base case 를 통해 언제 재귀할지 꼭 유의한다
- dp 배열 크기를 n + 1 로 선언해 index out of range 를 막는다
- 탐색 순서가 Bottom-Up은 작은 값부터, Top-Down은 memo 사용

```bash
// dp[i] = i번째 계단까지의 최소 비용
dp := make([]int, n+1)  // ★ n+1
dp[0], dp[1] = 0, 0     // ★ Base Case
for i := 2; i <= n; i++ {
    dp[i] = min(dp[i-1]+cost[i-1], dp[i-2]+cost[i-2])
}
```
```bash
var memo map[int]int  // ★ 반드시 make로 초기화 후 사용

func solve(n int) int {
    if n <= 1 { return n }
    if v, ok := memo[n]; ok { return v }
    memo[n] = solve(n-1) + solve(n-2)
    return memo[n]
}
```

## DP

- base case를 통해 언제 재귀할지 꼭 유의한다
- dp 배열 크기를 `n + 1`로 선언해 index out of range를 막는다
- 탐색 순서가 Bottom-Up은 작은 값부터, Top-Down은 memo 사용

```java
// dp[i] = i번째 계단까지의 최소 비용 (Bottom-Up)
int[] dp = new int[n + 1]; // ★ n+1
dp[0] = 0; dp[1] = 0;     // ★ Base Case
for (int i = 2; i <= n; i++) {
    dp[i] = Math.min(dp[i - 1] + cost[i - 1], dp[i - 2] + cost[i - 2]);
}
```
```java
// Top-Down (메모이제이션)
Map<Integer, Integer> memo = new HashMap<>(); // ★ 선언과 동시에 초기화

int solve(int n) {
    if (n <= 1) return n;
    if (memo.containsKey(n)) return memo.get(n);
    int result = solve(n - 1) + solve(n - 2);
    memo.put(n, result);
    return result;
}
```

---

## 3. 완전탐색, DP

> 📌 keyword

완전탐색으로 문제를 풀었을 때 중복계산 때문에 시간초과가 나는 경우가 있습니다.
이 때 memoization, dp table를 활용하여 최적화하시면 시간내에 통과 됩니다.

사실 핵심은, DP가 아니라 완전탐색입니다.
완전탐색(재귀)으로 문제를 풀 수 있으면 그 이후에 중복을 제거하는 최적화 과정은 어렵지 않습니다.
특히 재귀로 코드를 작성하다도면 자연스럽게 n항과 n-1항과의 관계를 함수로 나타낼 수 있게 됩니다.
즉, 점화식을 작성할 수 있게 되고 이를 통해 top-down, bottom-up 두 가지 방식으로 코드를 구현할 수 있습니다.


- 예제
