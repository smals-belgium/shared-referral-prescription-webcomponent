import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { SelectPrescriptionTypeComponent } from './select-prescription-type.component';
import { ModelEntityDto, Template } from '@reuse/code/openapi';

const mockTemplates: Template[] = [
  {
    id: 1,
    code: 'ASSISTING_WITH_PERSONAL_HYGIENE',
    labelTranslations: {
      en: 'Nursing Template 1',
      fr: 'Modèle Soins 1',
      nl: 'Nursing Template 1',
      de: 'Nursing Template 1',
    },
    label: 'Nursing Template 1',
  },
  {
    id: 2,
    code: 'ANNEX_82',
    labelTranslations: {
      en: 'Radiology Template 1',
      fr: 'Modèle Radio 1',
      nl: 'Radiology Template 1',
      de: 'Radiology Template 1',
    },
    label: 'Radiology Template 1',
  },
  {
    id: 3,
    code: 'PHYSIOTHERAPY_CONSULTATIVE',
    labelTranslations: {
      en: 'Physio Template 1',
      fr: 'Modèle Physio 1',
      nl: 'Physio Template 1',
      de: 'Physio Template 1',
    },
    label: 'Physio Template 1',
  },
];

const mockModels: ModelEntityDto[] = [
  { id: 12, label: 'Model 1', templateId: 1 },
  { id: 13, label: 'Model 2', templateId: 2 },
];

describe('SelectPrescriptionTypeComponent', () => {
  let component: SelectPrescriptionTypeComponent;
  let fixture: ComponentFixture<SelectPrescriptionTypeComponent>;
  let langChangeSubject: Subject<any>;
  let mockTranslateService: jest.Mocked<TranslateService>;

  beforeEach(async () => {
    langChangeSubject = new Subject();
    mockTranslateService = {
      currentLang: 'en',
      onLangChange: langChangeSubject.asObservable(),
      instant: jest.fn((key: string) => {
        const translations: { [key: string]: string } = {
          'prescription.categories.nursingCare': 'Nursing Care',
          'prescription.categories.radiology': 'Radiology',
          'prescription.categories.physiotherapy': 'Physiotherapy',
        };
        return translations[key] || key;
      }),
    } as any;

    await TestBed.configureTestingModule({
      imports: [SelectPrescriptionTypeComponent, ReactiveFormsModule],
      providers: [{ provide: TranslateService, useValue: mockTranslateService }],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectPrescriptionTypeComponent);
    component = fixture.componentInstance;
  });

  it('should create component successfully', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize category options with translations', done => {
    component.templates = mockTemplates;
    createFormAndTriggerOnChange();

    component.categoryOptions$.subscribe(categories => {
      expect(categories).toHaveLength(3);
      expect(categories[0]).toEqual({ code: 'nursingCare', label: 'Nursing Care' });
      expect(categories[1]).toEqual({ code: 'radiology', label: 'Radiology' });
      expect(categories[2]).toEqual({ code: 'physiotherapy', label: 'Physiotherapy' });
      done();
    });
  });

  it('should add validators to form controls on form group change', () => {
    const formGroup = new FormGroup({
      category: new FormControl(null),
      template: new FormControl(null),
    });

    const categoryValidatorSpy = jest.spyOn(formGroup.get('category')!, 'addValidators');
    const templateValidatorSpy = jest.spyOn(formGroup.get('template')!, 'addValidators');

    component.formGroup = formGroup;
    component.templates = mockTemplates;

    component.ngOnChanges({
      formGroup: { currentValue: formGroup, previousValue: undefined, firstChange: true, isFirstChange: () => true },
    });

    expect(categoryValidatorSpy).toHaveBeenCalled();
    expect(templateValidatorSpy).toHaveBeenCalled();
  });

  it('should filter templates by nursing care category', done => {
    component.templates = mockTemplates;
    createFormAndTriggerOnChange();

    let emissionCount = 0;
    component.templatesOptions$.subscribe(templates => {
      emissionCount++;
      // Skip the first emission (which will be with null category)
      if (emissionCount === 1) {
        // Set the category value and trigger the second emission
        component.formGroup.get('category')!.setValue({ code: 'nursingCare' });
        return;
      }

      // Test the third emission (with category nursingCare)
      expect(templates).toHaveLength(1);
      expect(templates[0].code).toBe('ASSISTING_WITH_PERSONAL_HYGIENE');
      done();
    });
  });

  it('should filter templates by radiology category', done => {
    component.templates = mockTemplates;
    createFormAndTriggerOnChange();

    let emissionCount = 0;
    component.templatesOptions$.subscribe(templates => {
      emissionCount++;
      if (emissionCount === 1) {
        component.formGroup.get('category')!.setValue({ code: 'radiology' });
        return;
      }

      // Test the third emission (with category radiology)
      expect(templates).toHaveLength(1);
      expect(templates[0].code).toBe('ANNEX_82');
      done();
    });
  });

  it('should setup model options when models are provided', done => {
    component.templates = mockTemplates;
    component.models = mockModels;
    createFormAndTriggerOnChange();

    let emissionCount = 0;
    component.modelOptions$?.subscribe(models => {
      emissionCount++;

      if (emissionCount === 1) {
        // First set the category
        component.formGroup.get('category')!.setValue({ code: 'nursingCare' });
        return;
      }

      if (emissionCount === 2) {
        // Then set the template
        component.formGroup.get('template')!.setValue(mockTemplates[0]);
        return;
      }

      // Test the third emission (with both category nursingCare and template 1 set)
      expect(models).toHaveLength(1);
      expect(models[0].templateId).toBe(1);
      done();
    });
  });

  it('should display category label correctly', () => {
    const category = { code: 'nursingCare', label: 'Nursing Care' };
    const result = component.displayCategoryWith(category);
    expect(result).toBe('Nursing Care');

    const stringResult = component.displayCategoryWith('test');
    expect(stringResult).toBe('');
  });

  it('should display template label correctly', () => {
    const template = { labelTranslations: { en: 'Test Template' } };
    mockTranslateService.currentLang = 'en';
    const result = component.displayTypeWith(template as Template);
    expect(result).toBe('Test Template');

    const stringResult = component.displayTypeWith('test');
    expect(stringResult).toBe('');
  });

  it('should display model label correctly', () => {
    const model = { label: 'Test Model' };
    const result = component.displayModelWith(model as ModelEntityDto);
    expect(result).toBe('Test Model');

    const stringResult = component.displayModelWith('test');
    expect(stringResult).toBe('');
  });

  it('should correctly identify required fields', () => {
    const formGroup = new FormGroup({
      category: new FormControl(null),
      template: new FormControl(null),
    });
    component.formGroup = formGroup;

    // Mock a validator that returns required error
    const mockValidator = () => ({ required: true });
    formGroup.get('category')!.setValidators(mockValidator);

    expect(component.isRequiredField('category')).toBeTruthy();
    expect(component.isRequiredField('template')).toBeFalsy();
  });

  it('should validate mustBeObjectValidator and allow objects, but reject non-objects', () => {
    createFormAndTriggerOnChange();

    //allow
    const result = (component as any).formGroup.get('category')?.validator?.({ value: { code: 'abc' } } as any);
    expect(result).toBeNull();

    //reject
    const validator = (component as any).formGroup.get('category')?.validator!;
    expect(validator({ value: 'abc' } as any)).toEqual({ pickOptionFromList: true });
  });

  it('should update translations when language changes', done => {
    component.templates = mockTemplates;
    createFormAndTriggerOnChange();

    // Change language
    mockTranslateService.currentLang = 'fr';
    // @ts-ignore
    mockTranslateService.instant = jest.fn((key: string) => {
      const frTranslations: { [key: string]: string } = {
        'prescription.categories.nursingCare': 'Soins Infirmiers',
        'prescription.categories.radiology': 'Radiologie',
        'prescription.categories.physiotherapy': 'Physiothérapie',
      };
      return frTranslations[key] || key;
    });

    langChangeSubject.next({ lang: 'fr' });

    component.categoryOptions$.subscribe(categories => {
      expect(categories[0].label).toBe('Soins Infirmiers');
      done();
    });
  });

  const createFormAndTriggerOnChange = () => {
    component.formGroup = new FormGroup({
      category: new FormControl(null),
      template: new FormControl(null),
      model: new FormControl(null),
    });

    component.ngOnChanges({
      formGroup: {
        currentValue: component.formGroup,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
      templates: {
        currentValue: mockTemplates,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
  };
});
