import { Pipe, PipeTransform } from '@angular/core';
import { toSearchString } from '@reuse/code/utils/utils';

@Pipe({
  name: 'highlightFilter',
  standalone: true,
})
export class HighlightFilterPipe implements PipeTransform {
  transform(value: string, filter?: string): string {
    if (!filter) {
      return value;
    }
    const searchFilter = toSearchString(filter);
    const index = toSearchString(value).indexOf(searchFilter);
    if (index < 0) {
      return value;
    }
    return (
      value.substring(0, index) +
      '<span>' +
      value.substring(index, index + searchFilter.length) +
      '</span>' +
      value.substring(index + searchFilter.length)
    );
  }
}
