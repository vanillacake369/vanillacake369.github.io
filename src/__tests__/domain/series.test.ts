import { describe, expect, it } from 'vitest';
import { extractSeries, slugifySeries } from '../../domain/series';
import type { Post } from '../../domain/types';

function makePost(overrides: Partial<Post> = {}) {
  return {
    slug: 'test-post',
    title: 'Test Post',
    description: 'desc',
    date: new Date('2025-01-15'),
    tags: ['go'],

    lang: 'ko' as const,
    draft: false,
    ...overrides,
  };
}

describe('slugifySeries', () => {
  it('normalizes English names', () => {
    expect(slugifySeries('Effective Java')).toBe('effective-java');
  });

  it('preserves Korean characters', () => {
    expect(slugifySeries('쿠버네티스 정리')).toBe('쿠버네티스-정리');
  });
});

describe('extractSeries', () => {
  it('groups posts by series id and sorts series posts by order', () => {
    const series = extractSeries([
      makePost({ slug: 'part-2', title: 'Part 2', date: new Date('2025-01-02'), series: { id: 'Astro Deep Dive', order: 2 } }),
      makePost({ slug: 'standalone', title: 'Standalone' }),
      makePost({ slug: 'part-1', title: 'Part 1', date: new Date('2025-01-01'), tags: ['go', 'astro'], series: { id: 'Astro Deep Dive', order: 1 } }),
    ]);

    expect(series).toHaveLength(1);
    expect(series[0].id).toBe('Astro Deep Dive');
    expect(series[0].posts.map((post) => post.slug)).toEqual(['part-1', 'part-2']);
    expect(series[0].totalPosts).toBe(2);
    expect(series[0].tags.map((tag) => tag.name)).toEqual(['go', 'astro']);
  });

  it('sorts series by latest date descending', () => {
    const series = extractSeries([
      makePost({ slug: 'a', date: new Date('2025-01-01'), series: { id: 'Old Series', order: 1 } }),
      makePost({ slug: 'b', date: new Date('2025-05-01'), series: { id: 'New Series', order: 1 } }),
    ]);

    expect(series.map((entry) => entry.id)).toEqual(['New Series', 'Old Series']);
  });
});
