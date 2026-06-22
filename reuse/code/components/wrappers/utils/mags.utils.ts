import { UserLanguage } from '@smals-belgium/myhealth-wc-integration';
import { Lang } from '@reuse/code/constants/languages';

export function mapLanguageToTranslations(language?: UserLanguage) {
  switch (language) {
    case 'nl':
      return Lang.NL.full;
    case 'fr':
      return Lang.FR.full;
    case 'de':
      return Lang.DE.full;
    case 'en':
      return Lang.EN.full;
    default:
      return Lang.NL.full;
  }
}
