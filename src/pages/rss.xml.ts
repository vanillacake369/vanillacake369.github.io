import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { filterPublished, sortPostsByDate } from '../domain/post';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const rawEntries = await getCollection('posts');

  const posts = sortPostsByDate(
    filterPublished(
      rawEntries.map((entry) => ({
        slug: entry.id,
        title: entry.data.title,
        description: entry.data.description,
        date: entry.data.date,
        updatedDate: entry.data.updatedDate,
        tags: entry.data.tags,
        category: entry.data.category,
        lang: entry.data.lang,
        draft: entry.data.draft,
        heroImage: entry.data.heroImage,
      }))
    )
  );

  return rss({
    title: "Vanilla's Blog",
    description: 'A blog about software engineering, systems, and ideas.',
    site: context.site!,
    items: posts.map((post) => ({
      title: post.title,
      description: post.description,
      pubDate: post.date,
      link: `/posts/${post.slug}/`,
    })),
    customData: `<language>ko</language>`,
  });
}
