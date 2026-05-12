import { describe, it, expect } from 'vitest';
import { translations, t } from '../../i18n/translations';
import type { Lang, TranslationKey } from '../../i18n/translations';

const langs: Lang[] = ['ko', 'en'];
const allKeys = Object.keys(translations.ko) as TranslationKey[];

describe('translations object', () => {
  it('has the same keys in both languages', () => {
    const koKeys = Object.keys(translations.ko).sort();
    const enKeys = Object.keys(translations.en).sort();
    expect(koKeys).toEqual(enKeys);
  });

  it('has no empty strings in Korean', () => {
    for (const key of allKeys) {
      expect(translations.ko[key].length, `ko.${key} should not be empty`).toBeGreaterThan(0);
    }
  });

  it('has no empty strings in English', () => {
    for (const key of allKeys) {
      expect(translations.en[key].length, `en.${key} should not be empty`).toBeGreaterThan(0);
    }
  });
});

describe('t()', () => {
  it('returns Korean text for lang "ko"', () => {
    expect(t('ko', 'nav.home')).toBe('홈');
    expect(t('ko', 'nav.about')).toBe('소개');
    expect(t('ko', 'nav.tags')).toBe('태그');
    expect(t('ko', 'nav.calendar')).toBe('달력');
    expect(t('ko', 'nav.search')).toBe('검색');
    expect(t('ko', 'posts.title')).toBe('글 목록');
    expect(t('ko', 'posts.noPosts')).toBe('아직 글이 없습니다.');
    expect(t('ko', 'footer.rights')).toBe('모든 권리 보유.');
    expect(t('ko', 'post.updated')).toBe('수정됨');
    expect(t('ko', 'toc.title')).toBe('목차');
    expect(t('ko', 'comments.title')).toBe('댓글');
  });

  it('returns English text for lang "en"', () => {
    expect(t('en', 'nav.home')).toBe('Home');
    expect(t('en', 'nav.about')).toBe('About');
    expect(t('en', 'nav.tags')).toBe('Tags');
    expect(t('en', 'nav.calendar')).toBe('Calendar');
    expect(t('en', 'nav.search')).toBe('Search');
    expect(t('en', 'posts.title')).toBe('Posts');
    expect(t('en', 'posts.noPosts')).toBe('No posts yet. Check back soon.');
    expect(t('en', 'footer.rights')).toBe('All rights reserved.');
    expect(t('en', 'post.updated')).toBe('Updated');
    expect(t('en', 'toc.title')).toBe('Contents');
    expect(t('en', 'comments.title')).toBe('Comments');
  });

  it('returns different strings for ko and en', () => {
    for (const key of allKeys) {
      // Not all keys must differ, but t() must return the correct locale's value
      expect(t('ko', key)).toBe(translations.ko[key]);
      expect(t('en', key)).toBe(translations.en[key]);
    }
  });

  it('covers all defined keys for every language', () => {
    for (const lang of langs) {
      for (const key of allKeys) {
        expect(typeof t(lang, key)).toBe('string');
      }
    }
  });
});
