import { ChangeDetectorRef, SimpleChange, SimpleChanges } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SupportOption } from '@reuse/code/openapi/model/models';
import { PssRecommendationsDetailComponent } from './pss-recommendations-detail.component';
import { AutocompleteOption } from '@smals-belgium-shared/vas-evaluation-form-ui-core';

describe('PssRecommendationsDetailComponent', () => {
  let component: PssRecommendationsDetailComponent;

  const createMockElementControl = (value: SupportOption[] = [], selectedRecommendation?: AutocompleteOption) => ({
    value,
    element: {},
    elementGroup: {
      get: jest.fn().mockReturnValue({ value: selectedRecommendation }),
    },
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PssRecommendationsDetailComponent,
        { provide: ChangeDetectorRef, useValue: { markForCheck: jest.fn(), detectChanges: jest.fn() } },
      ],
    });

    component = TestBed.inject(PssRecommendationsDetailComponent);
    component.options = { showLabel: true };
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('radioGroupName', () => {
    it('should generate a unique radio group name per instance', () => {
      const cdRef = { markForCheck: jest.fn() } as unknown as ChangeDetectorRef;
      const instanceA = new PssRecommendationsDetailComponent(cdRef);
      const instanceB = new PssRecommendationsDetailComponent(cdRef);

      expect((instanceA as any).radioGroupName).toMatch(/^pss-recommendation-group-\d+$/);
      expect((instanceA as any).radioGroupName).not.toBe((instanceB as any).radioGroupName);
    });
  });

  describe('recommendations', () => {
    it('should default to OtherReason and noExamination', () => {
      expect(component.recommendations().map(recommendation => recommendation.id)).toEqual([
        'OtherReason',
        'noExamination',
      ]);
    });

    it('should prepend the recommendations from elementControl.value on ngOnChanges', () => {
      const customRecommendation: SupportOption = {
        id: 'custom',
        score: 5,
        supportOptionMetadata: { labelTranslationId: 'custom' },
      };
      component.elementControl = createMockElementControl([customRecommendation]) as any;

      component.ngOnChanges({ elementControl: new SimpleChange(null, component.elementControl, true) });

      expect(component.recommendations().map(recommendation => recommendation.id)).toEqual([
        'custom',
        'OtherReason',
        'noExamination',
      ]);
    });

    it('should not update recommendations when elementControl is not part of the changes', () => {
      component.ngOnChanges({} as SimpleChanges);

      expect(component.recommendations().map(recommendation => recommendation.id)).toEqual([
        'OtherReason',
        'noExamination',
      ]);
    });
  });

  describe('selectedRecommendation', () => {
    it('should be undefined before ngOnChanges has run', () => {
      expect(component.selectedRecommendation()).toBeUndefined();
    });

    it('should match the recommendation whose id equals the initially prescribed recommendation', () => {
      component.elementControl = createMockElementControl([], { value: 'noExamination' } as AutocompleteOption) as any;

      component.ngOnChanges({ elementControl: new SimpleChange(null, component.elementControl, true) });

      expect(component.selectedRecommendation()?.id).toBe('noExamination');
    });

    it('should be undefined when the prescribed recommendation id has no match', () => {
      component.elementControl = createMockElementControl([], { value: 'unknownId' } as AutocompleteOption) as any;

      component.ngOnChanges({ elementControl: new SimpleChange(null, component.elementControl, true) });

      expect(component.selectedRecommendation()).toBeUndefined();
    });

    it('should return the selected recommendation when the prescribed recommendation id has no match, but the selected recommendation has translations', () => {
      component.elementControl = createMockElementControl([], {
        value: 'unknownId',
        label: {
          nl: 'nl unknownId',
          fr: 'fr unknownId',
          de: 'de unknownId',
          en: 'en unknownId',
        },
      } as AutocompleteOption) as any;

      component.ngOnChanges({ elementControl: new SimpleChange(null, component.elementControl, true) });

      expect(component.selectedRecommendation()?.id).toBe('unknownId');
    });
  });

  describe('isSelected / onRecommendationSelected', () => {
    it('should return false for every recommendation before a selection was made', () => {
      component.recommendations().forEach(recommendation => {
        expect((component as any).isSelected(recommendation)).toBe(false);
      });
    });

    it('should mark only the selected recommendation as selected', () => {
      const [first, second] = component.recommendations();

      (component as any).onRecommendationSelected(first);

      expect((component as any).isSelected(first)).toBe(true);
      expect((component as any).isSelected(second)).toBe(false);
    });

    it('should update the selection when a different recommendation is selected', () => {
      const [first, second] = component.recommendations();

      (component as any).onRecommendationSelected(first);
      (component as any).onRecommendationSelected(second);

      expect((component as any).isSelected(first)).toBe(false);
      expect((component as any).isSelected(second)).toBe(true);
    });
  });
});
