#!/usr/bin/env node
/**
 * migrate-series-to-dirs.mjs — Migrate series posts into subdirectories.
 *
 * For each post with `series:` in frontmatter:
 *   1. Creates a directory named after `series.id` in src/content/posts/
 *   2. Moves the file to `{series.id}/{order:02d}-{original-filename}`
 *   3. Strips the `series:` block from frontmatter
 *
 * - Dry-run by default: pass --apply to actually move files
 * - Prints a summary of all changes
 *
 * Usage:
 *   node scripts/migrate-series-to-dirs.mjs          # dry-run
 *   node scripts/migrate-series-to-dirs.mjs --apply  # actually migrate
 */

import { readdir, readFile, writeFile, mkdir, rename } from 'fs/promises';
import path from 'path';

const POSTS_DIR = './src/content/posts';
const APPLY = process.argv.includes('--apply');

function extractSeries(content) {
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) return null;

  const frontmatter = fmMatch[1];

  // Inline format: series: { id: "NixOS Ecosystem", order: 1 }
  const inlineMatch = frontmatter.match(
    /^series:\s*\{[^}]*id:\s*["'](.+?)["'][^}]*order:\s*(\d+)[^}]*\}/m,
  );
  if (inlineMatch) {
    return { id: inlineMatch[1].trim(), order: parseInt(inlineMatch[2], 10) };
  }

  // Block format:
  // series:
  //   id: "..."
  //   order: N
  const blockMatch = frontmatter.match(
    /^series:\s*\n(?:[ \t]+\S[^\n]*\n?)*/m,
  );
  if (!blockMatch) return null;

  const idMatch = frontmatter.match(/^[ \t]+id:\s*["']?(.+?)["']?\s*$/m);
  const orderMatch = frontmatter.match(/^[ \t]+order:\s*(\d+)\s*$/m);
  if (!idMatch || !orderMatch) return null;

  return { id: idMatch[1].trim(), order: parseInt(orderMatch[1], 10) };
}

function stripSeriesFromFrontmatter(content) {
  // Inline format: series: { ... }\n
  const stripped = content.replace(/^series:\s*\{[^}]*\}\s*\n?/m, '');
  if (stripped !== content) return stripped;
  // Block format: series:\n  id: ...\n  order: ...\n
  return content.replace(/^series:\s*\n(?:[ \t]+[^\n]*\n?)*/m, '');
}

async function main() {
  const entries = await readdir(POSTS_DIR, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile() && (e.name.endsWith('.md') || e.name.endsWith('.mdx')))
    .map((e) => e.name);

  let skipped = 0;
  let errors = 0;

  console.log(`\nScanning ${files.length} files in ${POSTS_DIR}...`);
  console.log(APPLY ? 'Mode: --apply (moving files)\n' : 'Mode: dry-run (use --apply to migrate)\n');

  // Collect all series posts first, then renumber contiguously per series
  const seriesPosts = new Map(); // seriesId -> [{ file, order, content }]

  for (const file of files) {
    const filePath = path.join(POSTS_DIR, file);
    const content = await readFile(filePath, 'utf-8');
    const series = extractSeries(content);

    if (!series) {
      skipped++;
      continue;
    }

    const existing = seriesPosts.get(series.id) ?? [];
    existing.push({ file, order: series.order, content });
    seriesPosts.set(series.id, existing);
  }

  // Sort each series by original order, then renumber contiguously
  let moved = 0;
  for (const [seriesId, posts] of seriesPosts) {
    posts.sort((a, b) => a.order - b.order);

    console.log(`  SERIES "${seriesId}" (${posts.length} posts)`);
    for (let i = 0; i < posts.length; i++) {
      const { file, order, content } = posts[i];
      const newOrder = i + 1;
      const orderPrefix = String(newOrder).padStart(2, '0');
      const newFileName = `${orderPrefix}-${file}`;
      const targetDir = path.join(POSTS_DIR, seriesId);
      const targetPath = path.join(targetDir, newFileName);
      const filePath = path.join(POSTS_DIR, file);

      const renumbered = order !== newOrder ? ` (was ${order})` : '';
      console.log(`    ${orderPrefix}${renumbered} ${file}`);

      if (APPLY) {
        try {
          await mkdir(targetDir, { recursive: true });
          const updatedContent = stripSeriesFromFrontmatter(content);
          await writeFile(filePath, updatedContent, 'utf-8');
          await rename(filePath, targetPath);
          moved++;
        } catch (err) {
          errors++;
          console.log(`      ERROR: ${err.message}`);
        }
      } else {
        moved++;
      }
    }
    console.log();
  }

  console.log(`Done. ${skipped} non-series skipped, ${moved} ${APPLY ? 'moved' : 'would be moved'}, ${errors} errors.`);
  if (!APPLY && moved > 0) {
    console.log('Run with --apply to actually migrate files.');
  }
}

main();
