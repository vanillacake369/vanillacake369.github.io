import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { entryToPost } from '../domain/post';

export const GET: APIRoute = async () => {
  const rawPosts = await getCollection('posts');
  const index = rawPosts
    .filter((p) => !p.data.draft)
    .map((p) => {
      const post = entryToPost(p);
      return {
        title: post.title,
        description: post.description,
        url: `/posts/${post.slug}/`,
        tags: post.tags,
        date: post.date.toISOString(),
        excerpt: post.description || (p.body ?? '').replace(/^---[\s\S]*?---\s*/, '').slice(0, 200),
      };
    });

  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json' },
  });
};
