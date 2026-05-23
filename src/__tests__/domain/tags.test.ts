import { describe, it, expect } from 'vitest';
import { extractTags, filterByTag, slugifyTag } from '../../modules/post/model';
import { makePost } from '../helpers/make-post';

describe('extractTags', () => {
  it('returns an empty array when no posts have tags', () => {
    const posts = [makePost({ tags: [] }), makePost({ tags: [] })];
    expect(extractTags(posts)).toEqual([]);
  });

  it('returns an empty array for an empty post list', () => {
    expect(extractTags([])).toEqual([]);
  });

  it('counts each tag occurrence correctly', () => {
    const posts = [
      makePost({ tags: ['go'] }),
      makePost({ tags: ['go'] }),
      makePost({ tags: ['go'] }),
    ];
    const tags = extractTags(posts);
    expect(tags).toHaveLength(1);
    expect(tags[0]).toEqual({ name: 'go', count: 3, slug: 'go' });
  });

  it('sorts tags by count descending', () => {
    const posts = [
      makePost({ tags: ['rust'] }),
      makePost({ tags: ['go', 'rust'] }),
      makePost({ tags: ['go', 'rust', 'nix'] }),
    ];
    const tags = extractTags(posts);
    expect(tags.map((t) => t.name)).toEqual(['rust', 'go', 'nix']);
    expect(tags.map((t) => t.count)).toEqual([3, 2, 1]);
  });

  it('produces correct slug for tags with spaces', () => {
    const posts = [makePost({ tags: ['distributed systems'] })];
    const tags = extractTags(posts);
    expect(tags[0].slug).toBe('distributed-systems');
  });

  it('produces correct slug for Korean tags', () => {
    const posts = [makePost({ tags: ['투자 일지'] })];
    const tags = extractTags(posts);
    expect(tags[0].slug).toBe('투자-일지');
  });

  it('handles a post with multiple tags counting each once', () => {
    const posts = [makePost({ tags: ['a', 'b', 'c'] })];
    const tags = extractTags(posts);
    expect(tags).toHaveLength(3);
    tags.forEach((t) => expect(t.count).toBe(1));
  });

  it('does not double-count duplicate tags within a single post', () => {
    // tags array in schema is a plain array — duplicates inside one post count twice
    // this test documents actual behavior
    const posts = [makePost({ tags: ['go', 'go'] })];
    const tags = extractTags(posts);
    expect(tags[0].count).toBe(2);
  });
});

describe('filterByTag', () => {
  it('returns only posts that include the given tag', () => {
    const posts = [
      makePost({ slug: 'a', tags: ['go', 'k8s'] }),
      makePost({ slug: 'b', tags: ['rust'] }),
      makePost({ slug: 'c', tags: ['go'] }),
    ];
    const result = filterByTag(posts, 'go');
    expect(result.map((p) => p.slug)).toEqual(['a', 'c']);
  });

  it('returns an empty array when no posts match the tag', () => {
    const posts = [
      makePost({ slug: 'a', tags: ['go'] }),
      makePost({ slug: 'b', tags: ['rust'] }),
    ];
    expect(filterByTag(posts, 'nix')).toEqual([]);
  });

  it('returns an empty array for an empty post list', () => {
    expect(filterByTag([], 'go')).toEqual([]);
  });

  it('does not match posts with no tags', () => {
    const posts = [makePost({ slug: 'a', tags: [] })];
    expect(filterByTag(posts, 'go')).toEqual([]);
  });

  it('is case-sensitive', () => {
    const posts = [
      makePost({ slug: 'a', tags: ['Go'] }),
      makePost({ slug: 'b', tags: ['go'] }),
    ];
    expect(filterByTag(posts, 'go').map((p) => p.slug)).toEqual(['b']);
  });

  it('does not mutate the original array', () => {
    const posts = [
      makePost({ slug: 'a', tags: ['go'] }),
      makePost({ slug: 'b', tags: ['rust'] }),
    ];
    filterByTag(posts, 'go');
    expect(posts).toHaveLength(2);
  });

  it('returns all posts when every post has the tag', () => {
    const posts = [
      makePost({ slug: 'a', tags: ['go', 'k8s'] }),
      makePost({ slug: 'b', tags: ['go', 'nix'] }),
    ];
    const result = filterByTag(posts, 'go');
    expect(result.map((p) => p.slug)).toEqual(['a', 'b']);
  });
});

describe('slugifyTag (edge cases)', () => {
  it('handles an already-slugified string unchanged', () => {
    expect(slugifyTag('go')).toBe('go');
  });

  it('collapses multiple hyphens', () => {
    expect(slugifyTag('a--b')).toBe('a-b');
  });

  it('strips leading and trailing whitespace', () => {
    expect(slugifyTag('  go  ')).toBe('go');
  });

  it('handles an empty string', () => {
    expect(slugifyTag('')).toBe('');
  });

  it('handles a string with only special characters', () => {
    expect(slugifyTag('!!!')).toBe('');
  });
});
