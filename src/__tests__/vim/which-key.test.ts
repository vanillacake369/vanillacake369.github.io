import { describe, it, expect, beforeEach } from 'vitest';
import * as whichKey from '../../vim/which-key';
import type { WhichKeyGroup } from '../../vim/types';

function makeWhichKeyUI(): { el: HTMLElement; inner: HTMLElement } {
  const el = document.createElement('div');
  el.id = 'vim-whichkey';
  el.hidden = true;
  const inner = document.createElement('div');
  inner.className = 'vim-whichkey-inner';
  el.appendChild(inner);
  document.body.appendChild(el);
  return { el, inner };
}

const SAMPLE_GROUPS: WhichKeyGroup[] = [
  {
    label: 'Search',
    prefix: 'Space',
    entries: [
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

beforeEach(() => {
  document.body.innerHTML = '';
  const { el, inner } = makeWhichKeyUI();
  whichKey.init({ el, inner });
});

describe('show', () => {
  it('renders the correct number of entries', () => {
    whichKey.show(SAMPLE_GROUPS);

    const entries = document.querySelectorAll('.vim-whichkey-entry');
    // 2 entries in Search + 1 in Theme = 3
    expect(entries.length).toBe(3);
  });

  it('renders each entry key and description', () => {
    whichKey.show(SAMPLE_GROUPS);

    const keys = Array.from(document.querySelectorAll('.vim-whichkey-key')).map(
      (el) => el.textContent,
    );
    expect(keys).toContain('f');
    expect(keys).toContain('g');
    expect(keys).toContain('t');

    const descs = Array.from(document.querySelectorAll('.vim-whichkey-desc')).map(
      (el) => el.textContent,
    );
    expect(descs).toContain('Find files');
    expect(descs).toContain('Grep content');
    expect(descs).toContain('Toggle theme');
  });

  it('renders group labels', () => {
    whichKey.show(SAMPLE_GROUPS);

    const labels = Array.from(document.querySelectorAll('.vim-whichkey-group-label')).map(
      (el) => el.textContent,
    );
    expect(labels).toContain('Search');
    expect(labels).toContain('Theme');
  });

  it('makes the element visible (removes hidden)', () => {
    const el = document.getElementById('vim-whichkey') as HTMLElement;
    expect(el.hidden).toBe(true);

    whichKey.show(SAMPLE_GROUPS);

    expect(el.hidden).toBe(false);
  });

  it('re-renders correctly when called multiple times', () => {
    const navGroups: WhichKeyGroup[] = [
      {
        label: 'Navigation',
        prefix: 'g',
        entries: [
          { key: 'h', description: 'Home' },
          { key: 'a', description: 'About' },
        ],
      },
    ];

    whichKey.show(SAMPLE_GROUPS);
    whichKey.show(navGroups);

    const entries = document.querySelectorAll('.vim-whichkey-entry');
    expect(entries.length).toBe(2);

    const keys = Array.from(document.querySelectorAll('.vim-whichkey-key')).map(
      (el) => el.textContent,
    );
    expect(keys).toContain('h');
    expect(keys).toContain('a');
    // Old entries should not be present
    expect(keys).not.toContain('f');
  });
});

describe('hide', () => {
  it('sets hidden to true after transition', async () => {
    whichKey.show(SAMPLE_GROUPS);

    const el = document.getElementById('vim-whichkey') as HTMLElement;
    expect(el.hidden).toBe(false);

    whichKey.hide();

    // Wait for the 200ms fallback timeout
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(el.hidden).toBe(true);
  });

  it('removes the visible class', () => {
    whichKey.show(SAMPLE_GROUPS);

    const el = document.getElementById('vim-whichkey') as HTMLElement;
    expect(el.classList.contains('vim-whichkey--visible')).toBe(true);

    whichKey.hide();
    expect(el.classList.contains('vim-whichkey--visible')).toBe(false);
  });
});
