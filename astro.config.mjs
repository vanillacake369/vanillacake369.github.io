// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import {
  getMarkdownRemarkPlugins,
  markdownRehypePlugins,
} from './src/shared/markdown/pipeline.mjs';
import monokaiDeepDark from './src/styles/themes/shiki/monokai-deep-dark.mjs';
import monokaiProLight from './src/styles/themes/shiki/monokai-pro-light.mjs';
import { buildLastmodMap } from './scripts/sitemap-lastmod.mjs';

const lastmodMap = buildLastmodMap();
const POST_URL_RE = /^\/posts\/([^/]+)\/?$/;

export default defineConfig({
  site: 'https://vanillacake369.github.io',
  output: 'static',
  integrations: [
    mdx(),
    sitemap({
      serialize(item) {
        const url = new URL(item.url);
        const match = url.pathname.match(POST_URL_RE);
        if (match) {
          const slug = decodeURIComponent(match[1]);
          const date = lastmodMap.get(slug);
          if (date) item.lastmod = date.toISOString();
        }
        return item;
      },
    }),
  ],
  markdown: {
    remarkPlugins: getMarkdownRemarkPlugins(),
    rehypePlugins: markdownRehypePlugins,
    shikiConfig: {
      themes: {
        light: monokaiProLight,
        dark: monokaiDeepDark,
      },
    },
  },
});
