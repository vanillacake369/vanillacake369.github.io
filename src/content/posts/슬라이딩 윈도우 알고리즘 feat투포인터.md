---
title: "슬라이딩 윈도우 알고리즘 (feat.투포인터)"
description: "각각의 경우를 찾아나갈 때, 종종 double for loop 를 쓴다. 이를 개선하기 위해 탐색범위를 효과적으로 줄이는 방법인 sliding window 알고리즘을 사용해보자."
date: 2024-05-14
tags: [sliding-window, boj, two pointer]
category: uncategorized
lang: ko
draft: false
---

# What is Sliding Window ??

각각의 경우를 찾아나갈 때, 종종 double for loop 를 쓴다.

이 때 outer loop(i), inner loop(j) 를 통해 풀곤 하는데, 이렇게 처리하는 경우 O(N^2) 시간복잡도가 발생한다.

이를 개선하기 위해 탐색범위를 효과적으로 줄이는 방법을 사용한다.

바로 **<span style="color:yellowgreen">N 크기만큼의 윈도우를 유지한채 탐색</span>** 해나가는 것이다.

![](/images/velog/69b8cdeaa042bcbe.png)

1. left pointer, right pointer 를 생성

2. 초기에 N 크기만큼을 선택하기 위해 right pointer 를 expand 한다.

3. 이제 right pointer,left pointer 를 움직여 window 를 움직일 차례다. 우선 left pointer 요소를 제거한다.

4. window size 를 맞추기 위해 left pointer 를 expand 한다.

5. right pointer 가 끝에 닿을 때까지 반복한다.

## 예시문제 : N 개의 이웃원소의 합 찾기

만약 아래와 같은 문제가 있다고 치자.

>주어진 a배열과 숫자 s,ans 에 대해
a 배열에서 이웃원소 중 ans 개수만큼을 추출하여 s 를 만족하는 경우를 찾으시오.

이를 일반적인 double for loop 를 사용하면 아래와 같이 풀 수 있다.

> naive solution :: "for-loop"
> O(N^2)

```python
import math
ans = math.inf

for i in range(0,n):
	sum = 0
	for j in range(i,n):
		# 만약 sum + a[j] 이 s 보다 커지면 합산 이후 멈춘다.
		if sum + a[j] >= s:
			sum += a[j]
			ans = min(ans, j-i+1)
			break
		sum += a[j]
```

위와 같은 접근은 O(N^2) 이다. 조금 더 개선할 수 있을까?

있다. Sliding Window 를 사용하여 다음과 같이 탐색 범위를 줄이는 것이다.

- 오른쪽 포인터를 움직여 범위를 확장
- 왼쪽 포인터를 움직여 조건에 맞게 범위를 줄인다.
   - 이 때, <span style="color:yellowgreen">왼쪽 포인터의 값을 제거해주는 것이 포인트</span>이다.
	

> sliding window :: "shrink range by moving two pointer"
> O(N)

```python
import math
ans = math.inf
l,sum = 0,0  # l : left pointer

# expand right pointer
for r in range(0,n):
	sum += a[r]
	while(sum >= s):
		ans = min(ans,r-l+1)
		sum -= a[l] # left pointer 를 이동하기 때문에 sum 에서 제거해준다.
		l++ # left pointer 를 이동
		""" 위 두 라인은 sum -= a[l++] 으로 처리될 수 있다."""
```

## 예시문제 : [내려가기](https://www.acmicpc.net/problem/2096)

> 음 사실 이 문제는 슬라이딩 윈도우가 소금처럼 가미된 DP 문제이지만, 
> 
> "double array 에서 각 row 별로 슬라이딩 윈도우를 사용하여 접근한다" 는 의미가 있기에
> 
> 소개해본다.

해당 문제는 그리디에 가까운 메모이제이션문제이다.

각 row 에서의 아래의 row 의 특정 column을 선택할 때, 최대값,최소값을 찾는 문제인데,

관건은 "어떻게 경우의 수를 구할 수 있느냐" 이다.

해당 문제는 DP 문제로 점화식은 다음과 같다.

```python
maxDP1[i] = arr[i][0] + max(maxDP1[i-1], maxDP2[i-1])
maxDP2[i] = arr[i][1] + max(maxDP1[i-1], maxDP2[i-1], maxDP3[i-1])
maxDP3[i] = arr[i][2] + max(maxDP2[i-1], maxDP3[i-1])
```

하지만 이러한 DP 점화식을 Sliding Window 를 통해 개선할 수 있다.

각각의 row 들에 접근하였을 때의 값을 메모하기 위해 

메모이제이션 배열을 따로 두지 않는 것이다.

각각의 row 들에 접근할 때마다 값을 갱신해주고, 접근범위를 옮기는 것이다.

여기서는 i,j 와 같은 투포인터를 사용하여 접근범위를 지정하지 않고

값을 입력받을 때마다 갱신해주는 식으로 처리하였다.


```python
from sys import stdin

N = int(input())
# 맨 처음 세개의 숫자를 입력받아 DP의 초기 값을 설정한다.
arr = list(map(int, stdin.readline().split()))
maxDP = arr
minDP = arr
for _ in range(N - 1):
    arr = list(map(int, stdin.readline().split()))
    # 세가지 값을 입력받을 때마다, DP에 새롭게 갱신한다.
    maxDP = [arr[0] + max(maxDP[0], maxDP[1]), arr[1] + max(maxDP), arr[2] + max(maxDP[1], maxDP[2])]
    minDP = [arr[0] + min(minDP[0], minDP[1]), arr[1] + min(minDP), arr[2] + min(minDP[1], minDP[2])]

print(max(maxDP), min(minDP))

```

# Reference
---
- [Algorithm Sliding Window - Dynamic Version
](https://www.youtube.com/watch?v=nCcSwjFmfMM&ab_channel=DuoWeiEducation)
- [[알고리즘] 슬라이딩 윈도우 알고리즘](https://velog.io/@ninto_2/%EC%8A%AC%EB%9D%BC%EC%9D%B4%EB%94%A9-%EC%9C%88%EB%8F%84%EC%9A%B0-%EC%95%8C%EA%B3%A0%EB%A6%AC%EC%A6%98)
- [[백준] 2096번: 내려가기 문제 풀이 파이썬
](https://velog.io/@hyuntall/%EB%B0%B1%EC%A4%80-2096%EB%B2%88-%EB%82%B4%EB%A0%A4%EA%B0%80%EA%B8%B0-%EB%AC%B8%EC%A0%9C-%ED%92%80%EC%9D%B4-%ED%8C%8C%EC%9D%B4%EC%8D%AC)
