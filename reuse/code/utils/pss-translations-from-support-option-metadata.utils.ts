import { SupportOption, TranslatedFieldItem } from '@reuse/code/openapi';
import { EvfTranslateService, Language } from '@smals-belgium-shared/vas-evaluation-form-ui-core';

export function getTranslationFromSupportOptionMetadata(
  supportOption: SupportOption,
  currentLang: Language,
  evfTranslate: EvfTranslateService
) {
  const instruction = supportOption.instruction;
  if (instruction?.translations && instruction.translations.length > 0) {
    const translations = instruction.translations;
    const translation = findTranslationValue(translations, currentLang);
    if (!translation) return '';
    return translation;
  }

  const supportOptionMetadata = supportOption.supportOptionMetadata;
  if (
    supportOptionMetadata?.['translations'] &&
    (supportOptionMetadata['translations'] as TranslatedFieldItem[]).length > 0
  ) {
    const translations = supportOptionMetadata['translations'] as TranslatedFieldItem[];
    const translation = findTranslationValue(translations, currentLang);
    if (!translation) return '';
    return translation;
  }

  if (supportOptionMetadata?.['labelTranslationId']) {
    return evfTranslate.instant(supportOptionMetadata?.['labelTranslationId'] as string);
  }

  return instruction?.code || '';
}

export function findTranslationValue(translations: TranslatedFieldItem[], language: string): string | undefined {
  const normalizedLanguage = language.toLowerCase();

  return translations.find(translation => {
    const translationLanguage = translation.language.toLowerCase();
    return translationLanguage === normalizedLanguage || translationLanguage.startsWith(`${normalizedLanguage}-`);
  })?.value;
}
