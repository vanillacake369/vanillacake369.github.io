// Strips unused namespace declarations from generated sitemap files so that
// every <urlset>/<sitemapindex> opens with only the required xmlns.
// Mirrors the Chirpy fix in jekyll-theme-chirpy#2658 — Google Search Console
// occasionally fails to fetch sitemaps when extra xmlns attributes are present.
import fs from 'node:fs/promises';
import path from 'node:path';

const SITEMAP_NS = 'http://www.sitemaps.org/schemas/sitemap/0.9';

async function listSitemapFiles(distDir) {
  const entries = await fs.readdir(distDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && /^sitemap.*\.xml$/.test(e.name))
    .map((e) => path.join(distDir, e.name));
}

function stripNamespaces(xml) {
  return xml
    .replace(
      /<urlset\b[^>]*>/,
      `<urlset xmlns="${SITEMAP_NS}">`,
    )
    .replace(
      /<sitemapindex\b[^>]*>/,
      `<sitemapindex xmlns="${SITEMAP_NS}">`,
    );
}

async function main() {
  const distDir = path.resolve('./dist');
  const files = await listSitemapFiles(distDir);
  if (files.length === 0) {
    console.log('[sitemap-clean] no sitemap files found in dist/');
    return;
  }
  for (const file of files) {
    const original = await fs.readFile(file, 'utf8');
    const cleaned = stripNamespaces(original);
    if (cleaned !== original) {
      await fs.writeFile(file, cleaned, 'utf8');
      console.log(`[sitemap-clean] cleaned ${path.basename(file)}`);
    } else {
      console.log(`[sitemap-clean] unchanged ${path.basename(file)}`);
    }
  }
}

main().catch((err) => {
  console.error('[sitemap-clean] failed:', err);
  process.exit(1);
});
