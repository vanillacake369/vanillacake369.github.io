import { describe, expect, it } from 'vitest';
import { readdirSync, statSync } from 'fs';
import path from 'path';
import { SERIES } from '../../modules/taxonomy/model';

const POSTS_DIR = path.resolve(process.cwd(), 'src/content/posts');

const SERIES_FILE_RE = /^\d{2}-\d{4}-\d{2}-\d{2}-.+\.mdx?$/;

/**
 * Returns a list of subdirectory names inside POSTS_DIR.
 * These are the series directories.
 */
function getSeriesDirs(): string[] {
  return readdirSync(POSTS_DIR).filter((entry) => {
    return statSync(path.join(POSTS_DIR, entry)).isDirectory();
  });
}

/**
 * Returns the list of files directly inside a series directory.
 */
function getFilesInSeriesDir(seriesId: string): string[] {
  const dirPath = path.join(POSTS_DIR, seriesId);
  return readdirSync(dirPath).filter((entry) => {
    const fullPath = path.join(dirPath, entry);
    return statSync(fullPath).isFile() && (entry.endsWith('.md') || entry.endsWith('.mdx'));
  });
}

describe('series directory convention', () => {
  const seriesDirs = getSeriesDirs();

  if (seriesDirs.length === 0) {
    it.skip('no series directories found — run migration first', () => {});
    return;
  }

  it('all series directory names are listed in the SERIES enum', () => {
    for (const dir of seriesDirs) {
      expect(
        (SERIES as readonly string[]).includes(dir),
        `Directory "${dir}" is not in the SERIES enum`,
      ).toBe(true);
    }
  });

  for (const seriesId of seriesDirs) {
    describe(`series: ${seriesId}`, () => {
      const files = getFilesInSeriesDir(seriesId);

      it('every file matches the NN-YYYY-MM-DD-Title pattern', () => {
        for (const file of files) {
          expect(
            SERIES_FILE_RE.test(file),
            `File "${file}" in "${seriesId}" does not match NN-YYYY-MM-DD-Title.md pattern`,
          ).toBe(true);
        }
      });

      it('orders are contiguous starting from 01 with no gaps', () => {
        const orders = files
          .map((f) => parseInt(f.slice(0, 2), 10))
          .sort((a, b) => a - b);

        expect(orders[0], `First order in "${seriesId}" should be 1`).toBe(1);

        for (let i = 0; i < orders.length; i++) {
          expect(
            orders[i],
            `Gap detected in "${seriesId}": expected order ${i + 1}, got ${orders[i]}`,
          ).toBe(i + 1);
        }
      });

      it('has no duplicate order numbers', () => {
        const orders = files.map((f) => parseInt(f.slice(0, 2), 10));
        const unique = new Set(orders);
        expect(
          unique.size,
          `Duplicate order numbers found in "${seriesId}"`,
        ).toBe(orders.length);
      });

      it('contains only files, no nested subdirectories', () => {
        const dirPath = path.join(POSTS_DIR, seriesId);
        const allEntries = readdirSync(dirPath);
        for (const entry of allEntries) {
          const fullPath = path.join(dirPath, entry);
          expect(
            statSync(fullPath).isFile(),
            `"${entry}" inside "${seriesId}" is not a file — nested directories are not allowed`,
          ).toBe(true);
        }
      });
    });
  }
});
