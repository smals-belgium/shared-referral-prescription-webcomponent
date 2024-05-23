import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'formatSsin', standalone: true})
export class FormatSsinPipe implements PipeTransform {
  private static readonly mask = '00.00.00-000.00';
  private static readonly maskParts = FormatSsinPipe.mask.split(/[^0-9]/);
  private static readonly maskSeparators = FormatSsinPipe.mask
    .replace(/[0-9]/g, '')
    .split('');

  transform(value?: string): string {
    if (!value) {
      return '';
    }
    value = value.replace(/[^0-9]+/, '');
    let formattedParts = [];
    for (const part of FormatSsinPipe.maskParts) {
      const endIndex = value.length >= part.length ? part.length : value.length;
      formattedParts.push(value.substring(0, endIndex));
      value = value.substring(endIndex);
    }
    return formattedParts.reduce((acc, cur, index) => acc
        + cur
        + (index < formattedParts.length - 1 ? FormatSsinPipe.maskSeparators[index] : '')
      , '');
  }
}
