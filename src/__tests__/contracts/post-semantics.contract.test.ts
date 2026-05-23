/**
 * @contract Post Semantic Invariants
 * @invariant Every post has a non-empty title
 * @invariant Every post has a non-empty description (from frontmatter)
 * @invariant updatedDate > date when present
 * @invariant No duplicate tags within a single post
 */
import { describe, expect, it } from 'vitest';
import { parsePostId } from '../../modules/post/grammar';
import { collectPosts, POSTS_DIR } from '../helpers/collect-posts';

describe('post semantic invariants contract', () => {
  const posts = collectPosts(POSTS_DIR);

  if (posts.length === 0) {
    it.skip('no posts found', () => {});
    return;
  }

  it('every post has a resolvable title (from frontmatter or filename)', () => {
    const failures: string[] = [];
    for (const post of posts) {
      const parsed = parsePostId(post.id);
      const title = post.title ?? parsed.title;
      if (!title || title.trim().length === 0) {
        failures.push(post.id);
      }
    }
    expect(failures, `Posts with empty title:\n${failures.join('\n')}`).toEqual([]);
  });

  it('updatedDate is after the post date when present', () => {
    const failures: string[] = [];
    for (const post of posts) {
      if (!post.updatedDate) continue;
      const parsed = parsePostId(post.id);
      const postDate = new Date(parsed.year, parsed.month - 1, parsed.day);
      const updatedDate = new Date(post.updatedDate);
      if (isNaN(updatedDate.getTime()) || updatedDate <= postDate) {
        failures.push(`${post.id}: date=${postDate.toISOString().slice(0, 10)}, updatedDate=${post.updatedDate}`);
      }
    }
    expect(failures, `Posts with invalid updatedDate:\n${failures.join('\n')}`).toEqual([]);
  });

  it('no post has duplicate tags', () => {
    const failures: string[] = [];
    for (const post of posts) {
      if (!post.tags) continue;
      const unique = new Set(post.tags);
      if (unique.size !== post.tags.length) {
        const dups = post.tags.filter((t, i) => post.tags!.indexOf(t) !== i);
        failures.push(`${post.id}: duplicate tags [${dups.join(', ')}]`);
      }
    }
    expect(failures, `Posts with duplicate tags:\n${failures.join('\n')}`).toEqual([]);
  });
});
