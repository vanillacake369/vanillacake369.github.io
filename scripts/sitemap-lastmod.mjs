import fs from 'node:fs';
import path from 'node:path';

const STANDALONE_RE = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})-(?<title>.+)$/;
const SERIES_RE = /^(?<order>\d{2})-(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})-(?<title>.+)$/;

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9가-힣ㄱ-ㅎㅏ-ㅣ\-_.()]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim();
}

function parseFilename(filename) {
  const cleaned = filename.replace(/\.mdx?$/, '');
  const series = cleaned.match(SERIES_RE);
  if (series?.groups) return series.groups;
  const standalone = cleaned.match(STANDALONE_RE);
  return standalone?.groups;
}

export function buildLastmodMap(postsDir = path.resolve('./src/content/posts')) {
  const map = new Map();
  const stack = [postsDir];
  while (stack.length > 0) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (!/\.mdx?$/.test(entry.name)) continue;
      const parsed = parseFilename(entry.name);
      if (!parsed) continue;
      const slug = slugify(parsed.title);
      const date = new Date(
        Number(parsed.year),
        Number(parsed.month) - 1,
        Number(parsed.day),
      );
      map.set(slug, date);
    }
  }
  return map;
}
