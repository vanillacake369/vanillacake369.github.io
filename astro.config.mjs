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

export default defineConfig({
  site: 'https://vanillacake369.github.io',
  output: 'static',
  integrations: [mdx(), sitemap()],
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
