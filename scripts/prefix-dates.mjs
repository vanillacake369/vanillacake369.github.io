#!/usr/bin/env node
/**
 * prefix-dates.mjs — Add date prefix to post filenames based on frontmatter date.
 *
 * Reads each .md/.mdx file in src/content/posts/, extracts the `date:` field
 * from frontmatter, and renames files to `YYYY-MM-DD-<original-name>.md`.
 *
 * - Idempotent: skips files that already have correct date prefix
 * - Dry-run by default: pass --apply to actually rename
 * - Reports all changes (or would-be changes)
 *
 * Usage:
 *   node scripts/prefix-dates.mjs          # dry-run
 *   node scripts/prefix-dates.mjs --apply  # actually rename
 */

import { readdir, readFile, rename } from 'fs/promises';
import path from 'path';

const POSTS_DIR = './src/content/posts';
const APPLY = process.argv.includes('--apply');
const DATE_PREFIX_RE = /^(\d{4}-\d{2}-\d{2})-/;

function extractDate(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  for (const line of match[1].split(/\r?\n/)) {
    const colonIdx = line.indexOf(':');
    if (colonIdx < 0) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    if (key === 'date' && value) {
      const d = new Date(value);
      if (isNaN(d.getTime())) return null;
      return d.toISOString().slice(0, 10); // YYYY-MM-DD
    }
  }
  return null;
}

async function main() {
  const entries = await readdir(POSTS_DIR);
  const files = entries.filter(f => f.endsWith('.md') || f.endsWith('.mdx'));

  let renamed = 0;
  let skipped = 0;
  let errors = 0;

  console.log(`\nScanning ${files.length} files in ${POSTS_DIR}...`);
  console.log(APPLY ? 'Mode: --apply (renaming files)\n' : 'Mode: dry-run (use --apply to rename)\n');

  for (const file of files) {
    const filePath = path.join(POSTS_DIR, file);
    const content = await readFile(filePath, 'utf-8');
    const date = extractDate(content);

    if (!date) {
      errors++;
      console.log(`  ERROR  ${file}: could not extract date from frontmatter`);
      continue;
    }

    const existingPrefix = file.match(DATE_PREFIX_RE);

    // Already has the correct prefix
    if (existingPrefix && existingPrefix[1] === date) {
      skipped++;
      continue;
    }

    // Has a wrong date prefix — strip it first
    const baseName = existingPrefix ? file.slice(existingPrefix[0].length) : file;
    const newName = `${date}-${baseName}`;

    if (APPLY) {
      await rename(filePath, path.join(POSTS_DIR, newName));
      console.log(`  RENAMED  ${file}\n        -> ${newName}`);
    } else {
      console.log(`  WOULD RENAME  ${file}\n             -> ${newName}`);
    }
    renamed++;
  }

  console.log(`\nDone. ${skipped} already prefixed, ${renamed} ${APPLY ? 'renamed' : 'to rename'}, ${errors} errors.`);
  if (!APPLY && renamed > 0) {
    console.log('Run with --apply to rename files.');
  }
}

main();
