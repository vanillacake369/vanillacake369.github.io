import { describe, it, expect, beforeEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Helpers that mirror the logic in MermaidInit.astro and CodeCopyButton.astro
// ---------------------------------------------------------------------------

/** Returns true when the <pre> contains a mermaid code block. */
function isMermaidPre(pre: Element): boolean {
  return pre.querySelector('code.language-mermaid') !== null;
}

/** Collects all non-mermaid <pre> elements — the targets for copy buttons. */
function getCodePres(container: Element): HTMLElement[] {
  return (Array.from(container.querySelectorAll('pre')) as HTMLElement[]).filter(
    (pre) => !isMermaidPre(pre),
  );
}

/** Returns mermaid <pre> elements to be replaced by the mermaid script. */
function getMermaidPres(container: Element): HTMLElement[] {
  return (Array.from(container.querySelectorAll('pre')) as HTMLElement[]).filter(isMermaidPre);
}

/** Extracts heading data as the TOC component would consume it. */
interface Heading {
  depth: number;
  slug: string;
  text: string;
}

function extractTocHeadings(container: Element): Heading[] {
  const els = Array.from(
    container.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6'),
  );
  return els
    .filter((el) => el.id)
    .map((el) => ({
      depth: parseInt(el.tagName[1], 10),
      slug: el.id,
      text: el.textContent?.trim() ?? '',
    }))
    .filter((h) => h.depth >= 2 && h.depth <= 4);
}

// ---------------------------------------------------------------------------
// Mermaid selector tests
// ---------------------------------------------------------------------------

describe('MermaidInit — selector logic', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('identifies a mermaid pre block by code.language-mermaid', () => {
    container.innerHTML = `
      <pre><code class="language-mermaid">flowchart TD\n  A --> B</code></pre>
    `;
    const mermaidBlocks = getMermaidPres(container);
    expect(mermaidBlocks).toHaveLength(1);
  });

  it('does not flag a regular code block as mermaid', () => {
    container.innerHTML = `
      <pre><code class="language-typescript">const x = 1;</code></pre>
    `;
    const mermaidBlocks = getMermaidPres(container);
    expect(mermaidBlocks).toHaveLength(0);
  });

  it('handles mixed mermaid and regular code blocks', () => {
    container.innerHTML = `
      <pre><code class="language-mermaid">graph LR\n  A --> B</code></pre>
      <pre><code class="language-go">fmt.Println("hello")</code></pre>
      <pre><code class="language-mermaid">sequenceDiagram\n  A->>B: hi</code></pre>
    `;
    expect(getMermaidPres(container)).toHaveLength(2);
    expect(getCodePres(container)).toHaveLength(1);
  });

  it('replaces pre with div.mermaid containing the diagram source', () => {
    container.innerHTML = `
      <pre><code class="language-mermaid">flowchart LR\n  X --> Y</code></pre>
    `;
    const pre = getMermaidPres(container)[0];
    const code = pre.querySelector('code.language-mermaid')!;
    const diagram = code.textContent ?? '';

    const div = document.createElement('div');
    div.className = 'mermaid';
    div.textContent = diagram;
    pre.replaceWith(div);

    expect(container.querySelector('pre')).toBeNull();
    expect(container.querySelector('div.mermaid')?.textContent).toContain('flowchart LR');
  });
});

// ---------------------------------------------------------------------------
// Code copy button tests
// ---------------------------------------------------------------------------

describe('CodeCopyButton — clipboard logic', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');

    // Mock clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('targets non-mermaid pre elements only', () => {
    container.innerHTML = `
      <pre><code class="language-go">fmt.Println("hi")</code></pre>
      <pre><code class="language-mermaid">graph TD\n  A-->B</code></pre>
      <pre><code class="language-bash">echo hello</code></pre>
    `;
    const targets = getCodePres(container);
    expect(targets).toHaveLength(2);
    for (const pre of targets) {
      expect(isMermaidPre(pre)).toBe(false);
    }
  });

  it('copies code element innerText on click', async () => {
    container.innerHTML = `<pre><code class="language-typescript">const x = 1;</code></pre>`;
    const pre = getCodePres(container)[0];
    const code = pre.querySelector('code')!;

    // Simulate what the copy button click handler does
    const text = code.innerText ?? code.textContent ?? '';
    await navigator.clipboard.writeText(text);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('const x'),
    );
  });

  it('does not add copy button to mermaid pre', () => {
    container.innerHTML = `
      <pre><code class="language-mermaid">flowchart TD\n  A-->B</code></pre>
    `;
    const targets = getCodePres(container);
    expect(targets).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// TOC heading extraction tests
// ---------------------------------------------------------------------------

describe('TOC — heading extraction logic', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('extracts h2-h4 headings with ids', () => {
    container.innerHTML = `
      <h1 id="title">Title</h1>
      <h2 id="intro">Introduction</h2>
      <h3 id="sub">Sub-section</h3>
      <h4 id="deep">Deep</h4>
      <h5 id="too-deep">Too Deep</h5>
    `;
    const headings = extractTocHeadings(container);
    expect(headings).toHaveLength(3);
    expect(headings[0]).toEqual({ depth: 2, slug: 'intro', text: 'Introduction' });
    expect(headings[1]).toEqual({ depth: 3, slug: 'sub', text: 'Sub-section' });
    expect(headings[2]).toEqual({ depth: 4, slug: 'deep', text: 'Deep' });
  });

  it('excludes headings without ids', () => {
    container.innerHTML = `
      <h2>No id here</h2>
      <h2 id="has-id">Has ID</h2>
    `;
    const headings = extractTocHeadings(container);
    expect(headings).toHaveLength(1);
    expect(headings[0].slug).toBe('has-id');
  });

  it('returns empty array when no qualifying headings exist', () => {
    container.innerHTML = `<p>Just a paragraph</p>`;
    expect(extractTocHeadings(container)).toHaveLength(0);
  });

  it('preserves heading order', () => {
    container.innerHTML = `
      <h2 id="a">A</h2>
      <h3 id="b">B</h3>
      <h2 id="c">C</h2>
      <h4 id="d">D</h4>
    `;
    const slugs = extractTocHeadings(container).map((h) => h.slug);
    expect(slugs).toEqual(['a', 'b', 'c', 'd']);
  });

  it('computes correct depth from heading tag', () => {
    container.innerHTML = `
      <h2 id="h2">H2</h2>
      <h3 id="h3">H3</h3>
      <h4 id="h4">H4</h4>
    `;
    const depths = extractTocHeadings(container).map((h) => h.depth);
    expect(depths).toEqual([2, 3, 4]);
  });
});
