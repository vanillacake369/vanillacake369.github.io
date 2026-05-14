---
title: "알고리즘 - DFS BFS 그래프 탐색"
description: "DFS/BFS 그래프 탐색 알고리즘 정리 및 풀이"
date: 2025-12-19
tags: [algorithm]
lang: ko
draft: false
---

## DFS/BFS

BFS
`visited` 체크를 **큐에 넣을 때** 하는지, **꺼낼 때** 하는지 확인

- `visited` 체크를 **큐에 넣을 때** 해야하는 경우
- `visited` 체크를 **큐에 꺼낼 때** 해야하는 경우

DFS

- **백트래킹에서 ****`visited[next] = false`**** 빠뜨림** → 경로 탐색 실패
- 재귀 DFS에서 visited 체크를 호출 전에 안 하면 **무한 루프**
- 타겟 넘버 유형(+/- 분기)에서는 visited 자체가 **필요 없는** 경우도 있음

## DFS / BFS

### BFS

> visited 체크를 큐에 넣을 때 하는지, 꺼낼 때 하는지 확인

**visited 체크를 큐에 넣을 때 해야하는 경우**

```java
Queue<int[]> queue = new LinkedList<>();
queue.offer(new int[]{start[0], start[1], 0});
visited[start[0]][start[1]] = true; // ★ 넣을 때 체크

while (!queue.isEmpty()) {
    int[] curr = queue.poll();
    int x = curr[0], y = curr[1], dist = curr[2];

    for (int d = 0; d < 4; d++) {
        int nx = x + dx[d], ny = y + dy[d];
        if (inRange(nx, ny, n, m) && !visited[nx][ny] && grid[nx][ny] != 1) {
            visited[nx][ny] = true; // ★ 큐에 넣기 전에 체크
            queue.offer(new int[]{nx, ny, dist + 1});
        }
    }
}
```

**visited 체크를 큐에서 꺼낼 때 해야하는 경우 (다익스트라 등)**

```java
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]); 
// cost 기준 최소힙
pq.offer(new int[]{0, startX, startY});

while (!pq.isEmpty()) {
    int[] curr = pq.poll();
    int cost = curr[0], x = curr[1], y = curr[2];

    if (visited[x][y]) continue; // ★ 꺼낼 때 체크
    visited[x][y] = true;

    // 인접 노드 탐색...
    pq.offer(new int[]{cost + weight, nx, ny});
}
```

### DFS

- 백트래킹에서 `visited[next] = false` 빠뜨림 → 경로 탐색 실패
- 재귀 DFS에서 visited 체크를 호출 전에 안 하면 무한 루프
- 타겟 넘버 유형(+/- 분기)에서는 visited 자체가 필요 없는 경우도 있음

---

## 4.

그래프 + BFS, DFS

> 📌 keyword

그래프에서 가장 많이 출제되는 유형은 크게 두 가지 있습니다.

1.

연결된 영역 그룹(개수, 넓이, 요소의 개수 등)
2.

최단거리

연결된 영역 그룹에 관련된 문제는 BFS, DFS의 공통적인 특성인 “연결되어 있는 모든 노드를 탐색한다”를 활용하는 것입니다.

해당 유형은 [[리트코드] number of islands](https://leetcode.com/problems/number-of-islands/description/),  [[리트코드] keys and rooms](https://leetcode.com/problems/keys-and-rooms/)문제를 통해서 학습하실 수 있습니다.

비슷한 유형으로는 [[프로그래머스] 네트워크](https://school.programmers.co.kr/learn/courses/30/lessons/43162), [[백준 11724] 연결 요소의 개수](https://www.acmicpc.net/problem/11724)이 있습니다.

최단거리 문제는 BFS로 풀 수 있고, 시험에서는 훨씬 더 자주 나오는 유형입니다.

최단거리 문제 유형은 두 가지 형식으로 출제됩니다.

> (1) 그래프 + BFS
> (2) 암시적그래프(grid) + BFS

(1) 그래프 + BFS

- 그래프 변환 (인접리스트)
- BFS문제인지 알아차리기가 어렵다.

최단거리, 최소비용 등을 힌트로 알아차리자
- 유형 문제

(2) 암시적그래프(grid) + BFS

## 5.

트리 + DFS (최근 트렌드)

> 📌 keyword

트리는 그래프 문제의 확장으로 생각하시면 됩니다.

트리에서 가장 중요한건 DFS 입니다.

기본적으로 트리는 재귀적인 자료구조이기 때문에 문제풀이 유형도 재귀(DFS)와 연관이 아주 깊습니다.

트리의 DFS에서는 전위순회, 중위순회, 후위순회가 있습니다.

가장 많이 나오는 것은 후위순회입니다.

**후위 순회 (Postorder Traversal)**
💡 왼쪽 서브트리 → 오른쪽 서브트리 → 루트 순서로 순회하는 방식

- 출제 방식:
- 예제 문제

특히 트리에서는 입력값을 어떻게 인접리스트 코드로 구현할지를 미리 학습해 두어야 합니다.

문제에서 트리를 표현하는 방식이 다양하기 때문에 미리 살펴보면 큰 도움이 됩니다.

## BFS

각 노드들의 이웃노드들을 순차적으로 탐색해나가는 방식 cf) DFS 는 노드의 자식의 자식을 재귀호출을 통해 탐색
Queue 를 사용해서 다음 방문할 곳을 순서대로 저장
Visited 를 통해 방문여부를 표시하여 노드들을 탐색

- 시작 지점을 **Queue**에 넣고 **방문 처리**를 한다.
- 큐가 빌 때까지 다음을 반복한다:

```java
// BFS에 사용할 큐를 생성해줍니다.
int[][] graph = {{}, {2,3,7}, {1,3,5}, {1,2}, {6,8}, {2}, {4,7,8}, {1,6}, {4,6}};
boolean[] visit = new boolean[9];
Queue<Integer> q = new LinkedList<Integer>();

// 큐에 BFS를 시작 할 노드 번호를 넣어줍니다.
q.offer(start);

// 시작노드 방문처리
visited[start] = true;

// 큐가 빌 때까지 반복
while(!q.isEmpty()) {
	int nodeIndex = q.poll();

	//큐에서 꺼낸 노드와 연결된 노드들 체크
	for(int i=0; i<graph[nodeIndex].length; i++) {
		int temp = graph[nodeIndex][i];
		// 방문하지 않았으면 방문처리 후 큐에 넣기
		if(!visited[temp]) {
			visited[temp] = true;
			q.offer(temp);
		}
	}
}
```

### 테크닉 : State Space BFS(상태 사용하여 조건에 따른 탐색)

> 💡 핵심 원리

```java
static int bfs(int n, int m, int[][] map) {
		// 방문여부
    int[][][] visited = new int[n][m][2];
    for (int[][] row : visited){ 
		    for (int[] col : row) {
				    Arrays.fill(col, -1);
		    }
    }

		// 일반이동과 특수이동에 대해 BFS 진행
		// 각 노드에 대해 특수이동한 경우의 수들로 진행 -- 조합처럼
    Queue<int[]> q = new LinkedList<>();
    q.add(new int[]{0, 0, 0});
    visited[0][0][0] = 0;

    while (!q.isEmpty()) {
        int[] curr = q.poll();
        int r = curr[0];
        int c = curr[1];
        int used = curr[2];

        if (r == n - 1 && c == m - 1){
		        return visited[r][c][used];
        }

        for (int i = 0; i < 4; i++) {
            // 1. 일반 이동 (항상 가능)
            int nr = r + dr[i], nc = c + dc[i];
            if (canGo(nr, nc) && visited[nr][nc][used] == -1) {
                visited[nr][nc][used] = visited[r][c][used] + 1;
                q.add(new int[]{nr, nc, used});
            }

            // 2. 특수 이동 (신발 미사용 시에만 가능)
            if (used == 0) {
                int sr = r + dr[i] * 2, sc = c + dc[i] * 2;
                if (canGo(sr, sc) && visited[sr][sc][1] == -1) {
                    visited[sr][sc][1] = visited[r][c][0] + 1;
                    q.add(new int[]{sr, sc, 1});
                }
            }
        }
    }
    return -1;
}
```

### 문제 : [보물 지도](https://school.programmers.co.kr/learn/courses/15009/lessons/121690)

> 요구사항
> 접근/원리

```java
import java.util.*;

class Solution {
    private int N, M;
    private boolean[][] isHole;
    private int[][][] visited;
    private final int[] dx = {0, 0, 1, -1};
    private final int[] dy = {1, -1, 0, 0};

    public int solution(int n, int m, int[][] hole) {
        // 1. 초기 설정 및 맵 구성
        setup(n, m, hole);

        // 2. 탐색 시작 (BFS)
        return findShortestPath();
    }

    private void setup(int n, int m, int[][] hole) {
        this.N = n;
        this.M = m;
        this.isHole = new boolean[n + 1][m + 1];
        for (int[] h : hole) {
            isHole[h[0]][h[1]] = true;
        }

        this.visited = new int[n + 1][m + 1][2];
        for (int i = 1; i <= n; i++) {
            for (int j = 1; j <= m; j++) {
                Arrays.fill(visited[i][j], -1);
            }
        }
    }

    private int findShortestPath() {
        Queue<int[]> q = new LinkedList<>();
        q.add(new int[]{1, 1, 0}); // {x, y, usedShoes}
        visited[1][1][0] = 0;

        while (!q.isEmpty()) {
            int[] curr = q.poll();
            int x = curr[0];
            int y = curr[1];
            int used = curr[2];

            // 목표 지점 도달 시 즉시 반환
            if (x == N && y == M) return visited[x][y][used];

            // 네 방향으로 이동 시도
            for (int i = 0; i < 4; i++) {
                handleNormalMove(q, x, y, used, i);
                handleShoeMove(q, x, y, used, i);
            }
        }
        return -1;
    }

    private void handleNormalMove(Queue<int[]> q, int x, int y, int used, int dir) {
        int nx = x + dx[dir];
        int ny = y + dy[dir];

        if (canMoveTo(nx, ny) && visited[nx][ny][used] == -1) {
            visited[nx][ny][used] = visited[x][y][used] + 1;
            q.add(new int[]{nx, ny, used});
        }
    }

    private void handleShoeMove(Queue<int[]> q, int x, int y, int used, int dir) {
        // 신발을 이미 썼다면 무시
        if (used == 1) return;

        int nx = x + dx[dir] * 2;
        int ny = y + dy[dir] * 2;

        // 신발 사용 후 상태는 무조건 1(used)
        if (canMoveTo(nx, ny) && visited[nx][ny][1] == -1) {
            visited[nx][ny][1] = visited[x][y][0] + 1;
            q.add(new int[]{nx, ny, 1});
        }
    }

    private boolean canMoveTo(int x, int y) {
        // 맵 범위 내에 있고, 함정이 아닌지 확인
        return x >= 1 && x <= N && y >= 1 && y <= M && !isHole[x][y];
    }
}
```

### 문제 : [그림](https://www.acmicpc.net/problem/1926)

```java
public int[] solution {int n, int m, int[][] paint) {
	Queue<int[]> q = new LinkedList<>();
	int[] dr = {-1,1,0,0};
	int[] dc = {0,0,-1,1};
	boolean[][] visited = new boolean[n][m];
	int count = 0;
	int maxSize = 0;

	for (int r=0;r<n;r++){
		for(int c=0;c<m;c++){
			// 현재 노드가 그림인 경우
			// 현재 노드 방문 처리 && 이웃노드들에 대한 BFS 시작
			if ( isPaint(paint,r,c) && visited[r][c] == false ) {
				visited[r][c] = true;
				q.offer(new int[]{r,c});
				count++;
				int currentSize =0;

				while ( !q.isEmpty() ){
					int[] currNode = q.poll();
					int cr = currNode[0];
          int cc = currNode[1];
					currentSize ++;

					for (int i=0;i<4;i++){
						nr = cr + dr[i];
						nc = cc + dc[i];
						// 다음 노드가 범위 내 그림이고 미방문이라면
						// 방문처리하고 방문대기큐에 추가
						if ( isRange(paint,nr,nc) && isPaint(paint,nr,nc) && visited[nr][nc] == false ){
							visited[nr][nc] = true;
							q.offer(new int[]{nr,nc});
						}
					}
				}

				maxSize = Math.max(maxSize,currentSize);
			}
		}
	}

	return new int[]{count, maxSize);
}

public boolean isRange(int[][] paint, int r, int c) {
	boolean isRangeRow = 0 <= r && r < paint.length;
	boolean isRangeCol = 0 <= c && c < paint[0].length;
	return isRangeRow && isRangeCol;
}

public boolean isPaint(int[][] paint, int r, int c) {
	return paint[r][c] == 1;
}
```

## DFS/백트래킹

한 방향으로 갈 수 있을 때까지 깊게 탐색하고, 더 이상 갈 곳이 없으면 가장 마지막 갈림길로 돌아와 다른 방향을 탐색하는 방식

- 사용 자료구조: 시스템 Stack(재귀 호출) 또는 명시적 `Stack` 클래스 사용.
- 탐색 메커니즘: 현재 노드와 연결된 인접 노드 중 하나를 선택해 즉시 깊게 들어간다. (자식의 자식을 먼저 방문)
- 백트래킹(Backtracking): 막다른 길에 도달하면 호출 스택을 빠져나와(Return) 이전 상태로 복귀한다.
- 방문 처리(Visited): 무한 루프 방지를 위해 필수이며, 문제 유형에 따라 복귀 시 방문 처리를 해제하기도 한다.

```java
// 그래프 예시 (BFS와 동일한 인접 리스트 구조)
int[][] graph = {{}, {2,3,7}, {1,3,5}, {1,2}, {6,8}, {2}, {4,7,8}, {1,6}, {4,6}};
boolean[] visited = new boolean[9];

// DFS 실행 함수
public void dfs(int nodeIndex) {
    // 1. 현재 노드 방문 처리
    visited[nodeIndex] = true;
    System.out.print(nodeIndex + " -> "); // 탐색 순서 확인용

    // 2. 인접한 노드들을 확인
    for (int nextNode : graph[nodeIndex]) {
        // 3. 방문하지 않은 노드가 있다면 즉시 깊게 탐색(재귀 호출)
        if (!visited[nextNode]) {
            dfs(nextNode);
        }
    }
}

// 메인 실행부
dfs(start);
```

### 문제 : [부분집합](https://leetcode.com/problems/subsets/description/)

> 요구사항
> 접근/원리

```java
import java.util.*;

class Solution {
    public List<List<Integer>> subsets(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        backtrack(0, nums, new ArrayList<>(), result);
        return result;
    }

    private void backtrack(int start, int[] nums, List<Integer> temp, List<List<Integer>> result) {
        result.add(new ArrayList<>(temp));
        for (int i = start; i < nums.length; i++) {
            temp.add(nums[i]);
            backtrack(i + 1, nums, temp, result);
            temp.remove(temp.size() - 1);
        }
    }
}
```

### 문제 : [순열](https://leetcode.com/problems/permutations/description/)

> 요구사항
> 접근/원리

```java
import java.util.*;

class Solution {
    public List<List<Integer>> permute(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        backtrack(nums, new boolean[nums.length], new ArrayList<>(), result);
        return result;
    }

    private void backtrack(int[] nums, boolean[] visited, List<Integer> temp, List<List<Integer>> result) {
        if (temp.size() == nums.length) {
            result.add(new ArrayList<>(temp));
            return;
        }

        for (int i = 0; i < nums.length; i++) {
            if (visited[i]) continue;
            visited[i] = true;
            temp.add(nums[i]);
            backtrack(nums, visited, temp, result);
            temp.remove(temp.size() - 1);
            visited[i] = false;
        }
    }
}
```

### 문제 : [조합](https://leetcode.com/problems/combinations/description/)

> 요구사항
> 접근/원리

```java
import java.util.*;

class Solution {
    public List<List<Integer>> combine(int n, int k) {
        List<List<Integer>> result = new ArrayList<>();
        backtrack(1, n, k, new ArrayList<>(), result);
        return result;
    }

    private void backtrack(int start, int n, int k, List<Integer> cur, List<List<Integer>> result) {
        if (cur.size() == k) {
            result.add(new ArrayList<>(cur));
            return;
        }

        for (int i = start; i <= n; i++) {
            cur.add(i);
            backtrack(i + 1, n, k, cur, result);
            cur.remove(cur.size() - 1);
        }
    }
}
```

# Graph
