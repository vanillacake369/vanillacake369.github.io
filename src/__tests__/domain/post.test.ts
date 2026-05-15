import { describe, it, expect } from 'vitest';
import {
  titleFromId,
  slugify,
  entryToPost,
  excerptFromBody,
  sortPostsByDate,
  filterPublished,
  filterByLang,
  filterByTag,
  extractTags,
  groupByCalendarDay,
  slugifyTag,
} from '../../modules/post/model';
import type { Post } from '../../modules/post/model';

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    slug: 'test-post',
    title: 'Test Post',
    description: 'desc',
    date: new Date('2025-01-15'),
    tags: ['go', 'k8s'],
    lang: 'ko',
    draft: false,
    ...overrides,
  };
}

// ── titleFromId ──────────────────────────────────────────────────────────────

describe('titleFromId', () => {
  it('returns filename as-is (preserving spaces and case)', () => {
    expect(titleFromId('NixOS 는 어떤 원리로 커널패키지를 관리할까'))
      .toBe('NixOS 는 어떤 원리로 커널패키지를 관리할까');
  });

  it('strips .md extension', () => {
    expect(titleFromId('Hello World.md')).toBe('Hello World');
  });

  it('strips .mdx extension', () => {
    expect(titleFromId('Hello World.mdx')).toBe('Hello World');
  });

  it('trims whitespace', () => {
    expect(titleFromId('  spaced  ')).toBe('spaced');
  });
});

// ── slugify ──────────────────────────────────────────────────────────────────

describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('handles Korean with spaces', () => {
    expect(slugify('NixOS 는 어떤 원리로 커널패키지를 관리할까'))
      .toBe('nixos-는-어떤-원리로-커널패키지를-관리할까');
  });

  it('preserves parentheses and dots', () => {
    expect(slugify('NixOS k8s 클러스터 구축기 (feat.kubelet 설정 장애 해결)'))
      .toBe('nixos-k8s-클러스터-구축기-(feat.kubelet-설정-장애-해결)');
  });

  it('strips .md extension', () => {
    expect(slugify('test-post.md')).toBe('test-post');
  });

  it('collapses multiple hyphens', () => {
    expect(slugify('a   b---c')).toBe('a-b-c');
  });

  it('removes leading/trailing hyphens', () => {
    expect(slugify(' -hello- ')).toBe('hello');
  });

  it('removes special characters except allowed ones', () => {
    expect(slugify('C++ & Rust!')).toBe('c-rust');
  });
});

// ── entryToPost ──────────────────────────────────────────────────────────────

describe('entryToPost', () => {
  const baseEntry = {
    id: 'NixOS 는 어떤 원리로 커널패키지를 관리할까',
    data: {
      date: new Date('2026-05-08'),
      tags: ['nix'] as string[],
    },
  };

  it('derives slug via slugify', () => {
    const post = entryToPost(baseEntry);
    expect(post.slug).toBe('nixos-는-어떤-원리로-커널패키지를-관리할까');
  });

  it('derives title from filename when no frontmatter title', () => {
    const post = entryToPost(baseEntry);
    expect(post.title).toBe('NixOS 는 어떤 원리로 커널패키지를 관리할까');
  });

  it('uses frontmatter title when provided', () => {
    const post = entryToPost({
      ...baseEntry,
      data: { ...baseEntry.data, title: 'Custom Title' },
    });
    expect(post.title).toBe('Custom Title');
  });

  it('defaults description to empty string', () => {
    const post = entryToPost(baseEntry);
    expect(post.description).toBe('');
  });

  it('defaults lang to ko', () => {
    const post = entryToPost(baseEntry);
    expect(post.lang).toBe('ko');
  });

  it('defaults draft to false', () => {
    const post = entryToPost(baseEntry);
    expect(post.draft).toBe(false);
  });
});

// ── excerptFromBody ──────────────────────────────────────────────────────────

describe('excerptFromBody', () => {
  it('strips frontmatter', () => {
    const body = '---\ntitle: Test\n---\nHello world';
    expect(excerptFromBody(body)).toBe('Hello world');
  });

  it('strips code blocks', () => {
    const body = 'Before\n```js\nconsole.log("hi")\n```\nAfter';
    expect(excerptFromBody(body)).toBe('Before After');
  });

  it('strips images', () => {
    const body = 'Text ![alt](image.png) more';
    expect(excerptFromBody(body)).toBe('Text  more');
  });

  it('converts links to text', () => {
    const body = 'Check [this link](https://example.com) out';
    expect(excerptFromBody(body)).toBe('Check this link out');
  });

  it('strips markdown syntax characters', () => {
    const body = '## Heading\n**bold** and _italic_';
    expect(excerptFromBody(body)).toBe('Heading bold and italic');
  });

  it('collapses newlines to spaces', () => {
    const body = 'Line 1\n\nLine 2\nLine 3';
    expect(excerptFromBody(body)).toBe('Line 1 Line 2 Line 3');
  });

  it('respects maxLength', () => {
    const body = 'a'.repeat(500);
    expect(excerptFromBody(body, 100)).toHaveLength(100);
  });

  it('returns empty for empty input', () => {
    expect(excerptFromBody('')).toBe('');
  });
});

// ── sortPostsByDate ──────────────────────────────────────────────────────────

describe('sortPostsByDate', () => {
  it('sorts posts newest first', () => {
    const posts = [
      makePost({ slug: 'old', date: new Date('2024-01-01') }),
      makePost({ slug: 'new', date: new Date('2025-06-01') }),
      makePost({ slug: 'mid', date: new Date('2025-01-01') }),
    ];
    const sorted = sortPostsByDate(posts);
    expect(sorted.map((p) => p.slug)).toEqual(['new', 'mid', 'old']);
  });

  it('does not mutate original array', () => {
    const posts = [
      makePost({ slug: 'a', date: new Date('2025-01-01') }),
      makePost({ slug: 'b', date: new Date('2024-01-01') }),
    ];
    sortPostsByDate(posts);
    expect(posts[0].slug).toBe('a');
  });
});

describe('filterPublished', () => {
  it('excludes drafts', () => {
    const posts = [
      makePost({ slug: 'published', draft: false }),
      makePost({ slug: 'draft', draft: true }),
    ];
    expect(filterPublished(posts).map((p) => p.slug)).toEqual(['published']);
  });
});

describe('filterByLang', () => {
  it('filters by language', () => {
    const posts = [
      makePost({ slug: 'ko', lang: 'ko' }),
      makePost({ slug: 'en', lang: 'en' }),
    ];
    expect(filterByLang(posts, 'en').map((p) => p.slug)).toEqual(['en']);
  });
});

describe('filterByTag', () => {
  it('filters posts containing the tag', () => {
    const posts = [
      makePost({ slug: 'a', tags: ['go', 'k8s'] }),
      makePost({ slug: 'b', tags: ['nix', 'ai'] }),
    ];
    expect(filterByTag(posts, 'k8s').map((p) => p.slug)).toEqual(['a']);
  });
});

describe('extractTags', () => {
  it('counts tags and sorts by frequency', () => {
    const posts = [
      makePost({ tags: ['go', 'k8s'] }),
      makePost({ tags: ['go', 'nix'] }),
      makePost({ tags: ['k8s'] }),
    ];
    const tags = extractTags(posts);
    expect(tags[0]).toEqual({ name: 'go', count: 2, slug: 'go' });
    expect(tags[1]).toEqual({ name: 'k8s', count: 2, slug: 'k8s' });
    expect(tags[2]).toEqual({ name: 'nix', count: 1, slug: 'nix' });
  });
});

describe('groupByCalendarDay', () => {
  it('groups posts by date string', () => {
    const posts = [
      makePost({ slug: 'a', title: 'A', date: new Date('2025-03-15') }),
      makePost({ slug: 'b', title: 'B', date: new Date('2025-03-15') }),
      makePost({ slug: 'c', title: 'C', date: new Date('2025-03-16') }),
    ];
    const days = groupByCalendarDay(posts);
    expect(days).toHaveLength(2);
    expect(days[0].date).toBe('2025-03-15');
    expect(days[0].count).toBe(2);
    expect(days[1].date).toBe('2025-03-16');
    expect(days[1].count).toBe(1);
  });
});

describe('slugifyTag', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugifyTag('Distributed System')).toBe('distributed-system');
  });

  it('handles Korean tags', () => {
    expect(slugifyTag('투자 일지')).toBe('투자-일지');
  });

  it('removes special characters', () => {
    expect(slugifyTag('C++ & Rust!')).toBe('c-rust');
  });
});
