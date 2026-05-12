import type { Post, TagInfo, CalendarDay } from './types';

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

export function filterByCategory(posts: Post[], category: string): Post[] {
  return posts.filter((p) => p.category === category);
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

export function groupByCalendarDay(posts: Post[]): CalendarDay[] {
  const dayMap = new Map<string, CalendarDay>();
  for (const post of posts) {
    const dateStr = post.date.toISOString().split('T')[0];
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

export function slugifyTag(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
