import { readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { slugify } from '../../modules/post/model';

export const POSTS_DIR = path.resolve(process.cwd(), 'src/content/posts');

export interface RawPostMeta {
  id: string;
  slug: string;
  title?: string;
  description?: string;
  tags: string[];
  updatedDate?: string;
  draft: boolean;
}

function parseTags(fm: string): string[] {
  const inlineMatch = fm.match(/^tags:\s*\[(.+)\]/m);
  if (inlineMatch) {
    return inlineMatch[1].split(',').map(t => t.trim().replace(/['"]/g, ''));
  }
  const listMatches = [...fm.matchAll(/^[ \t]+-\s*["']?([^\n"']+?)["']?\s*$/gm)];
  return listMatches.map(m => m[1].trim());
}

export function collectPosts(dir: string = POSTS_DIR, prefix = ''): RawPostMeta[] {
  const posts: RawPostMeta[] = [];
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
      const updatedMatch = fm.match(/^updatedDate:\s*(.+)$/m);
      const draftMatch = fm.match(/^draft:\s*(true|false)/m);

      posts.push({
        id,
        slug: slugify(id),
        title: titleMatch?.[1],
        description: descMatch?.[1],
        tags: parseTags(fm),
        updatedDate: updatedMatch?.[1]?.trim(),
        draft: draftMatch?.[1] === 'true',
      });
    }
  }
  return posts;
}
