import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import {
  isSoftBreaksEnabled,
  renderMarkdownHtml,
  stripFrontmatter,
} from '../../shared/markdown/pipeline.mjs';

function extractParagraphTexts(html: string): string[] {
  const container = document.createElement('div');
  container.innerHTML = html;
  return Array.from(container.querySelectorAll('p')).map((p) =>
    p.textContent?.replace(/\s+/g, ' ').trim() ?? '',
  );
}

describe('Markdown paragraph policy', () => {
  it('keeps single newlines inside the same paragraph when soft breaks are disabled', async () => {
    const html = await renderMarkdownHtml('Line 1\nLine 2\nLine 3', {
      softBreaks: false,
    });
    const paragraphs = extractParagraphTexts(html);

    expect(paragraphs).toHaveLength(1);
    expect(paragraphs[0]).toBe('Line 1 Line 2 Line 3');
    expect(html).not.toContain('<br');
  });

  it('renders single newlines as <br> when soft breaks are enabled', async () => {
    const html = await renderMarkdownHtml('Line 1\nLine 2\nLine 3', {
      softBreaks: true,
    });
    const paragraphs = extractParagraphTexts(html);

    expect(paragraphs).toHaveLength(1);
    expect(paragraphs[0]).toBe('Line 1 Line 2 Line 3');
    expect(html).toContain('<br');
  });

  it('splits paragraphs on empty lines', async () => {
    const html = await renderMarkdownHtml('First paragraph.\n\nSecond paragraph.', {
      softBreaks: false,
    });
    const paragraphs = extractParagraphTexts(html);

    expect(paragraphs).toHaveLength(2);
    expect(paragraphs).toEqual(['First paragraph.', 'Second paragraph.']);
  });

  it('renders the NixOS IaC intro as separate paragraphs', async () => {
    const source = fs.readFileSync(
      'src/content/posts/NixOS Ecosystem/03-2026-05-08-NixOS IaC 설계: 계약, 계층, 순수 함수로 홈랩 제어하기.md',
      'utf8',
    );
    const html = await renderMarkdownHtml(stripFrontmatter(source), {
      softBreaks: false,
    });
    const paragraphs = extractParagraphTexts(html);

    expect(paragraphs[0]).toContain('홈랩에 Kubernetes 클러스터를 구축한다고 가정해보자.');
    expect(paragraphs[0]).toContain('Terraform이나 OpenTofu로 VM을 프로비저닝할 수 있겠지만');
    expect(paragraphs[1]).toContain('이때 NixOS를 도입하면 커널부터 부트로더까지');
    expect(paragraphs[2]).toContain('NixOS가 보장하는 것은');
    expect(html).not.toContain('<br');
  });

  it('defaults soft breaks to the runtime feature flag', () => {
    expect(isSoftBreaksEnabled()).toBe(false);
  });
});
