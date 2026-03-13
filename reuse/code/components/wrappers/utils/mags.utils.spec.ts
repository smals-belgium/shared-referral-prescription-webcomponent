import { Lang } from '@reuse/code/constants/languages';
import { mapLanguageToTranslations } from './mags.utils';
import { UserLanguage } from '@smals-belgium/myhealth-wc-integration';

describe('mapLanguageToTranslations', () => {
  describe('valid language mappings', () => {
    const cases: ReadonlyArray<[UserLanguage, Lang]> = [
      ['nl', Lang.NL.short],
      ['fr', Lang.FR.short],
      ['de', Lang.DE.short],
      ['en', Lang.EN.short],
    ];

    it.each(cases)('should map %s to %s', (input, expected) => {
      expect(mapLanguageToTranslations(input)).toBe(expected);
    });
  });

  describe('default fallback', () => {
    it('should return Lang.FR when language is undefined', () => {
      expect(mapLanguageToTranslations(undefined)).toBe(Lang.FR.short);
    });

    it('should return Lang.FR for unknown runtime value', () => {
      // Explicitly simulate unexpected runtime input
      const invalid = 'es' as unknown as UserLanguage;
      expect(mapLanguageToTranslations(invalid)).toBe(Lang.FR.short);
    });
  });
});
