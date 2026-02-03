import { ChangeDetectorRef } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { TranslationPipe } from './translation.pipe';
import { Translation } from '@reuse/code/openapi';

describe('TranslationPipe - 100% Coverage', () => {
  let pipe: TranslationPipe;
  let translateService: jest.Mocked<TranslateService>;
  let cd: jest.Mocked<ChangeDetectorRef>;
  let onLangChange: Subject<any>;

  beforeEach(() => {
    onLangChange = new Subject();
    translateService = {
      onLangChange: onLangChange.asObservable(),
      currentLang: 'fr',
      defaultLang: 'fr',
    } as jest.Mocked<TranslateService>;

    cd = {
      markForCheck: jest.fn(),
    } as unknown as jest.Mocked<ChangeDetectorRef>;

    pipe = new TranslationPipe(translateService, cd);
  });

  afterEach(() => {
    pipe.ngOnDestroy();
  });

  it('should return empty string when value is undefined', () => {
    const result = pipe.transform(undefined);
    expect(result).toBe('');
  });

  it('should translate on first call', () => {
    const prescription: Translation = {
      fr: 'Soins infirmiers',
      nl: 'Verpleegkundige zorg',
      de: 'Krankenpflege',
      en: 'Nursing care',
    };
    const result = pipe.transform(prescription);
    expect(result).toBe('Soins infirmiers');
  });

  it('should use currentLang when available', () => {
    translateService.currentLang = 'nl';
    const prescription: Translation = {
      fr: 'Pansement stérile',
      nl: 'Steriel verband',
      de: 'Steriler Verband',
      en: 'Sterile dressing',
    };
    const result = pipe.transform(prescription);
    expect(result).toBe('Steriel verband');
  });

  it('should handle missing translation for language', () => {
    translateService.currentLang = 'es';
    const prescription: Translation = {
      fr: 'Soins postopératoires',
      nl: 'Postoperatieve zorg',
      de: 'Postoperative Versorgung',
      en: 'Postoperative care',
    };
    const result = pipe.transform(prescription);
    expect(result).toBe('');
  });
});
