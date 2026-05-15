import { describe, expect, it } from 'vitest';
import {
  entryToPost,
  excerptFromBody,
  extractTags,
  filterPublished,
  slugify,
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

describe('modules/post/model', () => {
  it('creates a slug from a mixed Korean and English title', () => {
    expect(slugify('NixOS 는 어떤 원리로 커널패키지를 관리할까'))
      .toBe('nixos-는-어떤-원리로-커널패키지를-관리할까');
  });

  it('maps a content entry to a Post model', () => {
    const post = entryToPost({
      id: 'NixOS 는 어떤 원리로 커널패키지를 관리할까',
      data: {
        date: new Date('2026-05-08'),
        tags: ['nix'],
      },
    });

    expect(post.slug).toBe('nixos-는-어떤-원리로-커널패키지를-관리할까');
    expect(post.title).toBe('NixOS 는 어떤 원리로 커널패키지를 관리할까');
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
});
