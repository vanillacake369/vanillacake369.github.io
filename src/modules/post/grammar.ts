/**
 * @module post/grammar
 *
 * Single source of truth for post ID parsing.
 * Every function that extracts data from a post ID delegates to parsePostId().
 *
 * Supported formats:
 *   standalone: "YYYY-MM-DD-Title"
 *   series:     "SeriesName/NN-YYYY-MM-DD-Title"
 */

const STANDALONE_RE = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})-(?<title>.+)$/;
const SERIES_RE = /^(?<series>.+?)\/(?<order>\d{2})-(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})-(?<title>.+)$/;

export interface ParsedPostId {
  kind: 'standalone' | 'series';
  year: number;
  month: number;
  day: number;
  title: string;
  series?: { id: string; order: number };
}

export class InvalidPostIdError extends Error {
  constructor(
    public readonly postId: string,
    reason: string,
  ) {
    super(`Invalid post ID "${postId}": ${reason}`);
    this.name = 'InvalidPostIdError';
  }
}

export class InvariantViolation extends Error {
  constructor(
    public readonly field: string,
    public readonly postId: string,
    reason: string,
  ) {
    super(`[${field}] "${postId}": ${reason}`);
    this.name = 'InvariantViolation';
  }
}

export function parsePostId(id: string): ParsedPostId {
  const cleaned = id.replace(/\.mdx?$/, '');

  const seriesMatch = cleaned.match(SERIES_RE);
  if (seriesMatch?.groups) {
    const { series, order, year, month, day, title } = seriesMatch.groups;
    return {
      kind: 'series',
      year: parseInt(year, 10),
      month: parseInt(month, 10),
      day: parseInt(day, 10),
      title,
      series: { id: series, order: parseInt(order, 10) },
    };
  }

  const standaloneMatch = cleaned.match(STANDALONE_RE);
  if (standaloneMatch?.groups) {
    const { year, month, day, title } = standaloneMatch.groups;
    return {
      kind: 'standalone',
      year: parseInt(year, 10),
      month: parseInt(month, 10),
      day: parseInt(day, 10),
      title,
    };
  }

  throw new InvalidPostIdError(
    id,
    'Must match "YYYY-MM-DD-Title" or "Series/NN-YYYY-MM-DD-Title"',
  );
}

export function parsePostIdSafe(id: string): ParsedPostId | undefined {
  try {
    return parsePostId(id);
  } catch {
    return undefined;
  }
}
