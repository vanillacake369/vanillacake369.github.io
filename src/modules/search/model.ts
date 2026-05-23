import {
  createPost,
  excerptFromBody,
  filterPublished,
  slugify,
  sortPostsByDate,
} from '../post/model';

export interface SearchPage {
  url: string;
  title: string;
  excerpt: string;
  body: string;
  tags: string[];
}

interface SearchEntry {
  id: string;
  body?: string;
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

export function buildSearchPageList(entries: SearchEntry[]): SearchPage[] {
  const bodyMap = new Map<string, string>();

  for (const entry of entries) {
    bodyMap.set(slugify(entry.id), excerptFromBody(entry.body ?? ''));
  }

  const posts = sortPostsByDate(filterPublished(entries.map(createPost)));

  return posts.map((post) => ({
    url: `/posts/${post.slug}/`,
    title: post.title,
    excerpt: post.description,
    body: bodyMap.get(post.slug) ?? '',
    tags: post.tags,
  }));
}
