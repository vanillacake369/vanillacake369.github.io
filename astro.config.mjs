// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkFootnotes from 'remark-footnotes';

export default defineConfig({
  site: 'https://vanillacake369.github.io',
  output: 'static',
  integrations: [mdx()],
  markdown: {
    remarkPlugins: [
      remarkGfm,
      [remarkFootnotes, { inlineNotes: true }],
      remarkMath,
    ],
    rehypePlugins: [
      rehypeKatex,
    ],
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    },
  },
});
