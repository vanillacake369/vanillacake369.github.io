import { describe, expect, it } from 'vitest';
import {
  createPost,
  excerptFromBody,
  extractTags,
  filterPublished,
  slugify,
  sortPostsByDate,
} from '../../modules/post/model';
import { makePost } from '../helpers/make-post';

describe('modules/post/model', () => {
  it('creates a slug from a mixed Korean and English title', () => {
    expect(slugify('NixOS 는 어떤 원리로 커널패키지를 관리할까'))
      .toBe('nixos-는-어떤-원리로-커널패키지를-관리할까');
  });

  it('maps a content entry with date-prefixed id to a Post model', () => {
    const post = createPost({
      id: '2026-05-08-NixOS 는 어떤 원리로 커널패키지를 관리할까',
      data: {
        tags: ['nix'],
      },
    });

    expect(post.slug).toBe('nixos-는-어떤-원리로-커널패키지를-관리할까');
    expect(post.title).toBe('NixOS 는 어떤 원리로 커널패키지를 관리할까');
    expect(post.date.getFullYear()).toBe(2026);
    expect(post.date.getMonth()).toBe(4); // 0-indexed May
    expect(post.date.getDate()).toBe(8);
    expect(post.lang).toBe('ko');
    expect(post.draft).toBe(false);
  });

  it('filters out drafts while preserving published posts', () => {
    const posts = [
      makePost({ slug: 'published', draft: false }),
      makePost({ slug: 'draft', draft: true }),
    ];

    expect(filterPublished(posts).map((post) => post.slug)).toEqual(['published']);
  });

  it('extracts and counts tags from posts', () => {
    const tags = extractTags([
      makePost({ tags: ['go', 'k8s'] }),
      makePost({ tags: ['go', 'nix'] }),
      makePost({ tags: ['k8s'] }),
    ]);

    expect(tags[0]).toEqual({ name: 'go', count: 2, slug: 'go' });
    expect(tags[1]).toEqual({ name: 'k8s', count: 2, slug: 'k8s' });
    expect(tags[2]).toEqual({ name: 'nix', count: 1, slug: 'nix' });
  });

  it('builds a plain-text excerpt from markdown body', () => {
    const excerpt = excerptFromBody('## Heading\n\nCheck [this link](https://example.com) out');
    expect(excerpt).toBe('Heading Check this link out');
  });

  describe('sortPostsByDate', () => {
    it('sorts by date descending', () => {
      const posts = [
        makePost({ slug: 'old', date: new Date('2026-01-01') }),
        makePost({ slug: 'new', date: new Date('2026-05-23') }),
        makePost({ slug: 'mid', date: new Date('2026-03-15') }),
      ];
      const sorted = sortPostsByDate(posts);
      expect(sorted.map(p => p.slug)).toEqual(['new', 'mid', 'old']);
    });

    it('sorts same-date series posts by series order', () => {
      const posts = [
        makePost({ slug: 'valkey-03', date: new Date('2026-05-23'), title: 'Valkey 03', series: { id: 'OSSCA Valkey', order: 3 } }),
        makePost({ slug: 'valkey-01', date: new Date('2026-05-23'), title: 'Valkey 01', series: { id: 'OSSCA Valkey', order: 1 } }),
        makePost({ slug: 'valkey-02', date: new Date('2026-05-23'), title: 'Valkey 02', series: { id: 'OSSCA Valkey', order: 2 } }),
      ];
      const sorted = sortPostsByDate(posts);
      expect(sorted.map(p => p.slug)).toEqual(['valkey-01', 'valkey-02', 'valkey-03']);
    });

    it('sorts same-date non-series posts by title', () => {
      const posts = [
        makePost({ slug: 'b-post', date: new Date('2026-05-23'), title: 'Banana' }),
        makePost({ slug: 'a-post', date: new Date('2026-05-23'), title: 'Apple' }),
      ];
      const sorted = sortPostsByDate(posts);
      expect(sorted.map(p => p.slug)).toEqual(['a-post', 'b-post']);
    });

    it('groups series posts together among same-date posts', () => {
      const posts = [
        makePost({ slug: 'standalone', date: new Date('2026-05-23'), title: 'Zzz standalone' }),
        makePost({ slug: 'valkey-02', date: new Date('2026-05-23'), title: 'Valkey 02', series: { id: 'OSSCA Valkey', order: 2 } }),
        makePost({ slug: 'algo', date: new Date('2026-05-23'), title: 'Algorithm' }),
        makePost({ slug: 'valkey-01', date: new Date('2026-05-23'), title: 'Valkey 01', series: { id: 'OSSCA Valkey', order: 1 } }),
      ];
      const sorted = sortPostsByDate(posts);
      // Series posts grouped by series id, then by order; non-series by title
      // 비시리즈(제목순) → 시리즈(시리즈 ID순 → order순)
      expect(sorted.map(p => p.slug)).toEqual(['algo', 'standalone', 'valkey-01', 'valkey-02']);
    });
  });
});
