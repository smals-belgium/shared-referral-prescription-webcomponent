export const LANGUAGES = {
  DUTCH_BE: 'nl-BE',
  FRENCH: 'fr',
  ENGLISH: 'en',
  GERMAN: 'de',
} as const;

export type SupportedLanguage = (typeof LANGUAGES)[keyof typeof LANGUAGES];
