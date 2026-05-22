import { describe, expect, it } from 'vitest';
import { buildSearchPageList } from '../../modules/search/model';

describe('modules/search/model', () => {
  it('builds a sorted page list from content entries and excludes drafts', () => {
    const result = buildSearchPageList([
      {
        id: '2025-03-03-Draft Post',
        body: 'Hidden body',
        data: {
          title: 'Draft Post',
          description: 'draft desc',
          tags: ['hidden'],
          draft: true,
        },
      },
      {
        id: '2025-03-01-Older Post',
        body: 'Older body',
        data: {
          title: 'Older Post',
          description: 'older desc',
          tags: ['infra'],
          draft: false,
        },
      },
      {
        id: '2025-03-02-Newer Post',
        body: '## Heading\n\nNewer body',
        data: {
          title: 'Newer Post',
          description: 'newer desc',
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
