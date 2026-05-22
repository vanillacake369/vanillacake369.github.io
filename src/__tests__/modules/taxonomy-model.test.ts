import { describe, expect, it } from 'vitest';
import {
  SERIES,
  TAGS,
  countToLevel,
  extractSeries,
  generateCalendarGrid,
  slugifySeries,
} from '../../modules/taxonomy/model';
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

describe('modules/taxonomy/model', () => {
  it('slugifies a series name', () => {
    expect(slugifySeries('NixOS Ecosystem')).toBe('nixos-ecosystem');
  });

  it('extracts ordered series info from posts', () => {
    const result = extractSeries([
      makePost({
        slug: 'part-2',
        title: 'Part 2',
        date: new Date('2025-03-02'),
        tags: ['nix', 'infra'],
        series: { id: 'NixOS Ecosystem', order: 2 },
      }),
      makePost({
        slug: 'part-1',
        title: 'Part 1',
        date: new Date('2025-03-01'),
        tags: ['nix'],
        series: { id: 'NixOS Ecosystem', order: 1 },
      }),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('nixos-ecosystem');
    expect(result[0].posts.map((post) => post.slug)).toEqual(['part-1', 'part-2']);
  });

  it('maps post counts to contribution levels', () => {
    expect(countToLevel(0)).toBe(0);
    expect(countToLevel(1)).toBe(1);
    expect(countToLevel(2)).toBe(2);
    expect(countToLevel(4)).toBe(3);
    expect(countToLevel(5)).toBe(4);
  });

  it('creates a non-empty calendar grid from posts', () => {
    const weeks = generateCalendarGrid(
      [makePost({ slug: 'a', title: 'A', date: new Date('2025-03-15') })],
      1,
      new Date('2025-03-31'),
    );

    expect(weeks.length).toBeGreaterThan(0);
    expect(weeks.some((week) => week.cells.some((cell) => cell?.count === 1))).toBe(true);
  });

  it('keeps the tag catalog centralized', () => {
    expect(TAGS).toContain('nix');
    expect(TAGS).toContain('kubernetes');
  });

  it('keeps the series catalog centralized', () => {
    expect(SERIES).toContain('NixOS Ecosystem');
    expect(SERIES).toContain('Effective Java');
  });
});
