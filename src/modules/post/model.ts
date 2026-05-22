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

export interface CalendarDay {
  date: string;
  count: number;
  posts: Pick<Post, 'slug' | 'title'>[];
}

const DATE_PREFIX_RE = /^\d{4}-\d{2}-\d{2}-/;

export function dateFromId(id: string): Date | undefined {
  const match = id.match(/^(\d{4}-\d{2}-\d{2})-/);
  if (!match) return undefined;
  return new Date(match[1]);
}

export function titleFromId(id: string): string {
  return id
    .replace(DATE_PREFIX_RE, '')
    .replace(/\.mdx?$/, '')
    .trim();
}

export function slugify(id: string): string {
  return id
    .replace(DATE_PREFIX_RE, '')
    .replace(/\.mdx?$/, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9가-힣ㄱ-ㅎㅏ-ㅣ\-_.()]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim();
}

export function entryToPost(entry: {
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
    series?: { id: string; order: number };
  };
}): Post {
  const date = dateFromId(entry.id) ?? entry.data.date ?? new Date(0);
  return {
    slug: slugify(entry.id),
    title: entry.data.title ?? titleFromId(entry.id),
    description: entry.data.description ?? '',
    date,
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
  return posts.filter((post) => !post.draft);
}

export function filterByLang(posts: Post[], lang: Post['lang']): Post[] {
  return posts.filter((post) => post.lang === lang);
}

export function filterByTag(posts: Post[], tag: string): Post[] {
  return posts.filter((post) => post.tags.includes(tag));
}

export function slugifyTag(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
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
      existing.count += 1;
      existing.posts.push({ slug: post.slug, title: post.title });
      continue;
    }

    dayMap.set(dateStr, {
      date: dateStr,
      count: 1,
      posts: [{ slug: post.slug, title: post.title }],
    });
  }

  return Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

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
