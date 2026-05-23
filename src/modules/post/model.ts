import {
  parsePostId,
  parsePostIdSafe,
  InvalidPostIdError,
  InvariantViolation,
} from './grammar';
import type { ParsedPostId } from './grammar';

export { parsePostId, parsePostIdSafe, InvalidPostIdError, InvariantViolation };
export type { ParsedPostId };

export type Lang = 'ko' | 'en';

export interface Post {
  slug: string;
  title: string;
  description: string;
  date: Date;
  updatedDate?: Date;
  tags: string[];
  lang: Lang;
  draft: boolean;
  heroImage?: string;
  series?: { id: string; order: number };
}

export interface TagInfo {
  name: string;
  count: number;
  slug: string;
}

// ── Grammar-based derivation ────────────────────────────────────────────────

export function dateFromId(id: string): Date | undefined {
  const parsed = parsePostIdSafe(id);
  if (!parsed) return undefined;
  return new Date(parsed.year, parsed.month - 1, parsed.day);
}

export function titleFromId(id: string): string {
  const parsed = parsePostIdSafe(id);
  if (!parsed) return id.replace(/\.mdx?$/, '').trim();
  return parsed.title;
}

export function slugify(id: string): string {
  const parsed = parsePostIdSafe(id);
  const raw = parsed ? parsed.title : id.replace(/\.mdx?$/, '');
  return raw
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9가-힣ㄱ-ㅎㅏ-ㅣ\-_.()]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim();
}

// ── Smart Constructor (Level 1) ─────────────────────────────────────────────

interface RawEntry {
  id: string;
  data: {
    title?: string;
    description?: string;
    date?: Date;
    updatedDate?: Date;
    tags?: string[];
    lang?: 'ko' | 'en';
    draft?: boolean;
    heroImage?: string;
  };
}

export function createPost(entry: RawEntry): Post {
  const parsed = parsePostId(entry.id);
  const date = new Date(parsed.year, parsed.month - 1, parsed.day);
  const title = entry.data.title ?? parsed.title;
  const description = entry.data.description ?? '';
  const tags = entry.data.tags ?? [];
  const updatedDate = entry.data.updatedDate;

  if (title.length === 0) {
    throw new InvariantViolation('title', entry.id, 'must not be empty');
  }

  if (updatedDate !== undefined && updatedDate <= date) {
    throw new InvariantViolation('updatedDate', entry.id, 'must be after date');
  }

  return Object.freeze({
    slug: slugify(entry.id),
    title,
    description,
    date,
    updatedDate,
    tags,
    lang: entry.data.lang ?? 'ko',
    draft: entry.data.draft ?? false,
    heroImage: entry.data.heroImage,
    // series.id validated against SERIES enum via contract test (series-convention.test.ts)
    series: parsed.series,
  });
}

// ── Query functions ─────────────────────────────────────────────────────────

export function sortPostsByDate(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function filterPublished(posts: Post[]): Post[] {
  return posts.filter((post) => !post.draft);
}

export function filterByTag(posts: Post[], tag: string): Post[] {
  return posts.filter((post) => post.tags.includes(tag));
}

function slugifyBase(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim();
}

export function slugifyTag(tag: string): string {
  return slugifyBase(tag);
}

export function extractTags(posts: Post[]): TagInfo[] {
  const tagMap = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.tags) {
      tagMap.set(tag, (tagMap.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(tagMap.entries())
    .map(([name, count]) => ({ name, count, slug: slugifyTag(name) }))
    .sort((a, b) => b.count - a.count);
}

export function excerptFromBody(body: string, maxLength = 300): string {
  return body
    .replace(/^---[\s\S]*?---\n*/m, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^\|.*\|$/gm, '')
    .replace(/<[^>]+>/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*>`~_\-|]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
    .slice(0, maxLength);
}
