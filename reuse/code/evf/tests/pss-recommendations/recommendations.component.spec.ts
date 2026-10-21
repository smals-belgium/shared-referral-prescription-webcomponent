import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  AutocompleteOption,
  evfElementConfigFeature,
  FormTemplate,
  provideEvfCore,
} from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EvfDynamicFormComponent } from '@smals-belgium-shared/vas-evaluation-form-ui-material/dynamic-form';
import { BrowserModule, By } from '@angular/platform-browser';
import { MarkdownModule } from 'ngx-markdown';
import { RecommendationsComponent as Wrapper } from './recommendations.component';
import { PssRecommendationsComponent } from '@reuse/code/evf/components/pss-recommendations/element/pss-recommendations.component';
import { PssService } from '@reuse/code/services/api/pss.service';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { SupportOption, SupportResponseRadiology } from '@reuse/code/openapi';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { PSS_NO_EXAMINATION, PSS_OTHER_REASON } from '@reuse/code/constants/pss.constants';

const formTemplate: FormTemplate = {
  elements: [
    {
      id: 'recommendations',
      viewType: 'recommendations',
      dataType: { type: 'object' },
      labelTranslationId: 'recommendations',
      validations: [{ name: 'required' }],
    },
  ],
  translations: {
    recommendations: { fr: 'Pss Recommendations', nl: 'Pss Recommendations' },
  },
};

const disableAnimations =
  !('animate' in document.documentElement) || (navigator && /iPhone OS (8|9|10|11|12|13)_/.test(navigator.userAgent));

const indicationMock: AutocompleteOption = {
  label: { nl: 'Indicatie NL', fr: 'Indication FR', de: 'Indikation DE', en: 'Indication EN' },
  value: 'indication1',
};

const proposedImagingMock: AutocompleteOption = {
  label: { nl: 'Procedure NL', fr: 'Procédure FR', de: 'Prozedur DE', en: 'Procedure EN' },
  value: 'procedure1',
};

function buildElementGroupMock(overrides: Record<string, unknown> = {}) {
  const values: Record<string, unknown> = {
    exchangeId: 'exchange-1',
    pssIndicationProposal: [indicationMock],
    proposedImaging: [proposedImagingMock],
    urgency: false,
    reasonOfDeviationCode: undefined,
    reasonOfDeviationText: undefined,
    score: undefined,
    ...overrides,
  };

  const rawControls: Record<string, { value: unknown; setValue: jest.Mock; markAsTouched: jest.Mock }> = {};
  Object.keys(values).forEach(key => {
    rawControls[key] = {
      value: values[key],
      setValue: jest.fn(val => (rawControls[key].value = val)),
      markAsTouched: jest.fn(),
    };
  });

  const controls = new Proxy(rawControls, {
    get(target, prop: string) {
      if (!(prop in target) && typeof prop === 'string') {
        target[prop] = {
          value: undefined,
          setValue: jest.fn(val => (target[prop].value = val)),
          markAsTouched: jest.fn(),
        };
      }
      return target[prop];
    },
  });

  return {
    get: (field: string) => controls[field],
    getOutputValue: jest.fn().mockReturnValue(values),
    controls,
  };
}

describe('PssRecommendationsComponent', () => {
  let component: Wrapper;
  let fixture: ComponentFixture<Wrapper>;
  let pssServiceMock: jest.Mocked<PssService>;
  let toastServiceMock: jest.Mocked<ToastService>;

  beforeEach(async () => {
    pssServiceMock = {
      controlIndications: jest.fn(),
      getPssRecommendations: jest.fn().mockReturnValue(of({ exchangeId: '', supportOptions: [], conclusions: [] })),
      getPssSessionId: jest.fn().mockReturnValue(1),
      setPssSessionId: jest.fn(),
    } as unknown as jest.Mocked<PssService>;

    toastServiceMock = {
      show: jest.fn(),
      showSomethingWentWrong: jest.fn(),
    } as unknown as jest.Mocked<ToastService>;

    await TestBed.configureTestingModule({
      imports: [
        Wrapper,
        EvfDynamicFormComponent,
        BrowserModule,
        BrowserAnimationsModule.withConfig({ disableAnimations }),
        MarkdownModule.forRoot(),
        TranslateModule.forRoot(),
        MatIconTestingModule,
      ],
      providers: [
        provideEvfCore(evfElementConfigFeature({ name: 'recommendations', element: PssRecommendationsComponent })),
        { provide: PssService, useValue: pssServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Wrapper);
    component = fixture.componentInstance;
    component.demoTemplate = formTemplate;
    fixture.detectChanges();
  });

  function getRecommendations() {
    return fixture.debugElement.query(By.directive(PssRecommendationsComponent)).componentInstance;
  }

  function runPssControlWith(elementGroupMock: ReturnType<typeof buildElementGroupMock>) {
    const instance = getRecommendations();
    instance.elementControl.elementGroup = elementGroupMock as any;

    toastServiceMock.show.mockClear();
    toastServiceMock.showSomethingWentWrong.mockClear();
    pssServiceMock.getPssRecommendations.mockClear();

    instance['pssControl']();
    fixture.detectChanges();
    return instance;
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('pssControl / required field validation', () => {
    it('should show error and stop loading when required fields are missing', () => {
      const elementGroupMock = buildElementGroupMock({ exchangeId: undefined, pssIndicationProposal: undefined });

      const instance = runPssControlWith(elementGroupMock);

      expect(toastServiceMock.show).toHaveBeenCalledWith('prescription.create.control.error.required');
      expect(instance.isLoading()).toBe(false);
      expect(elementGroupMock.controls['exchangeId'].markAsTouched).toHaveBeenCalled();
      expect(elementGroupMock.controls['pssIndicationProposal'].markAsTouched).toHaveBeenCalled();
      expect(pssServiceMock.getPssRecommendations).not.toHaveBeenCalled();
    });

    it('should show error when pssIndicationProposal is an empty array', () => {
      const elementGroupMock = buildElementGroupMock({ pssIndicationProposal: [] });

      const instance = runPssControlWith(elementGroupMock);

      expect(toastServiceMock.show).toHaveBeenCalledWith('prescription.create.control.error.required');
      expect(instance.isLoading()).toBe(false);
    });

    it('should call the API when all required fields are present', () => {
      const elementGroupMock = buildElementGroupMock();

      runPssControlWith(elementGroupMock);

      expect(toastServiceMock.show).not.toHaveBeenCalled();
      expect(pssServiceMock.getPssRecommendations).toHaveBeenCalled();
    });
  });

  describe('fetchPssRecommendations', () => {
    const DEFAULT_INDICATIONS_LENGTH = 2; // 'OtherReason' + 'noExamination'

    it('should append DEFAULT_INDICATIONS to the fetched supportOptions on success', () => {
      const mockResult: SupportResponseRadiology = {
        exchangeId: '',
        supportOptions: [
          {
            id: '1',
            score: 4,
            instruction: { code: '1', translations: [], system: '2' },
            evidenceSummary: { code: '1', translations: [], version: '2', system: '' },
            supportOptionMetadata: { isRequested: true, radiationLevel: 1, relativeCost: 3 },
          },
        ],
        conclusions: [],
      };
      pssServiceMock.getPssRecommendations.mockReturnValue(of(mockResult));

      const instance = runPssControlWith(buildElementGroupMock());

      expect(instance.controlIndications()).toHaveLength(
        mockResult.supportOptions!.length + DEFAULT_INDICATIONS_LENGTH
      );
      expect(instance.controlIndications()).toEqual(
        expect.arrayContaining([...mockResult.supportOptions!, expect.objectContaining({ id: PSS_OTHER_REASON })])
      );
      expect(instance.isLoading()).toBe(false);
    });

    it('should fall back to DEFAULT_INDICATIONS and toast on API error', () => {
      pssServiceMock.getPssRecommendations.mockReturnValue(throwError(() => new Error('API Error')));

      const instance = runPssControlWith(buildElementGroupMock());

      expect(toastServiceMock.showSomethingWentWrong).toHaveBeenCalled();
      expect(instance.controlIndications()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: PSS_OTHER_REASON }),
          expect.objectContaining({ id: PSS_NO_EXAMINATION }),
        ])
      );
      expect(instance.isLoading()).toBe(false);
    });
  });

  describe('hasProposedImaging', () => {
    it('should be true when proposedImaging has entries', () => {
      const instance = runPssControlWith(buildElementGroupMock({ proposedImaging: [proposedImagingMock] }));
      instance.checkIfFormHasProposedImaging();
      expect(instance.hasProposedImaging()).toBe(true);
    });

    it('should be false when proposedImaging is empty', () => {
      const instance = runPssControlWith(buildElementGroupMock({ proposedImaging: [] }));
      instance.checkIfFormHasProposedImaging();
      expect(instance.hasProposedImaging()).toBe(false);
    });

    it('should be false when proposedImaging is missing', () => {
      const instance = runPssControlWith(buildElementGroupMock({ proposedImaging: undefined }));
      instance.checkIfFormHasProposedImaging();
      expect(instance.hasProposedImaging()).toBe(false);
    });
  });

  describe('selectSupportOption', () => {
    it('should set control value as a single-item array', () => {
      const instance = getRecommendations();
      instance.elementControl.elementGroup = buildElementGroupMock() as any;
      const option = { id: '1', score: 5 } as SupportOption;

      instance.selectSupportOption(option);

      expect(instance.control.value).toEqual([option]);
    });

    it('should clear reasonOfDeviationCode/Text and set score for a normal option', () => {
      const elementGroupMock = buildElementGroupMock();
      const instance = getRecommendations();
      instance.elementControl.elementGroup = elementGroupMock as any;
      const option = { id: '1', score: 5 } as SupportOption;

      instance.selectSupportOption(option);

      expect(elementGroupMock.controls['reasonOfDeviationCode'].setValue).toHaveBeenCalledWith(undefined);
      expect(elementGroupMock.controls['reasonOfDeviationText'].setValue).toHaveBeenCalledWith(undefined);
      expect(elementGroupMock.controls['score'].setValue).toHaveBeenCalledWith(5);
    });

    it('should set reasonOfDeviationCode to OtherReason for the OtherReason option', () => {
      const elementGroupMock = buildElementGroupMock();
      const instance = getRecommendations();
      instance.elementControl.elementGroup = elementGroupMock as any;
      const option = { id: 'OtherReason', score: 0 } as SupportOption;

      instance.selectSupportOption(option);

      expect(elementGroupMock.controls['reasonOfDeviationCode'].setValue).toHaveBeenCalledWith('OtherReason');
      expect(elementGroupMock.controls['reasonOfDeviationText'].setValue).not.toHaveBeenCalledWith(expect.anything());
    });

    it('should set reasonOfDeviationCode and translated reasonOfDeviationText for noExamination', () => {
      const elementGroupMock = buildElementGroupMock();
      const instance = getRecommendations();
      instance.elementControl.elementGroup = elementGroupMock as any;
      const option: SupportOption = { id: 'noExamination', score: -1 } as SupportOption;
      jest.spyOn(instance, 'getTranslationFromSupportOption').mockReturnValue('translated reason');

      instance.selectSupportOption(option);

      expect(elementGroupMock.controls['reasonOfDeviationCode'].setValue).toHaveBeenCalledWith('OtherReason');
      expect(elementGroupMock.controls['reasonOfDeviationText'].setValue).toHaveBeenCalledWith('translated reason');
    });
  });

  describe('hasAdditionalRelevantInformation / getRelevantInfo / getImplants / getPreviuosExams', () => {
    it('should return true when additional relevant information exists', () => {
      const instance = getRecommendations();
      instance.elementControl.elementGroup = buildElementGroupMock({
        'additional-relevant-information': ['Some relevant info'],
      }) as any;

      expect(instance.hasAdditionalRelevantInformation()).toBe(true);
    });

    it('should return false when additional relevant information and previous exams are both empty', () => {
      const instance = getRecommendations();
      instance.elementControl.elementGroup = buildElementGroupMock({
        'additional-relevant-information': [],
        'previous-relevant-examinations': [],
      }) as any;

      expect(instance.hasAdditionalRelevantInformation()).toBe(false);
    });

    it('should return true when only previous exams exist', () => {
      const instance = getRecommendations();
      instance.elementControl.elementGroup = buildElementGroupMock({
        'additional-relevant-information': [],
        'previous-relevant-examinations': [indicationMock],
      }) as any;

      expect(instance.hasAdditionalRelevantInformation()).toBe(true);
    });

    it('should read implants out of tmp-addInfo-impl', () => {
      const instance = getRecommendations();
      instance.elementControl.elementGroup = buildElementGroupMock({
        'tmp-addInfo-impl': { implants: [proposedImagingMock] },
      }) as any;

      expect(instance.getImplants()).toEqual([proposedImagingMock]);
    });

    it('should return an empty array of implants when tmp-addInfo-impl is missing', () => {
      const instance = getRecommendations();
      instance.elementControl.elementGroup = buildElementGroupMock({ 'tmp-addInfo-impl': undefined }) as any;

      expect(instance.getImplants()).toEqual([]);
    });
  });

  describe('evidenceUrl / getTranslation', () => {
    it('should set evidenceUrl from API response', () => {
      const mockEvidenceUrl = {
        code: 'https://example.com/evidence',
        system: 'pss',
        translations: [
          { language: 'NL', value: 'Evidence Link' },
          { language: 'FR', value: 'Lien Evidence' },
        ],
      };
      const mockResult: SupportResponseRadiology = {
        exchangeId: '',
        supportOptions: [],
        conclusions: [],
        evidenceUrl: mockEvidenceUrl,
      };
      pssServiceMock.getPssRecommendations.mockReturnValue(of(mockResult));

      const instance = runPssControlWith(buildElementGroupMock());

      expect(instance.evidenceUrl()).toEqual(mockEvidenceUrl);
    });

    it('should translate evidenceUrl using currentLang', () => {
      const mockEvidenceUrl = {
        code: 'https://example.com/evidence',
        system: 'pss',
        translations: [
          { language: 'NL', value: 'Dutch Evidence' },
          { language: 'FR', value: 'French Evidence' },
        ],
      };
      const instance = getRecommendations();

      // Assuming currentLang returns 'NL'
      const translation = instance.getTranslation(mockEvidenceUrl);

      expect(translation).toBe('Dutch Evidence');
    });
  });

  describe('findSupportOptionById / scoreLowerThanSeven / hasExam / showAlert / alertTitle', () => {
    it('findSupportOptionById should return undefined when controlIndications is not set', () => {
      const instance = getRecommendations();
      instance.controlIndications.set(undefined);
      expect(instance.findSupportOptionById(indicationMock)).toBeUndefined();
    });

    it('findSupportOptionById should match by id against option.value', () => {
      const instance = getRecommendations();
      const supportOption: SupportOption = { id: indicationMock.value as string, score: 3 } as SupportOption;
      instance.controlIndications.set([supportOption]);

      expect(instance.findSupportOptionById(indicationMock)).toBe(supportOption);
    });

    it('scoreLowerThanSeven should be false when defaultOption is unset', () => {
      const instance = getRecommendations();
      instance.defaultOption.set(undefined);
      expect(instance.scoreLowerThanSeven()).toBe(false);
    });

    it('scoreLowerThanSeven should be true when a matched option scores below 7', () => {
      const instance = getRecommendations();
      const supportOption: SupportOption = { id: indicationMock.value as string, score: 5 } as SupportOption;
      instance.controlIndications.set([supportOption]);
      instance.defaultOption.set([indicationMock]);

      expect(instance.scoreLowerThanSeven()).toBe(true);
    });

    it('hasExam should be true when the current control value scores below 7', () => {
      const instance = getRecommendations();
      instance.elementControl.elementGroup = buildElementGroupMock() as any;
      instance.control.setValue({ id: '1', score: 3 } as SupportOption);

      expect(instance.hasExam()).toBe(true);
    });

    it('hasExam should be true when no control value, no defaultOption, but controlIndications exist', () => {
      const instance = getRecommendations();
      instance.control.setValue(undefined);
      instance.defaultOption.set(undefined);
      instance.controlIndications.set([{ id: '1', score: 3 } as SupportOption]);

      expect(instance.hasExam()).toEqual([{ id: '1', score: 3 }]);
    });

    it('alertTitle should be chosenExam when the selected option scores below 7', () => {
      const instance = getRecommendations();
      instance.control.setValue({ id: '1', score: 3 } as SupportOption);
      expect(instance.alertTitle()).toBe('prescription.create.control.alert.chosenExam');
    });

    it('alertTitle should be relevantInfo when nothing qualifies as an exam', () => {
      const instance = getRecommendations();
      instance.control.setValue({ id: '1', score: 8 } as SupportOption);
      expect(instance.alertTitle()).toBe('prescription.create.control.alert.relevantInfo');
    });

    it('showAlert should be true when hasAdditionalRelevantInformation is true even without an exam', () => {
      const instance = getRecommendations();
      instance.control.setValue({ id: '1', score: 8 } as SupportOption);
      instance.defaultOption.set(undefined);
      instance.controlIndications.set(undefined);
      instance.elementControl.elementGroup = buildElementGroupMock({
        'additional-relevant-information': ['info'],
      }) as any;

      expect(instance.showAlert()).toBe(true);
    });
  });
});
