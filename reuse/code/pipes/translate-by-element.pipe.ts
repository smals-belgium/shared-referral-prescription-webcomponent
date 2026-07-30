import { Pipe, PipeTransform } from '@angular/core';
import { Lang as LanguageType, Lang } from '@reuse/code/constants/languages';
import { ElementGroup } from '@smals-belgium-shared/vas-evaluation-form-ui-core';

@Pipe({
  name: 'translateByElement',
  standalone: true,
  pure: false,
})
export class TranslateByElementPipe implements PipeTransform {
  transform(id: string, element?: ElementGroup, userLang?: string): string {
    if (!element) return '';

    const lang = (userLang && userLang.length >= 2 ? userLang.slice(0, 2) : LanguageType.FR.short) as Lang;

    const translations = { ...element.template?.translations, ...element.template?.commonTranslations };
    if (!(id in translations)) return '';

    const langObject = translations[id];
    if (!(lang in langObject)) return '';

    return langObject[lang]?.replace(" <span class='required'>*</span>", '') ?? '';
  }
}
