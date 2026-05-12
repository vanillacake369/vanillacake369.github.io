---
title: "안녕하세요, Astro 블로그입니다"
description: "이 블로그의 첫 번째 포스트입니다. Astro로 구축한 블로그를 소개합니다."
date: 2026-05-01
tags: [blog, astro]
category: dev
lang: ko
draft: false
---

## 소개

이 블로그는 [Astro](https://astro.build)로 구축되었습니다. Astro는 콘텐츠 중심 웹사이트를 위한 현대적인 정적 사이트 생성기입니다.

## 왜 Astro인가?

Astro를 선택한 이유는 다음과 같습니다.

- **빠른 성능**: 기본적으로 JavaScript를 최소화하여 빠른 페이지 로드를 제공합니다.
- **유연한 통합**: React, Vue, Svelte 등 다양한 UI 프레임워크를 함께 사용할 수 있습니다.
- **콘텐츠 컬렉션**: 타입 안전한 마크다운 관리가 가능합니다.

## 간단한 코드 예시

다음은 Astro 컴포넌트의 기본 구조입니다.

```astro
---
const greeting = "안녕하세요!";
---

<h1>{greeting}</h1>
```

TypeScript로 작성된 유틸리티 함수 예시입니다.

```typescript
function formatDate(date: Date): string {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
```

## 앞으로의 계획

앞으로 이 블로그에서는 개발, 독서, 그리고 일상에 대한 글을 작성할 예정입니다.

> 좋은 글은 좋은 생각에서 나옵니다. 꾸준히 읽고, 꾸준히 씁니다.

---

읽어주셔서 감사합니다.
