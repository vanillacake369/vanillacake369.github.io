/**
 * Footnote Preview — hover tooltips + instant scroll
 *
 * Adapts to remark-footnotes output:
 *   ref:     <sup><a href="#user-content-fn-N" id="user-content-fnref-N" data-footnote-ref>N</a></sup>
 *   fn:      <li id="user-content-fn-N"><p>content <a href="#user-content-fnref-N" data-footnote-backref>↩</a></p></li>
 *   section: <section class="footnotes" data-footnotes>
 */

const REF_SELECTOR = 'a[data-footnote-ref]';
const BACKREF_SELECTOR = 'a[data-footnote-backref]';
const FOOTNOTES_SELECTOR = 'section.footnotes, .footnotes';

let tooltip: HTMLElement | null = null;

function getOrCreateTooltip(): HTMLElement {
  if (tooltip && document.contains(tooltip)) return tooltip;
  tooltip = document.createElement('div');
  tooltip.id = 'fn-tooltip';
  tooltip.hidden = true;
  tooltip.setAttribute('role', 'tooltip');
  document.body.appendChild(tooltip);
  return tooltip;
}

function showTooltip(anchor: HTMLElement, html: string): void {
  const tip = getOrCreateTooltip();

  const rect = anchor.getBoundingClientRect();
  tip.innerHTML = html;
  tip.hidden = false;
  const tipWidth = tip.offsetWidth;
  let left = rect.left;
  if (left + tipWidth > window.innerWidth) {
    left = window.innerWidth - tipWidth - 16;
  }

  tip.style.position = 'fixed';
  tip.style.left = `${Math.max(8, left)}px`;
  tip.style.top = `${rect.bottom + 6}px`;
}

function hideTooltip(): void {
  const tip = getOrCreateTooltip();
  tip.hidden = true;
  tip.innerHTML = '';
}

function getFootnoteContent(href: string): string {
  const id = href.replace('#', '');
  const fn = document.getElementById(id);
  if (!fn) return '';
  const clone = fn.cloneNode(true) as HTMLElement;
  // Remove backref links from preview
  clone.querySelectorAll('[data-footnote-backref]').forEach(el => el.remove());
  // Get inner paragraph content
  const p = clone.querySelector('p');
  return p ? p.innerHTML : clone.innerHTML;
}

function getRefContext(href: string): string {
  const id = href.replace('#', '');
  const ref = document.getElementById(id);
  if (!ref) return '';
  const parent = ref.closest('p') ?? ref.parentElement;
  if (!parent) return '';
  const text = parent.textContent ?? '';
  return text.length > 120 ? text.slice(0, 120) + '…' : text;
}

export function initFootnotePreview(): void {
  getOrCreateTooltip();

  const article = document.querySelector('.post-body');
  if (!article) return;

  // --- Ref links (in article body): hover + click ---
  article.addEventListener('mouseenter', (e: Event) => {
    const target = (e.target as HTMLElement).closest?.(REF_SELECTOR) as HTMLAnchorElement | null;
    if (!target) return;
    const href = target.getAttribute('href');
    if (!href) return;
    const content = getFootnoteContent(href);
    if (content) showTooltip(target, content);
  }, true);

  article.addEventListener('mouseleave', (e: Event) => {
    if ((e.target as HTMLElement).closest?.(REF_SELECTOR)) hideTooltip();
  }, true);

  article.addEventListener('click', (e: Event) => {
    const target = (e.target as HTMLElement).closest?.(REF_SELECTOR) as HTMLAnchorElement | null;
    if (!target) return;
    e.preventDefault();
    hideTooltip();
    const href = target.getAttribute('href');
    if (!href) return;
    const fn = document.querySelector(href);
    fn?.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'center' });
  });

  // --- Backref links (in footnotes section): hover + click ---
  const footnotes = document.querySelector(FOOTNOTES_SELECTOR);
  if (!footnotes) return;

  footnotes.addEventListener('mouseenter', (e: Event) => {
    const target = (e.target as HTMLElement).closest?.(BACKREF_SELECTOR) as HTMLAnchorElement | null;
    if (!target) return;
    const href = target.getAttribute('href');
    if (!href) return;
    const context = getRefContext(href);
    if (context) showTooltip(target, context);
  }, true);

  footnotes.addEventListener('mouseleave', (e: Event) => {
    if ((e.target as HTMLElement).closest?.(BACKREF_SELECTOR)) hideTooltip();
  }, true);

  footnotes.addEventListener('click', (e: Event) => {
    const target = (e.target as HTMLElement).closest?.(BACKREF_SELECTOR) as HTMLAnchorElement | null;
    if (!target) return;
    e.preventDefault();
    hideTooltip();
    const href = target.getAttribute('href');
    if (!href) return;
    const ref = document.querySelector(href);
    ref?.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'center' });
  });
}
