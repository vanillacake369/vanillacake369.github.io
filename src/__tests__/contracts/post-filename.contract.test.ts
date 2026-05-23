/**
 * @contract Post Filename Grammar
 * @invariant Every post ID matches POST_ID_GRAMMAR.standalone or .series
 * @invariant Date prefix produces a valid Date object
 * @invariant Slug derivation is deterministic and collision-free
 */
import { describe, expect, it } from 'vitest';
import { parsePostId } from '../../modules/post/grammar';
import { slugify } from '../../modules/post/model';
import { collectPosts, POSTS_DIR } from '../helpers/collect-posts';

describe('post filename grammar contract', () => {
  const postIds = collectPosts(POSTS_DIR).map((p) => p.id);

  if (postIds.length === 0) {
    it.skip('no posts found', () => {});
    return;
  }

  it('every post ID is parseable by the grammar', () => {
    const failures: string[] = [];
    for (const id of postIds) {
      try {
        parsePostId(id);
      } catch {
        failures.push(id);
      }
    }
    expect(failures, `Unparseable post IDs:\n${failures.join('\n')}`).toEqual([]);
  });

  it('every parsed date produces a valid Date object', () => {
    for (const id of postIds) {
      const parsed = parsePostId(id);
      const date = new Date(parsed.year, parsed.month - 1, parsed.day);
      expect(isNaN(date.getTime()), `Invalid date for "${id}"`).toBe(false);
      expect(date.getFullYear()).toBe(parsed.year);
      expect(date.getMonth() + 1).toBe(parsed.month);
      expect(date.getDate()).toBe(parsed.day);
    }
  });

  it('no two posts produce the same slug', () => {
    const slugMap = new Map<string, string[]>();
    for (const id of postIds) {
      const slug = slugify(id);
      const existing = slugMap.get(slug) ?? [];
      existing.push(id);
      slugMap.set(slug, existing);
    }

    const collisions = Array.from(slugMap.entries())
      .filter(([, ids]) => ids.length > 1);

    expect(
      collisions,
      `Slug collisions:\n${collisions.map(([slug, ids]) => `  ${slug}: ${ids.join(', ')}`).join('\n')}`,
    ).toEqual([]);
  });
});
