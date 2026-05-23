import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { TAGS } from './modules/taxonomy/model';

const tagsEnum = z.enum(TAGS);

const posts = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/posts',
    generateId: ({ entry }) => entry.replace(/\.mdx?$/, ''),
  }),
  schema: z
    .object({
      title: z.string().optional(),
      description: z.string().default(''),
      date: z.coerce.date().optional(),
      updatedDate: z.coerce.date().optional(),
      tags: z.array(tagsEnum).default([]),
      lang: z.enum(['ko', 'en']).default('ko'),
      draft: z.boolean().default(false),
      heroImage: z.string().optional(),
    })
    .refine(
      (data) => !data.updatedDate || !data.date || data.updatedDate > data.date,
      { message: 'updatedDate must be after date', path: ['updatedDate'] },
    ),
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
