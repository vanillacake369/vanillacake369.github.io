---
description: "OWASP 서울에서 DevSecOps 에 대한 세미나가 있길래 팟캐스트처럼 보던 와중"
date: 2025-12-28
tags: [conference]
lang: ko
draft: false
---

# Why?

OWASP 서울에서 DevSecOps 에 대한 세미나가 있길래 팟캐스트처럼 보던 와중
DevSecOps 가 하는 일이 정확히 무엇이고,
영상에서 언급된 SAST / DAST 가 무엇인지 궁금하게 되어 정리해보았다.

# What?

## DevSecOps란?

**DevSecOps = Dev + Sec + Ops**
보안(Security)을 개발과 운영의 나중 단계가 아니라, 처음부터 자동화된 프로세스로 통합을 지향

- 보안은 **보안팀만의 책임이 아니다**
- 개발자가 **코드를 쓰는 순간부터** 보안이 고려되어야 한다
- 사람의 검토가 아니라 **파이프라인에서 자동으로 검증**

### 기존 방식 vs DevSecOps

| 구분      | 기존 DevOps | DevSecOps           |
| --------- | ----------- | ------------------- |
| 보안 시점 | 릴리즈 직전 | 코드 작성부터       |
| 책임 주체 | 보안팀      | 개발·운영·보안 공동 |
| 방식      | 수동 점검   | 자동화된 스캔       |
| 결과      | 릴리즈 지연 | 빠르고 안전한 배포  |

## SAST (Static Application Security Testing)

### 정의

> 소스 코드를 실행하지 않고 정적으로 분석해서 보안 취약점을 찾는 방식

### 언제?

- **코드 작성 시**
- **PR / Merge 단계**
- **CI 파이프라인 초반**

### 무엇을 찾나?

- SQL Injection 가능 코드
- XSS 취약한 문자열 처리
- 하드코딩된 비밀번호
- 인증/인가 로직 오류
- 취약한 암호화 방식

### 장점

✅ 빠름
✅ 개발 초기 발견 → 수정 비용 낮음
✅ 코드 레벨 원인 파악 쉬움

### 단점

❌ 실제 실행 환경 맥락 부족
❌ False Positive 많을 수 있음

### 예시 흐름

```
git push
 → CI
   → SAST 실행
     → 취약 코드 발견 ❌ → 빌드 실패

```

## DAST (Dynamic Application Security Testing)

### 정의

> 실제로 실행 중인 애플리케이션을 대상으로 공격자처럼 테스트하는 방식

### 언제?

- **스테이징 환경**
- **배포 후**
- **릴리즈 직전**

### 무엇을 찾나?

- 인증 우회
- 세션 탈취
- XSS / CSRF
- 서버 설정 취약점
- API 권한 문제

### 장점

✅ 실제 공격 시나리오 반영
✅ 런타임 취약점 발견 가능

### 단점

❌ 느림
❌ 코드 원인 추적이 어려움
❌ 테스트 환경 필요

### 예시 흐름

```
배포 완료
 → DAST 도구가 API/웹 공격 시도
   → 취약점 발견 시 리포트 생성

```

| 항목            | SAST         | DAST       |
| --------------- | ------------ | ---------- |
| 분석 대상       | 소스 코드    | 실행 중 앱 |
| 실행 시점       | 개발/CI      | 배포 후    |
| 속도            | 빠름         | 느림       |
| 정확성          | 낮을 수 있음 | 높음       |
| 공격 시뮬레이션 | ❌           | ✅         |
| 개발자 친화성   | 높음         | 낮음       |

[^1]: https://www.blackduck.com/glossary/what-is-sast.html <https://www.blackduck.com/glossary/what-is-sast.html>

[^2]: https://www.wiz.io/ko-kr/academy/application-security/static-application-security-testing-sast <https://www.wiz.io/ko-kr/academy/application-security/static-application-security-testing-sast>
