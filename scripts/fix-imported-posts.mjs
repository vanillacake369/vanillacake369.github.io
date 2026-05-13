#!/usr/bin/env node
/**
 * fix-imported-posts.mjs — Bulk fix frontmatter and content issues
 *
 * Tasks:
 *   3. Auto-fill empty descriptions from first sentence of body
 *   4. Normalize tag casing (Infra→infra, Kubernetes→kubernetes, DB/Database→database)
 *   6. Convert Notion <aside> callout artifacts to blockquotes
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

const POSTS_DIR = './src/content/posts';

// === Task 4: Tag normalization map ===
const TAG_MAP = {
  'Infra': 'infra',
  'Kubernetes': 'kubernetes',
  'Database': 'database',
  'DB': 'database',
  'k8s': 'kubernetes',
  // Lowercase normalization for common tags
  'Java': 'java',
  'Linux': 'linux',
  'Homelab': 'homelab',
  'Talk': 'talk',
  'Network': 'network',
  'Tools': 'tools',
  'Conference': 'conference',
  'Investment': 'investment',
  'AI': 'ai',
  'OpenSource': 'opensource',
  'Go': 'go',
  'Nix': 'nix',
  'System Design': 'system-design',
  'Spring boot': 'spring-boot',
  'Effective Java': 'effective-java',
  'Neovim': 'neovim',
  'Generic': 'generic',
  'Hobbies': 'hobbies',
  'Fashion': 'fashion',
  'Interior': 'interior',
  'Survival': 'survival',
  'Algorithm': 'algorithm',
  'JPA': 'jpa',
  'N+1 Issue': 'n+1-issue',
  'Observer Pattern': 'observer-pattern',
  'Facade Pattern': 'facade-pattern',
  'Separation of Concerns': 'separation-of-concerns',
  'Service Layer': 'service-layer',
  'Sliding Window': 'sliding-window',
  'ValueObject': 'value-object',
  'CodeDeploy': 'codedeploy',
  'Galera Cluster': 'galera-cluster',
  'CI/CD': 'ci-cd',
  'Aurora': 'aurora',
  'Pubsub': 'pubsub',
};

let stats = { description: 0, tags: 0, aside: 0, total: 0 };

async function processFile(filePath) {
  let content = await readFile(filePath, 'utf-8');
  let changed = false;
  const basename = path.basename(filePath);

  // Parse frontmatter
  const fmMatch = content.match(/^(---\n)([\s\S]*?)\n(---\n)/);
  if (!fmMatch) return;

  let frontmatter = fmMatch[2];
  const body = content.slice(fmMatch[0].length);

  // === Task 3: Auto-fill empty description ===
  if (/^description:\s*""?\s*$/m.test(frontmatter)) {
    const firstSentence = extractFirstSentence(body);
    if (firstSentence) {
      const escaped = firstSentence.replace(/"/g, '\\"');
      frontmatter = frontmatter.replace(
        /^description:\s*""?\s*$/m,
        `description: "${escaped}"`
      );
      changed = true;
      stats.description++;
    }
  }

  // === Task 4: Normalize tags ===
  const tagMatch = frontmatter.match(/^tags:\s*\[([^\]]*)\]\s*$/m);
  if (tagMatch && tagMatch[1].trim()) {
    const rawTags = tagMatch[1];
    const tags = rawTags.split(',').map(t => t.trim()).filter(Boolean);
    const normalized = [...new Set(tags.map(t => TAG_MAP[t] || t.toLowerCase()))];
    const newTagLine = `tags: [${normalized.join(', ')}]`;
    const oldTagLine = tagMatch[0].trim();
    if (newTagLine !== oldTagLine) {
      frontmatter = frontmatter.replace(tagMatch[0].trim(), newTagLine);
      changed = true;
      stats.tags++;
    }
  }

  // === Task 6: Convert Notion <aside> to blockquote ===
  let newBody = body;
  if (body.includes('<aside>') || body.includes('<aside ')) {
    // Pattern: <aside>\n emoji content \n</aside>
    newBody = newBody.replace(
      /<aside[^>]*>\s*\n?([\s\S]*?)\n?\s*<\/aside>/g,
      (_, inner) => {
        const lines = inner.trim().split('\n');
        return lines.map(l => '> ' + l).join('\n');
      }
    );
    if (newBody !== body) {
      changed = true;
      stats.aside++;
    }
  }

  if (changed) {
    const result = `---\n${frontmatter}\n---\n${newBody}`;
    await writeFile(filePath, result, 'utf-8');
    stats.total++;
  }
}

function extractFirstSentence(body) {
  // Strip markdown artifacts to get clean text
  let text = body
    .replace(/^#+ .*/gm, '')           // headings
    .replace(/^>.*$/gm, '')             // blockquotes
    .replace(/^[-*] .*/gm, '')          // list items
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links → text
    .replace(/```[\s\S]*?```/g, '')     // code blocks
    .replace(/`[^`]+`/g, '')            // inline code
    .replace(/^\s*[-*_]{3,}\s*$/gm, '') // hr
    .replace(/<[^>]+>/g, '')            // HTML tags
    .trim();

  // Get first meaningful line (at least 10 chars)
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 10);
  if (lines.length === 0) return '';

  let sentence = lines[0];
  // Truncate at sentence boundary or 150 chars
  const sentenceEnd = sentence.search(/[.!?。]\s|$/);
  if (sentenceEnd > 0 && sentenceEnd < 150) {
    sentence = sentence.slice(0, sentenceEnd + 1);
  } else if (sentence.length > 150) {
    sentence = sentence.slice(0, 147) + '...';
  }

  return sentence.trim();
}

async function main() {
  const files = (await readdir(POSTS_DIR))
    .filter(f => f.endsWith('.md') || f.endsWith('.mdx'))
    .map(f => path.join(POSTS_DIR, f));

  console.log(`Processing ${files.length} posts...\n`);

  for (const f of files) {
    await processFile(f);
  }

  console.log('=== Results ===');
  console.log(`  Descriptions filled: ${stats.description}`);
  console.log(`  Tags normalized:     ${stats.tags}`);
  console.log(`  Aside→blockquote:    ${stats.aside}`);
  console.log(`  Total files changed: ${stats.total}`);
}

main().catch(console.error);
