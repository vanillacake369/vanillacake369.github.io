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

function getUI() {
  const bar = document.getElementById('vim-search-bar') as HTMLElement;
  const input = bar.querySelector<HTMLInputElement>('.vim-search-input')!;
  const count = bar.querySelector<HTMLElement>('.vim-search-count')!;
  return { bar, input, count };
}

beforeEach(() => {
  // Clean up DOM between tests
  document.body.innerHTML = '';
  // Re-init with a fresh UI
  const { bar, input, count } = makeSearchUI();
  vimSearch.init({ bar, input, count });
});

// ---------------------------------------------------------------------------
// setQuery — text highlighting
// ---------------------------------------------------------------------------

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

  it('highlights Korean text correctly', () => {
    const p = document.createElement('p');
    p.textContent = '안녕 세계 안녕하세요';
    document.body.appendChild(p);

    vimSearch.open(() => {});
    vimSearch.setQuery('안녕');

    const marks = document.querySelectorAll('mark.vim-search-match');
    expect(marks.length).toBe(2);
    expect(marks[0].textContent).toBe('안녕');
  });

  it('marks the first match as active after setQuery', () => {
    const p = document.createElement('p');
    p.textContent = 'alpha alpha alpha';
    document.body.appendChild(p);

    vimSearch.open(() => {});
    vimSearch.setQuery('alpha');

    const marks = document.querySelectorAll('mark.vim-search-match');
    expect(marks[0].classList.contains('vim-search-match--active')).toBe(true);
    expect(marks[1].classList.contains('vim-search-match--active')).toBe(false);
    expect(marks[2].classList.contains('vim-search-match--active')).toBe(false);
  });

  it('does not highlight text inside the search bar itself', () => {
    // The search bar is inside #vim-search-bar which is excluded by the walker
    const { input } = getUI();
    input.placeholder = 'Search...';

    vimSearch.open(() => {});
    vimSearch.setQuery('Search');

    // Marks should be 0 since the only occurrence is inside the search bar UI
    const marks = document.querySelectorAll('mark.vim-search-match');
    expect(marks.length).toBe(0);
  });

  it('escapes regex special characters in query', () => {
    const p = document.createElement('p');
    p.textContent = 'price: $5.00 (tax included)';
    document.body.appendChild(p);

    vimSearch.open(() => {});
    // These chars have regex meaning — should still find literal text
    vimSearch.setQuery('$5.00');

    const marks = document.querySelectorAll('mark.vim-search-match');
    expect(marks.length).toBe(1);
    expect(marks[0].textContent).toBe('$5.00');
  });
});

// ---------------------------------------------------------------------------
// count display
// ---------------------------------------------------------------------------

describe('count display', () => {
  it('updates count text to "1/N" format after finding matches', () => {
    const p = document.createElement('p');
    p.textContent = 'cat cat cat';
    document.body.appendChild(p);

    vimSearch.open(() => {});
    vimSearch.setQuery('cat');

    const { count } = getUI();
    expect(count.textContent).toBe('1/3');
  });

  it('shows "2/N" after calling next()', () => {
    const p = document.createElement('p');
    p.textContent = 'dog dog dog';
    document.body.appendChild(p);

    vimSearch.open(() => {});
    vimSearch.setQuery('dog');
    vimSearch.next();

    const { count } = getUI();
    expect(count.textContent).toBe('2/3');
  });

  it('clears count text when query is empty', () => {
    const p = document.createElement('p');
    p.textContent = 'Test content';
    document.body.appendChild(p);

    vimSearch.open(() => {});
    vimSearch.setQuery('content');
    vimSearch.setQuery('');

    const { count } = getUI();
    expect(count.textContent).toBe('');
  });

  it('shows "3/3" after prev() from index 0 wraps to last', () => {
    const p = document.createElement('p');
    p.textContent = 'ab ab ab';
    document.body.appendChild(p);

    vimSearch.open(() => {});
    vimSearch.setQuery('ab');
    vimSearch.prev(); // wraps from 0 to 2

    const { count } = getUI();
    expect(count.textContent).toBe('3/3');
  });
});

// ---------------------------------------------------------------------------
// next / prev cycling
// ---------------------------------------------------------------------------

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

  it('next() is a no-op when there are no matches', () => {
    vimSearch.open(() => {});
    vimSearch.setQuery('zzznomatch');

    // Should not throw
    expect(() => vimSearch.next()).not.toThrow();
  });

  it('prev() is a no-op when there are no matches', () => {
    vimSearch.open(() => {});
    vimSearch.setQuery('zzznomatch');

    // Should not throw
    expect(() => vimSearch.prev()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// open
// ---------------------------------------------------------------------------

describe('open', () => {
  it('makes the search bar visible', () => {
    const { bar } = getUI();
    bar.hidden = true;

    vimSearch.open(() => {});

    expect(bar.hidden).toBe(false);
  });

  it('clears any previous input value', () => {
    const { input } = getUI();
    input.value = 'previous query';

    vimSearch.open(() => {});

    expect(input.value).toBe('');
  });

  it('clears previous marks when reopened', () => {
    const p = document.createElement('p');
    p.textContent = 'foo foo foo';
    document.body.appendChild(p);

    vimSearch.open(() => {});
    vimSearch.setQuery('foo');
    expect(document.querySelectorAll('mark.vim-search-match').length).toBe(3);

    // Reopen — should clear old marks
    vimSearch.open(() => {});
    expect(document.querySelectorAll('mark.vim-search-match').length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// close
// ---------------------------------------------------------------------------

describe('close', () => {
  it('removes all marks and hides the bar', () => {
    const p = document.createElement('p');
    p.textContent = 'something to find';
    document.body.appendChild(p);

    const { bar } = getUI();

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

  it('does not call onClose callback a second time if called twice', () => {
    const cb = vi.fn();
    vimSearch.open(cb);
    vimSearch.close();
    vimSearch.close(); // second call should be safe
    expect(cb).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// Korean IME compositionend handling
// ---------------------------------------------------------------------------

describe('Korean IME compositionend handling', () => {
  it('fires setQuery on compositionend with the final composed value', () => {
    const p = document.createElement('p');
    p.textContent = '안녕하세요 세계';
    document.body.appendChild(p);

    const { input } = getUI();
    vimSearch.open(() => {});

    // Simulate Korean IME composition sequence:
    // 1. compositionstart — composing = true (input events are suppressed)
    input.dispatchEvent(new CompositionEvent('compositionstart'));

    // 2. During composition, intermediate characters are typed
    //    The input event fires but should be ignored while composing
    input.value = '안';
    input.dispatchEvent(new Event('input'));
    // At this point no marks should be set yet (still composing)
    // The count should remain empty
    const { count } = getUI();
    // intermediate state — depends on implementation; we just want no crash

    // 3. compositionend — final value committed
    input.value = '안녕';
    input.dispatchEvent(new CompositionEvent('compositionend'));

    // After compositionend, setQuery should have been called with '안녕'
    const marks = document.querySelectorAll('mark.vim-search-match');
    // '안녕하세요' contains '안녕' once
    expect(marks.length).toBe(1);
    expect(marks[0].textContent).toBe('안녕');
  });

  it('input event triggers setQuery when NOT composing', () => {
    const p = document.createElement('p');
    p.textContent = 'hello world';
    document.body.appendChild(p);

    const { input } = getUI();
    vimSearch.open(() => {});

    // Normal (non-IME) input
    input.value = 'hello';
    input.dispatchEvent(new Event('input'));

    const marks = document.querySelectorAll('mark.vim-search-match');
    expect(marks.length).toBe(1);
    expect(marks[0].textContent).toBe('hello');
  });

  it('does not double-apply marks when compositionend fires after input during composition', () => {
    const p = document.createElement('p');
    p.textContent = '고양이 고양이';
    document.body.appendChild(p);

    const { input } = getUI();
    vimSearch.open(() => {});

    // Start composing
    input.dispatchEvent(new CompositionEvent('compositionstart'));

    // Input fires during composition — should NOT trigger setQuery
    input.value = '고';
    input.dispatchEvent(new Event('input'));

    // Verify no marks were placed during composition
    let marks = document.querySelectorAll('mark.vim-search-match');
    expect(marks.length).toBe(0);

    // Composition ends with final value
    input.value = '고양이';
    input.dispatchEvent(new CompositionEvent('compositionend'));

    // Now marks should reflect the final composed value
    marks = document.querySelectorAll('mark.vim-search-match');
    expect(marks.length).toBe(2);
  });
});
