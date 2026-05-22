import { describe, it, expect } from 'vitest';
import { parsePostId, parsePostIdSafe, InvalidPostIdError } from '../../modules/post/grammar';

describe('parsePostId', () => {
  describe('standalone format', () => {
    it('parses "YYYY-MM-DD-Title"', () => {
      const result = parsePostId('2024-02-04-JPA Cascade Type');
      expect(result).toEqual({
        kind: 'standalone',
        year: 2024,
        month: 2,
        day: 4,
        title: 'JPA Cascade Type',
      });
    });

    it('parses Korean titles', () => {
      const result = parsePostId('2026-05-08-NixOS 는 어떤 원리로 커널패키지를 관리할까');
      expect(result.kind).toBe('standalone');
      expect(result.title).toBe('NixOS 는 어떤 원리로 커널패키지를 관리할까');
    });

    it('strips .md extension before parsing', () => {
      const result = parsePostId('2025-01-15-Hello World.md');
      expect(result.title).toBe('Hello World');
    });

    it('strips .mdx extension before parsing', () => {
      const result = parsePostId('2025-01-15-Hello World.mdx');
      expect(result.title).toBe('Hello World');
    });
  });

  describe('series format', () => {
    it('parses "Series/NN-YYYY-MM-DD-Title"', () => {
      const result = parsePostId('NixOS Ecosystem/01-2026-01-14-Nix Disko 설정');
      expect(result).toEqual({
        kind: 'series',
        year: 2026,
        month: 1,
        day: 14,
        title: 'Nix Disko 설정',
        series: { id: 'NixOS Ecosystem', order: 1 },
      });
    });

    it('parses multi-digit order', () => {
      const result = parsePostId('Effective Java/12-2024-02-18-Generic Method');
      expect(result.series).toEqual({ id: 'Effective Java', order: 12 });
    });

    it('strips .md extension in series format', () => {
      const result = parsePostId('Series/01-2025-01-15-Title.md');
      expect(result.title).toBe('Title');
    });
  });

  describe('error cases', () => {
    it('throws InvalidPostIdError for missing date prefix', () => {
      expect(() => parsePostId('no-date-here')).toThrow(InvalidPostIdError);
    });

    it('throws for partial date pattern', () => {
      expect(() => parsePostId('2024-02-something')).toThrow(InvalidPostIdError);
    });

    it('includes the offending ID in the error', () => {
      try {
        parsePostId('bad-id');
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidPostIdError);
        expect((e as InvalidPostIdError).postId).toBe('bad-id');
      }
    });

    it('includes guidance in the error message', () => {
      expect(() => parsePostId('bad'))
        .toThrow(/YYYY-MM-DD-Title/);
    });
  });
});

describe('parsePostIdSafe', () => {
  it('returns parsed result for valid IDs', () => {
    const result = parsePostIdSafe('2025-01-15-Title');
    expect(result).toBeDefined();
    expect(result!.title).toBe('Title');
  });

  it('returns undefined for invalid IDs', () => {
    expect(parsePostIdSafe('invalid')).toBeUndefined();
  });
});
