import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkFootnotes from 'remark-footnotes';

export const markdownRemarkPlugins = [
  remarkGfm,
  [remarkFootnotes, { inlineNotes: true }],
  remarkMath,
];

export const markdownRehypePlugins = [
  rehypeKatex,
];

export function isSoftBreaksEnabled() {
  return process.env.MARKDOWN_SOFT_BREAKS === '1';
}

export function getMarkdownRemarkPlugins(options = {}) {
  const softBreaks = options.softBreaks ?? isSoftBreaksEnabled();
  return softBreaks
    ? [...markdownRemarkPlugins, remarkBreaks]
    : [...markdownRemarkPlugins];
}

export function stripFrontmatter(source) {
  return source.replace(/^---\n[\s\S]*?\n---\n*/u, '');
}

export function createMarkdownProcessor(options = {}) {
  const processor = unified()
    .use(remarkParse);

  for (const plugin of getMarkdownRemarkPlugins(options)) {
    if (Array.isArray(plugin)) {
      processor.use(plugin[0], plugin[1]);
    } else {
      processor.use(plugin);
    }
  }

  processor.use(remarkRehype);

  for (const plugin of markdownRehypePlugins) {
    if (Array.isArray(plugin)) {
      processor.use(plugin[0], plugin[1]);
    } else {
      processor.use(plugin);
    }
  }

  return processor.use(rehypeStringify);
}

export async function renderMarkdownHtml(source, options = {}) {
  const file = await createMarkdownProcessor(options).process(source);
  return String(file);
}
