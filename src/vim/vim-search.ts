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
    if (!composing) setQuery(inputEl!.value);
  });

  // Enter: confirm search, blur input so n/N work
  inputEl.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      inputEl!.blur();
    }
  });

  // Auto-highlight from ?highlight= URL param (from fuzzy finder navigation)
  const params = new URLSearchParams(window.location.search);
  const highlight = params.get('highlight');
  if (highlight) {
    setQuery(highlight);
    // Clean up URL without reloading
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

export function setQuery(query: string): void {
  clearMarks();
  if (!query) {
    updateCount();
    return;
  }
  buildMarks(query);
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
  for (const match of matches) {
    const mark = match.highlight;
    const parent = mark.parentNode;
    if (!parent) continue;
    // Replace <mark> with its text content
    parent.replaceChild(document.createTextNode(mark.textContent ?? ''), mark);
    parent.normalize();
  }
  matches = [];
  currentIndex = -1;
}

function buildMarks(query: string): void {
  // Try window.find first (handles cross-element matches like Shiki code blocks)
  // Falls back to TreeWalker for test environments where window.find is unavailable
  if (typeof (window as unknown as { find?: unknown }).find === 'function') {
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

  // @ts-expect-error window.find is non-standard but widely supported
  while (window.find(query, false, false, false, false, false, false)) {
    const range = sel.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const parentEl = container.nodeType === Node.ELEMENT_NODE
      ? container as Element : container.parentElement;
    if (parentEl?.closest('#vim-search-bar, #vim-fuzzy-overlay, #vim-whichkey')) continue;

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
  }
  sel.removeAllRanges();
}

function buildMarksWithTreeWalker(query: string): void {
  const re = new RegExp(escapeRegExp(query), 'gi');

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node: Node): number {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest('#vim-search-bar, #vim-fuzzy-overlay, #vim-whichkey')) return NodeFilter.FILTER_REJECT;
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

function activateMatch(index: number): void {
  for (let i = 0; i < matches.length; i++) {
    matches[i].highlight.classList.toggle('vim-search-match--active', i === index);
  }
  matches[index]?.highlight.scrollIntoView({ block: 'center', behavior: 'smooth' });
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
