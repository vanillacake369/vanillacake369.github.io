import { describe, it, expect } from 'vitest';
import { getInitialTheme, toggleTheme } from '../../domain/theme';

describe('getInitialTheme', () => {
  it('returns dark when stored is dark', () => {
    expect(getInitialTheme('dark', false)).toBe('dark');
  });

  it('returns light when stored is light', () => {
    expect(getInitialTheme('light', true)).toBe('light');
  });

  it('returns dark when stored is null and prefersDark is true', () => {
    expect(getInitialTheme(null, true)).toBe('dark');
  });

  it('returns light when stored is null and prefersDark is false', () => {
    expect(getInitialTheme(null, false)).toBe('light');
  });

  it('returns dark when stored is invalid and prefersDark is true', () => {
    expect(getInitialTheme('invalid', true)).toBe('dark');
  });
});

describe('toggleTheme', () => {
  it('toggles light to dark', () => {
    expect(toggleTheme('light')).toBe('dark');
  });

  it('toggles dark to light', () => {
    expect(toggleTheme('dark')).toBe('light');
  });
});
