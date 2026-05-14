// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkFootnotes from 'remark-footnotes';
import remarkBreaks from 'remark-breaks';
import monokaiDeepDark from './src/styles/themes/shiki/monokai-deep-dark.mjs';
import monokaiProLight from './src/styles/themes/shiki/monokai-pro-light.mjs';

export default defineConfig({
  site: 'https://vanillacake369.github.io',
  output: 'static',
  integrations: [mdx(), sitemap()],
  markdown: {
    remarkPlugins: [
      remarkGfm,
      remarkBreaks,
      [remarkFootnotes, { inlineNotes: true }],
      remarkMath,
    ],
    rehypePlugins: [
      rehypeKatex,
    ],
    shikiConfig: {
      themes: {
        light: monokaiProLight,
        dark: monokaiDeepDark,
      },
    },
  },
});
