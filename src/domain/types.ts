export interface Post {
  slug: string;
  title: string;
  description: string;
  date: Date;
  updatedDate?: Date;
  tags: string[];
  category: string;
  lang: 'ko' | 'en';
  draft: boolean;
  heroImage?: string;
}

export interface TagInfo {
  name: string;
  count: number;
  slug: string;
}

export interface CalendarDay {
  date: string; // YYYY-MM-DD
  count: number;
  posts: Pick<Post, 'slug' | 'title'>[];
}

export type Theme = 'light' | 'dark';
export type Lang = 'ko' | 'en';
