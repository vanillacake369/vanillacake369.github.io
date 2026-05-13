#!/usr/bin/env node
/**
 * lint-markdown.mjs — Lint markdown files for Astro compatibility
 *
 * Checks:
 * 1. Obsidian wiki-links: ![[image.png]] → ![alt](./image.png)
 * 2. Broken relative image paths: ../../../assets/ → ./images/ or public/
 * 3. Missing frontmatter fields (title, description, date)
 * 4. Filename spaces (warn, Astro handles them but URLs get ugly)
 *
 * Usage: node scripts/lint-markdown.mjs [--fix]
 */

import { readdir, readFile, writeFile, stat, copyFile, mkdir } from 'fs/promises';
import path from 'path';

const POSTS_DIR = './src/content/posts';
const PUBLIC_IMAGES = './public/images';
const FIX_MODE = process.argv.includes('--fix');
const REQUIRED_FRONTMATTER = ['title', 'description', 'date'];

let errors = 0;
let warnings = 0;
let fixed = 0;

async function getFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getFiles(full)));
    } else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
      files.push(full);
    }
  }
  return files;
}

function extractFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const fm = {};
  for (const line of match[1].split(/\r?\n/)) {
    // Split only on the first colon to preserve values containing colons (dates, URLs)
    const colonIdx = line.indexOf(':');
    if (colonIdx < 0) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    if (key && value) fm[key] = value;
  }
  return fm;
}

async function lintFile(filePath) {
  const content = await readFile(filePath, 'utf-8');
  const relPath = path.relative('.', filePath);
  let newContent = content;

  // 1. Check filename for spaces
  const basename = path.basename(filePath);
  if (basename.includes(' ')) {
    warnings++;
    console.log(`  WARN  ${relPath}: filename contains spaces (URLs will be encoded)`);
  }

  // 2. Check frontmatter
  const fm = extractFrontmatter(content);
  if (!fm) {
    errors++;
    console.log(`  ERROR ${relPath}: missing frontmatter (---)`)
    return;
  }
  for (const field of REQUIRED_FRONTMATTER) {
    if (!fm[field]) {
      errors++;
      console.log(`  ERROR ${relPath}: missing frontmatter field "${field}"`);
    }
  }

  // 3. Obsidian wiki-link images: ![[filename.png]]
  const wikiImageRe = /!\[\[([^\]]+\.(png|jpg|jpeg|gif|webp|svg))\]\]/gi;
  const wikiMatches = content.match(wikiImageRe);
  if (wikiMatches) {
    for (const m of wikiMatches) {
      const filename = m.match(/!\[\[([^\]]+)\]\]/)?.[1] ?? '';
      errors++;
      console.log(`  ERROR ${relPath}: Obsidian wiki-link image "${m}"`);
      if (FIX_MODE) {
        newContent = newContent.replace(m, `![${path.basename(filename, path.extname(filename))}](/images/${filename})`);
        fixed++;
        console.log(`  FIXED → ![...](/images/${filename})`);
      } else {
        console.log(`        → fix: ![alt](/images/${filename})`);
      }
    }
  }

  // 4. Relative paths outside content dir: ../../../assets/
  const relImageRe = /!\[([^\]]*)\]\((\.\.\/[^)]+\.(png|jpg|jpeg|gif|webp|svg))\)/gi;
  let relMatch;
  while ((relMatch = relImageRe.exec(content)) !== null) {
    const imgPath = relMatch[2];
    const imgName = path.basename(imgPath);
    errors++;
    console.log(`  ERROR ${relPath}: relative image path "${imgPath}" may not resolve in Astro`);
    if (FIX_MODE) {
      // Copy image to public/images/ if source exists
      const resolvedSrc = path.resolve(path.dirname(filePath), imgPath);
      try {
        await stat(resolvedSrc);
        await mkdir(PUBLIC_IMAGES, { recursive: true });
        await copyFile(resolvedSrc, path.join(PUBLIC_IMAGES, imgName));
        newContent = newContent.replace(imgPath, `/images/${imgName}`);
        fixed++;
        console.log(`  FIXED → copied to public/images/${imgName}, path updated to /images/${imgName}`);
      } catch {
        console.log(`        → source not found at ${resolvedSrc}, manual fix needed`);
      }
    } else {
      console.log(`        → fix: move image to public/images/ and use /images/${imgName}`);
    }
  }

  // 5. Write fixed content
  if (FIX_MODE && newContent !== content) {
    await writeFile(filePath, newContent, 'utf-8');
  }
}

async function main() {
  console.log(`\nLinting markdown files in ${POSTS_DIR}...`);
  if (FIX_MODE) console.log('Mode: --fix (auto-fixing enabled)\n');
  else console.log('Mode: check only (use --fix to auto-fix)\n');

  const files = await getFiles(POSTS_DIR);
  for (const file of files) {
    await lintFile(file);
  }

  console.log(`\nDone. ${files.length} files scanned.`);
  console.log(`  ${errors} errors, ${warnings} warnings${FIX_MODE ? `, ${fixed} fixed` : ''}`);
  if (errors > 0 && !FIX_MODE) {
    console.log('\nRun with --fix to auto-fix some issues.');
    process.exit(1);
  }
}

main();
