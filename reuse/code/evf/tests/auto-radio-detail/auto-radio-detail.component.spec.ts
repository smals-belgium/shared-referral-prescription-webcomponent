import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AutoRadioDetailComponent } from '@reuse/code/evf/components/auto-radio/detail/auto-radio-detail.component';
import { EvfTranslateService } from '@smals-belgium-shared/vas-evaluation-form-ui-core';

describe('AutoRadioDetailComponent', () => {
  let fixture: ComponentFixture<AutoRadioDetailComponent>;
  let component: AutoRadioDetailComponent;

  const setElementControl = (elementControl: Record<string, unknown>) => {
    Object.defineProperty(component, 'elementControl', {
      configurable: true,
      get: () => elementControl,
    });
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AutoRadioDetailComponent],
      providers: [
        {
          provide: EvfTranslateService,
          useValue: {
            currentLang: 'en',
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AutoRadioDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exposes the current language from the translate service', () => {
    expect(component.currentLang).toBe('en');
  });

  it('exposes the element and id from the elementControl', () => {
    const element = { id: 'auto-radio', labelTranslationId: 'auto-radio-label' };
    setElementControl({ element });

    expect(component.element).toEqual(element);
    expect(component.id).toBe('auto-radio');
  });

  it('exposes the selected value from the elementControl', () => {
    const value = { label: { en: 'Option A', fr: 'Option A' }, value: 'a' };
    setElementControl({ value });

    expect(component.elementControl.value).toEqual(value);
  });
});
