import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const rawPosts = await getCollection('posts');
  const index = rawPosts
    .filter((p) => !p.data.draft)
    .map((p) => ({
      title: p.data.title,
      description: p.data.description,
      url: `/posts/${p.id}/`,
      tags: p.data.tags,
      date: p.data.date.toISOString(),
      excerpt: p.body?.slice(0, 500) ?? '',
    }));

  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json' },
  });
};
