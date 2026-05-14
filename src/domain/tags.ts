/**
 * Single Source of Truth for all valid post tags.
 *
 * When writing a post, pick tags from this list.
 * Using a tag not listed here will cause a build-time error.
 *
 * To add a new tag: append it to TAGS below, then use it in frontmatter.
 */
export const TAGS = [
  'kubernetes',
  'infra',
  'nix',
  'homelab',
  'linux',
  'dev',
  'ai',
  'tools',
  'database',
  'network',
  'system-design',
  'algorithm',
  'java',
  'spring-boot',
  'effective-java',
  'neovim',
  'conference',
  'investment',
  'journal',
  'reflection',
] as const;

export type Tag = (typeof TAGS)[number];
