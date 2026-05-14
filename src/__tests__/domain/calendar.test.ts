import { describe, it, expect } from 'vitest';
import { generateCalendarGrid, countToLevel } from '../../domain/calendar';
import type { Post } from '../../domain/types';

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    slug: 'test-post',
    title: 'Test Post',
    description: 'desc',
    date: new Date('2025-01-15'),
    tags: [],

    lang: 'ko',
    draft: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// countToLevel
// ---------------------------------------------------------------------------
describe('countToLevel', () => {
  it('returns 0 for 0 posts', () => {
    expect(countToLevel(0)).toBe(0);
  });

  it('returns 1 for 1 post', () => {
    expect(countToLevel(1)).toBe(1);
  });

  it('returns 2 for 2 posts', () => {
    expect(countToLevel(2)).toBe(2);
  });

  it('returns 3 for 3 posts', () => {
    expect(countToLevel(3)).toBe(3);
  });

  it('returns 3 for 4 posts', () => {
    expect(countToLevel(4)).toBe(3);
  });

  it('returns 4 for 5 posts', () => {
    expect(countToLevel(5)).toBe(4);
  });

  it('returns 4 for counts above 5', () => {
    expect(countToLevel(10)).toBe(4);
    expect(countToLevel(100)).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// generateCalendarGrid — grid structure
// ---------------------------------------------------------------------------
describe('generateCalendarGrid — structure', () => {
  it('returns an array of CalendarWeek objects', () => {
    const grid = generateCalendarGrid([], 1);
    expect(Array.isArray(grid)).toBe(true);
    expect(grid.length).toBeGreaterThan(0);
    for (const week of grid) {
      expect(week).toHaveProperty('cells');
      expect(week.cells).toHaveLength(7);
    }
  });

  it('each non-null cell has date, count, level, and posts', () => {
    const grid = generateCalendarGrid([], 1);
    for (const week of grid) {
      for (const cell of week.cells) {
        if (cell !== null) {
          expect(cell).toHaveProperty('date');
          expect(cell).toHaveProperty('count');
          expect(cell).toHaveProperty('level');
          expect(cell).toHaveProperty('posts');
          expect(typeof cell.date).toBe('string');
          expect(cell.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        }
      }
    }
  });

  it('covers approximately 12 months (≥ 48 weeks) for months=12', () => {
    const grid = generateCalendarGrid([], 12);
    // 12 months is between 48 and 54 weeks depending on where in the year we are
    expect(grid.length).toBeGreaterThanOrEqual(48);
    expect(grid.length).toBeLessThanOrEqual(54);
  });

  it('covers fewer weeks for months=1', () => {
    const grid1 = generateCalendarGrid([], 1);
    const grid12 = generateCalendarGrid([], 12);
    expect(grid1.length).toBeLessThan(grid12.length);
  });

  it('non-null cells have level between 0 and 4 inclusive', () => {
    const grid = generateCalendarGrid([], 3);
    for (const week of grid) {
      for (const cell of week.cells) {
        if (cell !== null) {
          expect(cell.level).toBeGreaterThanOrEqual(0);
          expect(cell.level).toBeLessThanOrEqual(4);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// generateCalendarGrid — post data integration
// ---------------------------------------------------------------------------
describe('generateCalendarGrid — post data', () => {
  it('cells for days with no posts have count 0 and level 0', () => {
    // Use a post date that is guaranteed to be in range (today minus a few days)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const grid = generateCalendarGrid([], 1);
    let foundNonNull = false;
    for (const week of grid) {
      for (const cell of week.cells) {
        if (cell !== null) {
          foundNonNull = true;
          expect(cell.count).toBe(0);
          expect(cell.level).toBe(0);
        }
      }
    }
    expect(foundNonNull).toBe(true);
  });

  it('reflects correct count and level for a day with posts', () => {
    // Build posts for a date that we know will be inside the 12-month window.
    // Use today's date so it is always in range.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateStr = today.toISOString().split('T')[0];

    const posts = [
      makePost({ slug: 'a', date: new Date(dateStr) }),
      makePost({ slug: 'b', date: new Date(dateStr) }),
    ];

    const grid = generateCalendarGrid(posts, 1);
    let found: { count: number; level: number } | undefined;
    for (const week of grid) {
      for (const cell of week.cells) {
        if (cell?.date === dateStr) {
          found = { count: cell.count, level: cell.level };
        }
      }
    }

    expect(found).toBeDefined();
    expect(found?.count).toBe(2);
    expect(found?.level).toBe(2);
  });

  it('populates posts array for a day with posts', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateStr = today.toISOString().split('T')[0];

    const posts = [makePost({ slug: 'hello', title: 'Hello', date: new Date(dateStr) })];
    const grid = generateCalendarGrid(posts, 1);

    let cellPosts: Pick<Post, 'slug' | 'title'>[] = [];
    for (const week of grid) {
      for (const cell of week.cells) {
        if (cell?.date === dateStr) {
          cellPosts = cell.posts;
        }
      }
    }

    expect(cellPosts).toHaveLength(1);
    expect(cellPosts[0]).toEqual({ slug: 'hello', title: 'Hello' });
  });

  it('assigns level 4 for 5 or more posts on the same day', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateStr = today.toISOString().split('T')[0];

    const posts = Array.from({ length: 5 }, (_, i) =>
      makePost({ slug: `post-${i}`, date: new Date(dateStr) }),
    );
    const grid = generateCalendarGrid(posts, 1);

    let level: number | undefined;
    for (const week of grid) {
      for (const cell of week.cells) {
        if (cell?.date === dateStr) level = cell.level;
      }
    }

    expect(level).toBe(4);
  });

  it('dates outside the range are null', () => {
    // A post from 5 years ago should not appear as a non-null cell in a 1-month grid
    const oldDate = new Date();
    oldDate.setFullYear(oldDate.getFullYear() - 5);
    const posts = [makePost({ slug: 'old', date: oldDate })];

    const grid = generateCalendarGrid(posts, 1);
    for (const week of grid) {
      for (const cell of week.cells) {
        if (cell !== null) {
          // All in-range cells should have count 0 (old post not counted)
          expect(cell.count).toBe(0);
        }
      }
    }
  });
});
