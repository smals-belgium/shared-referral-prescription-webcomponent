import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'showDetails', standalone: true})
export class ShowDetailsPipe implements PipeTransform {

  transform(item: string | undefined, visibleItems: string[]): boolean {
    if (!item) return false

    return visibleItems.includes(item)
  }
}
