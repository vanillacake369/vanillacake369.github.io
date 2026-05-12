import { describe, it, expect } from 'vitest';
import {
  sortPostsByDate,
  filterPublished,
  filterByLang,
  filterByTag,
  filterByCategory,
  extractTags,
  groupByCalendarDay,
  slugifyTag,
} from '../../domain/post';
import type { Post } from '../../domain/types';

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    slug: 'test-post',
    title: 'Test Post',
    description: 'desc',
    date: new Date('2025-01-15'),
    tags: ['go', 'k8s'],
    category: 'dev',
    lang: 'ko',
    draft: false,
    ...overrides,
  };
}

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

describe('filterByCategory', () => {
  it('filters by category', () => {
    const posts = [
      makePost({ slug: 'a', category: 'dev' }),
      makePost({ slug: 'b', category: 'books' }),
    ];
    expect(filterByCategory(posts, 'books').map((p) => p.slug)).toEqual(['b']);
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
