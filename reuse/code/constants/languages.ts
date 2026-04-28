export const Lang = {
  NL: { short: 'nl', full: 'nl-BE' },
  FR: { short: 'fr', full: 'fr-BE' },
  DE: { short: 'de', full: 'de-BE' },
  EN: { short: 'en', full: 'en-GB' },
} as const;

/**
 * type Lang = "nl" | "fr" | "de" | "en";
 */
export type Lang = (typeof Lang)[keyof typeof Lang]['short'];

/**
 * "nl-BE" | "fr-BE" | "de-BE" | "en-GB"
 */
export type FullLang = (typeof Lang)[keyof typeof Lang]['full'];
