---
title: "모든 공부법은 BFS 실습루프 + 교차검증이다 "
description: "요 근래 알고리즘, 쿠버네티스, 리눅스, 투자의 기초를 탄탄히 다져나가고 있다"
date: 2026-05-07
tags: [journal]
lang: ko
draft: false
---

# Why?

왜 배움?

---

---

요 근래 알고리즘, 쿠버네티스, 리눅스, 투자의 기초를 탄탄히 다져나가고 있다

공부접근법이 같은 메커니즘을 타고 가는 것 같다

- 개념
- 교차질문
- 실습
- 추가학습/연구

근데 혼자 하다보면 블라인드 스팟, 즉 놓치는 부분이 엄청 많다

가령 CKA 목차대로 공부했다고 k8s 완전히 아는 게 아니다
가령 스프링 책을 한 권 마스터했다고 스프링을 완전히 아는 게 아니다
가령 AWS 자격증을 땄다고 AWS 를 완전히 아는 게 아니다
가령 지표와 차트를 안다고 투자를 완전히 아는 게 아니다

책에서 다루지 않는 실전의 내공을 익혀야 완전히 내 것이 되는 것이다.

그리고 간혹 누군가 방향 잡아주거나 필요한 기술/개념을 툭툭 물어다줄 때가 있다.
`~~에 대해서는 ~~ 를 보기보다 ~~ 를 한 번 공부해봐` 라던지
`~~에 대해서는 ~~ 를 써봐` 라던지 말이다

이런 부분들에 대해서는 헷지방안이 어떻게 되는가??

그리고 이런 학습과정에서 AI 를 쓸 때의 가드레일과 주의사항이 무엇인가??
 

# What?

뭘 배움?

---

---

## BFS 실습루프 : 전체 숲은 직접 걸어나간다 🌲

무슨 공부든 — 개발(홈랩/서버/백엔드/프론트 뭐든)이든, 투자이든, 러시아어든 —

같은 메커니즘을 타고 가는 것 같다

1.

처음에는 BFS 방식으로 얕은 지식을 여러 번 걸쳐서 개념-실습을 하고
2. n 번의 루프가 끝나면 실제로 활용해나가고
3.

더 새롭게 발견되거나 알게된 개념들을 축적해나간다

다만 전체 숲을 배울 때만큼은 직접 해야한다

강의/책이나 스스로 정한 목차/커리큘럼을 따라가보다면 특정 방향벡터에 갇힌다

그 방향벡터에 따라 내가 놓친 스텝은 무엇이며, 실제로는 어떤 유의사례가 있고
관련하여 어떤 유사스킬들을 활용할 수 있는지 놓칠 수 있기 때문이다.

이를 헷지하려면 방향벡터의 다각화를 실처하면 된다

1.

책/강의들의 목차들을 결합하고 덜어낼 건 덜어내서 하나의 목차를 만든다
2.

이 목차에 대로 2주씩 2~3번의 루프 학습한다
3.

부족한 점이나 더 깊게 공부할 것들을 세우고 또 다시 루프를 반복한다
4.

다른 책/강의/실무자를 통해 부족한 점에 대해서 방향벡터를 다각화한다

이런 구조를 통해 BFS 방식의 개념-실습을 반복하다보면
처음에는 얕은 개념들로 채워나가다가 점점 그 개념의 성숙도가 깊어질 것이다

또한 짧은 시간의 루프 학습은 집중력을 분산시키지 않고 장기적으로 달릴 수 있게한다

이후 교차검증을 통해 내가 가진 개념을 더 단단하게 할 수 있다

## AI 는 선생님이 아니라 검증/트레이드오프만 ✅

AI 는 편향될 수 있다

이유인즉슨 AI 는 대화맥락과 학습한 정보를 기반으로 답하기 때문이다

따라서 우리는 AI 에게 `~~ 을 알려줘` 의 프롬프트를 피해야한다

되려 AI 에게 `~~ 이라고 알고 있는데 놓치고 있는 부분이 뭔지 검토해줘` 라고 질문해야한다

만약 가능하다면 교차검증 혹은 트레이드오프가 아닌 프롬프트는 무시하게끔 가드레일을 설정하면 좋다

## 멘토가 없다면 잘못된 것이다 ⚠️

형식지(explicit knowledge) 는 책/강의/AI로 채울 수 있지만,
암묵지(tacit knowledge) 는 그렇지 않다

이 상황에선 X 말고 Y 써", "그건 함정이야" 같은 휴리스틱은
누가 옆에서 툭 던져줘야 알게 된다.

이에 대해서는 두 가지 원인이 있다.

- **알려진 미지(known unknowns)**
- **알려지지 않은 미지(unknown unknowns)**

즉, 만약 누군가로부터
`~~에 대해서는 ~~ 를 보기보다 ~~ 를 한 번 공부해봐` 혹은 `~~에 대해서는 ~~ 를 써봐` 
종류의 조언을 받을 수만 있다면 본인이 삽질하며 쓰는 시간/돈 투자대비
훨씬 더 빠르게 발전할 수 있다

이러한 조언을 해줄 수 있는 매체는 다음과 같다

1.

시니어 Guru
2.

시니어가 모인 커뮤니티 
3.

멘토링 세션

만약 돈이 있다면 멘토가 있는 회사에 가던, 멘토를 고용하라

경험 상 커뮤니티에서 해줄 수 있는 한계가 분명히 있고
특히 인터넷 포스트는 내가 매일매일 구독해서 보지 않는 이상
나를 봐주기란 쉽지 않기 때문이다.

돈이 없고 지금의 나처럼 백수라면
커뮤니티를 계속 따라가거나, 시니어에게 과감하게 나를 드러내는 게 맞다

질문하기 전까지는 스스로가 부끄러운 당신이였다가, 질문하고 발전하면 그를 벗어난다

따라서 부끄럽더라도 과감히 묻는 게 용기이고, 발전할 수 있는 유일한 길이다

## 실패사례 / 사후 분석을 살펴라 🚨

처음 학습 시에는 성공한 패턴을 가르치지만 왜 다른 패턴들이 실패했는지는 잘 안 가르친다.

그런데 unknown unknowns의 대부분은 거기 숨어있다.

꼭 커뮤니티나 포스트들을 활용해서 블라인드 스팟과 트레이드오프를 살펴보아라
(뭐 이건 개발자/엔지니어면 항상 하는 거지만 그래도,,,ㅎ)

- 개발이라면
- 투자라면
- 언어라면

# How?

어떻게 씀?

---

## 예시 : 서버/인프라공부에 대한 학습루프 + 교차검증 🌐

### 전체 숲을 걸어나갔는가?

> SRE Book (Google, 무료)

- *Principles*: 위험 수용 / **SLO** / Toil 제거 / 분산시스템 모니터링 / 자동화 / Release Engineering / Simplicity
- *Practices*: Practical Alerting / On-Call / Troubleshooting / Emergency Response / Incident Management / **Postmortem Culture** / Testing / Frontend & Datacenter Load Balancing / **Handling Overload** / **Cascading Failures** / Managing Critical State / Data Integrity / Launch Checklist
- *Management*: Communication / Embedding SRE / Engagement Model

> SRE Workbook (Google, 무료)

- **SLO Engineering / SLO Implementation**
- Monitoring + **Alerting on SLOs**
- Toil / Simplicity / On-Call / Incident Response / Postmortem
- **Managing Load** / **Non-Abstract Large System Design (NALSD)**

> DDIA (Kleppmann)

- Part I: 신뢰성·확장성·유지보수성 / 데이터 모델 / **스토리지 엔진 (LSM vs B-tree)** / 인코딩과 진화
- Part II: **복제** / **샤딩** / **트랜잭션 격리수준** / **분산시스템의 문제들** / **일관성과 합의**
- Part III: 배치처리 / 스트림처리

> Kubernetes Up & Running

- 컨테이너 / 클러스터 생성 / Pod / Labels / **Service Discovery** / Ingress / ReplicaSet / Deployment / DaemonSet / Job / ConfigMap·Secret / **RBAC** / **Service Mesh** / **Storage** / **CRD/Operator** / 조직화

> Production Kubernetes (Dotson, Strong) — 본인과 가장 겹침

- **Path to Production** (요구사항 도출) / Deployment Models / **Container Build Pipelines** / Container Runtime / **Container Storage** / **Pod & Node Security** / **Networking** / **Pod Lifecycle (probe 설계)** / **Observability** / **Secret Management** / **Admission Control** / **Identity** / **Platform Services** / **Multitenancy** / **Autoscaling**

> TLPI (Kerrisk) — 시스템 콜 정전 (참조용)

- File I/O · Buffering · 파일시스템 · 속성 · ACL · **Capabilities**
- Process · Signal · **Process Group / Session / Daemon**
- **PAM** · IPC · **Threads** · Sockets · **epoll / 대안 I/O**

> OSTEP — OS 정전 (무료)

- *Virtualization*: 프로세스 / **CPU 스케줄링** / 주소공간 / **페이징 / TLB / 가상메모리**
- *Concurrency*: 락 / 조건변수 / 세마포어 / **Common Concurrency Problems**
- *Persistence*: I/O / **HDD / SSD** / **RAID** / 파일시스템 / **저널링** / **Crash Consistency** / 분산시스템 / NFS

### 강의들의 목차들은 어떤가??

- [ ] ( 예정 )

### 우리의 목차

> Phase 0.

Foundation — Linux/Container 밑바닥 + Helm

- 현재 Nix 구조 정리 → 글
- kubelet 에러 이슈 원인/대안/해결 → 글
[추가] Linux 밑바닥 sanity check (홈랩 진행 중에 짧게):
- Helm 사용법 (오브젝트, 배포된 차트 확인, valkey 클러스터, top server) → 글

> Phase 1.

Storage 전략 + 메모리 분석

- Top Server 메모리 사용량 분석 → 글
[추가] Linux 메모리 멘탈모델:
- 메모리 누수 여부 확인 → 글
[추가] Storage 전략 설계:

> Phase 2.

GitOps + Release Engineering

- 레포 구조 설계
- FluxCD/ArgoCD 세팅
- 매니페스트 배포 / drift 감지 검증
[추가] Release strategy 설계:

> Phase 3.

Backup & DR — 목표부터 정의

[추가] RTO/RPO 정의 (워크로드별 표):

- 인증서비스 / 공고서비스 / DB / observability 각각의 RTO/RPO 목표
- etcd 백업, Velero
- 스모크 테스트 (네임스페이스 단위)
[추가] Full DR drill:

> Phase 4.

Observability + SRE 프레이밍 (가장 크게 보강)

[추가] SLI/SLO 정의 (서비스별):

- 인증서비스: 가용성 SLO, 지연 SLO (예: 99% < 200ms over 28d)
- DB: 가용성, 복제 지연
- Error budget 정책 결정
→ 글: "홈랩 SLO 설계"
- LGTM 스택 구축
[추가] 알람 철학:
- AlertRule 작성 + 이메일 채널
[추가] OTel 분산 추적 도입
[추가] Synthetic monitoring (Blackbox exporter)
- 의도적 OOM / 노드 다운하여 alert 검증
[추가] 카오스 엔지니어링 도구화:

> Phase 5.

Security + Identity (대폭 보강)

- RBAC + Namespace 전략 + ResourceQuota/LimitRange
- cert-manager + external-dns + Gateway API + NetworkPolicy + TLS 자동연장
- Teleport + RBAC
- Taint / Tenant
[추가] Pod Security Standards 적용 (privileged/baseline/restricted 결정)
[추가] Admission Control:
- 샘플 앱으로 위 전체 검증
→ 글: "홈랩 보안 베이스라인"

> Phase 6.

Data layer (분산시스템 이해 포함)

- CloudNativePG 기동
[추가] PG 운영 깊이:
- OIDC 기동 — Dex 또는 Keycloak
[추가] OIDC 학습 깊이: 무엇을 보장하고 무엇을 안 보장하는가, 토큰 lifetime 정책
- Tailscale OAuth 자동연장

> Phase 7.

Application + Quality

- AI 스크롤 차단 가드레일
- 서버 모듈 (인증, 공고, 이력서)
- 단위/통합 테스트
[추가] API 설계 리뷰:

> Phase 8.

CI/CD + Pipeline 보안

- CI/CD 파이프라인 구축
- 쿠베 위 스모크 테스트
[추가] Pipeline 보안:

> Phase 9.

HA / Fault Tolerance (DDIA 와 SRE 접목)

[추가] DDIA 학습 매핑:

- 합의 / 복제 / 분할 챕터를 본인 클러스터 구성과 매핑
- Consul Fault Tolerance
[추가] HA 메커니즘 종합:

> Phase 10.

Autoscaling + Cost

- Kubecost / OpenCost
[추가] HPA / VPA / KEDA / Cluster Autoscaler 설계:
- 가시성 정상여부 확인

> Phase 11.

Operations Maturity + Visibility

[추가] 운영 문서:

- 모든 서비스 runbook 정리
- ADR (Architecture Decision Record) 누적
- On-call 핸드오프 문서
[추가] Postmortem (운영 중 발생한 사고들)
[추가] 채용 가시성:
- GitHub 정리 (모든 매니페스트/IaC 공개)
- 블로그 시리즈로 모든 Phase 글 발행
- 한국 데브옵스/SRE 커뮤니티에 공유
- 면접 stories 정리: STAR 형식으로 각 Phase에서의 결정 / 트레이드오프 / 결과

- [ ] 진행 중

- [ ] 개념-실습 루프를 다 돌고 차이 비교 분석하고자 함

- [ ] ( 예정 )

- [ ] 좀 애매한 점이 맨 땅에 헤딩하며 서버 운영하기라서 제대로 하는 게 맞는지 애매함
- [ ] 그래서 LFCS 강의랑 병행 중인데 알려주는 내용이 한정적이고 얕아서 추가의 자격증 공부를 고민 중임

> 데브옵스/SRE 엔지니어

- [https://hellouz818.tistory.com/](https://hellouz818.tistory.com/)
- [https://lwkd.info/](https://lwkd.info/)
- [https://vulcan.site/](https://vulcan.site/)
- [https://blog.esukmean.com/](https://blog.esukmean.com/)
- [https://heeho.net/contents/](https://heeho.net/contents/)
- [https://www.blog.ecsimsw.com/?page=1](https://www.blog.ecsimsw.com/?page=1)
- [https://jesseduffield.com/](https://jesseduffield.com/)
- [https://sbulav.github.io/](https://sbulav.github.io/)
- [https://johngrib.github.io/](https://johngrib.github.io/)

> 홈랩

- [https://blog.haulrest.me/](https://blog.haulrest.me/)
- [https://techhut.tv/](https://techhut.tv/)
- [https://www.reddit.com/r/Backend/](https://www.reddit.com/r/Backend/)
- [https://www.reddit.com/r/homelab/](https://www.reddit.com/r/homelab/)

> 인프라 커뮤니티

- [https://www.cloudbro.ai/](https://www.cloudbro.ai/)
- CNCF Blog
- r/kubernetes, r/devops, r/homelab, r/sre

> 엔지니어링 블로그

- Google SRE blog
- Cloudflare blog
- Netflix Tech blog

- [http://github.com/danluu/post-mortems](http://github.com/danluu/post-mortems)
- AWS incident 공식 RCA
- GCP incident 공식 RCA

- eBPF
- WASM
- AI 인프라
- 데이터센터 / 하드웨어 레이어
- 멀티클러스터 / 멀티클라우드 패턴

## 예시 : 알고리즘공부에 대한 학습루프 + 교차검증 📓

### 전체 숲을 걸어나갔는가?

### 책의 목차들은 어떤가???

> **CLRS — Introduction to Algorithms (정전, 두꺼움)**

- *Foundations*: 알고리즘 분석 / **점근적 표기 / 마스터 정리** / 분할정복 / **확률적 분석**
- *Sorting & Order Statistics*: 힙·퀵·선형시간 정렬 / 중간값
- *Data Structures*: 해시 / BST / **레드블랙 트리** / **Augmenting**
- *Advanced Techniques*: **DP / Greedy / Amortized Analysis**
- *Advanced DS*: B-Tree / **Disjoint Set Union**
- *Graph*: 기본 탐색 / MST / **단일/전체 최단경로** / **Max Flow** / 이분매칭
- *Selected*: **NP-completeness** / 근사 / FFT / 정수론 / 문자열매칭

> **Skiena — The Algorithm Design Manual (실전적)**

- *Part I*: 알고리즘 설계 / 분석 / 자료구조 / 정렬 / **분할정복** / **해싱·랜덤화** / 그래프 탐색 / 가중치 그래프 / **조합 탐색** / DP / **NP-완전** / 하드 문제 다루기 / **알고리즘 설계 방법론**
- *Part II*: **75개 표준 문제 카탈로그** — "이 문제는 어떤 알고리즘인가" 를 색인화한 사전.

코딩테스트 시 패턴 매칭 훈련용

> **CPH — Competitive Programmer's Handbook (PS 정전, 무료 PDF)**

- *Part I*: 시간복잡도 / 정렬 / 자료구조 / **완전탐색** / Greedy / **DP** / Amortized / **Range Queries** / 비트연산
- *Part II Graph*: 탐색 / 최단경로 / 트리 / MST / 방향그래프 / **SCC** / 트리쿼리 / 경로/회로 / **Flows and Cuts**
- *Part III Advanced*: 정수론 / 조합론 / 행렬 / 확률 / **게임이론** / 문자열 / **세그먼트 트리** / 기하 / **Sweep line**

> **종만북 — 알고리즘 문제 해결 전략 (한국 PS 정전)**

- *1부 설계기법*: 분석 / 무식하게 풀기 / 분할정복 / **DP** / Greedy / **조합 탐색** / 최적화→결정 변환
- *2부 자료구조*: 선형 / 큐·스택 / 문자열 / 트리 / **BST / Heap / 구간트리 / DSU / Trie**
- *3부 그래프*: 표현/탐색 / DFS / BFS / **최단경로 / MST / Network Flow / 이분매칭**

> **Sedgewick — Algorithms 4th ed (Java/체계적)**

- 정렬 (전반부 절반을 정렬에 할애 — 알고리즘 사고방식 훈련용)
- 검색 / BST / 해싱
- 그래프 / MST / 최단경로
- 문자열 (정규식 / 데이터압축 / 정렬·검색)
- 컨텍스트: B-tree / Suffix Array / Network Flow

### 강의들의 목차들은 어떤가??

> **USACO Guide (usaco.guide, 무료, 난이도+주제별 트랙)** — *본인이 찾던 게 정확히 이거*

- *Bronze*: 시뮬레이션 / 완전탐색 / 정렬 / **Ad Hoc**
- *Silver*: **Prefix Sum** / 투포인터 / Set / **이분탐색** / Custom Sort / Greedy / **BFS·DFS·Floodfill** / 트리 / **재귀 함수 설계** / **DSU**
- *Gold*: 고급 DP / **BIT** / 해싱 / 최단경로 / MST / 트리 자료구조 / **Segment Tree** / 고급 그래프 / 문자열
- *Platinum*: **Persistent DS / Lazy Segtree / Treap / Link-Cut Tree** / Network Flow / 고급 정수론
- *Advanced*: **Heavy-Light / FFT-NTT / Suffix Automaton / DP 최적화 (CHT, Knuth, D&C)**

> **NeetCode 150 / Blind 75 (코딩테스트용 패턴 정리, 영어)**

- Arrays & Hashing → Two Pointers → Sliding Window → Stack → Binary Search → Linked List → Trees → Tries → Heap → Backtracking → Graphs → Advanced Graphs → 1D DP → 2D DP → Greedy → Intervals → Math & Geometry → Bit Manipulation
- *순서가 곧 학습 커리큘럼*.

NeetCode 유튜브 영상이 짝지어져 있음

> **Codeforces EDU (무료, 인터랙티브)**

- **이분탐색 / 투포인터·슬라이딩윈도우 / 해시테이블 / DSU / Segment Tree (Pt1, Pt2) / Suffix Array / Backtracking / DP**
- 각 주제별로 *영상 + 문제 + 자동채점*.

분야별 깊이 학습에 최적

> **백준 단계별로 풀어보기 + **[**solved.ac**](http://solved.ac/)** 클래스 시스템 (한국어)**

- 단계별: 입출력 → 조건문 → 반복문 → 배열 → 함수 → 문자열 → 정렬 → 재귀 → 백트래킹 → 동적계획법 → 그래프
- [solved.ac](http://solved.ac/) 클래스: 1~10 단계로 *알고리즘 마스터리 진척도*를 정량화.

본인 현재 클래스를 즉시 알 수 있음

> **이코테 — 이것이 코딩테스트다 (나동빈, 한국 코테 표준)**

- 그리디 / 구현 / DFS·BFS / 정렬 / 이분탐색 / DP / 최단경로 / 그래프 / 기타 — *카카오·삼성·네이버 기출 패턴 그대로*

> **바킹독의 실전 알고리즘 (BaaaaarkingDog, 무료 YouTube + 블로그)**

- 한국에서 가장 평이 좋은 PS 강의 시리즈 중 하나.

백준 문제로 진행

> **MIT 6.006 / 6.046 (무료, OCW)**

- 6.006: 알고리즘 입문 (자료구조 / 정렬 / 그래프 / DP / 복잡도)
- 6.046: 고급 알고리즘 설계 (분할정복·DP·Greedy 깊이 / Network Flow / NP / 근사·랜덤)

### 우리의 목차

> **Phase 0.

기반 — 이론과 환경 세팅 (1주)**

- 본인 현재 수준 진단:
- 환경 세팅:
- 이론 sanity check:

> **Phase 1.

자료구조 베이스 (2주 × 2회차)**

- *1회차 (개념 + easy)*: 배열·문자열 / 스택·큐·덱 / 해시 / 우선순위큐 / 연결리스트
- *2회차 (medium 패턴)*: 모노토닉 스택·큐 / **투포인터** / **슬라이딩 윈도우** / **Prefix Sum / Difference Array**
- 산출물: 각 자료구조별 template 정리 → 글

> **Phase 2.

정렬·이분탐색·재귀 (2주 × 2회차)**

- 정렬 알고리즘 8종 (구현은 1번씩)
- **이분탐색의 두 얼굴**: 값에 대한 이분탐색 / **답에 대한 이분탐색** (parametric search)
- 재귀 / 백트래킹 / N-Queens / 부분집합·순열 생성
- 분할정복 (merge sort, 카운팅 inversion)
- 산출물: "답에 대한 이분탐색 패턴 정리" → 글

> **Phase 3.

트리 + DSU + Trie (2주)**

- 이진트리 순회 (재귀/반복)
- BST 연산 / LCA
- **DSU (Union-Find) + 경로압축·랭크**
- Trie / 자동완성 응용
- 산출물: DSU·LCA template

> **Phase 4.

그래프 기본 (2주 × 2회차)**

- *1회차*: BFS / DFS / Floodfill / 사이클 탐지 / 위상정렬 / 이분그래프
- *2회차*: 최단경로 4종
- MST: Kruskal / Prim
- 산출물: "그래프 알고리즘 선택 매트릭스" → 글

> **Phase 5.

DP (2주 × 3회차) — 가장 약한 영역일 가능성 큼**

- *1회차 1D*: 피보나치류 / 계단 / 동전 / **LIS**
- *2회차 2D*: **LCS** / 편집거리 / 격자 / **Knapsack 4종 (0/1, 무한, 분할, 부분합)**
- *3회차 고급*: **구간 DP / 비트마스크 DP / 트리 DP / 자릿수 DP**
- 산출물: "DP 점화식 도출 7단계" → 글 (이건 코테 면접용으로 강력)

> **Phase 6.

문자열 + 수학 (2주)**

- 문자열: **KMP / Z-algorithm / 해싱**
- 수학: 모듈러 연산 / **GCD·확장 유클리드 / 에라토스테네스** / 모듈러 역원·페르마소정리 / 조합 nCr mod p
- 산출물: 수학 template

> **Phase 7.

고급 자료구조 (2주, 코테 상위권용)**

- **Segment Tree (point update, range query)**
- **Lazy Propagation**
- **Fenwick Tree (BIT)**
- Sparse Table (RMQ)
- 산출물: Segment tree 5문제 + template

> **Phase 8.

한국 코테 기출 집중 (2주 × N회차, 취준 직전 모드)**

- **카카오 기출** (프로그래머스 카카오 모음): 구현 / 문자열 / DFS·BFS / 자료구조 / 그래프 / 이분탐색
- **삼성 SW 역량테스트** 기출 (시뮬레이션 + 백트래킹 집중)
- **네이버·라인·쿠팡·토스** 기출/예상
- 시간 제한 두고 *모의 테스트* 형태로 진행
- 산출물: 회사별 출제 패턴 매트릭스 → 글

> **Phase 9.

시계열 누적 (영구히)**

- *매일*: 1-2문제 (현재 학습 중인 Phase 주제 위주, *random 회피*)
- *매주*: 1회 모의 contest (LeetCode Weekly / Codeforces Div3·Div4 / 프로그래머스 PCCP)
- *매월*: 직전 한 달 오답·실수 패턴 회고 → 글
- *Editorial 의무*: 모든 *틀린 문제* 와 *못 푼 문제* 의 editorial 을 반드시 읽고 정리
- *Template 누적*: 새 알고리즘 익힐 때마다 자기 라이브러리에 추가

### 2주 × 2~3회차 개념-실습 루프를 돌았는가?

- [ ] 진행 중 — 현재 Phase 와 회차 기록:

### 다른 책/강의와 내 커리큘럼의 차이는?

- [ ] **현재 비교 결과 (자가진단)**:

### 차이가 나는 책/강의에서 다루는 세부내용은 무엇인가?

- *USACO Guide*: 난이도-주제 매트릭스 자체 (학습 순서 설계)
- *NeetCode*: 패턴 카테고리화 (LeetCode식 *14개 패턴*)
- *Codeforces EDU*: 인터랙티브 + 분야 깊이
- *CLRS / Skiena*: 이론 증명, NP, 근사
- *CPH*: 대회 PS 의 모든 주제를 *압축적으로* 다 훑음
- *종만북*: 한국어 + 검증된 *한국 PS 사고방식*
- *이코테 / 바킹독*: 한국 코테 기출 패턴 매칭

### 남에게 설명하며 질문을 받아 방향벡터의 다각화할 수 있는가?

- [x] **현재**: 별도로 테크닉과 틀렸던 문제 정리 중
- [ ] **보강 행동**:

### 멘토가 있는가?

> **글로벌 PS Top-tier 계정 (Codeforces · 작성 글들 가치 큼)**

- **tourist** (Gennady Korotkevich) — 역대 최강.

라이브 스트림에서 사고 흐름 관찰
- **jiangly**, **Um_nik**, **Errichto**, **Petr** — 블로그 글이 깊다
- **Benq** — USACO Guide 의 핵심 contributor

> **YouTube (영어)**

- **Errichto** — Codeforces 라이브 + 알고리즘 강의
- **William Lin (tmwilliamlin168)** — IOI 메달리스트, 라이브 풀이
- **NeetCode** — LeetCode 패턴 풀이 (코테 준비 표준)
- **SecondThread** — Codeforces 라이브
- **Colin Galen** — 깊이 있는 분석

> **YouTube / 블로그 (한국어)**

- **바킹독 (BaaaaarkingDog)** — 백준 강의 + 블로그.

한국 PS 학습의 표준 레퍼런스
- **나동빈 (이코테 저자)** — 한국 코테 위주
- **AlgoDale, 안경잡이개발자, jasonkang, 큰돌의 코딩테스트** — 백준 풀이 / 코테 노하우
- [**JusticeHui, 알고리즘에 인생을 건 개발자,,,**](https://justicehui.github.io/)

> **글 / Editorial 채널 (의무 구독)**

- Codeforces blog (특히 Round editorial)
- AtCoder Editorial
- USACO contest editorial
- LeetCode discuss (Top voted 풀이)
- Codeforces *high-rated 사용자의 blog* 카테고리

> **커뮤니티**

- r/leetcode, r/competitiveprogramming
- 한국: BOJ 게시판, [solved.ac](http://solved.ac/) 디스코드, 백준 디스코드, 페이스북 *알고리즘 문제풀이* 그룹
- 인프런 / 패스트캠퍼스 코테 강의의 디스코드/카톡방

> **회사 코딩테스트 자료**

- 프로그래머스 *카카오 기출문제집*
- 삼성 SW 역량테스트 기출 (백준에 정리되어 있음)
- LeetCode *Top Interview 150* / *Top Liked 100*

### 참고할만한 실폐사례를 조사했는가?

> **WA (Wrong Answer) 의 흔한 원인**

- 경계조건 (N=1, 빈 배열, 단일 원소)
- **Off-by-one** (≤ vs <, 인덱스 범위)
- **Integer overflow** (`int` vs `long long`, 곱셈 후 모듈러)
- 음수 처리 (`%` 연산의 언어별 차이)
- 부동소수점 비교 (== 대신 |a-b|<eps)
- 다중 테스트케이스에서 *전역 상태 초기화 누락*
- 출력 형식 (개행, 공백)

> **TLE (Time Limit Exceeded) 의 흔한 원인**

- **복잡도 잘못 분석** (예: O(N²) 인 줄 알았는데 실제로 O(N²log N))
- 상수 큰 자료구조 (e.g. unordered_map vs map, Python list vs deque)
- 입출력 느림 (Python `input` → `sys.stdin.readline`, C++ `cin/cout` → `scanf/printf` or `ios_base::sync_with_stdio(false)`)
- 재귀 깊이 / 함수콜 오버헤드 (특히 Python)
- 불필요한 정렬 / 중복 계산

> **MLE (Memory Limit Exceeded)**

- 2D 배열 크기 잘못 산정
- 재귀 스택
- 메모이제이션 dict의 키 객체 비대화

> **RE (Runtime Error)**

- 배열 범위 초과 / null 참조
- 0으로 나누기
- 재귀 깊이 한계 (특히 Python `sys.setrecursionlimit`)
- 스택 오버플로우 (DFS on deep tree → BFS 또는 iterative DFS)

> **사고방식 실패**

- 문제 조건 *대충 읽고 시작* — 30초 더 읽으면 풀이 방향이 바뀜
- *이전 문제와 비슷해 보여서* 같은 패턴으로 풀려다 함정에 빠짐
- *예제만 통과하고* 제출 → 경계조건 누락
- 시간 끝까지 한 문제에 매달림 → 다른 *쉬운 문제 놓침* (contest day 전략 실패)

> **사후 분석 자료**

- Codeforces *upsolve* 문화 — 못 푼 문제 editorial 읽고 다시 풀기
- LeetCode *내 제출 기록* 의 실패한 제출 분석
- *오답노트 매월 회고*: "이번 달 가장 자주 한 실수 3가지"

### 시계열로 축적해나갈 추가적 방향벡터는 무엇인가?

- [ ] **단기 (취업 직후 ~ 6개월)**:
- [ ] **중기 (1~2년)**:
- [ ] **장기 / 선택 (관심사에 따라)**:
- [ ] **커리어 통합 방향벡터**:

## 예시 : 투자공부에 대한 학습루프 + 교차검증 💰

### 전체 숲을 걸어나갔는가?

### 책의 목차들은 어떤가???

> **가치투자**

- *현명한 투자자* (Graham) — Mr.

Market, margin of safety
- *The Most Important Thing* (Marks) — second-level thinking, 사이클, 리스크
- 버핏 주주서한 — 무료, 매년 발행
- *Little Book of Valuation* (Damodaran) — DCF / 상대가치 입문

> **패시브 / 인덱스**

- *모든 주식을 소유하라* (Bogle) — 비용의 위력
- *A Random Walk Down Wall Street* (Malkiel) — 효율시장 / MPT / 행동재무

> **자산배분**

- *The Intelligent Asset Allocator* (Bernstein) — 다자산 최적 배분
- *거인의 포트폴리오* (강환국) — 한국 자산배분 입문

> **행동재무**

- *생각에 관한 생각* (Kahneman) — 인지 편향
- *The Psychology of Money* (Housel) — 짧고 강한 글들
- *Reminiscences of a Stock Operator* (Lefèvre) — 시장 심리 정전

> **리스크 / 사이클**

- *Mastering the Market Cycle* (Marks) — 사이클 메커니즘
- *Big Debt Crises* (Dalio, 무료 PDF) — 부채 사이클
- *Antifragile* (Taleb) — 꼬리위험

> **한국 시장**

- *재무제표 모르면 주식투자 절대로 하지마라* (사경인)

### 강의들의 목차들은 어떤가??

> **Damodaran NYU Stern (무료, **[**pages.stern.nyu.edu/~adamodar**](http://pages.stern.nyu.edu/~adamodar)**)**

- Foundations of Finance / Valuation / Investment Philosophies

> **Ray Dalio — How the Economic Machine Works (YouTube 30분, 무료)**

- 거시 메커니즘 입문 1순위

> **Howard Marks — Oaktree memos (무료)**

- 분기 1회, 1990년부터 누적

> **Yale Financial Markets — Shiller (Coursera 무료)**

- 행동재무 / 효율시장

> **한국**

- 김단테 — 패시브 / 자산배분
- 강환국 — 퀀트 / 자산배분
- 사경인 — 재무제표
- 메르 (블로그) — 장기 매크로 / 산업

### 우리의 목차

기존 3 round 는 거시·매매·기술적 분석에 무게가 쏠려있다.

패시브, 자산배분, 행동재무, 리스크 시스템화가 비어있어 보강 round 를 뒤에 추가한다.

> **Round 0.

환경 세팅 + 자기진단 (1주, 신규)**

- 보유 종목 / 비중 / 진입 이유 글로 정리
- 비상자금 분리 (6~12개월치 생활비)
- 투자 일지 시작 (thesis / 진입가 / 손절가 / 가설이 깨지는 조건)
- 한국 세제 sanity check (양도소득세, ISA, 연금저축, IRP)

> **Round 1 (기존).

시장 + 회사 분석**

- 1주차: 시장이 뭐고 무엇이 움직이나
- 2주차: 회사를 어떻게 보고 사고팔 것인가

> **Round 2 (기존).

거시 + 백트래킹 + 재무제표 + 밸류에이션**

- 실습: 보유 종목 1개의 사업보고서 정독 + 간단한 DCF 작성

> **Round 3 (기존).

시장심리 + 사이클 + 섹터 + 매매 + 리스크 + 차트**
> **Round 4.

패시브 / 인덱스 (신규)**

- 1주차: 왜 액티브가 통계적으로 어려운가 (Malkiel + Bogle)
- 2주차: 인덱스 / 자산배분의 사고방식 (Bernstein + 강환국)
- 산출물: "내가 액티브를 하는 이유 — 통계와 함께" 글

> **Round 5.

행동재무 / 자기 검증 (신규)**

- 1주차: 인지 편향 (Kahneman 1부 + Housel)
- 2주차: 본인 거래 6개월치 회고 — 결과 좋았지만 운인 것 / 결과 나빴지만 과정은 옳았던 것 분리
- 산출물: "내 투자 행동 회고" 글

> **Round 6.

리스크 관리 시스템화 (신규)**

- 포지션 사이징 / 손절·익절 정책 / 상관관계
- 꼬리위험 (Taleb)
- 산출물: "내 포트폴리오 최악 시나리오 + 대응" 글

> **Round 7.

시계열 누적 (영구)**

- 매월 회고 / 분기 리뷰
- 매 거래의 thesis 사후 검증 비율 추적

### 2주 × 2~3회차 개념-실습 루프를 돌았는가?

- 이번 주말 첫 세션 — Round 0 부터 시작
- 진행 기록:

### 다른 책/강의와 내 커리큘럼의 차이는?

- 빠진 학파: 패시브 / 자산배분 / 행동재무 / 리스크 시스템화
- 빠진 도구: 투자 일지 / 직접 DCF / 본인 거래 사후 검증
- 빠진 한국 특수성: 세제 최적화 / 거버넌스 이슈 (물적분할 등)

### 차이가 나는 책/강의에서 다루는 세부내용은 무엇인가?

- (각 round 진행 중 채워나감)

### 남에게 설명하며 질문을 받아 방향벡터의 다각화할 수 있는가?

- 매 round 끝에 글 1편 발행
- 본인 기존 학파 외의 한국 투자 커뮤니티 1곳 가입
- 매 분기 본인 thesis 의 반대 의견을 종목당 1개 작성

### 멘토가 있는가?

> **(현재) 매크로 / 시황**

- [엉드루](https://www.youtube.com/@%EC%97%89%EB%93%9C%EB%A3%A8)
- [월가아재 과학적투가](https://www.youtube.com/@wsaj)
- [뉴욕주민](https://www.youtube.com/@newyork-er)
- [머니머니코믹스](https://www.youtube.com/@moneymoneycomics)

> **추가: 가치 / 밸류에이션**

- Aswath Damodaran (YouTube)
- Howard Marks — Oaktree memos
- 사경인 — 재무제표

> **추가: 패시브 / 자산배분**

- Ben Felix (YouTube) — 학술 기반 패시브 / 팩터
- 김단테 / 강환국

> **추가: 거시 깊이**

- Ray Dalio (YouTube)
- 메르 (블로그)
- 홍춘욱

> **정기 구독**

- Howard Marks memos (분기 1회)
- 버핏 주주서한 (연 1회)

### 참고할만한 실폐사례를 조사했는가?

> **글로벌**

- *The Big Short* (Lewis) — 2008
- *When Genius Failed* (Lowenstein) — LTCM
- *Bad Blood* (Carreyrou) — Theranos
- FTX 분석

> **한국**

- 라임 / 옵티머스
- 헬릭스미스 / 신라젠 등 바이오 거품
- 카카오 / 배민 2020 vs 2024
- 동학개미 5년 후 회고
- 물적분할 사례 (LG화학 / SK이노베이션)

> **본인 거래 사후 분석 (가장 중요)**

- 분기별 회고: 운으로 번 것과 과정이 옳았던 것 분리

### 시계열로 축적해나갈 추가적 방향벡터는 무엇인가?

- **단기 (~6개월)**
- **중기 (1~2년)**
- **장기 (2~5년)**

[^1]: https://medium.com/@sriramk1986/lessons-from-ultralearning-by-scott-young-book-summary-5a77f9682921 <https://medium.com/@sriramk1986/lessons-from-ultralearning-by-scott-young-book-summary-5a77f9682921>
[^2]: https://product.kyobobook.co.kr/detail/S000002223919 <https://product.kyobobook.co.kr/detail/S000002223919>
[^3]: https://www.soenkeahrens.de/en/takesmartnotes <https://www.soenkeahrens.de/en/takesmartnotes>
