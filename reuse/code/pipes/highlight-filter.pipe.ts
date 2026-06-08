import { Pipe, PipeTransform } from '@angular/core';
import { toSearchString } from '@reuse/code/utils/utils';

/**
 * Wraps occurrences of `filter` inside `value` with <span class="highlight">.
 *
 *
 * @param value       The original string
 * @param filter      The substring to hightlight in the original string
 * @param exactOrder  When true, the filter is matched as a single phrase
 *                    and only the first occurrence is highlighted.
 *                    When false (default), the filter is split into
 *                    individual terms and every occurrence is highlighted.
 */

@Pipe({
  name: 'highlightFilter',
  standalone: true,
})
export class HighlightFilterPipe implements PipeTransform {
  transform(value: string, filter?: string, exactOrder = false): string {
    if (!value || !filter) {
      return value;
    }

    value = value.normalize('NFC');
    const normalizedFilter = toSearchString(filter);

    // If exactOrder is false we split on anything that isn't a letter/digit so a query like "Ann verh." becomes ["ann", "verh"] and matches across columns.
    const searchTerms = exactOrder
      ? [normalizedFilter]
      : normalizedFilter.split(/[^a-z0-9]+/).filter(t => t.length > 0);

    if (searchTerms.length === 0 || searchTerms.every(t => t === '')) {
      return value;
    }

    const normalizedValue = toSearchString(value);
    const matches: Array<[number, number]> = [];

    // Collect every occurrence of every term.
    // Advancing `from` past the previous hit lets the same term match multiple times in one value if exactOrder is false.
    for (const term of searchTerms) {
      if (!term) continue;
      let from = 0;
      let index: number;
      while ((index = normalizedValue.indexOf(term, from)) !== -1) {
        matches.push([index, index + term.length]);
        if (exactOrder) break;
        from = index + term.length;
      }
    }

    if (matches.length === 0) {
      return value;
    }

    // Merge overlapping or adjacent matches so we don't emit nested or back-to-back <span> tags (e.g. searching "ann an" on "Ann").
    matches.sort((a, b) => a[0] - b[0]);
    const merged: Array<[number, number]> = [];
    for (const [start, end] of matches) {
      const last = merged[merged.length - 1];
      if (last && start <= last[1]) {
        last[1] = Math.max(last[1], end);
      } else {
        merged.push([start, end]);
      }
    }

    // glue the result
    let result = '';
    let cursor = 0;
    for (const [start, end] of merged) {
      result += value.substring(cursor, start) + '<span class="highlight">' + value.substring(start, end) + '</span>';
      cursor = end;
    }
    return result + value.substring(cursor);
  }
}
