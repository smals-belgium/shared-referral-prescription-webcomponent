import { TestBed, fakeAsync, flush } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { TemplatesState } from '@reuse/code/states/api/templates.state';
import { TemplateNamePipe } from './template-name.pipe';
import { Intent, LoadingStatus } from '@reuse/code/interfaces';
import { signal, ChangeDetectorRef } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

describe('TemplateNamePipe', () => {
  let pipe: TemplateNamePipe;
  let mockTranslateService: any;
  let mockTemplatesState: any;

  const mockTemplates: any[] = [
    {
      code: 'ANNEX_81',
      labelTranslations: {
        fr: 'Annexe 81',
        nl: 'Bijlage 81',
        de: 'Anlage 81',
      },
      metadata: { snomed: '123' },
    },
    {
      code: 'ANNEX_82',
      labelTranslations: {
        fr: 'Annexe 82',
        nl: 'Bijlage 82',
        de: 'Anlage 82',
      },
      metadata: { snomed: '456' },
    },
  ];

  beforeEach(fakeAsync(() => {
    const langChangeSubject = new BehaviorSubject({ lang: 'fr' });

    mockTranslateService = {
      currentLang: 'fr',
      defaultLang: 'nl',
      instant: jest.fn((key: string) => key),
      onLangChange: langChangeSubject,
    };

    mockTemplatesState = {
      state: signal({ data: mockTemplates, status: LoadingStatus.SUCCESS }),
    };

    TestBed.configureTestingModule({
      providers: [
        TemplateNamePipe,
        { provide: TranslateService, useValue: mockTranslateService },
        { provide: TemplatesState, useValue: mockTemplatesState },
        {
          provide: ChangeDetectorRef,
          useFactory: () => ({
            markForCheck: jest.fn(),
            detach: jest.fn(),
            detectChanges: jest.fn(),
            checkNoChanges: jest.fn(),
          }),
        },
      ],
    });

    pipe = TestBed.inject(TemplateNamePipe);
    flush();
  }));

  it('should transform template code to translated label', () => {
    const result = pipe.transform('ANNEX_81');
    expect(result).toBe('Annexe 81');
  });

  it('should return template code as fallback when translation not found', () => {
    const result = pipe.transform('UNKNOWN_CODE');
    expect(result).toBe('UNKNOWN_CODE');
  });

  it('should add proposal prefix when intent is proposal', () => {
    mockTranslateService.instant.mockReturnValueOnce('Proposition: ');
    const result = pipe.transform('ANNEX_81', 'proposal' as Intent);
    expect(result).toContain('Proposition:');
  });

  it('should return empty string when templateCodeOrId is null or undefined', () => {
    expect(pipe.transform(null as any)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });
});
