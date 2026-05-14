import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { TAGS } from './domain/tags';

const tagsEnum = z.enum(TAGS);

const posts = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/posts',
    generateId: ({ entry }) => entry.replace(/\.mdx?$/, ''),
  }),
  schema: z.object({
    title: z.string().optional(),
    description: z.string().default(''),
    date: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(tagsEnum).default([]),
    series: z.object({
      id: z.string(),
      order: z.number()
    }).optional(),
    lang: z.enum(['ko', 'en']).default('ko'),
    draft: z.boolean().default(false),
    heroImage: z.string().optional(),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    lang: z.enum(['ko', 'en']).default('ko'),
  }),
});

export const collections = { posts, pages };
