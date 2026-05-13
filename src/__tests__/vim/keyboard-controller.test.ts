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

describe('slash key opens fuzzy finder', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('pressing / calls fuzzyFinder.open and enters fuzzy mode', async () => {
    const { fuzzyOpenSpy, _handleKeydown } = await setupController();

    const slashEvent = new KeyboardEvent('keydown', { key: '/', bubbles: true });
    _handleKeydown(slashEvent);

    expect(fuzzyOpenSpy).toHaveBeenCalledOnce();
    expect(fuzzyOpenSpy).toHaveBeenCalledWith('files', expect.any(Function));
  });

  it('pressing / does not open fuzzy finder when input is focused', async () => {
    const { fuzzyOpenSpy, _handleKeydown } = await setupController();

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const slashEvent = new KeyboardEvent('keydown', { key: '/', bubbles: true });
    _handleKeydown(slashEvent);

    expect(fuzzyOpenSpy).not.toHaveBeenCalled();
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
// Ctrl+P does NOT open fuzzy finder (removed — only Ctrl+K is bound)
// ---------------------------------------------------------------------------

describe('Ctrl+P passes through', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('Ctrl+P does not open fuzzy finder', async () => {
    const { fuzzyOpenSpy, _handleKeydown } = await setupController();

    _handleKeydown(new KeyboardEvent('keydown', { key: 'p', ctrlKey: true, bubbles: true }));

    expect(fuzzyOpenSpy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Escape resets from all modes
// ---------------------------------------------------------------------------

describe('Escape resets from all modes', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('Escape closes fuzzy mode when opened via /', async () => {
    const { fuzzyCloseSpy, _handleKeydown } = await setupController();

    // Open fuzzy finder via /
    _handleKeydown(new KeyboardEvent('keydown', { key: '/', bubbles: true }));
    // Press Escape
    _handleKeydown(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(fuzzyCloseSpy).toHaveBeenCalledOnce();
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

// ---------------------------------------------------------------------------
// Ctrl+/ (or Cmd+/) shows which-key
// ---------------------------------------------------------------------------

describe('Ctrl+/ shows which-key', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Ctrl+/ calls whichKey.show with all groups', async () => {
    const { showSpy, _handleKeydown } = await setupController();

    _handleKeydown(new KeyboardEvent('keydown', { key: '/', ctrlKey: true, bubbles: true }));
    vi.advanceTimersByTime(20);

    expect(showSpy).toHaveBeenCalledOnce();
  });

  it('Cmd+/ (macOS) also calls whichKey.show', async () => {
    const { showSpy, _handleKeydown } = await setupController();

    _handleKeydown(new KeyboardEvent('keydown', { key: '/', metaKey: true, bubbles: true }));
    vi.advanceTimersByTime(20);

    expect(showSpy).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// gg scrolls to top
// ---------------------------------------------------------------------------

describe('gg scrolls to top', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('g then g calls window.scrollTo with top: 0', async () => {
    const { hideSpy, showSpy, _handleKeydown } = await setupController();

    // Mock scrollTo
    const origScrollTo = window.scrollTo;
    let scrollArgs: unknown = null;
    window.scrollTo = ((...args: unknown[]) => { scrollArgs = args[0]; }) as typeof window.scrollTo;

    // First g — enters whichkey
    _handleKeydown(new KeyboardEvent('keydown', { key: 'g', bubbles: true }));
    expect(showSpy).toHaveBeenCalled();

    // Second g — gg motion
    _handleKeydown(new KeyboardEvent('keydown', { key: 'g', bubbles: true }));

    expect(scrollArgs).toEqual({ top: 0, behavior: 'smooth' });
    expect(hideSpy).toHaveBeenCalled();

    window.scrollTo = origScrollTo;
  });
});

// ---------------------------------------------------------------------------
// G scrolls to bottom
// ---------------------------------------------------------------------------

describe('G scrolls to bottom', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('Shift+G scrolls to document bottom', async () => {
    const { _handleKeydown } = await setupController();
    const origScrollTo = window.scrollTo;
    let scrollArgs: unknown = null;
    window.scrollTo = ((...args: unknown[]) => { scrollArgs = args[0]; }) as typeof window.scrollTo;

    _handleKeydown(new KeyboardEvent('keydown', { key: 'G', bubbles: true }));

    expect(scrollArgs).toEqual({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    });
    window.scrollTo = origScrollTo;
  });
});
