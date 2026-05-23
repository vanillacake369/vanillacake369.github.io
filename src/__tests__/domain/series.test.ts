import { describe, expect, it } from 'vitest';
import { extractSeries, slugifySeries } from '../../modules/taxonomy/model';
import { createPost } from '../../modules/post/model';
import { makePost } from '../helpers/make-post';

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
      makePost({ slug: 'part-2', title: 'Part 2', date: new Date('2025-01-02'), tags: ['go'], series: { id: 'Astro Deep Dive', order: 2 } }),
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

describe('createPost with directory-format id', () => {
  it('derives series from entry id and produces slug without directory prefix', () => {
    const post = createPost({
      id: 'NixOS Ecosystem/02-2025-03-20-Nix Home Manager 튜토리얼',
      data: { tags: ['nix'] },
    });

    expect(post.series).toEqual({ id: 'NixOS Ecosystem', order: 2 });
    expect(post.slug).toBe('nix-home-manager-튜토리얼');
    expect(post.date.getFullYear()).toBe(2025);
    expect(post.date.getMonth()).toBe(2); // 0-indexed March
    expect(post.date.getDate()).toBe(20);
  });

  it('produces the same slug for a series post as the equivalent flat post would', () => {
    const seriesPost = createPost({
      id: 'Effective Java/01-2024-02-18-Generic Method',
      data: {},
    });
    const flatPost = createPost({
      id: '2024-02-18-Generic Method',
      data: {},
    });

    expect(seriesPost.slug).toBe(flatPost.slug);
  });
});
