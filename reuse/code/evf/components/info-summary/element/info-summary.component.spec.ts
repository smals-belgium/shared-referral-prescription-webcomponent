import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { Observable } from 'rxjs';
import { EvfTranslateService } from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { TranslateModule } from '@ngx-translate/core';
import { InfoSummaryComponent } from './info-summary.component';
import { Translation } from '@reuse/code/openapi';
import { MatIconTestingModule } from '@angular/material/icon/testing';

describe('InfoSummaryComponent', () => {
  let fixture: ComponentFixture<InfoSummaryComponent>;
  let component: InfoSummaryComponent;
  let currentLangSubject: BehaviorSubject<string>;
  let translateMock: {
    currentLang: string;
    currentLang$: Observable<string>;
    instant: jest.Mock;
  };

  const setElement = (element: Record<string, unknown>) => {
    Object.defineProperty(component, 'element', {
      configurable: true,
      get: () => element,
    });
  };

  const setElementControl = (outputValues: Record<string, unknown>) => {
    Object.defineProperty(component, 'elementControl', {
      configurable: true,
      get: () => ({
        elementGroup: {
          getOutputValue: jest.fn().mockReturnValue(outputValues),
        },
      }),
    });
  };

  const setEvents = (emit: jest.Mock) => {
    Object.defineProperty(component, 'events', {
      configurable: true,
      get: () => ({ emit }),
    });
  };

  beforeEach(async () => {
    currentLangSubject = new BehaviorSubject<string>('fr');

    translateMock = {
      currentLang: 'fr',
      currentLang$: currentLangSubject.asObservable(),
      instant: jest.fn((key: string) => `t:${key}`),
    };

    await TestBed.configureTestingModule({
      imports: [InfoSummaryComponent, TranslateModule.forRoot(), MatIconTestingModule],
      providers: [{ provide: EvfTranslateService, useValue: translateMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(InfoSummaryComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call getFormValues on init', () => {
    const spy = jest.spyOn(component, 'getFormValues');
    setElement({ custom: { displayValues: [] } });
    setElementControl({});

    component.ngOnInit();

    expect(spy).toHaveBeenCalled();
  });

  it('should call getFormValues on language change', () => {
    const spy = jest.spyOn(component, 'getFormValues');
    component.ngOnInit();

    expect(spy).toHaveBeenCalledTimes(1);

    // Simulate a language change
    currentLangSubject.next('en');

    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('should keep formValues empty when displayValues is missing', () => {
    setElement({ custom: {} });
    setElementControl({ name: 'John' });

    component.getFormValues();

    expect(component['formValues']()).toBe('');
  });

  it('should build summary with prefixes and formatted values', () => {
    setElement({
      custom: {
        displayValues: ['firstName', 'birthDate', 'tags', 'contacts', 'priority'],
        prefixString: {
          firstName: 'FIRST_NAME',
          birthDate: 'BIRTH_DATE',
          priority: 'PRIORITY',
        },
      },
    });
    setElementControl({
      firstName: 'John',
      birthDate: '2026-01-15',
      tags: ['alpha', 'beta'],
      contacts: [{ name: 'Alice' }, { name: 'Bob' }],
      priority: { label: { fr: 'Urgent', en: 'Urgent' } },
    });

    component.getFormValues();

    expect(component['formValues']()).toBe(
      't:FIRST_NAME John, t:BIRTH_DATE 15/01/2026, alpha, beta, Alice, Bob, t:PRIORITY Urgent'
    );
  });

  it('should keep original value for invalid ISO date string', () => {
    setElement({
      custom: {
        displayValues: ['invalidDate'],
        prefixString: {},
      },
    });
    setElementControl({
      invalidDate: '2026-99-99',
    });

    component.getFormValues();

    expect(component['formValues']()).toBe('2026-99-99');
  });

  it('should fallback to english label when current language translation is missing', () => {
    Object.defineProperty(component, 'currentLang', {
      configurable: true,
      value: () => 'nl',
    });
    setElement({
      custom: {
        displayValues: ['selection'],
        prefixString: {},
      },
    });
    setElementControl({
      selection: { label: { en: 'Default EN' } },
    });

    component.getFormValues();

    expect(component['formValues']()).toBe('Default EN');
  });

  it('should emit PREVIOUS_STEP event', () => {
    const emit = jest.fn();
    setEvents(emit);

    component.previousStep();

    expect(emit).toHaveBeenCalledWith({ type: 'PREVIOUS_STEP' });
  });

  describe('format values', () => {
    it('returns "" for an object with no "label" key', () => {
      expect((component as any).formatValue({ id: '1', score: 4 })).toBe('');
    });

    it('joins the names with ", "', () => {
      const value = [{ name: 'Alpha' }, { name: 'Beta' }, { name: 'Gamma' }];
      expect((component as any).formatValue(value)).toBe('Alpha, Beta, Gamma');
    });

    it('translates and joins each item using the current language, falling back to English per item', () => {
      const value = [{ label: { en: 'Alpha' } as Translation }, { label: { en: 'Beta', fr: 'Bêta' } as Translation }];

      expect((component as any).formatValue(value)).toBe('Alpha, Bêta');
    });

    it('joins primitive values with ", "', () => {
      expect((component as any).formatValue(['a', 'b', 'c'])).toBe('a, b, c');
      expect((component as any).formatValue([1, 2, 3])).toBe('1, 2, 3');
    });

    it('formats a valid ISO date as dd/MM/yyyy', () => {
      expect((component as any).formatValue('2023-05-15')).toBe('15/05/2023');
    });

    it('returns the original string when it matches the pattern but is not a valid date', () => {
      const invalidDate = '2023-13-45';
      expect((component as any).formatValue(invalidDate)).toBe(invalidDate);
    });

    it.each([
      ['number', 42],
      ['boolean true', true],
      ['boolean false', false],
    ])('returns "" for %s', (_label, value) => {
      expect((component as any).formatValue(value)).toBe('');
    });
  });
});
