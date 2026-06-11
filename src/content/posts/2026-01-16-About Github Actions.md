---
description: GitHub Actions 의 핵심 개념(workflow, job, step, runner)과 Secrets·GITHUB_TOKEN 권한, matrix/cache/reusable workflow/OIDC/self-hosted runner 같은 운영 트레이드오프, 그리고 실서비스에서 만난 트러블슈팅을 한 번에 정리한다.
tags:
  - infra
lang: ko
draft: false
---

# Why? 왜 배움?

홈랩과 블로그 저장소를 운영하면서 가장 먼저 자동화한 것이 GitHub Actions 였다. 다만 처음에는 `ubuntu-latest` 위에서 워크플로 하나만 띄워 두는 수준이었고, secrets, GITHUB_TOKEN 권한, matrix, cache, reusable workflow, OIDC 같은 운영 옵션들이 각각 어떤 문제를 푸는지는 모호한 상태였다. 그래서 빌드 시간이 두 배로 늘거나, PR 봇이 권한 부족으로 실패하거나, push 가 `workflow scope` 부재로 거절되는 사고를 반복했다.

이 글은 GitHub Actions 의 구성 요소와 실행 모델, Secrets 와 GITHUB_TOKEN 의 권한 모델, matrix·cache·reusable workflow·OIDC·self-hosted runner 의 사용 시점, 그리고 실제 운영에서 만난 트러블슈팅과 검증 절차까지 한 번에 정리한다.

# What? 뭘 배움?

## CI/CD 와 GitHub Actions 의 위치 🧭

GitHub Actions 는 CI/CD 도구 중 하나이지만, 그 위치는 Jenkins 나 GitLab CI 같은 도구들과 약간 다르다. CI/CD 일반론과 GitHub Actions 의 차이부터 정리한다.

CI(Continuous Integration) 는 변경분이 main 에 통합되기 전에 빌드, 테스트, 정적 분석을 자동으로 통과시키는 절차다. CD(Continuous Delivery / Deployment) 는 그 변경분을 사람 개입 없이 또는 한 번의 승인으로 운영 환경까지 배포하는 절차다. 두 절차는 보통 같은 도구 위에서 정의된다.

| 도구 | 구성 위치 | 러너 모델 | 특징 |
|---|---|---|---|
| Jenkins | 자체 서버 | 마스터 + 에이전트 | 플러그인 풍부, 운영 부담 큼 |
| GitLab CI | GitLab 내장 | shared / specific runner | GitLab 통합, `.gitlab-ci.yml` |
| CircleCI | SaaS | 컨테이너 / VM | 빠른 시작, 가격이 시간 단위 |
| GitHub Actions | GitHub 내장 | hosted runner + self-hosted | 마켓플레이스, OIDC 표준 지원 |

GitHub Actions 의 특징은 두 가지로 좁혀진다. 첫째, 워크플로 정의 파일이 저장소 안 `.github/workflows/*.yml` 에 들어가므로 코드와 같은 PR 흐름으로 리뷰된다. 둘째, 외부 액션을 마켓플레이스에서 `uses:` 한 줄로 가져온다. 이 두 가지가 결합되어 "저장소 자체가 CI 정의를 들고 다닌다" 는 모델이 만들어진다.

## 핵심 개념 — workflow, job, step, runner 🧩

앞 절에서 GitHub Actions 가 저장소에 워크플로를 들고 다니는 모델임을 확인했다. 그 워크플로가 어떤 단위로 쪼개져 어떻게 실행되는지부터 정리한다.

워크플로는 다음 네 단위로 구성된다.

- **Workflow** — `.github/workflows/*.yml` 한 파일 = 한 워크플로. `name`, `on`, `jobs` 세 키를 가진다.
- **Event (`on`)** — 트리거. `push`, `pull_request`, `schedule`, `workflow_dispatch`, `merge_group` 등이 표준이다[^gha-events].
- **Job** — 같은 러너 한 대에서 실행되는 step 묶음. 기본은 병렬, `needs:` 로 의존 관계를 만든다.
- **Step** — 명령 한 줄. `uses:` (마켓플레이스 액션) 또는 `run:` (셸 명령) 중 하나다.
- **Runner** — step 이 실제 실행되는 호스트. `ubuntu-latest` 같은 GitHub hosted 러너와 직접 등록한 self-hosted 러너 두 종류다[^gha-runners].

전형적인 워크플로 한 편은 다음과 같이 생긴다. 죽은 Nix 코드를 잡는 deadnix 검사 워크플로다.

```yaml
# .github/workflows/deadnix.yml
name: Deadnix
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
  merge_group:                                # ← merge queue 도 트리거
jobs:
  deadnix:
    name: Dead Code Check
    runs-on: ubuntu-latest                    # ← GitHub hosted 러너
    steps:
      - uses: actions/checkout@v4             # ← 저장소 체크아웃
      - uses: DeterminateSystems/nix-installer-action@main
      - uses: DeterminateSystems/magic-nix-cache-action@main
      - run: nix-shell -p deadnix --run "deadnix --fail"
```

같은 파일 안의 여러 job 은 기본적으로 병렬 실행된다. 그래서 lint, test, build 를 각각 job 으로 분리하면 한 PR 의 전체 검증 시간이 가장 긴 job 의 시간만큼만 늘어난다. 직렬화가 필요한 경우 (예: 빌드 후 배포) `needs: [build]` 한 줄로 의존 관계를 명시한다.

## 실행 모델 — 이벤트, 큐, 동시성 🚦

워크플로가 어떤 단위로 구성되는지 확인했다. 그 단위들이 어떤 순서로 큐에 들어가 실제로 실행되는지가 다음 주제다.

이벤트가 발생하면 GitHub 가 매칭되는 워크플로를 모두 enqueue 한다. 같은 워크플로가 짧은 간격으로 여러 번 트리거되면 기본적으로는 *각각 따로* 실행된다. 빌드 한 번에 5 분이 걸리는데 PR 에 push 가 10번 들어오면 50 분어치 러너 시간이 그대로 소모된다는 의미다.

이걸 막는 키가 `concurrency` 다.

```yaml
# .github/workflows/ci.yml
concurrency:
  group: ci-${{ github.ref }}                 # ← 브랜치 단위로 묶기
  cancel-in-progress: true                    # ← 이전 실행 취소
```

같은 group 의 워크플로가 큐에 있으면 이전 실행을 취소하고 최신 commit 만 검증한다. PR 빌드, 사이트 배포 워크플로에서 사실상 기본값으로 켜둔다. 다만 *배포 워크플로* 에서 `cancel-in-progress: true` 를 켜면 중간 배포가 잘려서 절반만 배포된 상태가 남을 수 있다. 배포 job 에는 `cancel-in-progress: false` 가 안전한 기본값이다.

워크플로의 트리거 이벤트별 동작도 정리해 둔다.

| 이벤트 | 발화 시점 | 주의점 |
|---|---|---|
| `push` | 브랜치 push | tag push 는 `tags:` 필터 필요 |
| `pull_request` | PR 생성·업데이트 | 포크 PR 은 `GITHUB_TOKEN` 권한이 read-only 로 강등됨 |
| `pull_request_target` | PR 이벤트 (base 컨텍스트) | 포크의 코드를 신뢰하면 안 됨 (secret 노출 위험) |
| `schedule` | cron 식 (UTC) | 저장소 60일간 무활동이면 자동 중지 |
| `workflow_dispatch` | 수동 실행 | `inputs:` 로 파라미터 받기 |
| `merge_group` | merge queue 진입 | required checks 와 같이 사용 |

`pull_request_target` 은 포크 PR 에서도 base 의 secret 을 사용할 수 있게 해주지만, 포크 코드를 신뢰해 `actions/checkout@v4` 로 그대로 체크아웃하면 secret 이 그대로 유출된다. 외부 PR 에 라벨을 붙이거나 댓글을 다는 자동화 외에는 사용을 피하는 것이 안전하다[^gha-pr-target].

## Secrets 와 GITHUB_TOKEN — 권한 모델 🔐

이벤트와 큐 모델을 정리했다. 그 위에서 워크플로가 실제 작업을 하려면 외부 API 키나 GitHub 자체에 대한 권한이 필요하다. 두 가지가 secrets 와 GITHUB_TOKEN 으로 분리되어 있다.

### Secrets

암호화된 값을 저장하고 워크플로에서 `${{ secrets.NAME }}` 로 참조한다. 스코프는 세 가지다.

- **Repository secrets** — 저장소 한 곳에서만 사용. 가장 일반적
- **Environment secrets** — `environment: production` 같은 환경에 묶음. 배포 환경별 분리에 사용
- **Organization secrets** — 조직 전체에서 공유. 같은 키를 여러 저장소에서 쓰는 경우

등록은 `Settings > Secrets and variables > Actions > New repository secret`. 사용 예시는 다음과 같다.

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: ./deploy.sh
        env:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}   # ← env 로 주입
          API_TOKEN: ${{ secrets.API_TOKEN }}
```

secret 은 워크플로 로그에 자동 마스킹되지만, `echo` 로 base64 인코딩한 뒤 출력하면 마스킹이 우회된다. 그래서 디버깅용 echo 는 절대 secret 을 거치지 않게 두는 것이 운영 원칙이다.

> [!WARNING]
> **포크 PR 의 secret 차단**
> `pull_request` 이벤트가 포크에서 발생하면 GitHub 는 `secrets.*` 참조를 빈 문자열로 치환한다. 그래서 포크 PR 의 빌드는 secret 이 필요한 step 에서 자동 실패한다. 외부 contributor 가 보낸 PR 의 일부만 검증하는 경우 secret 없는 lint/test job 과 secret 필요한 배포 job 을 분리한다.

### GITHUB_TOKEN

`GITHUB_TOKEN` 은 secret 이 아니라 *워크플로 실행마다 자동으로 발급되는 임시 토큰* 이다. 사용자가 PAT (Personal Access Token) 를 따로 만들지 않아도 워크플로가 자신의 저장소에 API 호출을 할 수 있게 해준다.

특성은 세 가지다.

- 워크플로 시작 시점에 발급되어, 작업 종료 후 또는 최대 24시간 뒤 만료된다
- 권한 범위는 자신의 저장소로 한정된다. cross-repo 접근에는 사용 불가
- 기본 권한은 `Settings > Actions > General` 의 `Workflow permissions` 로 조정한다. 2026 시점 신규 저장소의 기본값은 read-only 다[^gha-token]

워크플로 안에서 권한을 더 좁히려면 `permissions:` 키를 명시한다.

```yaml
# 기본은 모두 none, 필요한 것만 명시적으로 부여
permissions:
  contents: read                                 # ← 코드 읽기
  pull-requests: write                           # ← PR 코멘트/라벨
  id-token: write                                # ← OIDC 토큰 (배포에 사용)
```

`permissions:` 를 워크플로 최상단에 두면 그 워크플로 전체에 적용되고, job 안에 두면 그 job 에만 적용된다. 신규 워크플로에는 `contents: read` 를 기본으로 시작하고 step 이 요구할 때마다 권한을 추가하는 *최소권한* 흐름이 권장된다.

> [!IMPORTANT]
> **PR 생성·승인 권한**
> `pull-requests: write` 를 워크플로에 명시했더라도, 저장소의 `Settings > Actions > General > Workflow permissions` 섹션의 "Allow GitHub Actions to create and approve pull requests" 체크박스가 꺼져 있으면 PR 생성·승인이 실패한다. 저장소 설정이 워크플로 권한보다 우선한다.

## 운영 옵션 — matrix, cache, reusable workflow ⚙️

권한 모델을 정리했다. 그 위에서 빌드 시간과 유지보수 비용을 결정짓는 운영 옵션 세 가지를 본다. matrix, cache, reusable workflow 다.

### Matrix builds

`strategy.matrix` 는 같은 job 을 여러 차원의 조합으로 펼친다. OS × Node 버전, OS × Python 버전 같이 호환성을 검증해야 하는 경우에 사용한다.

```yaml
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false                          # ← 한 조합 실패해도 나머지 계속
      matrix:
        os: [ubuntu-latest, macos-latest]
        node: [20, 22]
        include:
          - os: ubuntu-latest                   # ← 특정 조합만 추가 설정
            node: 22
            coverage: true
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
      - run: npm ci && npm test
```

위 예시는 4개 조합 (2 OS × 2 Node) 을 병렬 실행한다. `fail-fast: false` 가 핵심이다. 기본값 (true) 은 한 조합이 실패하면 나머지를 모두 취소하는데, 호환성 테스트에서는 *모든 조합의 실패 패턴* 을 봐야 디버깅이 가능하다. 라이브러리 저장소에서는 false, 단순 빌드에서는 true 가 기본값이다.

운영 사례로는 Astro 블로그를 Node 20/22 에 모두 검증해 두는 패턴, 인프라 도구를 Ubuntu/macOS 양쪽에서 동작 확인하는 패턴이 있다. 다만 hosted 러너의 macOS 는 분당 과금 비율이 Linux 의 10배이므로 (private 저장소 기준), 무료 한도 외 사용 시점에서는 OS matrix 가 곧 비용이다.

### Cache

빌드 의존성을 워크플로 간에 공유해 시간을 줄인다. `actions/cache@v4` 가 표준이며, 언어별 setup 액션 (`setup-node`, `setup-python`) 에는 `cache:` 옵션이 통합되어 있다.

```yaml
# actions/cache 를 직접 쓰는 경우 — 정밀 제어 필요할 때
- uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

```yaml
# setup-node 의 통합 옵션 — 일반 케이스
- uses: actions/setup-node@v4
  with:
    node-version: 22
    cache: 'npm'                                # ← package-lock.json 자동 해시
```

key 가 정확히 일치하면 캐시 hit, restore-keys 로 prefix 일치 시 부분 복원이 가능하다. 사용 시점은 명확하다. `npm ci`, `pip install`, `cargo build`, `go mod download` 처럼 *의존성 해시가 안정적* 인 단계는 cache 후보다. 빌드 산출물 (`.next/`, `dist/`) 은 cache 보다는 `actions/upload-artifact` 로 job 간 전달하는 것이 표준 패턴이다.

> [!NOTE]
> **캐시 용량 제약**
> 저장소당 캐시 총 용량은 10GB 이며, 7일간 접근되지 않으면 자동 삭제된다. 한 빌드가 5GB cache 를 만들면 다음 빌드의 cache 가 강제 추출(eviction)되므로, 대형 cache 는 분할해서 등록한다.

### Reusable workflows

같은 워크플로 로직을 여러 저장소·여러 트리거에서 재사용하려면 reusable workflow 를 사용한다. `workflow_call` 이벤트로 호출 가능한 형태의 워크플로를 정의해 두고, 다른 워크플로에서 `uses:` 로 부른다.

```yaml
# .github/workflows/reusable-test.yml — 호출되는 쪽
on:
  workflow_call:
    inputs:
      node-version:
        type: string
        default: '22'
    secrets:
      NPM_TOKEN:
        required: false
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: ${{ inputs.node-version }} }
      - run: npm ci && npm test
```

```yaml
# .github/workflows/ci.yml — 호출하는 쪽
jobs:
  test:
    uses: ./.github/workflows/reusable-test.yml
    with:
      node-version: '22'
    secrets:
      NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

사용 시점은 두 가지다. 같은 조직의 여러 저장소가 동일한 lint/test 절차를 공유해야 할 때, 또는 한 저장소 안에서 PR 빌드와 nightly 빌드가 같은 job 을 살짝 다른 input 으로 호출해야 할 때다. 마켓플레이스의 외부 액션과 달리 reusable workflow 는 *워크플로 전체* (여러 job, needs 관계, permissions) 를 묶어서 재사용할 수 있다.

복합 action (`uses: ./.github/actions/setup`) 과 헷갈리기 쉬운데, 차이는 명확하다. 복합 action 은 *step 단위* 의 재사용이고, reusable workflow 는 *job 단위* 의 재사용이다.

## 보안 — OIDC, third-party action 핀고정 🛡️

운영 옵션을 정리했다. 그 위에서 자주 빠지는 보안 함정 두 가지를 본다. 클라우드 배포 시의 OIDC 와 third-party action 의 핀고정이다.

### OIDC 로 클라우드 자격 증명 발급

전통적인 패턴은 클라우드의 장기 access key 를 secret 에 박아두고 워크플로에서 꺼내 쓰는 것이었다. 이 모델은 두 가지 문제가 있다. 첫째, 키가 secret 에 영구 저장되므로 한 번 유출되면 회전 (rotation) 까지 노출이 지속된다. 둘째, 권한이 키 단위로 발급되어 워크플로 단위 최소권한이 어렵다.

OIDC (OpenID Connect) 모델은 워크플로 실행마다 GitHub 가 *단기 JWT* 를 발급하고, 클라우드 IAM 이 그 JWT 의 `iss`, `sub`, `aud` claim 을 검증해 짧은 수명 (보통 1시간) 의 자격증명을 발급한다[^gha-oidc]. AWS, GCP, Azure 모두 GitHub OIDC provider 를 표준으로 지원한다.

```yaml
# AWS 예시 — STS AssumeRoleWithWebIdentity 가 자동 호출됨
permissions:
  id-token: write                               # ← OIDC 토큰 발급 권한
  contents: read
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123:role/gh-deploy
          aws-region: ap-northeast-2
      - run: aws s3 sync ./dist s3://my-bucket
```

`role-to-assume` 의 IAM role 은 GitHub OIDC provider 를 신뢰 정책에 등록하고, `sub: repo:OWNER/REPO:ref:refs/heads/main` 같은 조건으로 *특정 저장소의 특정 브랜치* 에서만 가정될 수 있게 좁힌다. 이 모델에서는 클라우드 secret 자체를 GitHub 에 저장할 필요가 없다.

운영 사례로는 본 블로그도 GitHub Pages 배포에 `actions/deploy-pages` 의 OIDC 흐름을 사용하고 있다. 별도 PAT 를 만들지 않고도 Pages 가 워크플로 신원을 직접 검증한다.

### Third-party action 핀고정

`uses: actions/checkout@v4` 같은 표기는 `v4` 라는 *움직이는* 태그를 가리킨다. 액션 저자가 같은 태그를 새 커밋으로 이동시키면 다음 워크플로 실행에서 다른 코드가 실행된다. GitHub 공식 액션 (`actions/*`) 은 신뢰할 수 있지만, marketplace 의 third-party 액션은 *commit SHA 로 핀고정* 하는 것이 보안 표준이다.

```yaml
# 권장 — 40자 SHA 로 핀고정 + 주석으로 버전 표기
- uses: tj-actions/changed-files@2f7c5bfce28377bc069a65ba478de0a74aa0ca32   # v45.0.0
```

`Settings > Actions > General > Allow actions and reusable workflows` 에서 허용 목록을 좁히는 방식도 있다. 조직 단위에서는 verified creator 만 허용하거나 명시 화이트리스트만 통과시키는 정책이 표준이다.

## Self-hosted runner — 사용 시점과 보안 🖥️

GitHub hosted 러너로 해결되지 않는 경우가 있다. 사내 네트워크 안의 리소스 접근, GPU·ARM·대용량 빌드, 무료 한도 외 비용 절감이 대표적이다. 이런 경우 self-hosted runner 를 등록한다.

설치는 `Settings > Actions > Runners > New self-hosted runner` 에서 받은 스크립트를 호스트에서 실행한다.

```bash
# 토큰은 Settings 화면에서 발급
mkdir actions-runner && cd actions-runner
curl -o runner.tar.gz -L https://github.com/actions/runner/releases/download/v2.319.1/actions-runner-linux-x64-2.319.1.tar.gz
tar xzf runner.tar.gz
./config.sh --url https://github.com/OWNER/REPO --token ${TOKEN}
./run.sh                                       # ← foreground 실행, systemd 등록은 ./svc.sh install
```

워크플로에서는 `runs-on: self-hosted` 또는 라벨 (`runs-on: [self-hosted, gpu, linux]`) 로 매칭한다.

```yaml
jobs:
  build:
    runs-on: [self-hosted, linux, gpu]         # ← 라벨 AND 매칭
```

사용 시점 결정 기준은 다음과 같다.

| 상황 | 권장 |
|---|---|
| public 저장소의 기본 빌드 | hosted 러너 (무료 한도) |
| private 저장소의 가벼운 빌드 | hosted (월 2,000분 무료) |
| GPU 필요한 ML 빌드 | self-hosted (ephemeral) |
| 사내망 리소스 접근 | self-hosted (VPC 안에 배치) |
| 매월 빌드 시간 수만 분 | self-hosted (비용 절감) |

> [!CAUTION]
> **public 저장소 + self-hosted runner 의 코드 실행 위험**
> public 저장소에 self-hosted runner 를 붙이면 *임의의 외부 contributor* 가 PR 을 만들어 그 PR 의 임의 코드를 self-hosted 호스트에서 실행할 수 있다. GitHub 공식 가이드는 public 저장소에 self-hosted runner 를 붙이는 것을 *권장하지 않는다*. 꼭 필요하면 ephemeral runner 와 별도 격리 네트워크를 결합한다[^gha-self-hosted].

# How? 어떻게 검증 / 운영?

## 운영 트레이드오프 ⚖️

What 절에서 옵션들의 사용 시점을 정리했다. 실제 운영에서 어떤 조합이 어떤 비용·위험을 만드는지를 표 한 장으로 정리한다.

| 옵션 | 켜는 이유 | 끄는 이유 / 주의점 |
|---|---|---|
| `concurrency.cancel-in-progress: true` | PR 중간 push 의 빌드 시간 절감 | 배포 job 에서 켜면 부분 배포 위험 |
| matrix `fail-fast: false` | 호환성 실패 패턴 전체 관찰 | 단순 빌드는 true 가 시간·비용 절감 |
| `actions/cache` | 의존성 설치 시간 50%+ 절감 | 10GB 한도, eviction 시 빌드가 더 느려짐 |
| Reusable workflow | 여러 저장소 동일 절차 공유 | 한 저장소 한 사용처면 과한 추상화 |
| OIDC | 장기 secret 제거, 단기 자격 증명 | 클라우드 IAM 신뢰정책 설계 필요 |
| Self-hosted runner | GPU/사내망/비용 | public 저장소 보안 위험, 호스트 운영 부담 |
| `pull_request_target` | 포크 PR 에 라벨/코멘트 | 포크 코드 체크아웃 시 secret 유출 |

이 표의 결정은 모두 *기본값 vs 명시 override* 의 형태로 워크플로 안에서 한 줄로 토글된다. 그래서 어느 옵션이 기본값인지, 어느 옵션이 위험한 override 인지를 PR 리뷰에서 매번 확인하는 절차를 둔다.

## 실습 환경 — 빈 저장소 + workflow_dispatch 🧪

옵션 표를 정리했다. 그 옵션들을 실제로 토글하면서 동작을 관측하려면 격리된 저장소가 필요하다.

GitHub 에 빈 private 저장소 한 곳을 만들고 `.github/workflows/lab.yml` 한 파일만 둔다. `workflow_dispatch` 트리거를 켜두면 Actions 탭에서 수동으로 실행할 수 있어 실습 사이클이 빠르다.

```yaml
# .github/workflows/lab.yml
name: Lab
on:
  workflow_dispatch:                            # ← 수동 실행
    inputs:
      scenario:
        description: 'lab scenario 번호'
        type: choice
        options: ['1-matrix', '2-cache', '3-reusable', '4-oidc']
        default: '1-matrix'
permissions:
  contents: read
jobs:
  lab:
    runs-on: ubuntu-latest
    steps:
      - run: echo "scenario=${{ inputs.scenario }}"
```

이후 실습 1-4 는 이 파일을 시나리오별로 교체하면서 진행한다. 각 실습이 What 절의 어떤 주장을 검증하는지를 미리 정리하면 다음과 같다.

| 실습 | What 절 매핑 | 검증 대상 주장 |
|---|---|---|
| 1 | Matrix builds | `fail-fast: false` 가 모든 조합의 실패 패턴을 보여준다 |
| 2 | Cache | 두 번째 실행의 의존성 설치 시간이 줄어든다 |
| 3 | Reusable workflow | 호출하는 쪽이 `with:` 로 input 을 주입한다 |
| 4 | OIDC | id-token claim 의 `sub` 가 저장소·브랜치 정보를 포함한다 |

## 실습 1 — Matrix 의 fail-fast 비교 🔢

가장 작은 단위부터 시작한다. matrix 의 `fail-fast` 옵션 하나만 토글하면서 결과 화면이 어떻게 달라지는지 본다.

```yaml
name: Lab-Matrix
on: { workflow_dispatch: {} }
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false                          # ← true 로 바꿔서 재실행해 비교
      matrix:
        node: [18, 20, 22]
    steps:
      - run: |
          if [ "${{ matrix.node }}" = "20" ]; then
            echo "intentional fail on Node 20" && exit 1
          fi
          echo "Node ${{ matrix.node }} OK"
```

`fail-fast: false` 로 실행하면 Actions 화면에 세 job 의 결과가 각각 표시된다. Node 18, 22 는 성공, Node 20 만 실패다. `fail-fast: true` 로 바꾸면 Node 20 의 실패와 동시에 Node 18, 22 의 결과가 *cancelled* 로 마감되어 통과 여부가 확인되지 않는다. 라이브러리 저장소에서 false 를 기본값으로 두는 이유가 화면에 직접 드러난다.

## 실습 2 — Cache hit/miss 측정 ⏱️

캐시가 실제로 시간을 얼마나 줄이는지는 두 번 실행해서 비교한다.

```yaml
name: Lab-Cache
on: { workflow_dispatch: {} }
jobs:
  install:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'                          # ← 두 번째 실행에서 hit
      - run: |
          START=$(date +%s)
          npm ci
          echo "elapsed=$(( $(date +%s) - START ))s"
```

첫 실행에서는 cache miss 가 떠서 npm registry 에서 전 패키지를 받는다. 두 번째 실행에서는 `Cache restored successfully` 가 출력되고 `npm ci` 의 elapsed 가 절반 이하로 줄어든다. 로그 상단의 `Post Run actions/setup-node` 단계가 다음 실행을 위한 cache 를 저장한다. 캐시 키는 `package-lock.json` 의 해시이므로, lock 파일이 변하면 자동으로 새 캐시가 만들어진다.

## 실습 3 — Reusable workflow 호출 체인 🔗

reusable workflow 가 input/secret 을 어떻게 받아 처리하는지를 두 파일로 재현한다.

```yaml
# .github/workflows/_reusable.yml
on:
  workflow_call:
    inputs:
      message: { type: string, default: 'hello' }
jobs:
  echo:
    runs-on: ubuntu-latest
    steps:
      - run: echo "msg=${{ inputs.message }}"
```

```yaml
# .github/workflows/lab-reusable.yml
on: { workflow_dispatch: {} }
jobs:
  call-default:
    uses: ./.github/workflows/_reusable.yml    # ← default 'hello'
  call-override:
    uses: ./.github/workflows/_reusable.yml
    with:
      message: 'overridden'                    # ← input override
```

수동 실행하면 두 job 이 같은 reusable workflow 를 호출하지만 다른 메시지를 출력한다. Actions 화면에서는 호출된 reusable workflow 가 별도 box 로 그려져, 호출 관계가 시각적으로 드러난다.

## 실습 4 — OIDC 토큰의 claim 확인 🔐

OIDC 의 `sub` claim 이 저장소·브랜치 정보를 포함한다는 사실을 raw 응답으로 확인한다. 클라우드 IAM 설정 없이도 GitHub 가 발급한 토큰 자체는 워크플로 안에서 디코딩 가능하다.

```yaml
name: Lab-OIDC
on: { workflow_dispatch: {} }
permissions:
  id-token: write                               # ← OIDC 토큰 발급 권한
  contents: read
jobs:
  inspect:
    runs-on: ubuntu-latest
    steps:
      - name: Get OIDC token and decode payload
        run: |
          TOKEN=$(curl -sSL \
            -H "Authorization: Bearer $ACTIONS_ID_TOKEN_REQUEST_TOKEN" \
            "$ACTIONS_ID_TOKEN_REQUEST_URL&audience=lab" \
            | jq -r '.value')
          echo "$TOKEN" | cut -d. -f2 | base64 -d 2>/dev/null | jq '{iss, sub, aud, repository, ref}'
```

출력에서 `iss: https://token.actions.githubusercontent.com`, `sub: repo:OWNER/REPO:ref:refs/heads/main`, `aud: lab` 가 확인된다. 클라우드 IAM 신뢰정책은 이 `sub` 값을 `StringEquals` 또는 `StringLike` 로 매칭해 *특정 저장소의 특정 브랜치* 에서만 자격증명을 발급한다. 즉 GitHub Actions 의 신원이 곧 IAM 의 principal 이 되는 모델이다.

## 트러블슈팅 — 자주 만나는 실패 ⚠️

What 과 실습에서 정상 경로를 확인했다. 실제 운영에서 반복적으로 만난 실패 패턴을 정리해 둔다.

### 워크플로 파일 push 가 거부됨

`workflow scope` 없는 PAT 로 `.github/workflows/*.yml` 을 수정해 push 하면 다음 에러가 발생한다.

```
! [remote rejected] main -> main (refusing to allow a Personal Access Token
to create or update workflow `.github/workflows/ci.yml` without `workflow` scope)
```

해결은 PAT 의 scope 를 갱신하는 것이다.

1. `GitHub Settings > Developer settings > Personal access tokens` 진입
2. 대상 토큰을 편집하고 `workflow` scope 체크
3. (Fine-grained token 의 경우) `Workflows: Read and write` 권한 부여
4. 토큰 갱신 후 push 재시도

원격 URL 에 토큰을 박아두는 패턴 (`https://${TOKEN}@github.com/owner/repo.git`) 은 임시 우회로만 사용하고, 영구 설정에는 `gh auth login` 의 OAuth flow 나 SSH 키가 더 안전하다.

### PR 생성·승인 권한 부족

봇 워크플로가 PR 을 만들거나 자동 승인하려 할 때 다음 에러가 발생한다.

```
GitHub Actions is not permitted to create or approve pull request
```

워크플로 YAML 의 `permissions:` 만 고쳐서는 해결되지 않는다. 저장소 설정이 우선하기 때문이다.

1. `Settings > Actions > General` 진입
2. 페이지 하단 `Workflow permissions` 섹션
3. `Allow GitHub Actions to create and approve pull requests` 체크 후 Save

이 설정은 저장소 단위이며, 조직 단위에서 강제로 꺼두는 정책도 있을 수 있다. 조직 정책으로 꺼져 있으면 저장소에서 켤 수 없다.

### Schedule 워크플로가 멈춤

`schedule:` cron 워크플로는 저장소가 60일간 활동 (commit, push, manual run) 이 없으면 자동으로 중지된다. 정적 사이트의 nightly 인덱싱 같은 워크플로가 조용히 멈춰 있는 가장 흔한 원인이다. `Settings > Actions > General` 의 메시지로 재활성화하거나, 최소한의 dummy commit 한 번을 정기적으로 푸시한다.

### Self-hosted runner 가 offline 으로 표시됨

runner 호스트의 `./run.sh` 프로세스가 죽으면 GitHub 측 상태가 *offline* 으로 바뀐다. systemd service 로 등록해 두면 재부팅 후 자동 복구된다.

```bash
sudo ./svc.sh install                          # ← systemd unit 생성
sudo ./svc.sh start
sudo ./svc.sh status
```

GitHub 측에서는 워크플로의 `runs-on: self-hosted` job 이 *Waiting for a runner* 상태로 무기한 대기한다. 큐가 쌓이지 않게 monitoring 으로 runner 의 *online* 상태를 별도 알람으로 두는 것이 운영 표준이다.

# Remark

본문에서 다룬 주제를 한 표로 요약하고, 운영 관점의 회고와 인접 주제를 덧붙인다.

| 절 | 핵심 결론 |
|---|---|
| CI/CD 위치 | GitHub Actions 는 저장소가 워크플로를 들고 다니는 모델 |
| 핵심 개념 | workflow > job > step, runner 가 실행 호스트 |
| 실행 모델 | concurrency 로 큐 절약, `pull_request_target` 은 위험 |
| Secrets / TOKEN | `permissions:` 최소권한, 저장소 설정이 우선 |
| 운영 옵션 | matrix·cache·reusable workflow 의 사용 시점 분리 |
| 보안 | OIDC 로 장기 secret 제거, third-party 는 SHA 핀고정 |
| Self-hosted | GPU/사내망/비용 한정, public 저장소는 위험 |
| 트러블슈팅 | PAT workflow scope, 저장소 PR 권한 토글 |

운영 관점에서 가장 자주 부딪힌 문제는 두 가지였다. 하나는 third-party action 을 `@v1` 같은 움직이는 태그로 박아두었다가 갑자기 빌드가 깨진 경우다. 액션 저자가 동일 태그를 다른 커밋으로 옮긴 직후였고, 본문의 SHA 핀고정 규칙 한 줄만 적용해 두었으면 막을 수 있는 사고였다. 다른 하나는 reusable workflow 의 `secrets: inherit` 을 별 생각 없이 켜둔 채 외부 저장소를 호출했다가 secret 노출 범위가 의도보다 넓어진 경우다. 둘 다 본문의 *최소권한* 원칙과 *핀고정* 원칙 한 줄만 운영 절차에 박아두면 끝나는 문제였다. 다만 한 번 잘못 설계된 워크플로가 다른 워크플로의 default 가 되어 같은 사고가 반복됐다.

이 글이 다루지 않은 인접 주제로는 GitHub Environments 와 deployment protection rules (수동 승인, wait timer), composite action 으로 step 묶음을 추출하는 패턴, Dependabot 의 `dependabot.yml` 로 액션 버전 자체를 자동 갱신하는 흐름, 그리고 NixOS Homelab 같은 self-hosted 인프라 위에서 ephemeral runner 를 띄우는 운영 모델이 있다. 마지막은 본 블로그의 *NixOS Ecosystem* 시리즈와 자연스럽게 이어지는 주제다.

# Reference

[^gha-events]: <https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows> — 트리거 이벤트 전체 목록. push/pull_request/schedule/workflow_dispatch/merge_group 등.
[^gha-runners]: <https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners> — GitHub hosted runner 사양과 사용 가능 OS.
[^gha-pr-target]: <https://securitylab.github.com/research/github-actions-preventing-pwn-requests/> — `pull_request_target` 의 보안 함정과 권장 패턴 (GitHub Security Lab).
[^gha-token]: <https://docs.github.com/en/actions/security-guides/automatic-token-authentication> — GITHUB_TOKEN 의 권한 모델, 만료, permissions 키.
[^gha-oidc]: <https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect> — GitHub Actions OIDC 의 토큰 claim 과 클라우드 IAM 신뢰정책 설계.
[^gha-self-hosted]: <https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/about-self-hosted-runners#self-hosted-runner-security> — public 저장소 + self-hosted runner 의 코드 실행 위험과 권장 격리.
[^gha-docs]: <https://docs.github.com/en/actions> — GitHub Actions 공식 문서.
[^gha-permissions]: <https://docs.github.com/en/actions/using-jobs/assigning-permissions-to-jobs> — `permissions:` 키와 토큰 권한 범위.
