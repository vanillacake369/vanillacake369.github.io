// which-key.ts — Key-hint popup rendered at bottom of screen

import type { WhichKeyGroup } from './types';

let el: HTMLElement | null = null;
let innerEl: HTMLElement | null = null;

export function init(els: { el: HTMLElement; inner: HTMLElement }): void {
  el = els.el;
  innerEl = els.inner;
}

export function show(groups: WhichKeyGroup[]): void {
  if (!el || !innerEl) return;

  innerEl.innerHTML = '';

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
    innerEl.appendChild(groupEl);
  }

  el.hidden = false;
  // Trigger animation: force reflow then add visible class
  el.getBoundingClientRect();
  el.classList.add('vim-whichkey--visible');
}

export function hide(): void {
  if (!el) return;
  el.classList.remove('vim-whichkey--visible');
  // Wait for transition then hide
  const handleTransitionEnd = (): void => {
    if (el) el.hidden = true;
    el?.removeEventListener('transitionend', handleTransitionEnd);
  };
  el.addEventListener('transitionend', handleTransitionEnd);
  // Fallback in case transition doesn't fire (e.g., prefers-reduced-motion)
  setTimeout(() => {
    if (el && !el.hidden) el.hidden = true;
  }, 200);
}
