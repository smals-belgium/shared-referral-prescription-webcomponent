export const Lang = {
  NL: { short: 'nl', full: 'nl-BE', capital: 'NL' },
  FR: { short: 'fr', full: 'fr-BE', capital: 'FR' },
  DE: { short: 'de', full: 'de-BE', capital: 'DE' },
  EN: { short: 'en', full: 'en-GB', capital: 'EN' },
} as const;

/**
 * type Lang = "nl" | "fr" | "de" | "en";
 */
export type Lang = (typeof Lang)[keyof typeof Lang]['short'];

/**
 * "nl-BE" | "fr-BE" | "de-BE" | "en-GB"
 */
export type FullLang = (typeof Lang)[keyof typeof Lang]['full'];
