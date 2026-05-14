import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const tagsEnum = z.enum([
  'kubernetes', 'infra', 'nix', 'homelab', 'linux', 'dev', 'ai', 'tools', 
  'database', 'network', 'system-design', 'algorithm', 'java', 'spring-boot',
  'effective-java', 'neovim', 'conference', 'investment', 'journal', 'reflection'
]);

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
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
