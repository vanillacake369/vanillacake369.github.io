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
  const re = new RegExp(escapeRegExp(query), 'gi');

  // Walk all text nodes in body, skipping unwanted elements
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node: Node): number {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        // Skip vim UI elements
        if (parent.closest('#vim-search-bar, #vim-fuzzy-overlay, #vim-whichkey')) {
          return NodeFilter.FILTER_REJECT;
        }
        if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    },
  );

  // Collect all text nodes first (cannot mutate DOM while walking)
  const textNodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode()) !== null) {
    textNodes.push(node as Text);
  }

  for (const textNode of textNodes) {
    const text = textNode.nodeValue ?? '';
    if (!re.test(text)) {
      re.lastIndex = 0;
      continue;
    }
    re.lastIndex = 0;

    // Split the text node and insert <mark> elements for each match
    const parent = textNode.parentNode;
    if (!parent) continue;

    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let m: RegExpExecArray | null;

    re.lastIndex = 0;
    while ((m = re.exec(text)) !== null) {
      const start = m.index;
      const end = start + m[0].length;

      // Text before match
      if (start > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, start)));
      }

      // The <mark> element
      const mark = document.createElement('mark');
      mark.className = 'vim-search-match';
      mark.textContent = m[0];
      fragment.appendChild(mark);

      matches.push({ node: textNode, highlight: mark });
      lastIndex = end;
    }

    // Remaining text after last match
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

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
