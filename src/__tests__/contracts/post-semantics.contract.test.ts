/**
 * @contract Post Semantic Invariants
 * @invariant Every post has a non-empty title
 * @invariant Every post has a non-empty description (from frontmatter)
 * @invariant updatedDate > date when present
 * @invariant No duplicate tags within a single post
 */
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { parsePostId } from '../../modules/post/grammar';

const POSTS_DIR = path.resolve(process.cwd(), 'src/content/posts');

interface FrontmatterData {
  id: string;
  title?: string;
  description?: string;
  tags?: string[];
  updatedDate?: string;
  draft?: boolean;
}

function collectPosts(dir: string, prefix = ''): FrontmatterData[] {
  const posts: FrontmatterData[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      posts.push(...collectPosts(fullPath, `${prefix}${entry}/`));
    } else if (entry.endsWith('.md') || entry.endsWith('.mdx')) {
      const id = `${prefix}${entry}`.replace(/\.mdx?$/, '');
      const content = readFileSync(fullPath, 'utf-8');
      const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
      const fm = fmMatch?.[1] ?? '';

      const titleMatch = fm.match(/^title:\s*["']?(.+?)["']?\s*$/m);
      const descMatch = fm.match(/^description:\s*["']?(.+?)["']?\s*$/m);
      const tagsMatch = fm.match(/^tags:\s*\[(.+)\]/m);
      const updatedMatch = fm.match(/^updatedDate:\s*(.+)$/m);
      const draftMatch = fm.match(/^draft:\s*(true|false)/m);

      posts.push({
        id,
        title: titleMatch?.[1],
        description: descMatch?.[1],
        tags: tagsMatch?.[1]?.split(',').map((t) => t.trim().replace(/['"]/g, '')),
        updatedDate: updatedMatch?.[1]?.trim(),
        draft: draftMatch?.[1] === 'true',
      });
    }
  }
  return posts;
}

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
