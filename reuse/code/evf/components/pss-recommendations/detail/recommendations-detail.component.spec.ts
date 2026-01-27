import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { TranslateModule } from '@ngx-translate/core';
import { of, Subject, throwError } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChangeDetectorRef, SimpleChanges } from '@angular/core';
import { RecommendationsDetailComponent } from '@reuse/code/evf/components/pss-recommendations/detail/recommendations-detail.component';
import { EvfTranslateService } from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { generateWarningMessage } from '@reuse/code/utils/pss-relevant-info-message.utils';
import { PssService } from '@reuse/code/services/api/pss.service';

jest.mock('@reuse/code/utils/pss-relevant-info-message.utils', () => ({
  generateWarningMessage: jest.fn(() => 'Mocked warning message'),
}));

describe('RecommendationsDetailComponent (Jest)', () => {
  let component: RecommendationsDetailComponent;
  let fixture: ComponentFixture<RecommendationsDetailComponent>;
  const mockPssService = {
    getPssRecommendationsByExchangeId: jest.fn(),
  };

  const mockToastService = {
    show: jest.fn(),
    showSomethingWentWrong: jest.fn(),
  };

  const currentLangSubject = new Subject<string>();
  const mockTranslateService = {
    currentLang: 'fr',
    currentLang$: currentLangSubject.asObservable(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecommendationsDetailComponent, TranslateModule.forRoot(), MatIconModule, MatProgressSpinnerModule],
      providers: [
        { provide: PssService, useValue: mockPssService },
        { provide: ToastService, useValue: mockToastService },
        { provide: EvfTranslateService, useValue: mockTranslateService },
        { provide: ChangeDetectorRef, useValue: { markForCheck: jest.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecommendationsDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update isPssActive and isProfessional and call getPssRecommendationsByPssId if both are true', () => {
    mockPssService.getPssRecommendationsByExchangeId.mockReturnValue(of({ supportOptions: [] }));

    component.elementControl = {
      getOutputValue: () => 'exchangeId123',
    } as any;

    const spy = jest.spyOn(component, 'getPssRecommendationsByPssId');

    component.metadata = {
      pssActive: true,
      isProfessional: true,
    };

    const changes: SimpleChanges = {
      metadata: {
        currentValue: { pssActive: true, isProfessional: true },
        previousValue: {},
        firstChange: false,
        isFirstChange: () => false,
      },
    };

    component.ngOnChanges(changes);
    expect(component.isPssActive()).toBe(true);
    expect(component.isProfessional()).toBe(true);
    expect(spy).toHaveBeenCalled();
  });

  it('should call show when pssExchangeId is empty', () => {
    component['pssExchangeId'] = '';
    component.getPssRecommendationsByPssId();
    expect(mockToastService.show).toHaveBeenCalledWith('prescription.create.control.error.required');
  });

  it('should fetch and set recommendations on success', () => {
    const mockResult = { supportOptions: [{ id: 'opt1' }] };
    mockPssService.getPssRecommendationsByExchangeId.mockReturnValue(of(mockResult));

    component['pssExchangeId'] = 'abc123';
    component.getPssRecommendationsByPssId();

    expect(component.controlRecommendations()).toEqual(mockResult.supportOptions);
    expect(component.isLoading()).toBe(false);
  });

  it('should show toast error on service failure', () => {
    mockPssService.getPssRecommendationsByExchangeId.mockReturnValue(throwError(() => new Error('fail')));
    component['pssExchangeId'] = 'abc123';

    component.getPssRecommendationsByPssId();

    expect(mockToastService.showSomethingWentWrong).toHaveBeenCalled();
    expect(component.isLoading()).toBe(false);
  });

  it('should return true if additional relevant info is present', () => {
    component.elementControl = {
      elementGroup: {
        getOutputValue: () => ({
          'additional-relevant-information': ['pacemaker'],
        }),
      },
    } as any;

    expect(component.hasAdditionalRelevantInformation()).toBe(true);
  });

  it('should return false if no relevant info is present', () => {
    component.elementControl = {
      elementGroup: {
        getOutputValue: () => ({}),
      },
    } as any;

    expect(component.hasAdditionalRelevantInformation()).toBe(false);
  });

  it('should return prescribed exam', () => {
    component.elementControl = {
      elementGroup: {
        getOutputValue: () => ({
          intendedProcedure: 'MRI Thorax',
        }),
      },
    } as any;

    expect(component.getPrescribedExam()).toBe('MRI Thorax');
  });

  it('should return a warning message from generateWarningMessage', () => {
    component['language'] = 'fr';
    component.elementControl = {
      elementGroup: {
        getOutputValue: () => ({
          'additional-relevant-information': ['tmp-addInfo-impl', 'tmp-addInfo-diab'],
          implants: ['tmp-impl-stent'],
        }),
      },
    } as any;

    const result = component.getWarningMessage();
    expect(generateWarningMessage).toHaveBeenCalledWith(
      ['tmp-addInfo-impl', 'tmp-addInfo-diab'],
      ['tmp-impl-stent'],
      'fr'
    );
    expect(result).toBe('Mocked warning message');
  });
});
