import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'formatNihdi', standalone: true })
export class FormatNihdiPipe implements PipeTransform {
  private static readonly mask = '0-00000-00-000';
  private static readonly maskParts = FormatNihdiPipe.mask.split('-');

  transform(value?: string, qualificationCode?: string): string {
    return FormatNihdiPipe.format(value, qualificationCode);
  }

  static format(value?: string, qualificationCode?: string): string {
    let nihidi = value;
    if (!value) {
      return '';
    }
    if (qualificationCode && value.length === 8) {
      nihidi = value + qualificationCode;
    }
    nihidi = nihidi!.replace(/\D+/g, '');
    const formattedParts: string[] = [];
    for (const part of FormatNihdiPipe.maskParts) {
      const endIndex = nihidi.length >= part.length ? part.length : nihidi.length;
      formattedParts.push(nihidi.substring(0, endIndex));
      nihidi = nihidi.substring(endIndex);
    }
    return formattedParts.join('-');
  }
}
