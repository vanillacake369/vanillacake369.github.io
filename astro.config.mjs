// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import robotsTxt from 'astro-robots-txt';
import {
  getMarkdownRemarkPlugins,
  markdownRehypePlugins,
} from './src/shared/markdown/pipeline.mjs';
import monokaiDeepDark from './src/styles/themes/shiki/monokai-deep-dark.mjs';
import monokaiProLight from './src/styles/themes/shiki/monokai-pro-light.mjs';
import { buildLastmodMap } from './scripts/sitemap-lastmod.mjs';

const lastmodMap = buildLastmodMap();

export default defineConfig({
  site: 'https://vanillacake369.github.io',
  output: 'static',
  integrations: [
    mdx(),
    sitemap({
      serialize(item) {
        const url = new URL(item.url);
        // Match /posts/... including nested paths
        const match = url.pathname.match(/^\/posts\/(.+?)\/?$/);
        if (match) {
          const slug = decodeURIComponent(match[1]);
          const date = lastmodMap.get(slug);
          if (date) {
            item.lastmod = date.toISOString();
            item.changefreq = 'monthly';
            item.priority = 0.8;
          } else {
            item.changefreq = 'weekly';
            item.priority = 0.7;
          }
        } else {
          // Default for other pages (index, about, etc.)
          item.changefreq = 'weekly';
          item.priority = url.pathname === '/' ? 1.0 : 0.5;
        }
        return item;
      },
    }),
    robotsTxt({
      sitemap: 'https://vanillacake369.github.io/sitemap-index.xml',
      policy: [
        {
          userAgent: 'GPTBot',
          disallow: '/',
        },
        {
          userAgent: 'ChatGPT-User',
          disallow: '/',
        },
        {
          userAgent: 'CCBot',
          disallow: '/',
        },
        {
          userAgent: 'anthropic-ai',
          disallow: '/',
        },
        {
          userAgent: 'ClaudeBot',
          disallow: '/',
        },
        {
          userAgent: 'Google-Extended',
          disallow: '/',
        },
        {
          userAgent: 'FacebookBot',
          disallow: '/',
        },
        {
          userAgent: 'Bytespider',
          disallow: '/',
        },
        {
          userAgent: 'Amazonbot',
          disallow: '/',
        },
        {
          userAgent: 'Applebot-Extended',
          disallow: '/',
        },
        {
          userAgent: 'cohere-ai',
          disallow: '/',
        },
        {
          userAgent: 'PerplexityBot',
          disallow: '/',
        },
        {
          userAgent: '*',
          allow: '/',
        },
      ],
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
