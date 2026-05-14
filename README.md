# Tony's Blog

A technical blog built with Astro, featuring Vim-style keyboard navigation, full-text search, dark/light theming, and rich Markdown support.

**Live site:** https://vanillacake369.github.io

---

## Features

- **Vim keyboard layer** — navigate and search without touching the mouse
- **Pagefind full-text search** — fast, offline-capable search indexed at build time
- **Fuzzy finder** — VS Code-style `Ctrl+K` file/post finder
- **Dark/light theme** — persisted via `localStorage`, togglable by keyboard
- **Rich Markdown** — GFM, footnotes, math (KaTeX), Mermaid diagrams, code copy buttons
- **Table of contents** — auto-generated for every post
- **Related posts** — tag-based recommendations
- **Comments** — utterances (GitHub Issues-backed)
- **i18n** — Korean / English per post
- **RSS feed + sitemap** — auto-generated at build time
- **SEO** — structured Open Graph + canonical meta tags

---

## Tech Stack

| Layer      | Technology                                 |
| ---------- | ------------------------------------------ |
| Framework  | [Astro](https://astro.build) v6.3.1        |
| Language   | TypeScript (strict)                        |
| Testing    | Vitest v4 + happy-dom                      |
| Search     | Pagefind v1.5                              |
| Math       | remark-math + rehype-katex                 |
| Markdown   | remark-gfm, remark-footnotes, @astrojs/mdx |
| Fonts      | Pretendard, JetBrains Mono                 |
| Comments   | utterances                                 |
| Deployment | Cloudflare Pages / GitHub Pages            |
| Node       | >= 22.12.0                                 |

---

## Architecture

The source tree follows a clean, layered architecture:

```
src/
├── domain/          # Pure domain models (Post, Theme, Calendar, types)
├── components/      # Astro UI components
├── layouts/         # Page layout wrappers
├── pages/           # File-based routes (Astro pages)
├── content/         # Content Collections
│   ├── posts/       # Blog posts (.md / .mdx)
│   └── pages/       # Static pages (.md / .mdx)
├── vim/             # Vim keyboard layer (TypeScript modules)
│   ├── keyboard-controller.ts
│   ├── vim-search.ts
│   ├── fuzzy-finder.ts
│   ├── which-key.ts
│   └── types.ts
├── styles/
│   ├── global.css
│   ├── vim-ui.css
│   └── themes/      # dark.css, light.css
├── i18n/            # Translation strings
├── config.ts        # Site-wide configuration (SSOT)
└── content.config.ts # Zod collection schemas
```

Data flows strictly downward: `domain` has no imports from other layers; `components` and `pages` sit at the top and compose everything.

---

## Quick Start

```bash
git clone https://github.com/vanillacake369/tonys-blog
cd tonys-blog
npm install

npm run dev       # Start dev server at http://localhost:4321
npm run build     # Production build (Astro + Pagefind index)
npm run preview   # Preview the production build locally
npm test          # Run unit tests
```

---

## Writing Posts

### Create a post

Add a `.md` or `.mdx` file under `src/content/posts/`:

```
src/content/posts/my-new-post.md
```

### Required frontmatter

```yaml
---
title: "My Post Title"
description: "A short description shown in listings and SEO meta."
date: 2026-05-13
tags: [astro, typescript]
category: engineering
lang: ko # 'ko' or 'en'
draft: false # true hides the post from production
---
```

Full frontmatter schema (defined in `src/content.config.ts`):

| Field         | Type             | Required | Default           |
| ------------- | ---------------- | -------- | ----------------- |
| `title`       | string           | yes      | —                 |
| `description` | string           | yes      | —                 |
| `date`        | date             | yes      | —                 |
| `updatedDate` | date             | no       | —                 |
| `tags`        | string[]         | no       | `[]`              |
| `category`    | string           | no       | `"uncategorized"` |
| `lang`        | `"ko"` \| `"en"` | no       | `"ko"`            |
| `draft`       | boolean          | no       | `false`           |
| `heroImage`   | string (path)    | no       | —                 |

### Obsidian workflow

Symlink your Obsidian vault's posts folder into `src/content/posts/`, or copy files manually. After copying, run the markdown linter to fix image paths:

```bash
npm run lint:md:fix
```

---

## Keyboard Shortcuts

Vim-style shortcuts are active on every page. Shortcuts are disabled when an input element is focused.

### Global

| Key      | Action                                   |
| -------- | ---------------------------------------- |
| `/`      | In-page search (Pagefind)                |
| `Ctrl+K` | Open fuzzy finder (files / posts)        |
| `Ctrl+/` | Show / hide keyboard shortcut cheatsheet |
| `G`      | Jump to bottom of page                   |

### `g` prefix (press `g`, then the second key within 2 s)

| Sequence | Action              |
| -------- | ------------------- |
| `g g`    | Jump to top of page |
| `g h`    | Go to Home          |
| `g t`    | Go to Tags          |
| `g a`    | Go to About         |

### Heading navigation

| Key | Action                   |
| --- | ------------------------ |
| `}` | Jump to next heading     |
| `{` | Jump to previous heading |

### `Ctrl+K` leader sequences

| Sequence          | Action                    |
| ----------------- | ------------------------- |
| `Ctrl+K` then `f` | Find files (fuzzy finder) |
| `Ctrl+K` then `g` | Grep content              |
| `Ctrl+K` then `t` | Toggle dark/light theme   |

On the first visit, an onboarding cheatsheet is displayed automatically for 5 seconds.

---

## Configuration

### Site identity — `src/config.ts`

This is the single source of truth for all site-wide metadata. Edit this file to change the site title, author, or social links:

```ts
export const SITE_CONFIG = {
  title: "Tony's Blog",
  description: "A blog about software engineering, systems, and ideas.",
  author: "vanillacake369",
  email: "lonelynight1026@gmail.com",
  github: "https://github.com/vanillacake369",
  linkedin: "https://www.linkedin.com/in/vanillacake369/",
  site: "https://vanillacake369.github.io",
} as const;
```

### Build config — `astro.config.mjs`

Astro integrations, Markdown plugins (math, GFM, footnotes), and output settings live here.

### Theming — `src/styles/themes/`

CSS custom-property themes. `dark.css` and `light.css` are swapped by setting `data-theme` on `<html>`. The active theme is stored in `localStorage`.

### Comments — `src/components/Comments.astro`

utterances is pre-configured. To point it at your own repository, update the `repo` attribute inside that component.

---

## Available Scripts

| Script                    | Description                                      |
| ------------------------- | ------------------------------------------------ |
| `npm run dev`             | Start Astro dev server at `localhost:4321`       |
| `npm run build`           | Build for production and generate Pagefind index |
| `npm run preview`         | Serve the `dist/` folder locally                 |
| `npm test`                | Run unit tests (Vitest, single run)              |
| `npm run test:watch`      | Run tests in watch mode                          |
| `npm run test:coverage`   | Run tests with coverage report                   |
| `npm run lint:md`         | Check Markdown files for issues                  |
| `npm run lint:md:fix`     | Auto-fix Markdown issues (e.g. image paths)      |
| `npm run optimize-images` | Compress and resize images in `assets/`          |

---

## Deployment

### Cloudflare Pages

A GitHub Actions workflow at `.github/workflows/deploy.yml` builds and deploys to Cloudflare Pages on every push to `main`.

### GitHub Pages

A second workflow at `.github/workflows/deploy-gh-pages.yml` deploys to GitHub Pages.

### Manual

```bash
npm run build
# Upload the ./dist directory to any static host.
```

---

## Blog Importer (Notion + Velog)

A Go TUI tool to migrate posts from Notion and Velog into this blog.

```bash
cd tools/blog-importer
go run .
```

### Setup

Create a `.env` file at the project root with your credentials:

```env
notion_access_token = ntn_your_token_here
velog_cookie = access_token=your_jwt_here
```

- **Notion**: The target database must be shared with your integration (Connections → Add)
- **Velog**: Public API works without auth; cookie enables private post access

### Features

- TUI with multi-select (space to toggle, `a` for all, enter to import)
- Notion → Markdown conversion (headings, code, tables, images, toggles, **sub-pages**)
- Images auto-downloaded to `public/images/notion/` (self-hosted, no external dependencies)
- Velog posts imported as-is (already Markdown)
- Astro-compatible frontmatter auto-generated

### Output

Imported posts are saved to `src/content/posts/` with proper frontmatter. Images land in `public/images/notion/`.

---

## License

MIT
