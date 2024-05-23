import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'formatNihdi', standalone: true})
export class FormatNihdiPipe implements PipeTransform {
  private static readonly mask = '0-00000-00-000';
  private static readonly maskParts = FormatNihdiPipe.mask.split('-');

  transform(value?: string): string {
    if (!value) {
      return '';
    }
    value = value.replace(/[^0-9]+/g, '');
    let formattedParts = [];
    for (const part of FormatNihdiPipe.maskParts) {
      const endIndex = value.length >= part.length ? part.length : value.length;
      formattedParts.push(value.substring(0, endIndex));
      value = value.substring(endIndex);
    }
    return formattedParts.join('-');
  }
}
