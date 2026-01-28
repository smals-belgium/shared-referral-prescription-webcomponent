import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'formatSsin', standalone: true })
export class FormatSsinPipe implements PipeTransform {

  transform(value?: string): string {
    return FormatSsinPipe.format(value);
  }

  static format(value?: string): string {
    if (!value) {
      return '';
    }
    const digits = value.replace(/\D+/g, '');

    if (digits.length !== 11) {
      return digits.toString();
    }

    const year = digits.substring(0, 2);
    const month = digits.substring(2, 4);
    const day = digits.substring(4, 6);
    const order = digits.substring(6, 9);
    const control = digits.substring(9, 11);

    return `${year}.${month}.${day}-${order}.${control}`;
  }
}
