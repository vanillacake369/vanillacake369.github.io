import type { CalendarDay, Post } from '../post/model';
import { groupByCalendarDay, slugifyTag, sortPostsByDate, toLocalDateString } from '../post/model';

export const TAGS = [
  'kubernetes',
  'infra',
  'nix',
  'homelab',
  'linux',
  'dev',
  'ai',
  'tools',
  'database',
  'network',
  'system-design',
  'algorithm',
  'java',
  'spring-boot',
  'effective-java',
  'neovim',
  'conference',
  'investment',
  'journal',
  'reflection',
] as const;

export type Tag = (typeof TAGS)[number];

export interface SeriesPost extends Pick<Post, 'slug' | 'title' | 'description' | 'date' | 'tags'> {
  order: number;
}

export interface SeriesInfo {
  id: string;
  slug: string;
  totalPosts: number;
  startDate: Date;
  latestDate: Date;
  tags: { name: string; count: number; slug: string }[];
  posts: SeriesPost[];
}

export interface CalendarCell {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  posts: Pick<Post, 'slug' | 'title'>[];
}

export interface CalendarWeek {
  cells: (CalendarCell | null)[];
}

export function slugifySeries(id: string): string {
  return id
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function extractSeries(posts: Post[]): SeriesInfo[] {
  const seriesMap = new Map<string, SeriesPost[]>();

  for (const post of posts) {
    if (!post.series) continue;

    const existing = seriesMap.get(post.series.id) ?? [];
    existing.push({
      slug: post.slug,
      title: post.title,
      description: post.description,
      date: post.date,
      tags: post.tags,
      order: post.series.order,
    });
    seriesMap.set(post.series.id, existing);
  }

  return Array.from(seriesMap.entries())
    .map(([id, entries]) => {
      const orderedPosts = [...entries].sort(
        (a, b) => a.order - b.order || a.date.getTime() - b.date.getTime(),
      );
      const datedPosts = sortPostsByDate(orderedPosts);
      const tagMap = new Map<string, number>();

      for (const post of orderedPosts) {
        for (const tag of post.tags) {
          tagMap.set(tag, (tagMap.get(tag) ?? 0) + 1);
        }
      }

      return {
        id,
        slug: slugifySeries(id),
        totalPosts: orderedPosts.length,
        startDate: orderedPosts[0].date,
        latestDate: datedPosts[0].date,
        tags: Array.from(tagMap.entries())
          .map(([name, count]) => ({ name, count, slug: slugifyTag(name) }))
          .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
          .slice(0, 4),
        posts: orderedPosts,
      };
    })
    .sort((a, b) => b.latestDate.getTime() - a.latestDate.getTime() || a.id.localeCompare(b.id));
}

export function countToLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count < 5) return 3;
  return 4;
}

export function generateCalendarGrid(
  posts: Post[],
  months: number,
  referenceDate?: Date,
): CalendarWeek[] {
  const today = referenceDate ? new Date(referenceDate) : new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() - months + 1, 1);
  startDate.setHours(0, 0, 0, 0);

  const dayMap = new Map<string, CalendarDay>();
  for (const day of groupByCalendarDay(posts)) {
    dayMap.set(day.date, day);
  }

  const weeks: CalendarWeek[] = [];
  const cursor = new Date(startDate);
  cursor.setDate(cursor.getDate() - cursor.getDay());

  while (cursor <= today) {
    const cells: (CalendarCell | null)[] = [];

    for (let dow = 0; dow < 7; dow++) {
      const cellDate = new Date(cursor);
      cellDate.setDate(cursor.getDate() + dow);

      if (cellDate < startDate || cellDate > today) {
        cells.push(null);
        continue;
      }

      const dateStr = toLocalDateString(cellDate);
      const day = dayMap.get(dateStr);
      const count = day?.count ?? 0;

      cells.push({
        date: dateStr,
        count,
        level: countToLevel(count),
        posts: day?.posts ?? [],
      });
    }

    weeks.push({ cells });
    cursor.setDate(cursor.getDate() + 7);
  }

  return weeks;
}
