/**
 * @contract Collection Integrity
 * @invariant No two posts produce the same slug (routing collision)
 * @invariant Every tag in TAGS enum is used by at least one post (no dead tags)
 * @invariant Every tag used by a post exists in the TAGS enum
 */
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { slugify } from '../../modules/post/model';
import { TAGS } from '../../modules/taxonomy/model';

const POSTS_DIR = path.resolve(process.cwd(), 'src/content/posts');

interface PostMeta {
  id: string;
  slug: string;
  tags: string[];
  draft: boolean;
}

function collectPostMeta(dir: string, prefix = ''): PostMeta[] {
  const posts: PostMeta[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      posts.push(...collectPostMeta(fullPath, `${prefix}${entry}/`));
    } else if (entry.endsWith('.md') || entry.endsWith('.mdx')) {
      const id = `${prefix}${entry}`.replace(/\.mdx?$/, '');
      const content = readFileSync(fullPath, 'utf-8');
      const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
      const fm = fmMatch?.[1] ?? '';

      // Inline: tags: [foo, bar]
      const inlineMatch = fm.match(/^tags:\s*\[(.+)\]/m);
      // YAML list: tags:\n    - foo\n    - bar
      const listMatches = [...fm.matchAll(/^[ \t]+-\s*["']?([^\n"']+?)["']?\s*$/gm)];
      const tags = inlineMatch
        ? inlineMatch[1].split(',').map((t) => t.trim().replace(/['"]/g, ''))
        : listMatches.map((m) => m[1].trim());
      const draftMatch = fm.match(/^draft:\s*(true|false)/m);

      posts.push({
        id,
        slug: slugify(id),
        tags,
        draft: draftMatch?.[1] === 'true',
      });
    }
  }
  return posts;
}

describe('collection integrity contract', () => {
  const allPosts = collectPostMeta(POSTS_DIR);
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
