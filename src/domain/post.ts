import type { Post, TagInfo, CalendarDay } from './types';

/**
 * Derive a human-readable title from a file ID.
 * The file name IS the title — just strip the extension.
 */
export function titleFromId(id: string): string {
  return id.replace(/\.mdx?$/, '').trim();
}

/**
 * Convert a file ID to a URL-safe slug.
 * "NixOS 는 어떤 원리로 커널패키지를 관리할까" → "nixos-는-어떤-원리로-커널패키지를-관리할까"
 */
export function slugify(id: string): string {
  return id
    .replace(/\.mdx?$/, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9가-힣ㄱ-ㅎㅏ-ㅣ\-_.()]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim();
}

/**
 * Map a content collection entry to a domain Post.
 * If title is missing in frontmatter, derives it from the file ID.
 */
export function entryToPost(entry: {
  id: string;
  data: {
    title?: string;
    description?: string;
    date: Date;
    updatedDate?: Date;
    tags?: string[];
    lang?: 'ko' | 'en';
    draft?: boolean;
    heroImage?: string;
    series?: { id: string; order: number };
  };
}): Post {
  return {
    slug: slugify(entry.id),
    title: entry.data.title ?? titleFromId(entry.id),
    description: entry.data.description ?? '',
    date: entry.data.date,
    updatedDate: entry.data.updatedDate,
    tags: entry.data.tags ?? [],
    lang: entry.data.lang ?? 'ko',
    draft: entry.data.draft ?? false,
    heroImage: entry.data.heroImage,
    series: entry.data.series,
  };
}

export function sortPostsByDate(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function filterPublished(posts: Post[]): Post[] {
  return posts.filter((p) => !p.draft);
}

export function filterByLang(posts: Post[], lang: Post['lang']): Post[] {
  return posts.filter((p) => p.lang === lang);
}

export function filterByTag(posts: Post[], tag: string): Post[] {
  return posts.filter((p) => p.tags.includes(tag));
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

/** Format a Date as YYYY-MM-DD in the local timezone (avoids UTC date shift for KST) */
export function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function groupByCalendarDay(posts: Post[]): CalendarDay[] {
  const dayMap = new Map<string, CalendarDay>();
  for (const post of posts) {
    const dateStr = toLocalDateString(post.date);
    const existing = dayMap.get(dateStr);
    if (existing) {
      existing.count++;
      existing.posts.push({ slug: post.slug, title: post.title });
    } else {
      dayMap.set(dateStr, {
        date: dateStr,
        count: 1,
        posts: [{ slug: post.slug, title: post.title }],
      });
    }
  }
  return Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Extract a plain-text excerpt from raw markdown body.
 * Strips frontmatter, code blocks, images, links, and syntax characters.
 */
export function excerptFromBody(body: string, maxLength = 300): string {
  return body
    .replace(/^---[\s\S]*?---\n*/m, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*>`~_\-|]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function slugifyTag(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
