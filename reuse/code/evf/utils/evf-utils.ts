import { Language } from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { Lang } from '@reuse/code/constants/languages';

export type SupportedLanguages = Extract<Language, 'nl' | 'fr'>;

export function formatToEvfLangCode(localeCode: string): SupportedLanguages {
  return (localeCode?.substring(0, 2) as SupportedLanguages) ?? Lang.FR.short;
}
