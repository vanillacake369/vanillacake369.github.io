// fuzzy-finder.ts — Telescope-style modal for navigating posts by title

import type { FuzzyResult } from './types';

// Page index injected at init time (from inline script in FuzzyFinder.astro)
let pages: { url: string; title: string; excerpt?: string; body?: string; tags?: string[] }[] = [];

// DOM refs
let overlayEl: HTMLElement | null = null;
let inputEl: HTMLInputElement | null = null;
let resultListEl: HTMLElement | null = null;
let previewEl: HTMLElement | null = null;
let statusEl: HTMLElement | null = null;

// State
let results: FuzzyResult[] = [];
let selectedIndex = -1;
let currentQuery = '';
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let onCloseCallback: (() => void) | null = null;
let previouslyFocusedEl: HTMLElement | null = null;

export function init(els: {
  overlay: HTMLElement;
  input: HTMLInputElement;
  resultList: HTMLElement;
  preview: HTMLElement;
  status: HTMLElement;
}): void {
  overlayEl = els.overlay;
  inputEl = els.input;
  resultListEl = els.resultList;
  previewEl = els.preview;
  statusEl = els.status;

  inputEl.addEventListener('input', () => {
    const q = inputEl!.value.trim();
    currentQuery = q;
    if (debounceTimer !== null) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => runSearch(q), 80);
  });

  overlayEl.addEventListener('click', (e: MouseEvent) => {
    if (e.target === overlayEl) close();
  });
}

/** Inject page list — called once from the inline script in FuzzyFinder.astro */
export function setPages(list: { url: string; title: string; excerpt?: string; body?: string; tags?: string[] }[]): void {
  pages = list;
}

export function open(_mode: 'files' | 'grep', onClose: () => void): void {
  onCloseCallback = onClose;
  if (!overlayEl || !inputEl) return;
  previouslyFocusedEl = document.activeElement as HTMLElement | null;
  overlayEl.hidden = false;
  inputEl.value = '';
  inputEl.focus();
  results = [];
  selectedIndex = -1;
  currentQuery = '';
  renderResults();
  updateStatus();
}

export function close(): void {
  if (!overlayEl || !inputEl) return;
  overlayEl.hidden = true;
  inputEl.value = '';
  results = [];
  selectedIndex = -1;
  renderResults();
  if (previouslyFocusedEl?.focus) {
    previouslyFocusedEl.focus();
    previouslyFocusedEl = null;
  }
  if (onCloseCallback) {
    onCloseCallback();
    onCloseCallback = null;
  }
}

export function moveDown(): void {
  if (results.length === 0) return;
  selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
  updateSelection();
}

export function moveUp(): void {
  if (results.length === 0) return;
  selectedIndex = Math.max(selectedIndex - 1, 0);
  updateSelection();
}

export function confirm(): void {
  if (selectedIndex < 0 || selectedIndex >= results.length) return;
  window.location.href = results[selectedIndex].url;
}

// ── Internal ──────────────────────────────────────────────────────────────────

const previewCache = new Map<string, string>();
let fetchAbort: AbortController | null = null;

async function fetchPreview(url: string): Promise<void> {
  // Cancel any in-flight request
  if (fetchAbort) fetchAbort.abort();
  fetchAbort = new AbortController();

  // Return cached HTML if available
  const cached = previewCache.get(url);
  if (cached) {
    renderPreviewBody(cached);
    return;
  }

  try {
    const res = await fetch(url, { signal: fetchAbort.signal });
    if (!res.ok) return;
    const html = await res.text();
    // Extract .post-body content from the fetched page
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const body = doc.querySelector('.post-body');
    const content = body?.innerHTML ?? '';
    previewCache.set(url, content);
    // Only render if the selection hasn't changed
    if (selectedIndex >= 0 && results[selectedIndex]?.url === url) {
      renderPreviewBody(content);
    }
  } catch {
    // Aborted or network error — ignore
  }
}

function renderPreviewBody(html: string): void {
  if (!previewEl) return;
  const bodyEl = previewEl.querySelector('.vim-fuzzy-preview-body');
  if (bodyEl) {
    bodyEl.classList.remove('vim-fuzzy-preview-loading');
    bodyEl.innerHTML = html;
  }
}

function runSearch(query: string): void {
  currentQuery = query;
  if (!query) {
    results = [];
    selectedIndex = -1;
    renderResults();
    updateStatus();
    return;
  }

  const q = query.toLowerCase();
  results = pages
    .filter((p) => p.title.toLowerCase().includes(q))
    .slice(0, 20)
    .map((p) => ({ url: p.url, title: p.title, excerpt: p.excerpt ?? '', body: p.body, tags: p.tags }));

  selectedIndex = results.length > 0 ? 0 : -1;
  renderResults();
  updateStatus();
  updateSelection();
}

function renderResults(): void {
  if (!resultListEl) return;
  resultListEl.innerHTML = '';
  prevSelectedIndex = -1;

  if (results.length === 0) {
    if (inputEl?.value) {
      const empty = document.createElement('div');
      empty.className = 'vim-fuzzy-empty';
      empty.textContent = 'No results found';
      resultListEl.appendChild(empty);
    }
    return;
  }

  const frag = document.createDocumentFragment();
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const item = document.createElement('div');
    item.className = 'vim-fuzzy-item';
    item.dataset.index = String(i);
    item.innerHTML = `
      <span class="vim-fuzzy-item-title">${highlightText(escapeHtml(result.title), currentQuery)}</span>
      <span class="vim-fuzzy-item-url">${escapeHtml(result.url)}</span>
    `;
    frag.appendChild(item);
  }
  resultListEl.appendChild(frag);

  resultListEl.onclick = (e: MouseEvent) => {
    const item = (e.target as HTMLElement).closest<HTMLElement>('.vim-fuzzy-item');
    if (!item) return;
    selectedIndex = Number(item.dataset.index);
    updateSelection();
    confirm();
  };
  resultListEl.onmouseover = (e: MouseEvent) => {
    const item = (e.target as HTMLElement).closest<HTMLElement>('.vim-fuzzy-item');
    if (!item) return;
    const idx = Number(item.dataset.index);
    if (idx === selectedIndex) return;
    selectedIndex = idx;
    updateSelection();
  };
}

let prevSelectedIndex = -1;

function updateSelection(): void {
  if (!resultListEl || !previewEl) return;

  if (prevSelectedIndex !== selectedIndex) {
    if (prevSelectedIndex >= 0) {
      const prev = resultListEl.children[prevSelectedIndex] as HTMLElement | undefined;
      prev?.classList.remove('vim-fuzzy-item--active');
    }
    if (selectedIndex >= 0) {
      const cur = resultListEl.children[selectedIndex] as HTMLElement | undefined;
      if (cur) {
        cur.classList.add('vim-fuzzy-item--active');
        cur.scrollIntoView({ block: 'nearest' });
      }
    }
    prevSelectedIndex = selectedIndex;
  }

  if (selectedIndex >= 0 && selectedIndex < results.length) {
    const result = results[selectedIndex];
    const tagsHtml = result.tags?.length
      ? `<div class="vim-fuzzy-preview-tags">${result.tags.map(t => `<span class="vim-fuzzy-preview-tag">#${escapeHtml(t)}</span>`).join(' ')}</div>`
      : '';
    previewEl.innerHTML =
      `<div class="vim-fuzzy-preview-title">${highlightText(escapeHtml(result.title), currentQuery)}</div>` +
      tagsHtml +
      '<div class="vim-fuzzy-preview-body vim-fuzzy-preview-loading">Loading...</div>';
    fetchPreview(result.url);
  } else {
    previewEl.innerHTML = '<div class="vim-fuzzy-preview-placeholder">Select a result to preview</div>';
  }
}

function updateStatus(): void {
  if (!statusEl) return;
  statusEl.textContent = results.length === 0
    ? ''
    : `${results.length} result${results.length === 1 ? '' : 's'}`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function highlightText(escapedHtml: string, query: string): string {
  if (!query) return escapedHtml;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(${escaped})`, 'gi');
  return escapedHtml.replace(re, '<mark class="vim-search-match">$1</mark>');
}
