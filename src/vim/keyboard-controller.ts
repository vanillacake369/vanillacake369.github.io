// keyboard-controller.ts — Single global keydown listener
// Keybindings: Ctrl+K (leader), Ctrl+P (fuzzy), / (page search), g (nav prefix)

import type { VimMode, WhichKeyGroup } from './types';
import type { Theme } from '../domain/theme';
import { toggleTheme as domainToggleTheme } from '../domain/theme';
import * as vimSearch from './vim-search';
import * as fuzzyFinder from './fuzzy-finder';
import * as whichKey from './which-key';

let mode: VimMode = 'normal';
let prefixKey: string | null = null;
let prefixTimer: ReturnType<typeof setTimeout> | null = null;

const PREFIX_TIMEOUT_MS = 2000;
const FIRST_VISIT_KEY = 'vim-onboarded';

// ── Bindings shown in which-key ──────────────────────────────────────────────

const LEADER_GROUPS: WhichKeyGroup[] = [
  {
    label: 'Search',
    prefix: 'Ctrl+K',
    entries: [
      { key: 'f', description: 'Find files' },
      { key: 'g', description: 'Grep content' },
    ],
  },
  {
    label: 'Theme',
    prefix: 'Ctrl+K',
    entries: [{ key: 't', description: 'Toggle theme' }],
  },
];

const G_GROUPS: WhichKeyGroup[] = [
  {
    label: 'Go to',
    prefix: 'g',
    entries: [
      { key: 'g', description: 'Top of page' },
      { key: 'h', description: 'Home' },
      { key: 't', description: 'Tags' },
      { key: 'a', description: 'About' },
    ],
  },
];

const ONBOARDING_GROUPS: WhichKeyGroup[] = [
  {
    label: 'Shortcuts',
    prefix: '',
    entries: [
      { key: '/', description: 'Search in page' },
      { key: 'Ctrl+K', description: 'Fuzzy find' },
      { key: 'g', description: 'Go to...' },
      { key: 'G', description: 'Bottom of page' },
      { key: '{', description: 'Prev heading' },
      { key: '}', description: 'Next heading' },
    ],
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

function clearPrefix(): void {
  if (prefixTimer !== null) clearTimeout(prefixTimer);
  prefixTimer = null;
  prefixKey = null;
}

function startPrefixTimeout(): void {
  if (prefixTimer !== null) clearTimeout(prefixTimer);
  prefixTimer = setTimeout(() => {
    whichKey.hide();
    clearPrefix();
    mode = 'normal';
  }, PREFIX_TIMEOUT_MS);
}

function applyThemeToggle(): void {
  const html = document.documentElement;
  const current = (html.getAttribute('data-theme') ?? 'light') as Theme;
  const next = domainToggleTheme(current);
  html.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
}

function resetToNormal(): void {
  clearPrefix();
  mode = 'normal';
}

function showOnboarding(): void {
  if (localStorage.getItem(FIRST_VISIT_KEY)) return;
  localStorage.setItem(FIRST_VISIT_KEY, '1');
  setTimeout(() => {
    whichKey.show(ONBOARDING_GROUPS);
    setTimeout(() => {
      if (mode === 'normal') whichKey.hide();
    }, 5000);
  }, 1500);
}

// ── Heading navigation helpers ────────────────────────────────────────────────

let cachedHeadings: HTMLElement[] | null = null;

function getHeadings(): HTMLElement[] {
  if (cachedHeadings === null) {
    cachedHeadings = Array.from(document.querySelectorAll('h2[id], h3[id], h4[id]'));
  }
  return cachedHeadings;
}

function invalidateHeadingCache(): void {
  cachedHeadings = null;
}

// Track current heading index for deterministic {/} navigation
let currentHeadingIndex = -1;

function jumpToNextHeading(): void {
  const headings = getHeadings();
  if (headings.length === 0) return;
  currentHeadingIndex = Math.min(currentHeadingIndex + 1, headings.length - 1);
  headings[currentHeadingIndex].scrollIntoView({ block: 'start' });
}

function jumpToPrevHeading(): void {
  const headings = getHeadings();
  if (headings.length === 0) return;
  if (currentHeadingIndex <= 0) {
    currentHeadingIndex = -1;
    window.scrollTo({ top: 0 });
    return;
  }
  currentHeadingIndex = currentHeadingIndex - 1;
  headings[currentHeadingIndex].scrollIntoView({ block: 'start' });
}

// Sync heading index with scroll position (for when user scrolls manually)
function syncHeadingIndex(): void {
  const headings = getHeadings();
  currentHeadingIndex = -1;
  for (let i = headings.length - 1; i >= 0; i--) {
    if (headings[i].getBoundingClientRect().top <= 100) {
      currentHeadingIndex = i;
      break;
    }
  }
}


// ── Main handler ─────────────────────────────────────────────────────────────

function handleKeydown(e: KeyboardEvent): void {
  // ─── Ctrl combos (our bindings FIRST, then let browser handle the rest) ───
  if (e.ctrlKey || e.metaKey) {
    // Ctrl+K: open fuzzy finder directly (like VS Code command palette)
    if (e.key === 'k' || e.key === 'K') {
      e.preventDefault();
      if (mode === 'whichkey') { whichKey.hide(); clearPrefix(); }
      fuzzyFinder.open('files', resetToNormal);
      mode = 'fuzzy';
      return;
    }

    // Ctrl+/ or Cmd+/: toggle which-key
    if (e.key === '/') {
      e.preventDefault();
      if (mode === 'whichkey') {
        whichKey.hide();
        resetToNormal();
      } else {
        // Cancel any pending hide transition
        whichKey.hide();
        mode = 'whichkey';
        // Small delay to let hide() complete before re-showing
        setTimeout(() => {
          whichKey.show(ONBOARDING_GROUPS);
        }, 10);
        startPrefixTimeout();
      }
      return;
    }

    // All other Ctrl combos: let browser handle (Ctrl+C, Ctrl+V, etc.)
    return;
  }

  // Alt combos: let browser handle
  if (e.altKey) return;

  // ─── Escape: always close active UI ────────────────────────────────────
  if (e.key === 'Escape') {
    if (mode === 'search') {
      vimSearch.close();
      resetToNormal();
      e.preventDefault();
    } else if (mode === 'fuzzy') {
      fuzzyFinder.close();
      resetToNormal();
      e.preventDefault();
    } else if (mode === 'whichkey') {
      whichKey.hide();
      resetToNormal();
      e.preventDefault();
    }
    return;
  }

  // ─── Search mode ───────────────────────────────────────────────────────
  if (mode === 'search') {
    if (e.key === '/' && !isInputFocused()) {
      vimSearch.refocus();
      e.preventDefault();
    } else if (e.key === 'n' && !e.shiftKey && !isInputFocused()) {
      vimSearch.next();
      e.preventDefault();
    } else if ((e.key === 'N' || (e.key === 'n' && e.shiftKey)) && !isInputFocused()) {
      vimSearch.prev();
      e.preventDefault();
    }
    return;
  }

  // ─── Fuzzy mode ────────────────────────────────────────────────────────
  if (mode === 'fuzzy') {
    if (e.key === 'ArrowDown') { fuzzyFinder.moveDown(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { fuzzyFinder.moveUp(); e.preventDefault(); }
    else if (e.key === 'Enter') { fuzzyFinder.confirm(); e.preventDefault(); }
    return;
  }

  // ─── Input guard for non-modifier keys ─────────────────────────────────
  if (isInputFocused()) return;

  // ─── Which-key second key (prefix → action) ────────────────────────────
  if (mode === 'whichkey' && prefixKey !== null) {
    const savedPrefix = prefixKey;
    clearPrefix();
    whichKey.hide();
    mode = 'normal';

    if (savedPrefix === 'ctrl+k') {
      switch (e.key) {
        case 'f':
          fuzzyFinder.open('files', resetToNormal);
          mode = 'fuzzy';
          e.preventDefault();
          break;
        case 'g':
          fuzzyFinder.open('grep', resetToNormal);
          mode = 'fuzzy';
          e.preventDefault();
          break;
        case 't':
          applyThemeToggle();
          e.preventDefault();
          break;
      }
    } else if (savedPrefix === 'g') {
      switch (e.key) {
        case 'g':
          window.scrollTo({ top: 0, behavior: 'smooth' });
          e.preventDefault();
          break;
        case 'h': window.location.href = '/'; e.preventDefault(); break;
        case 't': window.location.href = '/tags'; e.preventDefault(); break;
        case 'a': window.location.href = '/about'; e.preventDefault(); break;
      }
    }
    return;
  }

  // ─── Normal mode ──────────────────────────────────────────────────────
  switch (e.key) {
    case '/':
      vimSearch.open(resetToNormal);
      mode = 'search';
      e.preventDefault();
      break;

    case 'g':
      prefixKey = 'g';
      mode = 'whichkey';
      whichKey.show(G_GROUPS);
      startPrefixTimeout();
      e.preventDefault();
      break;

    case 'G':
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
      e.preventDefault();
      break;

    case '{':
      syncHeadingIndex();
      jumpToPrevHeading();
      e.preventDefault();
      break;

    case '}':
      syncHeadingIndex();
      jumpToNextHeading();
      e.preventDefault();
      break;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export function init(): void {
  document.addEventListener('keydown', handleKeydown);
  // Invalidate heading cache on structural changes to <main> only (not Giscus, search marks, etc.)
  const main = document.querySelector('main');
  if (main) {
    new MutationObserver(invalidateHeadingCache)
      .observe(main, { childList: true, subtree: false });
  }
  // Also invalidate on Astro View Transitions navigation
  document.addEventListener('astro:after-swap', invalidateHeadingCache);
  // Allow vim-search to activate search mode (e.g. ?highlight= from fuzzy finder)
  document.addEventListener('vim:search-activated', () => { mode = 'search'; });
  showOnboarding();
}

export { isInputFocused, handleKeydown as _handleKeydown, mode as _mode };
