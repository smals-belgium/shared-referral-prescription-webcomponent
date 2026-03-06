import { UserLanguage } from '@smals-belgium/myhealth-wc-integration';
import { Lang } from '@reuse/code/interfaces/lang.enum';

export function mapLanguageToTranslations(language?: UserLanguage): Lang {
  switch (language) {
    case 'nl':
      return Lang.NL;
    case 'fr':
      return Lang.FR;
    case 'de':
      return Lang.DE;
    case 'en':
      return Lang.EN;
    default:
      return Lang.FR;
  }
}

