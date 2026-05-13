---
title: "잘못 올라간 파일을 github 상에서 모두 제거하기"
description: "commit 되지 말아야할 파일을 commit & push 하는 사고가 발생하면 어떻게 대처해야할까?\n어떻게 하면 local git 과 remote git 상에서 해당 파일에 대해서만 제거할 수 있을까 ?"
date: 2025-12-22
tags: []
category: uncategorized
lang: ko
draft: false
---

![](/images/velog/05df6c0754eeb89d.png)


# Why? 왜 배움?

---

환경변수나 DB 정보들을 잘못하고 github 상에 올려버렸다.

그나마 사내 gitlab 에 올려서 다행이지 만약 public repo 였으면 큰일날 뻔 했다.

이런 식의 불운한 사고 발생하면 어떻게 대처해야할까?

어떻게 하면 내 깃과 깃허브 상의 모든 커밋을 뒤져가며 해당 파일에 대해서만 제거할 수 있을까?

# bfg-repo-cleaner

### Purpose

BFG Repo-Cleaner는 기존 `git filter-branch`을 개선하기 위해 만들어진 Java 기반의 경량 툴이다.

| 항목 | 내용 |
| --- | --- |
| 언어 | Java |
| 주 용도 | 대용량 파일, 비밀키, 특정 경로 삭제 |
| 장점 | **매우 빠름** (기존 방식 대비 10~50배) |
| 단점 | 복잡한 리라이트(예: 커밋 메시지 변경)는 제한적 |
| 설치 | `brew install bfg` or [JAR 파일 다운로드](https://rtyley.github.io/bfg-repo-cleaner/) |

### Installation

필자는 아래와 같이 nix 를 통해 설치했는데 1) brew 를 통해 설치하거나 2) 직접 jar 파일을 받거나의 방식이 있다.

인터넷에 널리 널려있으니 찾아보길 바란다.

```nix
# General CLI utilities and tools
# Core utilities, terminal tools, recording, database clients, platform-specific services
{
  pkgs,
  lib,
  isWsl,
  isLinux,
  ...
}: {
  # =============================================================================
  # General CLI Utilities
  # =============================================================================
  home.packages = with pkgs;
    [
      bfg-repo-cleaner
		  # 이외 설정값들은 생략 ,,,
    ];
}
```

### Usage

1. `git clone --mirror` 을 통해 모든 refs 에 대한 clone 을 받는다.
    
    ** [git clone 의 mirror 옵션이란?](https://stackoverflow.com/questions/3959924/whats-the-difference-between-git-clone-mirror-and-git-clone-bare)
    
    ```nix
    # 실제 레포 URL 은 사내용이므로 예시로 가져옴
    ~/dev/newsclipping-java-api-v2/deploy/modules/monitoring/alloy feature                          3m 49s
    ❯ git clone --mirror git://example.com/some-big-repo.git
    ```
    
2. `bfg --delete-files ${삭제하고자 하는 파일명} ${대상 .git 파일}` 을 통해 모든 커밋에 대한 파일 내역을 삭제한다.
    
    ```nix
    /mnt/c/Users/limjihoon/dev/newsclipping-java-api-v2 feature ?2                                      7s
    ❯ bfg --delete-files .env.dev  ~/dev/newsclipping-java-api-v2/.git
    
    Using repo : /home/limjihoon/dev/newsclipping-java-api-v2/.git
    
    Found 625 objects to protect
    Found 8 commit-pointing refs : HEAD, refs/heads/develop, refs/heads/feature, ...
    
    Protected commits
    -----------------
    
    These are your protected commits, and so their contents will NOT be altered:
    
     * commit ec120c1a (protected by 'HEAD') - contains 1 dirty file :
            - deploy/modules/monitoring/alloy/.env.dev (598 B )
    
    WARNING: The dirty content above may be removed from other commits, but as
    the *protected* commits still use it, it will STILL exist in your repository.
    
    Details of protected dirty content have been recorded here :
    
    /home/limjihoon/dev/newsclipping-java-api-v2.bfg-report/2025-11-11/12-27-17/protected-dirt/
    
    If you *really* want this content gone, make a manual commit that removes it,
    and then run the BFG on a fresh copy of your repo.
    
    Cleaning
    --------
    
    Found 970 commits
    Cleaning commits:       100% (970/970)
    Cleaning commits completed in 239 ms.
    
    BFG aborting: No refs to update - no dirty commits found??
    ```
    
3. 실제로 해당 값이 잘 지워졌는지 확인한다. 만약 출력되는 값이 없다면 잘 지워진 것이다.
    
    ```nix
    ~/dev/newsclipping-java-api-v2 feature                                                                                                                                                                     56s
    ❯ git log --all --full-history -- deploy/modules/monitoring/alloy/.env.dev
    
    ~/dev/newsclipping-java-api-v2 feature
    ❯ git log --all --full-history -- .env.dev
    
    ```
    
4. 강제 푸시를 통해 원격 저장소에 업로드한다.
    
    ```nix
    ~/dev/newsclipping-java-api-v2/deploy/modules/monitoring/alloy feature                          3m 49s
    ❯ git push --force
    ```
    

> 💡
> 
> 더 자세한 옵션을 보고 싶다면 아래 man 을 확인해보자 (웹에 없어서 실제 man 코드를 퍼옴)
> 
> - bfg man
>   
    ```
    /mnt/c/Users/limjihoon/dev/tonys-nix main ⇡1 !8                                                  4m 0s
    ❯ bfg man
    bfg 1.15.0
    Usage: bfg [options] [<repo>]
>    
      -b, --strip-blobs-bigger-than <size>
                               strip blobs bigger than X (eg '128K', '1M', etc)
      -B, --strip-biggest-blobs NUM
                               strip the top NUM biggest blobs
      -bi, --strip-blobs-with-ids <blob-ids-file>
                               strip blobs with the specified Git object ids
      -D, --delete-files <glob>
                               delete files with the specified names (eg '*.class', '*.{txt,log}' - matches on file name, not path within repo)
      --delete-folders <glob>  delete folders with the specified names (eg '.svn', '*-tmp' - matches on folder name, not path within repo)
      --convert-to-git-lfs <value>
                               extract files with the specified names (eg '*.zip' or '*.mp4') into Git LFS
      -rt, --replace-text <expressions-file>
                               filter content of files, replacing matched text. Match expressions should be listed in the file, one expression per line - by default, each expression is treated as a literal, but 'regex:' & 'glob:' prefixes are supported, with '==>' to specify a replacement string other than the default of '***REMOVED***'.
      -fi, --filter-content-including <glob>
                               do file-content filtering on files that match the specified expression (eg '*.{txt,properties}')
      -fe, --filter-content-excluding <glob>
                               don't do file-content filtering on files that match the specified expression (eg '*.{xml,pdf}')
      -fs, --filter-content-size-threshold <size>
                               only do file-content filtering on files smaller than <size> (default is 1048576 bytes)
      -p, --protect-blobs-from <refs>
                               protect blobs that appear in the most recent versions of the specified refs (default is 'HEAD')
      --no-blob-protection     allow the BFG to modify even your *latest* commit. Not recommended: you should have already ensured your latest commit is clean.
      --private                treat this repo-rewrite as removing private data (for example: omit old commit ids from commit messages)
      --massive-non-file-objects-sized-up-to <size>
                               increase memory usage to handle over-size Commits, Tags, and Trees that are up to X in size (eg '10M')
      <repo>                   file path for Git repository to clean
    Aborting : man is not a valid Git repository.
    ```
    
> 🚧
> 
> bfg-repo-cleaner 의 가장 큰 ***단점은 파일명으로만 삭제가 가능하다는 것*** 이다
>
> 이로 인해 특정 디렉토리마다 
>
> 가령 각 컴포넌트 별로 [README.md](http://README.md) 를 선언한 경우 bfg 를 사용할 수 없다.
>
> 이런 경우에는 아래와 같이 git-filter-repo 를 사용해야만 한다.

# git-filter-repo

### Purpose

git-filter-repo는 Git 커뮤니티가 filter-branch의 공식 대체제로 인정한 Python 기반 툴이다.

2020년 이후로 git 문서에서도 filter-branch 대신 filter-repo를 권장한다.

### Installation

필자는 아래와 같이 nix 를 통해 설치했는데 1) brew 를 통해 설치하거나 2) 직접 jar 파일을 받거나의 방식이 있다.

인터넷에 널리 널려있으니 찾아보길 바란다.

```nix
# General CLI utilities and tools
# Core utilities, terminal tools, recording, database clients, platform-specific services
{
  pkgs,
  lib,
  isWsl,
  isLinux,
  ...
}: {
  # =============================================================================
  # General CLI Utilities
  # =============================================================================
  home.packages = with pkgs;
    [
      git-filter-repo
		  # 이외 설정값들은 생략 ,,,
    ];
}
```

### Usage

1. `git clone --mirror` 을 통해 모든 refs 에 대한 clone 을 받는다.
    
    ** [git clone 의 mirror 옵션이란?](https://stackoverflow.com/questions/3959924/whats-the-difference-between-git-clone-mirror-and-git-clone-bare)
    
    ```nix
    # 실제 레포 URL 은 사내용이므로 예시로 가져옴
    ~/dev/newsclipping-java-api-v2/deploy/modules/monitoring/alloy feature                          3m 49s
    ❯ git clone --mirror git://example.com/some-big-repo.git
    ```
    
2. `git-filter-repo --sensitive-data-removal --invert-paths --path ${제거하고자하는 파일의 상대경로}` 을 통해 모든 커밋에 대한 파일 내역을 삭제한다. 
    
    ```nix
    ~/dev/newsclipping-java-api-v2 feature
    ❯ git-filter-repo --sensitive-data-removal --invert-paths --path  deploy/README.md
    NOTICE: Fetching all refs from origin to make sure we rewrite
            all history that may reference the sensitive data, via
          git fetch -q --prune --update-head-ok --refmap "" origin +refs/*:refs/*
    Parsed 973 commits
    New history written in 7.19 seconds; now repacking/cleaning...
    You rewrote 9 (of 973) commits.
    
    NOTE: First Changed Commit(s) is/are:
      07221bd591ef1c83b7952dfffe69bd641471cb15
    NOTE: LFS object orphaning not checked (LFS not in use)
    
    Repacking your repo and cleaning out old unneeded objects
    HEAD is now at f60542f0 fix : 잘못 설정한 api image domain 수정
    Enumerating objects: 20640, done.
    Counting objects: 100% (20640/20640), done.
    Delta compression using up to 16 threads
    Compressing objects: 100% (8501/8501), done.
    Writing objects: 100% (20640/20640), done.
    Total 20640 (delta 7414), reused 20605 (delta 7389), pack-reused 0 (from 0)
    Completely finished after 55.32 seconds.
    
    NEXT STEPS FOR YOUR SENSITIVE DATA REMOVAL:
      * If you are doing your rewrite in multiple steps, ignore these next steps
        until you have completed all your invocations of git-filter-repo.
      * See the "Sensitive Data Removal" subsection of the "DISCUSSION" section
        of the manual for more details about any of the steps below.
      * Inspect this repository and verify that the sensitive data is indeed
        completely removed from all commits.
      * Force push the rewritten history to the server:
          git push --force --mirror origin
      * Contact the server admins for additional steps they need to take; the
        First Changed Commit(s) may come in handy here.
      * Have other colleagues with a clone either discard their clone and reclone
        OR follow the detailed steps in the manual to repeatedly rebase and
        purge the sensitive data from their copy.  Again, the First Changed
        Commit(s) may come in handy.
      * See the "Prevent repeats and avoid future sensitive data spills" section
        of the manual.
    
    ```
    
3. 실제로 해당 값이 잘 지워졌는지 확인한다. 만약 출력되는 값이 없다면 잘 지워진 것이다.
    
    ```nix
    ~/dev/newsclipping-java-api-v2 feature                                                                                                                                                                     56s
    ❯ git log --all --full-history -- deploy/modules/monitoring/alloy/.env.dev
    
    ~/dev/newsclipping-java-api-v2 feature
    ❯ git log --all --full-history -- .env.dev
    
    ```
    
4. 강제 푸시를 통해 원격 저장소에 업로드한다.
    
    ```nix
    ~/dev/newsclipping-java-api-v2/deploy/modules/monitoring/alloy feature                          3m 49s
    ❯ git push --force
    ```
    


> 💡
> 
> 더 자세한 옵션을 보고 싶다면 아래 man 을 확인해보자
> 
> [git-filter-repo man](https://htmlpreview.github.io/?https://github.com/newren/git-filter-repo/blob/docs/html/git-filter-repo.html)

## **git filter-branch vs. filter-repo**

`git filter-branch`라는 `git filter-repo`와 유사한 도구가 있다.

다만 일반적으로 속도가 느리고 사용자 친화적이지 않다고 한다.

물론 어떤 포스트 작성자의 권고사항이니 그냥 주의사항으로만 참고하자

https://graphite.com/guides/git-filter-repo#git-filter-branch-vs-filter-repo

# Reference

---

> bfg-repo-cleaner
> 

https://rtyley.github.io/bfg-repo-cleaner/

https://llshl.tistory.com/30

> git-filter-
> 

https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository

https://graphite.com/guides/git-filter-repo#git-filter-branch-vs-filter-repo
