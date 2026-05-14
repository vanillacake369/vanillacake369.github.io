import type { Post } from './types';
import { sortPostsByDate, slugifyTag } from './post';

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
      const orderedPosts = [...entries].sort((a, b) => a.order - b.order || a.date.getTime() - b.date.getTime());
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
