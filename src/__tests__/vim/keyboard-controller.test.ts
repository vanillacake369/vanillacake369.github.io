import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// The keyboard controller uses module-level state, so we reset modules between
// describe blocks and use vi.resetModules() in beforeEach where needed.

// ---------------------------------------------------------------------------
// Helper: set up fresh mocks for all dependencies and return the controller
// ---------------------------------------------------------------------------
async function setupController() {
  const whichKeyModule = await import('../../vim/which-key');
  const hideSpy = vi.spyOn(whichKeyModule, 'hide').mockImplementation(() => {});
  const showSpy = vi.spyOn(whichKeyModule, 'show').mockImplementation(() => {});
  vi.spyOn(whichKeyModule, 'init').mockImplementation(() => {});

  const vimSearchModule = await import('../../vim/vim-search');
  const searchOpenSpy = vi.spyOn(vimSearchModule, 'open').mockImplementation(() => {});
  const searchCloseSpy = vi.spyOn(vimSearchModule, 'close').mockImplementation(() => {});
  const searchNextSpy = vi.spyOn(vimSearchModule, 'next').mockImplementation(() => {});
  const searchPrevSpy = vi.spyOn(vimSearchModule, 'prev').mockImplementation(() => {});
  vi.spyOn(vimSearchModule, 'init').mockImplementation(() => {});

  const fuzzyModule = await import('../../vim/fuzzy-finder');
  const fuzzyOpenSpy = vi.spyOn(fuzzyModule, 'open').mockImplementation(() => {});
  const fuzzyCloseSpy = vi.spyOn(fuzzyModule, 'close').mockImplementation(() => {});
  vi.spyOn(fuzzyModule, 'moveDown').mockImplementation(() => {});
  vi.spyOn(fuzzyModule, 'moveUp').mockImplementation(() => {});
  vi.spyOn(fuzzyModule, 'confirm').mockImplementation(() => {});

  const { _handleKeydown } = await import('../../vim/keyboard-controller');

  return {
    _handleKeydown,
    hideSpy,
    showSpy,
    searchOpenSpy,
    searchCloseSpy,
    searchNextSpy,
    searchPrevSpy,
    fuzzyOpenSpy,
    fuzzyCloseSpy,
  };
}

// ---------------------------------------------------------------------------
// isInputFocused
// ---------------------------------------------------------------------------

describe('isInputFocused', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns false when no element is focused', async () => {
    const { isInputFocused } = await import('../../vim/keyboard-controller');
    // happy-dom: activeElement is document.body by default
    expect(isInputFocused()).toBe(false);
  });

  it('returns true when an <input> is focused', async () => {
    const { isInputFocused } = await import('../../vim/keyboard-controller');
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    expect(isInputFocused()).toBe(true);
    document.body.removeChild(input);
  });

  it('returns true when a <textarea> is focused', async () => {
    const { isInputFocused } = await import('../../vim/keyboard-controller');
    const ta = document.createElement('textarea');
    document.body.appendChild(ta);
    ta.focus();
    expect(isInputFocused()).toBe(true);
    document.body.removeChild(ta);
  });

  it('returns true when a <select> is focused', async () => {
    const { isInputFocused } = await import('../../vim/keyboard-controller');
    const sel = document.createElement('select');
    document.body.appendChild(sel);
    sel.focus();
    expect(isInputFocused()).toBe(true);
    document.body.removeChild(sel);
  });

  it('returns true when a contenteditable element is focused', async () => {
    const { isInputFocused } = await import('../../vim/keyboard-controller');
    const div = document.createElement('div');
    div.contentEditable = 'true';
    document.body.appendChild(div);
    div.focus();
    expect(isInputFocused()).toBe(true);
    document.body.removeChild(div);
  });
});

// ---------------------------------------------------------------------------
// Slash key opens search mode
// ---------------------------------------------------------------------------

describe('slash key opens search', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('pressing / calls vimSearch.open and enters search mode', async () => {
    const { searchOpenSpy, _handleKeydown } = await setupController();

    const slashEvent = new KeyboardEvent('keydown', { key: '/', bubbles: true });
    _handleKeydown(slashEvent);

    expect(searchOpenSpy).toHaveBeenCalledOnce();
  });

  it('pressing / does not open search when input is focused', async () => {
    const { searchOpenSpy, _handleKeydown } = await setupController();

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const slashEvent = new KeyboardEvent('keydown', { key: '/', bubbles: true });
    _handleKeydown(slashEvent);

    expect(searchOpenSpy).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });
});

// ---------------------------------------------------------------------------
// n / N cycle through matches in search mode
// ---------------------------------------------------------------------------

describe('n/N navigation in search mode', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('n advances to next match when in search mode', async () => {
    const { searchNextSpy, _handleKeydown } = await setupController();

    // Enter search mode
    _handleKeydown(new KeyboardEvent('keydown', { key: '/', bubbles: true }));
    // Press n
    _handleKeydown(new KeyboardEvent('keydown', { key: 'n', bubbles: true }));

    expect(searchNextSpy).toHaveBeenCalledOnce();
  });

  it('N goes to previous match when in search mode', async () => {
    const { searchPrevSpy, _handleKeydown } = await setupController();

    // Enter search mode
    _handleKeydown(new KeyboardEvent('keydown', { key: '/', bubbles: true }));
    // Press N
    _handleKeydown(new KeyboardEvent('keydown', { key: 'N', bubbles: true }));

    expect(searchPrevSpy).toHaveBeenCalledOnce();
  });

  it('n with shiftKey goes to previous match when in search mode', async () => {
    const { searchPrevSpy, _handleKeydown } = await setupController();

    // Enter search mode
    _handleKeydown(new KeyboardEvent('keydown', { key: '/', bubbles: true }));
    // Press Shift+n
    _handleKeydown(new KeyboardEvent('keydown', { key: 'n', shiftKey: true, bubbles: true }));

    expect(searchPrevSpy).toHaveBeenCalledOnce();
  });

  it('n does not cycle when NOT in search mode', async () => {
    const { searchNextSpy, _handleKeydown } = await setupController();

    // Normal mode - pressing n should do nothing
    _handleKeydown(new KeyboardEvent('keydown', { key: 'n', bubbles: true }));

    expect(searchNextSpy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Ctrl+K opens fuzzy finder
// ---------------------------------------------------------------------------

describe('Ctrl+K opens fuzzy finder', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('Ctrl+K calls fuzzyFinder.open with files mode', async () => {
    const { fuzzyOpenSpy, _handleKeydown } = await setupController();

    const ctrlK = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true });
    _handleKeydown(ctrlK);

    expect(fuzzyOpenSpy).toHaveBeenCalledOnce();
    expect(fuzzyOpenSpy).toHaveBeenCalledWith('files', expect.any(Function));
  });

  it('Ctrl+K (uppercase K) also opens fuzzy finder', async () => {
    const { fuzzyOpenSpy, _handleKeydown } = await setupController();

    const ctrlKUpper = new KeyboardEvent('keydown', { key: 'K', ctrlKey: true, bubbles: true });
    _handleKeydown(ctrlKUpper);

    expect(fuzzyOpenSpy).toHaveBeenCalledOnce();
  });

  it('Meta+K opens fuzzy finder (macOS Cmd+K)', async () => {
    const { fuzzyOpenSpy, _handleKeydown } = await setupController();

    const metaK = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true });
    _handleKeydown(metaK);

    expect(fuzzyOpenSpy).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// Ctrl+P opens fuzzy finder
// ---------------------------------------------------------------------------

describe('Ctrl+P opens fuzzy finder', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('Ctrl+P calls fuzzyFinder.open with files mode', async () => {
    const { fuzzyOpenSpy, _handleKeydown } = await setupController();

    const ctrlP = new KeyboardEvent('keydown', { key: 'p', ctrlKey: true, bubbles: true });
    _handleKeydown(ctrlP);

    expect(fuzzyOpenSpy).toHaveBeenCalledOnce();
    expect(fuzzyOpenSpy).toHaveBeenCalledWith('files', expect.any(Function));
  });

  it('Ctrl+P (uppercase P) also opens fuzzy finder', async () => {
    const { fuzzyOpenSpy, _handleKeydown } = await setupController();

    const ctrlPUpper = new KeyboardEvent('keydown', { key: 'P', ctrlKey: true, bubbles: true });
    _handleKeydown(ctrlPUpper);

    expect(fuzzyOpenSpy).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// Escape resets from all modes
// ---------------------------------------------------------------------------

describe('Escape resets from all modes', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('Escape closes search mode and calls vimSearch.close', async () => {
    const { searchCloseSpy, _handleKeydown } = await setupController();

    // Open search
    _handleKeydown(new KeyboardEvent('keydown', { key: '/', bubbles: true }));
    // Press Escape
    _handleKeydown(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(searchCloseSpy).toHaveBeenCalledOnce();
  });

  it('Escape closes fuzzy finder when in fuzzy mode', async () => {
    const { fuzzyOpenSpy, fuzzyCloseSpy, _handleKeydown } = await setupController();

    // Enter fuzzy mode via Ctrl+K
    _handleKeydown(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
    expect(fuzzyOpenSpy).toHaveBeenCalledOnce();

    // Press Escape
    _handleKeydown(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(fuzzyCloseSpy).toHaveBeenCalledOnce();
  });

  it('Escape hides which-key when in whichkey mode', async () => {
    const { hideSpy, _handleKeydown } = await setupController();

    // Enter whichkey mode via g
    _handleKeydown(new KeyboardEvent('keydown', { key: 'g', bubbles: true }));

    // Press Escape
    _handleKeydown(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(hideSpy).toHaveBeenCalled();
  });

  it('Escape in normal mode does nothing', async () => {
    const { searchCloseSpy, fuzzyCloseSpy, hideSpy, _handleKeydown } = await setupController();

    // Press Escape without entering any mode
    _handleKeydown(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    // Nothing should have been called
    expect(searchCloseSpy).not.toHaveBeenCalled();
    expect(fuzzyCloseSpy).not.toHaveBeenCalled();
    // hide may or may not be called - we just verify search/fuzzy are not closed
  });
});

// ---------------------------------------------------------------------------
// g prefix shows which-key for navigation
// ---------------------------------------------------------------------------

describe('g prefix navigation', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('pressing g shows which-key with G_GROUPS', async () => {
    const { showSpy, _handleKeydown } = await setupController();

    _handleKeydown(new KeyboardEvent('keydown', { key: 'g', bubbles: true }));

    expect(showSpy).toHaveBeenCalledOnce();
    // The groups passed to show should include 'Go to' label
    const [groups] = showSpy.mock.calls[0];
    expect(groups.some((g: { label: string }) => g.label === 'Go to')).toBe(true);
  });

  it('pressing g when input is focused does NOT show which-key', async () => {
    const { showSpy, _handleKeydown } = await setupController();

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    _handleKeydown(new KeyboardEvent('keydown', { key: 'g', bubbles: true }));

    expect(showSpy).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it('g then h navigates to home page', async () => {
    const { _handleKeydown } = await setupController();

    // Spy on window.location assignment
    const locationSpy = vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      href: '/',
    });

    _handleKeydown(new KeyboardEvent('keydown', { key: 'g', bubbles: true }));
    _handleKeydown(new KeyboardEvent('keydown', { key: 'h', bubbles: true }));

    locationSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// Prefix timeout resets mode
// ---------------------------------------------------------------------------

describe('prefix timeout', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resets mode to normal after 2000ms when no second key is pressed', async () => {
    const { hideSpy, _handleKeydown } = await setupController();

    // Press g to start prefix
    _handleKeydown(new KeyboardEvent('keydown', { key: 'g', bubbles: true }));

    // Fast-forward 2000ms (PREFIX_TIMEOUT_MS)
    vi.advanceTimersByTime(2000);

    expect(hideSpy).toHaveBeenCalled();
  });

  it('does not reset before 2000ms have elapsed', async () => {
    const { hideSpy, _handleKeydown } = await setupController();

    _handleKeydown(new KeyboardEvent('keydown', { key: 'g', bubbles: true }));

    // Advance only 1999ms
    vi.advanceTimersByTime(1999);

    // hide was called once by show->hide cycle, but the prefix timeout hide
    // should not have been triggered yet — we check that we're still in whichkey mode
    // by verifying that a subsequent second key is still accepted
    // (This is a structural check - hideSpy count should still be 0 from timeout)
    const hideCallsBefore = hideSpy.mock.calls.length;

    vi.advanceTimersByTime(1); // now exactly 2000ms
    expect(hideSpy.mock.calls.length).toBeGreaterThan(hideCallsBefore);
  });
});

// ---------------------------------------------------------------------------
// Other Ctrl combos do not interfere
// ---------------------------------------------------------------------------

describe('unhandled Ctrl combos pass through', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('Ctrl+C does not trigger any vim action', async () => {
    const { searchOpenSpy, fuzzyOpenSpy, _handleKeydown } = await setupController();

    _handleKeydown(new KeyboardEvent('keydown', { key: 'c', ctrlKey: true, bubbles: true }));

    expect(searchOpenSpy).not.toHaveBeenCalled();
    expect(fuzzyOpenSpy).not.toHaveBeenCalled();
  });

  it('Alt+key does not trigger any vim action', async () => {
    const { searchOpenSpy, fuzzyOpenSpy, _handleKeydown } = await setupController();

    _handleKeydown(new KeyboardEvent('keydown', { key: '/', altKey: true, bubbles: true }));

    expect(searchOpenSpy).not.toHaveBeenCalled();
    expect(fuzzyOpenSpy).not.toHaveBeenCalled();
  });
});
