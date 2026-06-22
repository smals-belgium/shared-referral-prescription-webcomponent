import { FullLang, Lang } from '@reuse/code/constants/languages';
import { mapLanguageToTranslations } from './mags.utils';
import { UserLanguage } from '@smals-belgium/myhealth-wc-integration';

describe('mapLanguageToTranslations', () => {
  describe('valid language mappings', () => {
    const cases: ReadonlyArray<[UserLanguage, FullLang]> = [
      ['nl', Lang.NL.full],
      ['fr', Lang.FR.full],
      ['de', Lang.DE.full],
      ['en', Lang.EN.full],
    ];

    it.each(cases)('should map %s to %s', (input, expected) => {
      expect(mapLanguageToTranslations(input)).toBe(expected);
    });
  });

  describe('default fallback', () => {
    it('should return Lang.NL when language is undefined', () => {
      expect(mapLanguageToTranslations(undefined)).toBe(Lang.NL.full);
    });

    it('should return Lang.NL for unknown runtime value', () => {
      // Explicitly simulate unexpected runtime input
      const invalid = 'es' as unknown as UserLanguage;
      expect(mapLanguageToTranslations(invalid)).toBe(Lang.NL.full);
    });
  });
});
