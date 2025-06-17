import { ComponentFixture, TestBed } from '@angular/core/testing';
import { evfElementConfigFeature, FormTemplate, provideEvfCore } from '@smals/vas-evaluation-form-ui-core';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { EvfDynamicFormComponent } from "@smals/vas-evaluation-form-ui-material/dynamic-form";
import { BrowserModule, By } from "@angular/platform-browser";
import { MarkdownModule } from 'ngx-markdown';
import { RecommendationsComponent as Wrapper } from './recommendations.component';
import { RecommendationsComponent } from '../../pss-recommendations/element/recommendations.component';
import { PssService } from '@reuse/code/services/pss.service';
import { ToastService } from '@reuse/code/services/toast.service';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { ControlAnnex82Response } from '@reuse/code/interfaces/pss.interface';

const formTemplate: FormTemplate = {
  "elements": [
    {
      "id": "recommendations",
      "viewType": "recommendations",
      "dataType": {
        "type": "object"
      },
      "labelTranslationId": "recommendations",
      "validations": [
        {
          "name": "required"
        }
      ]
    }
  ],
  "translations": {
    "recommendations": {
      "fr": "Pss Recommendations",
      "nl": "Pss Recommendations"
    }
  }
}

const disableAnimations =
  !('animate' in document.documentElement)
  || (navigator && /iPhone OS (8|9|10|11|12|13)_/.test(navigator.userAgent));

describe('AutocompleteMultiselectComponent', () => {
  let component: Wrapper;
  let fixture: ComponentFixture<Wrapper>;
  let pssServiceMock: jest.Mocked<PssService>;
  let toastServiceMock: jest.Mocked<ToastService>;

  beforeEach(async () => {

    pssServiceMock = {
      // controlIndications: jest.fn().mockReturnValue(of(mockAutocompleteOptions)),
      controlIndications: jest.fn(),
      getPssSessionId: jest.fn().mockReturnValue(1)
    } as unknown as jest.Mocked<PssService>;

    toastServiceMock = {
      show: jest.fn().mockImplementation((message) => message),
      showSomethingWentWrong: jest.fn().mockImplementation((message) => message),
    } as unknown as jest.Mocked<ToastService>;


    await TestBed.configureTestingModule({
      imports: [Wrapper, EvfDynamicFormComponent, BrowserModule,
        BrowserAnimationsModule.withConfig({disableAnimations}), MarkdownModule.forRoot(), TranslateModule.forRoot()],
      providers: [
        provideEvfCore(
          evfElementConfigFeature(
            {
              name: 'recommendations',
              element: RecommendationsComponent
            })
        ),
        {provide: PssService, useValue: pssServiceMock},
        {provide: ToastService, useValue: toastServiceMock},
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(Wrapper);
    component = fixture.componentInstance;
    component.demoTemplate = formTemplate;
    fixture.detectChanges();
  });


  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show error when clinicalIndications is missing', () => {
    const recommendationFormDebugElement = fixture.debugElement.query(By.directive(RecommendationsComponent));
    recommendationFormDebugElement.componentInstance.pssControl();
    expect(toastServiceMock.show).toHaveBeenCalledWith('prescription.create.control.error.required');
    expect(recommendationFormDebugElement.componentInstance.isLoading()).toBe(false);
  });

  it('should call API when valid clinical indications provided', () => {
    const mockIndications = [{value: 'indication1'}];
    const mockResult: ControlAnnex82Response = {
      request: "",
      supportOptions: [{
        id: '1',
        score: 4,
        instruction: {code: "1", translations: [], system: "2"},
        system: {code: "1", translations: [], version: "2"},
        supportOptionMetadata: {isRequested: true, radiationLevel: 1, relativeCost: 3}
      }]
    };

    const recommendationFormDebugElement = fixture.debugElement.query(By.directive(RecommendationsComponent));
    recommendationFormDebugElement.componentInstance.elementControl.elementGroup.getOutputValue = jest.fn().mockReturnValue({
      clinicalIndications: mockIndications
    });
    pssServiceMock.controlIndications.mockReturnValue(of(mockResult));

    recommendationFormDebugElement.componentInstance.pssControl();

    expect(pssServiceMock.controlIndications).toHaveBeenCalled();
    expect(recommendationFormDebugElement.componentInstance.controlIndications()).toEqual(mockResult.supportOptions);
    expect(recommendationFormDebugElement.componentInstance.isLoading()).toBe(false);
  });

  it('should handle API error', () => {
    const mockIndications = [{value: 'indication1'}];

    const recommendationFormDebugElement = fixture.debugElement.query(By.directive(RecommendationsComponent));
    recommendationFormDebugElement.componentInstance.elementControl.elementGroup.getOutputValue = jest.fn().mockReturnValue({
      clinicalIndications: mockIndications
    });
    pssServiceMock.controlIndications.mockReturnValue(throwError('API Error'));

    recommendationFormDebugElement.componentInstance.pssControl();

    expect(toastServiceMock.showSomethingWentWrong).toHaveBeenCalled();
    expect(recommendationFormDebugElement.componentInstance.isLoading()).toBe(false);
  });

  it('should set control value', () => {
    const mockSupportOption = {id: '1', value: 'option1', label: 'Option 1'};

    const recommendationFormDebugElement = fixture.debugElement.query(By.directive(RecommendationsComponent));

    recommendationFormDebugElement.componentInstance.selectSupportOption(mockSupportOption);

    expect(recommendationFormDebugElement.componentInstance.control.value).toBe(mockSupportOption);
    expect(recommendationFormDebugElement.componentInstance.hasValue()).toBe(false);
  });

  it('should return true when additional relevant information exists', () => {
    const recommendationFormDebugElement = fixture.debugElement.query(By.directive(RecommendationsComponent));
    recommendationFormDebugElement.componentInstance.elementControl.elementGroup.getOutputValue = jest.fn().mockReturnValue({
      'additional-relevant-information': 'Some relevant info'
    });

    expect(recommendationFormDebugElement.componentInstance.hasAdditionalRelevantInformation()).toBe(true);
  });

  it('should return false when additional relevant information is empty', () => {
    const recommendationFormDebugElement = fixture.debugElement.query(By.directive(RecommendationsComponent));
    recommendationFormDebugElement.componentInstance.elementControl.elementGroup.getOutputValue = jest.fn().mockReturnValue({
      'additional-relevant-information': ''
    });

    expect(recommendationFormDebugElement.componentInstance.hasAdditionalRelevantInformation()).toBe(false);
  });


  it('should render control button when no control indications', () => {
    const recommendationFormDebugElement = fixture.debugElement.query(By.directive(RecommendationsComponent));

    jest.spyOn(recommendationFormDebugElement.componentInstance, 'controlIndications').mockReturnValue(null);
    const isLoadingSignal = (recommendationFormDebugElement.componentInstance as any)['isLoading'];
    if (isLoadingSignal && typeof isLoadingSignal.set === 'function') {
      isLoadingSignal.set(false);
    }

    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('button[data-cy="prescription-control"]'));
    expect(button).toBeTruthy();
    expect(button.nativeElement.disabled).toBe(false);
  });

  it('should disable button when loading', async () => {
    const recommendationFormDebugElement = fixture.debugElement.query(By.directive(RecommendationsComponent));

    jest.spyOn(recommendationFormDebugElement.componentInstance, 'controlIndications').mockReturnValue(null);
    const isLoadingSignal = (recommendationFormDebugElement.componentInstance as any)['isLoading'];
    if (isLoadingSignal && typeof isLoadingSignal.set === 'function') {
      isLoadingSignal.set(true);
    }

    fixture.detectChanges();
    await fixture.whenStable();


    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('button[data-cy="prescription-control"]'));
    expect(button.nativeElement.disabled).toBe(true);

    const spinner = fixture.debugElement.query(By.css('mat-spinner'));
    expect(spinner).toBeTruthy();
  });

  it('should render form field and PSS results section when control indications exist', () => {
    const supportOptions = [{
      id: '1',
      score: 4,
      instruction: {code: "TEST123", translations: [], system: "2"},
      system: {code: "1", translations: [], version: "2"},
      supportOptionMetadata: {isRequested: true, radiationLevel: 1, relativeCost: 3}
    }];

    const recommendationFormDebugElement = fixture.debugElement.query(By.directive(RecommendationsComponent));
    jest.spyOn(recommendationFormDebugElement.componentInstance, 'controlIndications').mockReturnValue(supportOptions);
    jest.spyOn(recommendationFormDebugElement.componentInstance, 'hasValue').mockReturnValue(false);

    recommendationFormDebugElement.componentInstance.control.setValue(supportOptions[0]);

    fixture.detectChanges();

    const formField = fixture.debugElement.query(By.css('mat-form-field'));
    expect(formField).toBeTruthy();

    const input = fixture.debugElement.query(By.css('input[readonly]'));
    expect(input.nativeElement.value).toBe('TEST123');

    const resultsSection = fixture.debugElement.query(By.css('.pss-results'));
    expect(resultsSection).toBeTruthy();

    const dialogComponent = fixture.debugElement.query(By.css('app-pss-radiology-result-dialog'));
    expect(dialogComponent).toBeTruthy();
  });

  it('should call pssControl when button is clicked', () => {
    const recommendationFormDebugElement = fixture.debugElement.query(By.directive(RecommendationsComponent));
    jest.spyOn(recommendationFormDebugElement.componentInstance, 'controlIndications').mockReturnValue(null);
    const isLoadingSignal = (recommendationFormDebugElement.componentInstance as any)['isLoading'];
    if (isLoadingSignal && typeof isLoadingSignal.set === 'function') {
      isLoadingSignal.set(false);
    }

    jest.spyOn(recommendationFormDebugElement.componentInstance, 'pssControl').mockImplementation();

    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('button[data-cy="prescription-control"]'));
    button.nativeElement.click();

    expect(recommendationFormDebugElement.componentInstance.pssControl).toHaveBeenCalled();
  });
});
