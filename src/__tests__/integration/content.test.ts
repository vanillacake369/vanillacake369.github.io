import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Mirror the content collection schema without importing from astro:content.
// This tests the shape and validation rules independently of the Astro build pipeline.
const postSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.date(),
  updatedDate: z.date().optional(),
  tags: z.array(z.string()).default([]),
  category: z.string().default('uncategorized'),
  lang: z.enum(['ko', 'en']).default('ko'),
  draft: z.boolean().default(false),
  heroImage: z.string().optional(),
});

type PostFrontmatter = z.infer<typeof postSchema>;

function makeValidFrontmatter(overrides: Partial<PostFrontmatter> = {}): PostFrontmatter {
  return {
    title: 'Hello World',
    description: 'A test post.',
    date: new Date('2026-05-01'),
    tags: ['blog', 'astro'],
    category: 'dev',
    lang: 'ko',
    draft: false,
    ...overrides,
  };
}

describe('Content Collections schema', () => {
  describe('valid frontmatter', () => {
    it('parses a fully specified Korean post', () => {
      const input = makeValidFrontmatter();
      const result = postSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Hello World');
        expect(result.data.lang).toBe('ko');
        expect(result.data.draft).toBe(false);
        expect(result.data.tags).toEqual(['blog', 'astro']);
        expect(result.data.category).toBe('dev');
      }
    });

    it('parses a fully specified English post', () => {
      const input = makeValidFrontmatter({ lang: 'en', title: 'Hello World EN' });
      const result = postSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lang).toBe('en');
        expect(result.data.title).toBe('Hello World EN');
      }
    });

    it('applies default values when optional fields are omitted', () => {
      const minimal = {
        title: 'Minimal Post',
        description: 'No optional fields.',
        date: new Date('2026-01-01'),
      };
      const result = postSchema.safeParse(minimal);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toEqual([]);
        expect(result.data.category).toBe('uncategorized');
        expect(result.data.lang).toBe('ko');
        expect(result.data.draft).toBe(false);
      }
    });

    it('allows an optional updatedDate', () => {
      const input = makeValidFrontmatter({ updatedDate: new Date('2026-05-10') });
      const result = postSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.updatedDate).toEqual(new Date('2026-05-10'));
      }
    });

    it('allows an optional heroImage URL', () => {
      const input = makeValidFrontmatter({ heroImage: '/images/hero.png' });
      const result = postSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.heroImage).toBe('/images/hero.png');
      }
    });

    it('allows draft: true', () => {
      const input = makeValidFrontmatter({ draft: true });
      const result = postSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.draft).toBe(true);
      }
    });

    it('accepts an empty tags array', () => {
      const input = makeValidFrontmatter({ tags: [] });
      const result = postSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toEqual([]);
      }
    });
  });

  describe('invalid frontmatter', () => {
    it('rejects a post missing the required title field', () => {
      const input = {
        description: 'No title here.',
        date: new Date('2026-05-01'),
      };
      const result = postSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path[0]);
        expect(paths).toContain('title');
      }
    });

    it('rejects a post missing the required description field', () => {
      const input = {
        title: 'No Description',
        date: new Date('2026-05-01'),
      };
      const result = postSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path[0]);
        expect(paths).toContain('description');
      }
    });

    it('rejects a post missing the required date field', () => {
      const input = {
        title: 'No Date',
        description: 'Missing date.',
      };
      const result = postSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path[0]);
        expect(paths).toContain('date');
      }
    });

    it('rejects an invalid lang value', () => {
      const input = makeValidFrontmatter({ lang: 'fr' as 'ko' | 'en' });
      const result = postSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path[0]);
        expect(paths).toContain('lang');
      }
    });

    it('rejects a non-string title', () => {
      const input = makeValidFrontmatter({ title: 42 as unknown as string });
      const result = postSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path[0]);
        expect(paths).toContain('title');
      }
    });

    it('rejects a non-boolean draft value', () => {
      const input = makeValidFrontmatter({ draft: 'yes' as unknown as boolean });
      const result = postSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path[0]);
        expect(paths).toContain('draft');
      }
    });

    it('rejects tags that are not an array of strings', () => {
      const input = makeValidFrontmatter({ tags: [1, 2] as unknown as string[] });
      const result = postSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path[0]).toBe('tags');
      }
    });
  });
});
