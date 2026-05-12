---
title: "Hello, Astro Blog"
description: "The first post of this blog. Introducing a blog built with Astro."
date: 2026-05-02
tags: [blog, astro]
category: dev
lang: en
draft: false
---

## Introduction

This blog is built with [Astro](https://astro.build), a modern static site generator designed for content-focused websites. It prioritizes performance and developer experience above all else.

## Why Astro?

Here are the reasons I chose Astro for this blog.

- **Zero JavaScript by default**: Astro ships no JavaScript to the client unless you explicitly opt in.
- **Component Islands**: Hydrate only interactive components, keeping the rest static.
- **Content Collections**: Type-safe markdown and MDX management out of the box.

## A Quick Code Example

Here is the basic structure of an Astro component.

```astro
---
interface Props {
  title: string;
}
const { title } = Astro.props;
---

<article>
  <h1>{title}</h1>
  <slot />
</article>
```

And a TypeScript utility to format dates.

```typescript
function formatDate(date: Date, lang: 'ko' | 'en' = 'en'): string {
  return date.toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
```

## What to Expect

This blog will cover topics across software engineering, system design, and personal reflections. Posts may be written in either Korean or English depending on the subject and intended audience.

> A blog is a thinking tool as much as a publishing platform. Writing forces clarity.

---

Thanks for reading.
