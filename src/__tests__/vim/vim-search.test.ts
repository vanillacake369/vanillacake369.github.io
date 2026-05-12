import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as vimSearch from '../../vim/vim-search';

// Build a minimal DOM environment for each test
function makeSearchUI(): {
  bar: HTMLElement;
  input: HTMLInputElement;
  count: HTMLElement;
} {
  const bar = document.createElement('div');
  bar.id = 'vim-search-bar';
  const input = document.createElement('input');
  input.className = 'vim-search-input';
  const count = document.createElement('span');
  count.className = 'vim-search-count';
  bar.appendChild(input);
  bar.appendChild(count);
  document.body.appendChild(bar);
  return { bar, input, count };
}

beforeEach(() => {
  // Clean up DOM between tests
  document.body.innerHTML = '';
  // Re-init with a fresh UI
  const { bar, input, count } = makeSearchUI();
  vimSearch.init({ bar, input, count });
});

describe('setQuery', () => {
  it('wraps all matching text nodes in <mark> elements', () => {
    const p = document.createElement('p');
    p.textContent = 'Hello world and hello again';
    document.body.appendChild(p);

    vimSearch.open(() => {});
    vimSearch.setQuery('hello');

    const marks = document.querySelectorAll('mark.vim-search-match');
    expect(marks.length).toBe(2);
  });

  it('is case-insensitive', () => {
    const p = document.createElement('p');
    p.textContent = 'Foo foo FOO';
    document.body.appendChild(p);

    vimSearch.open(() => {});
    vimSearch.setQuery('foo');

    const marks = document.querySelectorAll('mark.vim-search-match');
    expect(marks.length).toBe(3);
  });

  it('clears marks when query is empty string', () => {
    const p = document.createElement('p');
    p.textContent = 'Test content here';
    document.body.appendChild(p);

    vimSearch.open(() => {});
    vimSearch.setQuery('content');
    expect(document.querySelectorAll('mark.vim-search-match').length).toBe(1);

    vimSearch.setQuery('');
    expect(document.querySelectorAll('mark.vim-search-match').length).toBe(0);
  });

  it('replaces marks on repeated calls', () => {
    const p = document.createElement('p');
    p.textContent = 'foo bar baz';
    document.body.appendChild(p);

    vimSearch.open(() => {});
    vimSearch.setQuery('foo');
    vimSearch.setQuery('bar');

    const marks = document.querySelectorAll('mark.vim-search-match');
    // Only 'bar' should be marked
    expect(marks.length).toBe(1);
    expect(marks[0].textContent).toBe('bar');
  });
});

describe('next / prev cycling', () => {
  it('next() advances currentIndex and adds active class', () => {
    const p = document.createElement('p');
    p.textContent = 'cat cat cat';
    document.body.appendChild(p);

    vimSearch.open(() => {});
    vimSearch.setQuery('cat');

    const marks = () => document.querySelectorAll('mark.vim-search-match');

    // After setQuery, index 0 is active
    expect(marks()[0].classList.contains('vim-search-match--active')).toBe(true);

    vimSearch.next();
    expect(marks()[1].classList.contains('vim-search-match--active')).toBe(true);
    expect(marks()[0].classList.contains('vim-search-match--active')).toBe(false);
  });

  it('next() wraps from last to first', () => {
    const p = document.createElement('p');
    p.textContent = 'ab ab';
    document.body.appendChild(p);

    vimSearch.open(() => {});
    vimSearch.setQuery('ab');

    vimSearch.next(); // index 1
    vimSearch.next(); // wraps to index 0

    const marks = document.querySelectorAll('mark.vim-search-match');
    expect(marks[0].classList.contains('vim-search-match--active')).toBe(true);
    expect(marks[1].classList.contains('vim-search-match--active')).toBe(false);
  });

  it('prev() cycles backward', () => {
    const p = document.createElement('p');
    p.textContent = 'xy xy xy';
    document.body.appendChild(p);

    vimSearch.open(() => {});
    vimSearch.setQuery('xy');

    // Start at 0, go backwards should wrap to 2
    vimSearch.prev();

    const marks = document.querySelectorAll('mark.vim-search-match');
    expect(marks[2].classList.contains('vim-search-match--active')).toBe(true);
  });
});

describe('close', () => {
  it('removes all marks and hides the bar', () => {
    const p = document.createElement('p');
    p.textContent = 'something to find';
    document.body.appendChild(p);

    const { bar, input, count } = (() => {
      const b = document.getElementById('vim-search-bar') as HTMLElement;
      const i = b.querySelector<HTMLInputElement>('.vim-search-input')!;
      const c = b.querySelector<HTMLElement>('.vim-search-count')!;
      return { bar: b, input: i, count: c };
    })();

    vimSearch.open(() => {});
    vimSearch.setQuery('something');
    expect(document.querySelectorAll('mark.vim-search-match').length).toBe(1);

    vimSearch.close();
    expect(document.querySelectorAll('mark.vim-search-match').length).toBe(0);
    expect(bar.hidden).toBe(true);
  });

  it('calls onClose callback', () => {
    const cb = vi.fn();
    vimSearch.open(cb);
    vimSearch.close();
    expect(cb).toHaveBeenCalledOnce();
  });
});
