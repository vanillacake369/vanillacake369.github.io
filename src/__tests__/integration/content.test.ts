import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Mirror the content collection schema without importing from astro:content.
// This tests the shape and validation rules independently of the Astro build pipeline.
// Keep in sync with src/content.config.ts.
const postSchema = z.object({
  title: z.string().optional(),
  description: z.string().default(''),
  date: z.coerce.date().optional(),
  updatedDate: z.coerce.date().optional(),
  tags: z.array(z.string()).default([]),
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
    lang: 'ko',
    draft: false,
    ...overrides,
  } as PostFrontmatter;
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
      const minimal = {};
      const result = postSchema.safeParse(minimal);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBeUndefined();
        expect(result.data.description).toBe('');
        expect(result.data.date).toBeUndefined();
        expect(result.data.tags).toEqual([]);
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
    it('accepts a post with no title (title is optional)', () => {
      const input = { description: 'No title here.', date: new Date('2026-05-01') };
      const result = postSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBeUndefined();
      }
    });

    it('accepts a post with no description (defaults to empty string)', () => {
      const input = { title: 'No Description', date: new Date('2026-05-01') };
      const result = postSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe('');
      }
    });

    it('accepts a post with no date (date is optional)', () => {
      const input = { title: 'No Date', description: 'Missing date.' };
      const result = postSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date).toBeUndefined();
      }
    });

    it('coerces a date string to a Date object', () => {
      const input = makeValidFrontmatter({ date: '2026-05-01' as unknown as Date });
      const result = postSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date).toBeInstanceOf(Date);
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
