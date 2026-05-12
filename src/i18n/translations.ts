export const translations = {
  ko: {
    'nav.home': '홈',
    'nav.about': '소개',
    'nav.tags': '태그',
    'nav.calendar': '달력',
    'nav.search': '검색',
    'posts.title': '글 목록',
    'posts.noPosts': '아직 글이 없습니다.',
    'tags.title': '태그',
    'calendar.title': '달력',
    'about.title': '소개',
    'footer.rights': '모든 권리 보유.',
    'post.updated': '수정됨',
    'toc.title': '목차',
    'comments.title': '댓글',
  },
  en: {
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.tags': 'Tags',
    'nav.calendar': 'Calendar',
    'nav.search': 'Search',
    'posts.title': 'Posts',
    'posts.noPosts': 'No posts yet. Check back soon.',
    'tags.title': 'Tags',
    'calendar.title': 'Calendar',
    'about.title': 'About',
    'footer.rights': 'All rights reserved.',
    'post.updated': 'Updated',
    'toc.title': 'Contents',
    'comments.title': 'Comments',
  },
} as const;

export type Lang = 'ko' | 'en';
export type TranslationKey = keyof typeof translations.ko;

export function t(lang: Lang, key: TranslationKey): string {
  return translations[lang][key];
}
