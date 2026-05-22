import { describe, it, expect } from 'vitest';
import { renderMarkdownHtml } from '../../shared/markdown/pipeline.mjs';

describe('remark-video-embed', () => {
  it('converts ![alt](youtube-url) to responsive iframe', async () => {
    const md = '![Demo](https://www.youtube.com/watch?v=G3NeZAyiRqA)';
    const html = await renderMarkdownHtml(md);
    expect(html).toContain('iframe');
    expect(html).toContain('youtube-nocookie.com/embed/G3NeZAyiRqA');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('aspect-ratio');
  });

  it('converts ![](youtu.be short url) to iframe', async () => {
    const md = '![](https://youtu.be/G3NeZAyiRqA)';
    const html = await renderMarkdownHtml(md);
    expect(html).toContain('youtube-nocookie.com/embed/G3NeZAyiRqA');
  });

  it('converts ![](vimeo url) to iframe', async () => {
    const md = '![](https://vimeo.com/123456789)';
    const html = await renderMarkdownHtml(md);
    expect(html).toContain('player.vimeo.com/video/123456789');
  });

  it('keeps regular image ![alt](image.png) as <img>', async () => {
    const md = '![screenshot](./screenshot.png)';
    const html = await renderMarkdownHtml(md);
    expect(html).toContain('<img');
    expect(html).toContain('screenshot.png');
    expect(html).not.toContain('iframe');
  });

  it('keeps [text](youtube-url) as a regular link', async () => {
    const md = '[Watch this](https://www.youtube.com/watch?v=G3NeZAyiRqA)';
    const html = await renderMarkdownHtml(md);
    expect(html).toContain('<a');
    expect(html).toContain('Watch this');
    expect(html).not.toContain('iframe');
  });

  it('renders alt text as figcaption when provided', async () => {
    const md = '![44BITS 인터뷰](https://www.youtube.com/watch?v=G3NeZAyiRqA)';
    const html = await renderMarkdownHtml(md);
    expect(html).toContain('44BITS 인터뷰');
    expect(html).toContain('figcaption');
  });

  it('skips figcaption when alt is empty', async () => {
    const md = '![](https://www.youtube.com/watch?v=G3NeZAyiRqA)';
    const html = await renderMarkdownHtml(md);
    expect(html).not.toContain('figcaption');
  });
});
