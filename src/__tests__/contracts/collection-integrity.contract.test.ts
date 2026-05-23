/**
 * @contract Collection Integrity
 * @invariant No two posts produce the same slug (routing collision)
 * @invariant Every tag in TAGS enum is used by at least one post (no dead tags)
 * @invariant Every tag used by a post exists in the TAGS enum
 */
import { describe, expect, it } from 'vitest';
import { TAGS } from '../../modules/taxonomy/model';
import { collectPosts, POSTS_DIR } from '../helpers/collect-posts';

describe('collection integrity contract', () => {
  const allPosts = collectPosts(POSTS_DIR);
  const publishedPosts = allPosts.filter((p) => !p.draft);

  if (allPosts.length === 0) {
    it.skip('no posts found', () => {});
    return;
  }

  it('no two posts produce the same slug', () => {
    const slugMap = new Map<string, string[]>();
    for (const post of allPosts) {
      const existing = slugMap.get(post.slug) ?? [];
      existing.push(post.id);
      slugMap.set(post.slug, existing);
    }

    const collisions = Array.from(slugMap.entries())
      .filter(([, ids]) => ids.length > 1);

    expect(
      collisions,
      `Slug collisions:\n${collisions.map(([slug, ids]) => `  ${slug}: ${ids.join(', ')}`).join('\n')}`,
    ).toEqual([]);
  });

  it('every tag in TAGS enum is used by at least one published post', () => {
    const usedTags = new Set(publishedPosts.flatMap((p) => p.tags));
    const deadTags = TAGS.filter((tag) => !usedTags.has(tag));
    expect(
      deadTags,
      `Dead tags (in TAGS enum but no published post uses them): ${deadTags.join(', ')}`,
    ).toEqual([]);
  });

  it('every tag used by a post exists in the TAGS enum', () => {
    const validTags = new Set<string>(TAGS);
    const unknownUsages: string[] = [];
    for (const post of allPosts) {
      for (const tag of post.tags) {
        if (!validTags.has(tag)) {
          unknownUsages.push(`${post.id}: unknown tag "${tag}"`);
        }
      }
    }
    expect(
      unknownUsages,
      `Posts using tags not in TAGS enum:\n${unknownUsages.join('\n')}`,
    ).toEqual([]);
  });
});
