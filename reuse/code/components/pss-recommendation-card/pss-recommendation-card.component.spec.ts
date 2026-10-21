import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { Subject } from 'rxjs';

import { Lang } from '@reuse/code/constants/languages';
import { SupportOption } from '@reuse/code/openapi';
import { EvfTranslateService, Language } from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { PssRecommendationCardComponent } from './pss-recommendation-card.component';
import { MatIconTestingModule } from '@angular/material/icon/testing';

describe('PssRecommendationCardComponent', () => {
  let component: PssRecommendationCardComponent;
  let fixture: ComponentFixture<PssRecommendationCardComponent>;
  let mockEvfTranslateService: jest.Mocked<Partial<EvfTranslateService>>;
  let currentLangSubject: Subject<Language>;

  const mockRecommendation: SupportOption = {
    id: '1',
    score: 7,
    instruction: { system: 'pss', code: 'exam-code', translations: [] },
    evidenceSummary: { code: '123', system: 'snomed', translations: [], version: '1' },
    supportOptionMetadata: { isRequested: true, radiationLevel: 2, relativeCost: 3 },
  };

  beforeEach(async () => {
    currentLangSubject = new Subject<Language>();

    mockEvfTranslateService = {
      currentLang: Lang.NL.short,
      currentLang$: currentLangSubject.asObservable(),
      instant: jest.fn((key: string) => key),
    };

    await TestBed.configureTestingModule({
      imports: [PssRecommendationCardComponent, TranslateModule.forRoot(), MatIconTestingModule],
      providers: [{ provide: EvfTranslateService, useValue: mockEvfTranslateService }],
    }).compileComponents();

    fixture = TestBed.createComponent(PssRecommendationCardComponent);
    component = fixture.componentInstance;
  });

  function setInputs(partial: {
    recommendation?: SupportOption;
    selectable?: boolean;
    disabled?: boolean;
    name?: string;
    checked?: boolean;
  }) {
    Object.entries(partial).forEach(([key, value]) => {
      fixture.componentRef.setInput(key, value);
    });
    fixture.detectChanges();
  }

  describe('hasScore', () => {
    it('should be true when score is greater than zero', () => {
      setInputs({ recommendation: { ...mockRecommendation, score: 5 } });
      expect(component['hasScore']()).toBe(true);
    });

    it('should be false when score is zero', () => {
      setInputs({ recommendation: { ...mockRecommendation, score: 0 } });
      expect(component['hasScore']()).toBe(false);
    });

    it('should be false when score is undefined', () => {
      setInputs({ recommendation: { ...mockRecommendation, score: undefined } });
      expect(component['hasScore']()).toBe(false);
    });
  });

  describe('examName', () => {
    it('should derive the exam name from the recommendation instruction code', () => {
      setInputs({ recommendation: mockRecommendation });
      expect(component['examName']()).toBe('exam-code');
    });

    it('should react to currentLang$ emissions', () => {
      setInputs({
        recommendation: {
          ...mockRecommendation,
          instruction: {
            system: 'pss',
            code: 'exam-code',
            translations: [
              { language: 'nl', value: 'NL naam' },
              { language: 'en', value: 'EN name' },
            ],
          },
        },
      });
      expect(component['examName']()).toBe('NL naam');

      currentLangSubject.next(Lang.EN.short as unknown as Language);
      fixture.detectChanges();
      expect(component['examName']()).toBe('EN name');
    });
  });

  describe('radiationLevel', () => {
    it('should read radiationLevel from supportOptionMetadata', () => {
      setInputs({ recommendation: mockRecommendation });
      expect(component['radiationLevel']()).toBe(2);
    });
  });

  describe('onCardClick', () => {
    it('should not emit selectionChange when not selectable', () => {
      setInputs({ recommendation: mockRecommendation, selectable: false });
      const emitSpy = jest.spyOn(component.selectionChange, 'emit');

      component['onCardClick']();

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not emit selectionChange when disabled', () => {
      setInputs({ recommendation: mockRecommendation, selectable: true, disabled: true });
      const emitSpy = jest.spyOn(component.selectionChange, 'emit');

      component['onCardClick']();

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should emit selectionChange with the recommendation when selectable and not disabled', () => {
      setInputs({ recommendation: mockRecommendation, selectable: true, disabled: false });
      const emitSpy = jest.spyOn(component.selectionChange, 'emit');

      component['onCardClick']();

      expect(emitSpy).toHaveBeenCalledWith(mockRecommendation);
    });
  });
});
