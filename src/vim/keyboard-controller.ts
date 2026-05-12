// keyboard-controller.ts — Single global keydown listener routing vim-style keys

import type { VimMode, WhichKeyGroup } from './types';
import * as vimSearch from './vim-search';
import * as fuzzyFinder from './fuzzy-finder';
import * as whichKey from './which-key';

// ── State ─────────────────────────────────────────────────────────────────────

let mode: VimMode = 'normal';
let prefixKey: string | null = null;
let prefixTimer: ReturnType<typeof setTimeout> | null = null;

const PREFIX_TIMEOUT_MS = 2000;
const FIRST_VISIT_KEY = 'vim-onboarded';

// ── Binding groups shown in which-key popup ───────────────────────────────────

const SPACE_GROUPS: WhichKeyGroup[] = [
  {
    label: 'Search',
    prefix: 'Space',
    entries: [
      { key: 'Space', description: 'Fuzzy find' },
      { key: 'f', description: 'Find files' },
      { key: 'g', description: 'Grep content' },
    ],
  },
  {
    label: 'Theme',
    prefix: 'Space',
    entries: [{ key: 't', description: 'Toggle theme' }],
  },
];

const G_GROUPS: WhichKeyGroup[] = [
  {
    label: 'Navigation',
    prefix: 'g',
    entries: [
      { key: 'h', description: 'Home' },
      { key: 't', description: 'Tags' },
      { key: 'a', description: 'About' },
    ],
  },
];

const ALL_GROUPS: WhichKeyGroup[] = [
  {
    label: 'Search',
    prefix: '',
    entries: [
      { key: '/', description: 'Search in page' },
      { key: 'Space', description: 'Show commands' },
    ],
  },
  {
    label: 'Navigation',
    prefix: '',
    entries: [
      { key: 'g', description: 'Go to...' },
    ],
  },
];

// ── Guard ─────────────────────────────────────────────────────────────────────

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

// ── Prefix timer helpers ──────────────────────────────────────────────────────

function clearPrefix(): void {
  if (prefixTimer !== null) {
    clearTimeout(prefixTimer);
    prefixTimer = null;
  }
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

// ── Theme toggle (mirrors ThemeToggle.astro logic) ────────────────────────────

function toggleTheme(): void {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme') as 'light' | 'dark';
  const next = current === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
}

// ── Mode reset ────────────────────────────────────────────────────────────────

function resetToNormal(): void {
  clearPrefix();
  mode = 'normal';
}

// ── First visit onboarding ────────────────────────────────────────────────────

function showOnboarding(): void {
  if (localStorage.getItem(FIRST_VISIT_KEY)) return;
  localStorage.setItem(FIRST_VISIT_KEY, '1');

  // Show a brief hint after page settles
  setTimeout(() => {
    whichKey.show(ALL_GROUPS);
    setTimeout(() => {
      if (mode === 'normal') whichKey.hide();
    }, 4000);
  }, 1500);
}

// ── Main handler ──────────────────────────────────────────────────────────────

function handleKeydown(e: KeyboardEvent): void {
  // Skip modifier-key combos (Ctrl+F etc.)
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  // Escape always closes everything regardless of input focus
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

  // In search mode, delegate n/N to vimSearch; all other keys go to the input
  if (mode === 'search') {
    if (e.key === 'n' && !e.shiftKey && !isInputFocused()) {
      vimSearch.next();
      e.preventDefault();
    } else if ((e.key === 'N' || (e.key === 'n' && e.shiftKey)) && !isInputFocused()) {
      vimSearch.prev();
      e.preventDefault();
    }
    return;
  }

  // In fuzzy mode, delegate navigation keys
  if (mode === 'fuzzy') {
    if (e.key === 'ArrowDown') {
      fuzzyFinder.moveDown();
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      fuzzyFinder.moveUp();
      e.preventDefault();
    } else if (e.key === 'Enter') {
      fuzzyFinder.confirm();
      e.preventDefault();
    } else if (e.key === 'Escape') {
      fuzzyFinder.close();
      resetToNormal();
      e.preventDefault();
    }
    // Let other keys (typing) pass through to the fuzzy input
    return;
  }

  // Guard: do not fire normal/whichkey bindings when an input is focused
  if (isInputFocused()) return;

  // In whichkey mode (prefix active), handle second key
  if (mode === 'whichkey' && prefixKey !== null) {
    clearPrefix();
    whichKey.hide();
    mode = 'normal';

    if (prefixKey === ' ') {
      switch (e.key) {
        case ' ':
          // Space+Space → open fuzzy finder
          fuzzyFinder.open('files', resetToNormal);
          mode = 'fuzzy';
          e.preventDefault();
          break;
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
          toggleTheme();
          e.preventDefault();
          break;
        default:
          break;
      }
    } else if (prefixKey === 'g') {
      switch (e.key) {
        case 'h':
          window.location.href = '/';
          e.preventDefault();
          break;
        case 't':
          window.location.href = '/tags';
          e.preventDefault();
          break;
        case 'a':
          window.location.href = '/about';
          e.preventDefault();
          break;
        default:
          break;
      }
    }
    return;
  }

  // Normal mode key dispatch
  switch (e.key) {
    case '/':
      vimSearch.open(resetToNormal);
      mode = 'search';
      e.preventDefault();
      break;

    case ' ':
      prefixKey = ' ';
      mode = 'whichkey';
      whichKey.show(SPACE_GROUPS);
      startPrefixTimeout();
      e.preventDefault();
      break;

    case 'g':
      prefixKey = 'g';
      mode = 'whichkey';
      whichKey.show(G_GROUPS);
      startPrefixTimeout();
      e.preventDefault();
      break;

    default:
      break;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export function init(): void {
  document.addEventListener('keydown', handleKeydown);
  showOnboarding();
}

// Exported for testing
export { isInputFocused, handleKeydown as _handleKeydown, mode as _mode };
