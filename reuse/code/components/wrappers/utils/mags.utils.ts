import { UserLanguage } from '@smals-belgium/myhealth-wc-integration';
import { Lang } from '@reuse/code/constants/languages';

export function mapLanguageToTranslations(language?: UserLanguage): Lang {
  switch (language) {
    case 'nl':
      return Lang.NL.short;
    case 'fr':
      return Lang.FR.short;
    case 'de':
      return Lang.DE.short;
    case 'en':
      return Lang.EN.short;
    default:
      return Lang.FR.short;
  }
}
