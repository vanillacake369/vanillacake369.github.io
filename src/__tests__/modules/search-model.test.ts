import { describe, expect, it } from 'vitest';
import { buildSearchPageList } from '../../modules/search/model';

describe('modules/search/model', () => {
  it('builds a sorted page list from content entries and excludes drafts', () => {
    const result = buildSearchPageList([
      {
        id: 'Draft Post',
        body: 'Hidden body',
        data: {
          title: 'Draft Post',
          description: 'draft desc',
          date: new Date('2025-03-03'),
          tags: ['hidden'],
          draft: true,
        },
      },
      {
        id: 'Older Post',
        body: 'Older body',
        data: {
          title: 'Older Post',
          description: 'older desc',
          date: new Date('2025-03-01'),
          tags: ['infra'],
          draft: false,
        },
      },
      {
        id: 'Newer Post',
        body: '## Heading\n\nNewer body',
        data: {
          title: 'Newer Post',
          description: 'newer desc',
          date: new Date('2025-03-02'),
          tags: ['nix'],
          draft: false,
        },
      },
    ]);

    expect(result.map((item) => item.title)).toEqual(['Newer Post', 'Older Post']);
    expect(result[0].url).toBe('/posts/newer-post/');
    expect(result[0].body).toContain('Heading Newer body');
  });
});
