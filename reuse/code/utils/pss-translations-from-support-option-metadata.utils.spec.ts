import { EvfTranslateService, Language } from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { SupportOption, TranslatedFieldItem } from '@reuse/code/openapi';
import { getTranslationFromSupportOptionMetadata } from './pss-translations-from-support-option-metadata.utils';

function buildSupportOption(overrides: Partial<SupportOption> = {}): SupportOption {
  return {
    id: '1',
    score: 5,
    instruction: undefined,
    evidenceSummary: { code: '1', system: 'snomed', translations: [], version: '1' },
    supportOptionMetadata: {},
    ...overrides,
  } as SupportOption;
}

function translation(language: string, value: string): TranslatedFieldItem {
  return { language, value } as TranslatedFieldItem;
}

describe('getTranslationFromSupportOptionMetadata', () => {
  let evfTranslate: jest.Mocked<Pick<EvfTranslateService, 'instant'>>;

  beforeEach(() => {
    evfTranslate = { instant: jest.fn().mockReturnValue('') } as unknown as jest.Mocked<
      Pick<EvfTranslateService, 'instant'>
    >;
  });

  describe('instruction.translations', () => {
    it('returns the value for an exact (case-insensitive) language match', () => {
      const supportOption = buildSupportOption({
        instruction: {
          system: 'pss',
          code: '123',
          translations: [translation('NL', 'Nederlandse tekst'), translation('en', 'English text')],
        },
      });

      expect(
        getTranslationFromSupportOptionMetadata(
          supportOption,
          'EN' as Language,
          evfTranslate as unknown as EvfTranslateService
        )
      ).toBe('English text');
    });

    it('matches a translation language against a the currentLang (e.g. "en-GB" matches "en")', () => {
      const supportOption = buildSupportOption({
        instruction: { system: 'pss', code: '123', translations: [translation('en-GB', 'English text')] },
      });

      expect(
        getTranslationFromSupportOptionMetadata(
          supportOption,
          'en' as Language,
          evfTranslate as unknown as EvfTranslateService
        )
      ).toBe('English text');
    });

    it('does NOT match a translation language against the currentLang (no reverse matching)', () => {
      const supportOption = buildSupportOption({
        instruction: { system: 'pss', code: '123', translations: [translation('en', 'English text')] },
      });

      expect(
        getTranslationFromSupportOptionMetadata(
          supportOption,
          'en-GB' as Language,
          evfTranslate as unknown as EvfTranslateService
        )
      ).toBe('');
    });

    it('returns "" when translations exist but none match the current language, WITHOUT falling back to supportOptionMetadata', () => {
      const supportOption = buildSupportOption({
        instruction: { system: 'pss', code: '123', translations: [translation('fr', 'Texte français')] },
        supportOptionMetadata: { labelTranslationId: 'should.not.be.used' },
      });

      const result = getTranslationFromSupportOptionMetadata(
        supportOption,
        'nl' as Language,
        evfTranslate as unknown as EvfTranslateService
      );

      expect(result).toBe('');
      expect(evfTranslate.instant).not.toHaveBeenCalled();
    });

    it('picks the first matching translation when multiple entries share a language', () => {
      const supportOption = buildSupportOption({
        instruction: {
          system: 'pss',
          code: '123',
          translations: [translation('en', 'First'), translation('en', 'Second')],
        },
      });

      expect(
        getTranslationFromSupportOptionMetadata(
          supportOption,
          'en' as Language,
          evfTranslate as unknown as EvfTranslateService
        )
      ).toBe('First');
    });
  });

  describe('falling back to supportOptionMetadata.translations when instruction has none', () => {
    it('uses supportOptionMetadata.translations when instruction.translations is undefined', () => {
      const supportOption = buildSupportOption({
        instruction: { system: 'pss', code: '123', translations: [] },
        supportOptionMetadata: { translations: [translation('en', 'Metadata English')] },
      });

      expect(
        getTranslationFromSupportOptionMetadata(
          supportOption,
          'en' as Language,
          evfTranslate as unknown as EvfTranslateService
        )
      ).toBe('Metadata English');
    });

    it('uses supportOptionMetadata.translations when instruction itself is undefined', () => {
      const supportOption = buildSupportOption({
        instruction: undefined,
        supportOptionMetadata: { translations: [translation('nl', 'Metadata Nederlands')] },
      });

      expect(
        getTranslationFromSupportOptionMetadata(
          supportOption,
          'nl' as Language,
          evfTranslate as unknown as EvfTranslateService
        )
      ).toBe('Metadata Nederlands');
    });

    it('returns "" when supportOptionMetadata.translations exist but none match the current language', () => {
      const supportOption = buildSupportOption({
        instruction: undefined,
        supportOptionMetadata: {
          translations: [translation('fr', 'Texte français')],
          labelTranslationId: 'should.not.be.used',
        },
      });

      const result = getTranslationFromSupportOptionMetadata(
        supportOption,
        'de' as Language,
        evfTranslate as unknown as EvfTranslateService
      );

      expect(result).toBe('');
      expect(evfTranslate.instant).not.toHaveBeenCalled();
    });
  });

  describe('falling back to labelTranslationId', () => {
    it('calls evfTranslate.instant with the labelTranslationId when no translations are present anywhere', () => {
      evfTranslate.instant.mockReturnValue('Translated label');
      const supportOption = buildSupportOption({
        instruction: undefined,
        supportOptionMetadata: { labelTranslationId: 'prescription.other-reason' },
      });

      const result = getTranslationFromSupportOptionMetadata(
        supportOption,
        'en' as Language,
        evfTranslate as unknown as EvfTranslateService
      );

      expect(evfTranslate.instant).toHaveBeenCalledWith('prescription.other-reason');
      expect(result).toBe('Translated label');
    });

    it('is used when translations arrays are present but empty', () => {
      evfTranslate.instant.mockReturnValue('Translated label');
      const supportOption = buildSupportOption({
        instruction: { system: 'pss', code: '123', translations: [] },
        supportOptionMetadata: { translations: [], labelTranslationId: 'prescription.no-examination' },
      });

      const result = getTranslationFromSupportOptionMetadata(
        supportOption,
        'en' as Language,
        evfTranslate as unknown as EvfTranslateService
      );

      expect(evfTranslate.instant).toHaveBeenCalledWith('prescription.no-examination');
      expect(result).toBe('Translated label');
    });
  });

  describe('final fallback to instruction.code', () => {
    it('returns instruction.code when nothing else is available', () => {
      const supportOption = buildSupportOption({
        instruction: { system: 'pss', code: 'ABC-123', translations: [] },
        supportOptionMetadata: {},
      });

      expect(
        getTranslationFromSupportOptionMetadata(
          supportOption,
          'en' as Language,
          evfTranslate as unknown as EvfTranslateService
        )
      ).toBe('ABC-123');
      expect(evfTranslate.instant).not.toHaveBeenCalled();
    });

    it('returns "" when there is no instruction, no metadata translations, and no labelTranslationId', () => {
      const supportOption = buildSupportOption({
        instruction: undefined,
        supportOptionMetadata: {},
      });

      expect(
        getTranslationFromSupportOptionMetadata(
          supportOption,
          'en' as Language,
          evfTranslate as unknown as EvfTranslateService
        )
      ).toBe('');
    });

    it('returns "" when instruction exists but has no code and no translations', () => {
      const supportOption = buildSupportOption({
        instruction: { system: 'pss', code: '', translations: [] },
        supportOptionMetadata: {},
      });

      expect(
        getTranslationFromSupportOptionMetadata(
          supportOption,
          'en' as Language,
          evfTranslate as unknown as EvfTranslateService
        )
      ).toBe('');
    });

    it('returns "" when supportOptionMetadata itself is undefined', () => {
      const supportOption = buildSupportOption({
        instruction: undefined,
        supportOptionMetadata: undefined,
      });

      expect(
        getTranslationFromSupportOptionMetadata(
          supportOption,
          'en' as Language,
          evfTranslate as unknown as EvfTranslateService
        )
      ).toBe('');
    });
  });
});
