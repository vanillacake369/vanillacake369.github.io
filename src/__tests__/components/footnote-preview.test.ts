import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Footnote Preview — TDD tests
 * DOM structure matches remark-footnotes actual output:
 *   ref:     <sup><a href="#user-content-fn-N" id="user-content-fnref-N" data-footnote-ref>N</a></sup>
 *   fn:      <li id="user-content-fn-N"><p>content <a href="#user-content-fnref-N" data-footnote-backref>↩</a></p></li>
 */

function setupDOM() {
  document.body.innerHTML = `
    <article class="post-body prose">
      <p>Some text with a footnote<sup><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref aria-describedby="footnote-label">1</a></sup> here.</p>
      <p>Another ref<sup><a href="#user-content-fn-2" id="user-content-fnref-2" data-footnote-ref aria-describedby="footnote-label">2</a></sup> inline.</p>
      <section class="footnotes" data-footnotes>
        <ol>
          <li id="user-content-fn-1">
            <p>This is footnote 1 content. <a href="https://example.com">Link</a>
              <a href="#user-content-fnref-1" data-footnote-backref class="data-footnote-backref" aria-label="Back to reference 1">↩</a>
            </p>
          </li>
          <li id="user-content-fn-2">
            <p>Footnote 2 with <code>code</code>.
              <a href="#user-content-fnref-2" data-footnote-backref class="data-footnote-backref" aria-label="Back to reference 2">↩</a>
            </p>
          </li>
        </ol>
      </section>
    </article>
  `;
}

let initFootnotePreview: () => void;

beforeEach(async () => {
  setupDOM();
  // Re-import to reset module state
  vi.resetModules();
  const mod = await import('../../components/footnote-preview');
  initFootnotePreview = mod.initFootnotePreview;
});

describe('footnote-preview init', () => {
  it('creates tooltip element on init', () => {
    initFootnotePreview();
    const tooltip = document.getElementById('fn-tooltip');
    expect(tooltip).not.toBeNull();
    expect(tooltip?.hidden).toBe(true);
  });

  it('does not create duplicate tooltips on re-init', () => {
    initFootnotePreview();
    initFootnotePreview();
    const tooltips = document.querySelectorAll('#fn-tooltip');
    expect(tooltips.length).toBe(1);
  });
});

describe('ref hover → footnote preview', () => {
  it('shows tooltip with footnote content on mouseenter', () => {
    initFootnotePreview();
    const ref = document.querySelector('[data-footnote-ref]') as HTMLElement;
    ref.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

    const tooltip = document.getElementById('fn-tooltip')!;
    expect(tooltip.hidden).toBe(false);
    expect(tooltip.textContent).toContain('footnote 1 content');
  });

  it('hides tooltip on mouseleave after delay', () => {
    vi.useFakeTimers();
    initFootnotePreview();
    const ref = document.querySelector('[data-footnote-ref]') as HTMLElement;
    ref.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    ref.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));

    const tooltip = document.getElementById('fn-tooltip')!;
    // Not hidden immediately — delayed to allow mouse to enter tooltip
    expect(tooltip.hidden).toBe(false);
    vi.advanceTimersByTime(200);
    expect(tooltip.hidden).toBe(true);
    vi.useRealTimers();
  });
});

describe('ref click → instant scroll', () => {
  it('scrolls to footnote without smooth behavior', () => {
    initFootnotePreview();
    const scrollSpy = vi.fn();
    const fn1 = document.getElementById('user-content-fn-1')!;
    fn1.scrollIntoView = scrollSpy;

    const ref = document.querySelector('[data-footnote-ref]') as HTMLAnchorElement;
    ref.click();

    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'instant', block: 'center' });
  });

  it('prevents default anchor navigation', () => {
    initFootnotePreview();
    const ref = document.querySelector('[data-footnote-ref]') as HTMLAnchorElement;
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    ref.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });
});

describe('backref hover → original context preview', () => {
  it('shows tooltip with surrounding text on backref mouseenter', () => {
    initFootnotePreview();
    const backref = document.querySelector('[data-footnote-backref]') as HTMLElement;
    backref.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

    const tooltip = document.getElementById('fn-tooltip')!;
    expect(tooltip.hidden).toBe(false);
    expect(tooltip.textContent).toContain('footnote');
  });
});

describe('backref click → instant scroll back', () => {
  it('scrolls back to ref position instantly', () => {
    initFootnotePreview();
    const scrollSpy = vi.fn();
    const fnref1 = document.getElementById('user-content-fnref-1')!;
    fnref1.scrollIntoView = scrollSpy;

    const backref = document.querySelector('[data-footnote-backref]') as HTMLAnchorElement;
    backref.click();

    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'instant', block: 'center' });
  });
});
