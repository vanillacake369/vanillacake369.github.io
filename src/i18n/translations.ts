export const translations = {
  ko: {
    'nav.home': '홈',
    'nav.about': '소개',
    'nav.series': '시리즈',
    'nav.tags': '태그',
    'nav.calendar': '달력',
    'nav.search': '검색',
    'posts.title': '글 목록',
    'posts.noPosts': '아직 글이 없습니다.',
    'tags.title': '태그',
    'series.title': '시리즈',
    'calendar.title': '달력',
    'about.title': '소개',
    'footer.rights': '모든 권리 보유.',
    'post.updated': '수정됨',
    'toc.title': '목차',
    'comments.title': '댓글',
    'series.kicker': '시리즈',
    'series.part': '편',
    'series.fold': '접기 / 펼치기',
    'series.panelText': '현재 글을 포함한 전체 흐름을 순서대로 볼 수 있습니다.',
    'series.archiveLink': '시리즈 목록 보기',
    'series.noPosts': '아직 등록된 시리즈가 없습니다.',
  },
  en: {
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.series': 'Series',
    'nav.tags': 'Tags',
    'nav.calendar': 'Calendar',
    'nav.search': 'Search',
    'posts.title': 'Posts',
    'posts.noPosts': 'No posts yet. Check back soon.',
    'tags.title': 'Tags',
    'series.title': 'Series',
    'calendar.title': 'Calendar',
    'about.title': 'About',
    'footer.rights': 'All rights reserved.',
    'post.updated': 'Updated',
    'toc.title': 'Contents',
    'comments.title': 'Comments',
    'series.kicker': 'Series',
    'series.part': 'part',
    'series.fold': 'Fold / Unfold',
    'series.panelText': 'View all posts in this series in order.',
    'series.archiveLink': 'Open series archive',
    'series.noPosts': 'No series yet.',
  },
} as const;

import type { Lang } from '../modules/post/model';
export type { Lang };
export type TranslationKey = keyof typeof translations.ko;

export function t(lang: Lang, key: TranslationKey): string {
  return translations[lang][key];
}
