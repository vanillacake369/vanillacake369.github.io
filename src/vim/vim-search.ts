// vim-search.ts — In-page "/" text search using TreeWalker + <mark> elements

import type { SearchMatch } from './types';

let barEl: HTMLElement | null = null;
let inputEl: HTMLInputElement | null = null;
let countEl: HTMLElement | null = null;
let onCloseCallback: (() => void) | null = null;

let matches: SearchMatch[] = [];
let currentIndex = -1;

// Nodes that should not be walked for text matches
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'SELECT', 'MARK']);

// Debounce timer for input → setQuery
let queryDebounce: ReturnType<typeof setTimeout> | null = null;
const QUERY_DEBOUNCE_MS = 60;

export function init(els: {
  bar: HTMLElement;
  input: HTMLInputElement;
  count: HTMLElement;
}): void {
  barEl = els.bar;
  inputEl = els.input;
  countEl = els.count;

  // Track Korean IME composition state to avoid duplicate characters
  let composing = false;
  inputEl.addEventListener('compositionstart', () => {
    composing = true;
  });
  inputEl.addEventListener('compositionend', () => {
    composing = false;
    setQuery(inputEl!.value);
  });
  inputEl.addEventListener('input', () => {
    if (composing) return;
    if (queryDebounce !== null) clearTimeout(queryDebounce);
    queryDebounce = setTimeout(() => setQuery(inputEl!.value), QUERY_DEBOUNCE_MS);
  });

  // Enter: confirm search, blur input so n/N work
  inputEl.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      // Flush pending debounce immediately on Enter
      if (queryDebounce !== null) {
        clearTimeout(queryDebounce);
        queryDebounce = null;
        setQuery(inputEl!.value);
      }
      inputEl!.blur();
    }
  });

  // Auto-highlight from ?highlight= URL param (from fuzzy finder navigation)
  const params = new URLSearchParams(window.location.search);
  const highlight = params.get('highlight');
  if (highlight) {
    // Delay to ensure page is fully rendered and keyboard-controller is ready
    setTimeout(() => {
      setQuery(highlight, { crossElement: true });

      // Show search bar with the query so user sees context + can refine with /
      if (barEl && inputEl) {
        barEl.hidden = false;
        inputEl.value = highlight;
        // Keep input blurred so n/N work immediately
      }

      // Scroll to first match in the prose/article area (skip footnotes, header, nav)
      if (matches.length > 0) {
        const proseMatch = matches.find(m => {
          const el = m.highlight;
          return !el.closest('.footnotes, header, nav, footer, .site-header');
        });
        if (proseMatch) {
          const idx = matches.indexOf(proseMatch);
          currentIndex = idx;
          activateMatch(idx);
          updateCount();
        }
      }

      // Signal keyboard-controller to enter search mode
      document.dispatchEvent(new CustomEvent('vim:search-activated'));
    }, 100);
    const clean = window.location.pathname + window.location.hash;
    window.history.replaceState({}, '', clean);
  }
}

export function open(onClose: () => void): void {
  onCloseCallback = onClose;
  if (!barEl || !inputEl) return;
  barEl.hidden = false;
  inputEl.value = '';
  inputEl.focus();
  clearMarks();
  updateCount();
}

export function refocus(): void {
  if (!inputEl) return;
  inputEl.focus();
  const len = inputEl.value.length;
  inputEl.setSelectionRange(len, len);
}

export function close(): void {
  if (!barEl || !inputEl) return;
  barEl.hidden = true;
  inputEl.value = '';
  clearMarks();
  if (onCloseCallback) {
    onCloseCallback();
    onCloseCallback = null;
  }
}

export function setQuery(query: string, opts?: { crossElement?: boolean }): void {
  clearMarks();
  if (!query) {
    updateCount();
    return;
  }
  buildMarks(query, opts?.crossElement);
  if (matches.length > 0) {
    currentIndex = 0;
    activateMatch(currentIndex);
  }
  updateCount();
}

export function next(): void {
  if (matches.length === 0) return;
  currentIndex = (currentIndex + 1) % matches.length;
  activateMatch(currentIndex);
  updateCount();
}

export function prev(): void {
  if (matches.length === 0) return;
  currentIndex = (currentIndex - 1 + matches.length) % matches.length;
  activateMatch(currentIndex);
  updateCount();
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function clearMarks(): void {
  // Collect unique parents first, then normalize once per parent (avoids O(n) reflows)
  const parents = new Set<Node>();
  for (const match of matches) {
    const mark = match.highlight;
    const parent = mark.parentNode;
    if (!parent) continue;
    parent.replaceChild(document.createTextNode(mark.textContent ?? ''), mark);
    parents.add(parent);
  }
  for (const parent of parents) parent.normalize();
  matches = [];
  currentIndex = -1;
  prevActiveIndex = -1;
}

function buildMarks(query: string, crossElement = false): void {
  // window.find: can match across element boundaries (e.g. Shiki code spans)
  //   but it hijacks the browser selection → disrupts typing in the input.
  // TreeWalker: selection-safe, used for live-as-you-type highlighting.
  // window.find is reserved for non-interactive cases (?highlight= on page load).
  if (crossElement && typeof (window as unknown as { find?: unknown }).find === 'function') {
    buildMarksWithWindowFind(query);
  } else {
    buildMarksWithTreeWalker(query);
  }
}

function buildMarksWithWindowFind(query: string): void {
  const sel = window.getSelection();
  if (!sel) return;

  sel.removeAllRanges();
  sel.collapse(document.body, 0);

  // Safety caps — MAX_MATCHES limits real hits, MAX_ITERATIONS limits total
  // loop cycles (including skipped ones) to guard against Safari wrap-around.
  const MAX_MATCHES = 5000;
  const MAX_ITERATIONS = 10_000;
  let iterations = 0;

  // @ts-expect-error window.find is non-standard but widely supported
  while (window.find(query, false, false, false, false, false, false)) {
    if (++iterations > MAX_ITERATIONS) break;

    const range = sel.getRangeAt(0);
    const container = range.startContainer;
    const parentEl = container.nodeType === Node.ELEMENT_NODE
      ? container as Element : container.parentElement;

    // Skip matches inside our own UI or already-created marks
    if (parentEl?.closest('#vim-search-bar, #vim-fuzzy-overlay, #vim-whichkey, .toc-sidebar, mark.vim-search-match')) {
      sel.collapseToEnd();
      continue;
    }

    const mark = document.createElement('mark');
    mark.className = 'vim-search-match';
    try {
      range.surroundContents(mark);
    } catch {
      const fragment = range.extractContents();
      mark.appendChild(fragment);
      range.insertNode(mark);
    }
    matches.push({ node: mark.firstChild as Text, highlight: mark });
    sel.collapse(mark, mark.childNodes.length);

    if (matches.length >= MAX_MATCHES) break;
  }
  sel.removeAllRanges();
}

function buildMarksWithTreeWalker(query: string): void {
  const re = new RegExp(escapeRegExp(query), 'gi');

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node: Node): number {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest('#vim-search-bar, #vim-fuzzy-overlay, #vim-whichkey, .toc-sidebar')) return NodeFilter.FILTER_REJECT;
      if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode()) !== null) textNodes.push(node as Text);

  for (const textNode of textNodes) {
    const text = textNode.nodeValue ?? '';
    re.lastIndex = 0;
    if (!re.test(text)) continue;
    re.lastIndex = 0;

    const parent = textNode.parentNode;
    if (!parent) continue;

    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(text)) !== null) {
      if (m.index > lastIndex) fragment.appendChild(document.createTextNode(text.slice(lastIndex, m.index)));
      const mark = document.createElement('mark');
      mark.className = 'vim-search-match';
      mark.textContent = m[0];
      fragment.appendChild(mark);
      matches.push({ node: textNode, highlight: mark });
      lastIndex = m.index + m[0].length;
    }
    if (lastIndex < text.length) fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    parent.replaceChild(fragment, textNode);
  }
}

let prevActiveIndex = -1;

function activateMatch(index: number): void {
  // O(1): only touch the previous and new active elements
  if (prevActiveIndex >= 0 && prevActiveIndex < matches.length) {
    matches[prevActiveIndex].highlight.classList.remove('vim-search-match--active');
  }
  if (index >= 0 && index < matches.length) {
    matches[index].highlight.classList.add('vim-search-match--active');
    matches[index].highlight.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  prevActiveIndex = index;
}

function updateCount(): void {
  if (!countEl) return;
  if (matches.length === 0) {
    countEl.textContent = '';
  } else {
    countEl.textContent = `${currentIndex + 1}/${matches.length}`;
  }
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
