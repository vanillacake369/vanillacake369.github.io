import type { Post, CalendarDay } from './types';
import { groupByCalendarDay, toLocalDateString } from './post';

export interface CalendarCell {
  date: string; // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  posts: Pick<Post, 'slug' | 'title'>[];
}

export interface CalendarWeek {
  cells: (CalendarCell | null)[];
}

export function countToLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count < 5) return 3;
  return 4;
}

/**
 * Generates a 2-D calendar grid suitable for a GitHub-style contribution graph.
 *
 * The grid covers the last `months` calendar months ending today (inclusive).
 * Columns represent ISO weeks; rows represent weekdays 0-6 (Sun … Sat).
 * Padding cells that fall outside the date range are `null`.
 */
export function generateCalendarGrid(
  posts: Post[],
  months: number,
  referenceDate?: Date,
): CalendarWeek[] {
  const today = referenceDate ? new Date(referenceDate) : new Date();
  today.setHours(0, 0, 0, 0);

  // Compute the start date: first day of the month `months` months ago
  const startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() - months + 1, 1);
  startDate.setHours(0, 0, 0, 0);

  // Build a lookup from YYYY-MM-DD → CalendarDay
  const dayMap = new Map<string, CalendarDay>();
  for (const day of groupByCalendarDay(posts)) {
    dayMap.set(day.date, day);
  }

  // Walk from startDate to today, building week columns.
  // We align the first column so that startDate falls on its correct weekday row.
  const weeks: CalendarWeek[] = [];

  // Find the Sunday on or before startDate
  const cursor = new Date(startDate);
  cursor.setDate(cursor.getDate() - cursor.getDay()); // rewind to Sunday

  while (cursor <= today) {
    const cells: (CalendarCell | null)[] = [];
    for (let dow = 0; dow < 7; dow++) {
      const cellDate = new Date(cursor);
      cellDate.setDate(cursor.getDate() + dow);

      if (cellDate < startDate || cellDate > today) {
        cells.push(null);
      } else {
        const dateStr = toLocalDateString(cellDate);
        const day = dayMap.get(dateStr);
        const count = day?.count ?? 0;
        cells.push({
          date: dateStr,
          count,
          level: countToLevel(count),
          posts: day?.posts ?? [],
        });
      }
    }
    weeks.push({ cells });
    // advance to next Sunday
    cursor.setDate(cursor.getDate() + 7);
  }

  return weeks;
}
