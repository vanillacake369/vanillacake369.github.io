// which-key.ts — Key-hint popup rendered at center of screen

import type { WhichKeyGroup } from './types';

let el: HTMLElement | null = null;
let innerEl: HTMLElement | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

// Cache rendered fragments keyed by group identity (avoids re-creating static DOM)
const renderedCache = new WeakMap<readonly WhichKeyGroup[], DocumentFragment>();

export function init(els: { el: HTMLElement; inner: HTMLElement }): void {
  el = els.el;
  innerEl = els.inner;
}

function buildGroupFragment(groups: readonly WhichKeyGroup[]): DocumentFragment {
  const frag = document.createDocumentFragment();
  for (const group of groups) {
    const groupEl = document.createElement('div');
    groupEl.className = 'vim-whichkey-group';

    const labelEl = document.createElement('span');
    labelEl.className = 'vim-whichkey-group-label';
    labelEl.textContent = group.label;
    groupEl.appendChild(labelEl);

    const entriesEl = document.createElement('div');
    entriesEl.className = 'vim-whichkey-entries';

    for (const entry of group.entries) {
      const entryEl = document.createElement('div');
      entryEl.className = 'vim-whichkey-entry';

      const keyEl = document.createElement('kbd');
      keyEl.className = 'vim-whichkey-key';
      keyEl.textContent = entry.key;

      const descEl = document.createElement('span');
      descEl.className = 'vim-whichkey-desc';
      descEl.textContent = entry.description;

      entryEl.appendChild(keyEl);
      entryEl.appendChild(descEl);
      entriesEl.appendChild(entryEl);
    }

    groupEl.appendChild(entriesEl);
    frag.appendChild(groupEl);
  }
  return frag;
}

export function show(groups: WhichKeyGroup[]): void {
  if (!el || !innerEl) return;

  // Cancel any pending hide
  if (hideTimer !== null) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }

  innerEl.innerHTML = '';

  // Use cached fragment (cloneNode) for static group arrays
  let cached = renderedCache.get(groups);
  if (!cached) {
    cached = buildGroupFragment(groups);
    renderedCache.set(groups, cached);
  }
  innerEl.appendChild(cached.cloneNode(true));

  el.hidden = false;
  el.removeAttribute('aria-hidden');
  // Force reflow then show
  void el.offsetHeight;
  el.classList.add('vim-whichkey--visible');
}

export function hide(): void {
  if (!el) return;
  el.classList.remove('vim-whichkey--visible');
  // Simple timeout to hide after transition (no transitionend stacking)
  if (hideTimer !== null) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    if (el) {
      el.hidden = true;
      el.setAttribute('aria-hidden', 'true');
    }
    hideTimer = null;
  }, 150);
}
