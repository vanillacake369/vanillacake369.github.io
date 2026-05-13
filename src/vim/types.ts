// Shared types for the vim-layer UI modules

export type VimMode = 'normal' | 'search' | 'fuzzy' | 'whichkey';

export interface SearchMatch {
  node: Text;
  highlight: HTMLElement;
}

export interface FuzzyResult {
  url: string;
  title: string;
  excerpt: string;
  tags?: string[];
}

export interface WhichKeyEntry {
  key: string;
  description: string;
}

export interface WhichKeyGroup {
  label: string;
  prefix: string;
  entries: WhichKeyEntry[];
}
