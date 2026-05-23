import type { Post } from '../../modules/post/model';

export function makePost(overrides: Partial<Post> = {}): Post {
  return {
    slug: 'test-post',
    title: 'Test Post',
    description: 'desc',
    date: new Date('2025-01-15'),
    tags: ['go', 'k8s'],
    lang: 'ko',
    draft: false,
    ...overrides,
  };
}
