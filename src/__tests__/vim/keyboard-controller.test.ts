import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We test the exported helpers directly.
// The keyboard controller uses module-level state, so we need to re-import
// between tests or reset state. We rely on fresh imports per test via vi.resetModules.

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

describe('prefix timeout', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resets mode to normal after 800ms when no second key is pressed', async () => {
    // We spy on which-key hide to confirm dismissal
    const whichKeyModule = await import('../../vim/which-key');
    const hideSpy = vi.spyOn(whichKeyModule, 'hide').mockImplementation(() => {});
    vi.spyOn(whichKeyModule, 'show').mockImplementation(() => {});
    vi.spyOn(whichKeyModule, 'init').mockImplementation(() => {});

    // Mock vim-search and fuzzy-finder to avoid DOM errors
    const vimSearchModule = await import('../../vim/vim-search');
    vi.spyOn(vimSearchModule, 'open').mockImplementation(() => {});
    vi.spyOn(vimSearchModule, 'init').mockImplementation(() => {});

    const fuzzyModule = await import('../../vim/fuzzy-finder');
    vi.spyOn(fuzzyModule, 'open').mockImplementation(() => {});

    const { _handleKeydown } = await import('../../vim/keyboard-controller');

    // Press g to start prefix
    const gEvent = new KeyboardEvent('keydown', { key: 'g', bubbles: true });
    _handleKeydown(gEvent);

    // Fast-forward 2000ms (PREFIX_TIMEOUT_MS)
    vi.advanceTimersByTime(2000);

    expect(hideSpy).toHaveBeenCalled();
  });
});

describe('escape resets mode', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('Escape closes search mode', async () => {
    const vimSearchModule = await import('../../vim/vim-search');
    const closeSpy = vi.spyOn(vimSearchModule, 'close').mockImplementation(() => {});
    vi.spyOn(vimSearchModule, 'open').mockImplementation(() => {});
    vi.spyOn(vimSearchModule, 'init').mockImplementation(() => {});

    const whichKeyModule = await import('../../vim/which-key');
    vi.spyOn(whichKeyModule, 'hide').mockImplementation(() => {});
    vi.spyOn(whichKeyModule, 'show').mockImplementation(() => {});
    vi.spyOn(whichKeyModule, 'init').mockImplementation(() => {});

    const fuzzyModule = await import('../../vim/fuzzy-finder');
    vi.spyOn(fuzzyModule, 'open').mockImplementation(() => {});
    vi.spyOn(fuzzyModule, 'close').mockImplementation(() => {});

    const { _handleKeydown } = await import('../../vim/keyboard-controller');

    // Open search
    const slashEvent = new KeyboardEvent('keydown', { key: '/', bubbles: true });
    _handleKeydown(slashEvent);

    // Press Escape
    const escEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    _handleKeydown(escEvent);

    expect(closeSpy).toHaveBeenCalled();
  });
});
