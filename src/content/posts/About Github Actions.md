---
description: "GitHub Actions의 핵심 개념(workflow, job, step, runner)과 Secrets 관리, 작동하지 않을 때의 트러블슈팅을 정리한다."
date: 2026-01-16
tags: [infra]
lang: ko
draft: false
---

# Why? 🤔

코드를 관리하다보면 다음과 같은 CI 문제에 직면한다.

- 설정을 수정하고 푸시했는데, 실제 서버에서 빌드가 안 되거나 설정이 꼬이는 경우
- 다양한 의존성 및 패키지에 대해 수동 업데이트 이슈
- 나도 모르게 비밀키를 커밋하거나, 사용하지 않는 코드(Dead Code), 오타 등이 코드베이스에 쌓이는 문제

이러한 문제들을 CI 레벨에서 해결할 수 있다. **이 때 GitHub Actions**로 자동화하면, 코드를 병합하기 전에 미리 검증하고 최신 상태를 유지하며 인프라의 신뢰성을 확보할 수 있다.

# What? 📋

## 어떤 기능들을 자동화할 수 있는가?

Github Actions 는 다음과 같은 기능들을 자동화할 수 있다.

1. **CI (Continuous Integration)**: 실제 서버 접속 없이도 설정 파일이 정상적으로 빌드되는지 검증
2. **의존성 업데이트**: 지정한 주기 별로 의존성을 업데이트하고 PR을 생성
3. **Security & Quality**
4. **Dependabot**: GitHub Actions 자체의 버전을 최신으로 유지

## Github Actions 핵심 개념

GitHub Actions는 소프트웨어 워크플로우를 자동화해주는 도구이다. 각각의 workflow 를 선언하여 해당 workflow 파이프라인을 특정 이벤트 트리거에 따라 호출하는 구조이다. 각 workflow 는 `.github/workflows` 폴더에 YAML 파일로 정의된다.

![](/images/notion/441ab5894795f2ef.png)

workflow 선언 프로세스는 다음과 같다.

1. name : workflow 이름
2. event : 어떤 이벤트에 따라 트리거 될건지 선언
3. jobs : 작업 묶음. 안에 steps 를 통해 작업들을 선언하여 형성한다. 여러 개를 나열할 수 있다.
4. runner : 어느 시스템에서 jobs 를 호출할 건지 선언

```yaml
name: Deadnix
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
  merge_group:
jobs:
  deadnix:
    name: Dead Code Check
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      - name: Install Nix
        uses: DeterminateSystems/nix-installer-action@main
      - name: Setup Magic Nix Cache
        uses: DeterminateSystems/magic-nix-cache-action@main
      - name: Run deadnix
        run: |
          nix-shell -p deadnix --run "deadnix --fail"
```

- **Event (`on`)**: 워크플로우를 실행시키는 트리거다. (예: `push`, `pull_request`, `schedule`)
- **Job**: 동일한 Runner에서 실행되는 일련의 Step 집합이다. 기본적으로 Job들은 병렬로 실행된다.
- **Step**: 명령을 실행하는 최소 단위다. `uses`(액션 사용)나 `run`(쉘 명령어 실행)으로 구성된다.
- **Runner**: 워크플로우가 실행되는 서버다. `ubuntu-latest` 같은 GitHub 호스팅 서버나 직접 구축한 서버를 사용할 수 있다.

## Secrets (feat.GITHUB_TOKEN) 🔐

시크릿키로 등록해야하는 값들인 경우 — 가령 SSH private key — Github Secrets 을 사용하여 등록해야 한다.

등록방법 및 사용방법은 아래와 같다.

- **등록 방법**: `Settings` > `Secrets and variables` > `Actions` > `New repository secret` 클릭
- **사용 방법**: YAML 파일에서 `${{ secrets.SSH_PUBLIC_KEY }}` 형태로 호출

```yaml
# 예시: 빌드 시 환경변수로 주입
env:
  SSH_PUB_KEY: ${{ secrets.SSH_PUBLIC_KEY }} #
```

GITHUB_TOKEN 을 이따금 볼 수 있는데 이는 시크릿 키값이 아니다. 해당 값은 워크플로가 GitHub 리포지토리에 접근할 수 있게 해주는 토큰이다. 해당 토큰을 통해 workflow 는 API 호출, 저장소 접근, 이슈 생성/관리 등의 작업을 수행하며, 사용자가 개인 토큰을 만들지 않아도 된다는 장점이 있다.

- 각 워크플로 또는 job 실행 시 고유하게 생성되며, 작업 완료 후(최대 24시간) 자동 만료
- 권한은 워크플로가 포함된 리포지토리로 제한되며, **`permissions`** 키로 세부 조정
- GitHub App 설치 액세스 토큰 기반으로 동작해 추가 앱 설치 없이 사용

[https://docs.github.com/ko/actions/concepts/security/github_token](https://docs.github.com/ko/actions/concepts/security/github_token)

## Github Actions 가 작동되지 않는 이슈 ⚠️

### 개인키 미등록

만약 개인키가 등록되어 있지 않다면 actions 는 정상 작동되지 않는다.

안 그러면 아래와 같이 에러가 발생한다.

```shell
~/dev/tonys-homelab main ⇡2                                                                      4s
❯ git push -u origin main
Enumerating objects: 30, done.
Counting objects: 100% (30/30), done.
Delta compression using up to 10 threads
Compressing objects: 100% (21/21), done.
Writing objects: 100% (21/21), 5.13 KiB | 5.13 MiB/s, done.
Total 21 (delta 10), reused 0 (delta 0), pack-reused 0 (from 0)
remote: Resolving deltas: 100% (10/10), completed with 8 local objects.
To https://github.com/vanillacake369/tonys-homelab.git
 ! [remote rejected] main -> main (refusing to allow a Personal Access Token to create or update workflow `.github/workflows/ci.yml` without `workflow` scope)
error: failed to push some refs to 'https://github.com/vanillacake369/tonys-homelab.git'

```

따라서 반드시 github 에 private token 을 등록해야 한다.

1. GitHub Settings → Developer settings → Personal access tokens
2. 전체 repo 혹은 특정 repo 선택
3. workflow 의 permission 을 read/write 부여
4. 토큰 생성
5. push 시 비밀번호 입력하거나 아래 방법을 통해 push

```shell
~/,,
❯ git remote add origin ${token}@github.com/${repo}

~/,,
❯ git push -u origin main                                Enumerating objects: 30, done.
Counting objects: 100% (30/30), done.
```

### PR 생성 권한이 없는 경우

```shell
GitHub Actions is not permitted to create or approve pull request
```

`ci.yml` 파일에 `pull-requests: write` 권한을 명시했더라도, **리포지토리 자체의 보안 설정**이 우선한다. 만약 위와 같은 에러가 발생한 경우 PR 권한이 없는 경우이므로 아래와 같이 설정을 수정한다.

- 해당 GitHub 리포지토리로 이동
- Settings > Actions > General 메뉴
- 페이지 하단의 Workflow permissions 섹션
- "Allow GitHub Actions to create and approve pull requests" 체크박스에 체크하고 Save

# How? 🛠️

?

[https://github.com/vanillacake369/tonys-homelab/tree/main/.github](https://github.com/vanillacake369/tonys-homelab/tree/main/.github)

[^1]: GitHub Actions 공식 문서. <https://docs.github.com/en/actions>

[^2]: <https://docs.github.com/en/actions>

[^3]: <https://docs.github.com/ko/actions/how-tos/write-workflows/choose-when-workflows-run>

[^4]: <https://docs.github.com/ko/actions/concepts/security/github_token#about-the-github_token>

[^5]: <https://jwonelife.tistory.com/entry/Github-Actions-%EA%B9%83%ED%97%88%EB%B8%8C-%EC%95%A1%EC%85%98%EB%9E%80>

[^6]: <https://www.freecodecamp.org/news/learn-to-use-github-actions-step-by-step-guide/>

[^7]: <https://danawalab.github.io/common/2022/08/24/Self-Hosted-Runner.html>
