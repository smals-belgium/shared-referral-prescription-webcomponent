import { Pipe, PipeTransform } from '@angular/core';
import { Translation } from '@reuse/code/openapi';

type Value = Translation;
type Lang = keyof Value;

@Pipe({ name: 'formatMultilingualObject', standalone: true })
export class FormatMultilingualObjectPipe implements PipeTransform {
  transform(value?: Value, userLang?: string): string {
    if (!value) {
      return '';
    }

    const lang = (userLang && userLang.length >= 2 ? userLang.slice(0, 2) : 'fr') as Lang;

    if (!(lang in value)) return '';

    return value[lang] ?? '';
  }
}
