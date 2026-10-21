import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomCheckboxListDetailComponent } from '@reuse/code/evf/components/custom-checkbox-list/detail/custom-checkbox-list-detail.component';
import { EvfTranslateService } from '@smals-belgium-shared/vas-evaluation-form-ui-core';

describe('CustomCheckboxListDetailComponent', () => {
  let fixture: ComponentFixture<CustomCheckboxListDetailComponent>;
  let component: CustomCheckboxListDetailComponent;

  const setElementControl = (elementControl: Record<string, unknown>) => {
    Object.defineProperty(component, 'elementControl', {
      configurable: true,
      get: () => elementControl,
    });
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomCheckboxListDetailComponent],
      providers: [
        {
          provide: EvfTranslateService,
          useValue: {
            currentLang: 'en',
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomCheckboxListDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exposes the current language from the translate service', () => {
    expect(component.currentLang).toBe('en');
  });

  it('returns the labelTranslationId of the response matching the value', () => {
    setElementControl({
      responses: [
        { value: 'a', labelTranslationId: 'label-a' },
        { value: 'b', labelTranslationId: 'label-b' },
      ],
    });

    expect(component.getTranslation('b')).toBe('label-b');
  });

  it('returns undefined when no response matches the value', () => {
    setElementControl({ responses: [{ value: 'a', labelTranslationId: 'label-a' }] });

    expect(component.getTranslation('unknown')).toBeUndefined();
  });

  it('returns undefined when the elementControl has no responses', () => {
    setElementControl({});

    expect(component.getTranslation('a')).toBeUndefined();
  });
});
