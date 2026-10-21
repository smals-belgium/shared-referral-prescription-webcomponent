import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import {
  evfElementConfigFeature,
  FormTemplate,
  provideEvfCore,
  AutocompleteOption,
} from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { EvfDynamicFormComponent } from '@smals-belgium-shared/vas-evaluation-form-ui-material/dynamic-form';
import { TranslateModule } from '@ngx-translate/core';
import { MarkdownModule } from 'ngx-markdown';
import { of, Subject, throwError } from 'rxjs';
import { IndicationRadiology, LanguageCode } from '@reuse/code/openapi';
import { PssIndicationProposalComponent } from '@reuse/code/evf/components/pss-indication-proposal/element/pss-indication-proposal.component';
import { PssIndicationProposalComponent as Wrapper } from '@reuse/code/evf/tests/pss-indication-proposal/pss-indication-proposal.component';
import { PssService } from '@reuse/code/services/api/pss.service';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { DateTime } from 'luxon';

const formTemplate: FormTemplate = {
  elements: [
    {
      id: 'pssIndicationProposal',
      viewType: 'pssIndicationProposal',
      dataType: {
        type: 'array',
      },
      labelTranslationId: 'indication-proposal',
      custom: {
        criteriaTarget: 'clinicalIndications',
      },
    },
  ],
  translations: {
    'indication-proposal': {
      fr: 'indication',
      nl: 'indication',
    },
  },
};

const disableAnimations =
  !('animate' in document.documentElement) || (navigator && /iPhone OS (8|9|10|11|12|13)_/.test(navigator.userAgent));

const criteriaOption: AutocompleteOption = {
  label: {
    de: 'Kriterium DE',
    en: 'Criteria EN',
    fr: 'Critère FR',
    nl: 'Criteria NL',
  },
  value: 'criterion-1',
};

function createIndication(id: string, name: string, code?: string): IndicationRadiology {
  return {
    id,
    translations: [{ language: 'EN', value: name }],
    snomedcodes: code ? [{ code }] : [],
  } as unknown as IndicationRadiology;
}

function createElementControl(overrides: Record<string, unknown> = {}) {
  const exchangeIdControl = {
    setValue: jest.fn(),
  };

  return {
    valueChanges: of(null),
    value: null,
    setValue: jest.fn(),
    markAsTouched: jest.fn(),
    elementGroup: {
      get: jest.fn((field: string) => (field === 'exchangeId' ? exchangeIdControl : undefined)),
      getOutputValue: jest.fn().mockReturnValue({}),
    },
    ...overrides,
  };
}

describe('PssIndicationProposalComponent', () => {
  let wrapperComponent: Wrapper;
  let wrapperFixture: ComponentFixture<Wrapper>;
  let component: any;
  let pssServiceMock: Partial<jest.Mocked<PssService>>;
  let toastServiceMock: Partial<jest.Mocked<ToastService>>;

  beforeEach(async () => {
    pssServiceMock = {
      getIndications: jest.fn(),
    };

    toastServiceMock = {
      showSomethingWentWrong: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [
        Wrapper,
        PssIndicationProposalComponent,
        EvfDynamicFormComponent,
        BrowserModule,
        BrowserAnimationsModule.withConfig({ disableAnimations }),
        TranslateModule.forRoot(),
        MarkdownModule.forRoot(),
        MatIconTestingModule,
      ],
      providers: [
        provideEvfCore(
          evfElementConfigFeature({
            name: 'pssIndicationProposal',
            element: PssIndicationProposalComponent,
          })
        ),
        { provide: PssService, useValue: pssServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
      ],
    }).compileComponents();

    wrapperFixture = TestBed.createComponent(Wrapper);
    wrapperComponent = wrapperFixture.componentInstance;
    wrapperFixture.detectChanges();

    component = TestBed.createComponent(PssIndicationProposalComponent).componentInstance as any;
    Object.defineProperty(component, 'element', {
      configurable: true,
      value: {
        custom: {
          criteriaTarget: 'clinicalIndications',
        },
      },
      writable: true,
    });
    Object.defineProperty(component, 'elementControl', {
      configurable: true,
      value: createElementControl() as any,
      writable: true,
    });
    Object.defineProperty(component, 'currentLang', {
      configurable: true,
      value: (() => 'en') as any,
      writable: true,
    });
  });

  it('should create', () => {
    expect(wrapperComponent).toBeTruthy();
  });

  it('should accept a demo template input', () => {
    wrapperFixture.componentRef.setInput('demoTemplate', formTemplate);

    expect(wrapperComponent.demoTemplate).toEqual(formTemplate);
  });

  describe('initCriteriaOptions', () => {
    it('should initialize criteria options from the configured target control', () => {
      const targetControl = { value: [criteriaOption] };
      Object.defineProperty(component, 'elementControl', {
        configurable: true,
        value: {
          elementGroup: {
            get: jest.fn().mockReturnValue(targetControl as any),
          },
        },
        writable: true,
      });

      component['initCriteriaOptions']();

      expect(component.criteriaOptions()).toEqual([criteriaOption]);
      expect(component.displayedColumns()).toEqual(['select', 'name', 'criteria1']);
    });

    it('should reset to [] when no criteriaTarget is configured on the element', () => {
      Object.defineProperty(component, 'element', {
        configurable: true,
        value: { custom: {} },
        writable: true,
      });

      component['initCriteriaOptions']();

      expect(component.criteriaOptions()).toEqual([]);
      expect(component.displayedColumns()).toEqual(['select', 'name']);
    });

    it('should reset to [] when the configured target control does not exist on the group', () => {
      Object.defineProperty(component, 'elementControl', {
        configurable: true,
        value: {
          elementGroup: {
            get: jest.fn().mockReturnValue(undefined),
          },
        },
        writable: true,
      });

      component['initCriteriaOptions']();

      expect(component.criteriaOptions()).toEqual([]);
    });
  });

  it('should map indications to table rows using the selected language and criteria labels', () => {
    Object.defineProperty(component, 'currentLang', {
      configurable: true,
      value: (() => 'fr') as any,
      writable: true,
    });
    component.criteriaOptions.set([criteriaOption]);
    component.rawIndications.set([
      {
        id: 'indication-1',
        translations: [
          { language: 'EN', value: 'English name' },
          { language: 'FR', value: 'Nom français' },
        ],
        snomedcodes: [{ code: 'criterion-1' }],
      } as unknown as IndicationRadiology,
    ]);

    const mapped = component.indications();

    expect(mapped).toHaveLength(1);
    expect(mapped?.[0]).toEqual({
      value: 'indication-1',
      name: 'Nom français',
      criteriaValues: new Map([['criterion-1', 'Critère FR']]),
    });
  });

  describe('pageSizeOptions / totalRows', () => {
    it('should default totalRows to undefined and pageSizeOptions to [10] with no data', () => {
      component.rawIndications.set(undefined);

      expect(component.totalRows()).toBeUndefined();
      expect(component.pageSizeOptions()).toEqual([10]);
    });

    it('should offer up to 50 when 100 or fewer rows exist', () => {
      component.rawIndications.set(Array.from({ length: 50 }, (_, i) => createIndication(`i${i}`, `n${i}`)));

      expect(component.totalRows()).toBe(50);
      expect(component.pageSizeOptions()).toEqual([10, 25, 50]);
    });

    it('should offer up to 100 when more than 100 rows exist', () => {
      component.rawIndications.set(Array.from({ length: 101 }, (_, i) => createIndication(`i${i}`, `n${i}`)));

      expect(component.pageSizeOptions()).toEqual([10, 25, 50, 100]);
    });
  });

  it('should sort and paginate rows and expose the correct sort icon', () => {
    const withCriteria = createIndication('indication-1', 'Alpha', 'criterion-1');
    const withoutCriteria = createIndication('indication-2', 'Beta');

    component.criteriaOptions.set([criteriaOption]);
    component.rawIndications.set([withoutCriteria, withCriteria]);
    Object.defineProperty(component, 'currentLang', {
      configurable: true,
      value: (() => 'en') as any,
      writable: true,
    });
    component.page = 1;
    component.pageSize = 1;
    Object.defineProperty(component, 'sort', {
      configurable: true,
      value: (() => ({ active: 'name', direction: 'asc' }) as any) as any,
      writable: true,
    });

    component['applyPagination']();

    expect(component.dataSource.data).toHaveLength(1);
    expect(component.dataSource.data[0].name).toBe('Alpha');
    expect(component.getSortIcon('name')).toBe('arrow_upward');
    expect(component.getSortIcon('criteria1')).toBe('swap_vert');

    Object.defineProperty(component, 'sort', {
      configurable: true,
      value: (() => ({ active: 'criteria1', direction: 'asc' }) as any) as any,
      writable: true,
    });
    component['applyPagination']();

    expect(component.dataSource.data).toHaveLength(1);
    expect(component.dataSource.data[0].name).toBe('Beta');
    expect(component.getSortIcon('criteria1')).toBe('arrow_upward');
  });

  describe('changePage', () => {
    it('should update page/pageSize and reapply pagination', () => {
      const applySpy = jest.spyOn(component, 'applyPagination').mockImplementation(() => {});

      component.changePage({ pageIndex: 3, pageSize: 25 });

      expect(component.page).toBe(3);
      expect(component.pageSize).toBe(25);
      expect(applySpy).toHaveBeenCalled();
    });

    it('should keep the existing page/pageSize when the event omits them', () => {
      component.page = 2;
      component.pageSize = 10;
      const applySpy = jest.spyOn(component, 'applyPagination').mockImplementation(() => {});

      component.changePage({});

      expect(component.page).toBe(2);
      expect(component.pageSize).toBe(10);
      expect(applySpy).toHaveBeenCalled();
    });
  });

  describe('isSelected', () => {
    it('should return true when the row value is present in elementControl.value', () => {
      Object.defineProperty(component, 'elementControl', {
        configurable: true,
        value: { value: [{ value: 'ind-1' }] },
        writable: true,
      });

      expect(component.isSelected({ value: 'ind-1', name: '', criteriaValues: new Map() })).toBe(true);
    });

    it('should fall back to the internal selection model when elementControl.value does not match', () => {
      Object.defineProperty(component, 'elementControl', {
        configurable: true,
        value: { value: null },
        writable: true,
      });
      const row = { value: 'ind-2', name: '', criteriaValues: new Map() };
      component.selection.select(row);

      expect(component.isSelected(row)).toBe(true);
      expect(component.isSelected({ value: 'other', name: '', criteriaValues: new Map() })).toBe(false);
    });
  });

  it('should toggle selection and emit sorted values when enabled', () => {
    const indication = createIndication('b', 'name');
    (indication as any).translations = [
      { language: 'EN', value: 'English val' },
      { language: 'FR', value: 'Val français' },
    ];
    component.rawIndications.set([indication]);

    const row = {
      criteriaValues: new Map(),
      name: 'Beta',
      value: 'b',
    };

    Object.defineProperty(component, 'elementControl', {
      configurable: true,
      value: {
        setValue: jest.fn(),
        markAsTouched: jest.fn(),
      },
      writable: true,
    });
    Object.defineProperty(component, 'disabled', {
      configurable: true,
      value: true,
      writable: true,
    });

    component.toggle(row);

    expect(component.selection.isSelected(row)).toBe(false);
    expect(component.elementControl.setValue).not.toHaveBeenCalled();

    Object.defineProperty(component, 'disabled', {
      configurable: true,
      value: false,
      writable: true,
    });
    component.toggle(row);

    expect(component.selection.isSelected(row)).toBe(true);
    expect(component.elementControl.setValue).toHaveBeenCalledWith([
      {
        label: {
          de: 'English val',
          en: 'English val',
          fr: 'Val français',
          nl: 'English val',
        },
        value: 'b',
      },
    ]);
    expect(component.elementControl.markAsTouched).toHaveBeenCalled();
  });

  it('should toggle selection via remove() regardless of the disabled flag', () => {
    const indication = createIndication('x', 'name');
    (indication as any).translations = [
      { language: 'EN', value: 'English val' },
      { language: 'FR', value: 'Val français' },
    ];
    component.rawIndications.set([indication]);

    Object.defineProperty(component, 'elementControl', {
      configurable: true,
      value: { setValue: jest.fn(), markAsTouched: jest.fn() },
      writable: true,
    });
    Object.defineProperty(component, 'disabled', {
      configurable: true,
      value: true,
      writable: true,
    });
    const row = { value: 'x', name: '', criteriaValues: new Map() };

    component.remove(row);

    expect(component.selection.isSelected(row)).toBe(true);
    expect(component.elementControl.setValue).toHaveBeenCalledWith([
      {
        label: {
          de: 'English val',
          en: 'English val',
          fr: 'Val français',
          nl: 'English val',
        },
        value: 'x',
      },
    ]);
  });

  describe('onChange -> toAutoCompleteOption / toAutocompleteLabel', () => {
    it('should build an AutocompleteOption per selected row, using each translation directly when present', () => {
      const indication = createIndication('ind-1', 'unused-name');
      (indication as any).translations = [
        { language: 'EN', value: 'English val' },
        { language: 'FR', value: 'Val français' },
      ];
      component.rawIndications.set([indication]);
      const emitSpy = jest.spyOn(component.events, 'emit');

      component.onChange([{ value: 'ind-1', name: 'fallback name', criteriaValues: new Map() }]);

      expect(component.elementControl.setValue).toHaveBeenCalledWith([
        {
          value: 'ind-1',
          label: {
            nl: 'English val', // no NL translation -> falls back to EN
            fr: 'Val français',
            de: 'English val', // no DE translation -> falls back to EN
            en: 'English val',
          },
        },
      ]);
      expect(component.elementControl.markAsTouched).toHaveBeenCalled();
      expect(emitSpy).toHaveBeenCalledWith({
        type: 'CLICK_OPTIONS',
        data: [{ value: 'ind-1', label: expect.any(Object) }],
      });
    });

    it('should fall back to the first available translation when EN is missing', () => {
      const indication = createIndication('ind-2', 'unused-name');
      (indication as any).translations = [{ language: 'DE', value: 'Deutscher Wert' }];
      component.rawIndications.set([indication]);

      component.onChange([{ value: 'ind-2', name: 'fallback name', criteriaValues: new Map() }]);

      expect(component.elementControl.setValue).toHaveBeenCalledWith([
        {
          value: 'ind-2',
          label: {
            nl: 'Deutscher Wert',
            fr: 'Deutscher Wert',
            de: 'Deutscher Wert',
            en: 'Deutscher Wert',
          },
        },
      ]);
    });

    it('should fall back to the row name when there are no translations at all', () => {
      const indication = createIndication('ind-3', 'unused-name');
      (indication as any).translations = [];
      component.rawIndications.set([indication]);

      component.onChange([{ value: 'ind-3', name: 'Row Fallback Name', criteriaValues: new Map() }]);

      expect(component.elementControl.setValue).toHaveBeenCalledWith([
        {
          value: 'ind-3',
          label: {
            nl: 'Row Fallback Name',
            fr: 'Row Fallback Name',
            de: 'Row Fallback Name',
            en: 'Row Fallback Name',
          },
        },
      ]);
    });

    it('should skip rows that no longer exist in rawIndications', () => {
      component.rawIndications.set([createIndication('ind-1', 'Alpha')]);

      component.onChange([{ value: 'not-in-raw-indications', name: '', criteriaValues: new Map() }]);

      expect(component.elementControl.setValue).toHaveBeenCalledWith([]);
    });

    it('should emit an empty array when rawIndications is unset', () => {
      component.rawIndications.set(undefined);

      component.onChange([{ value: 'ind-1', name: '', criteriaValues: new Map() }]);

      expect(component.elementControl.setValue).toHaveBeenCalledWith([]);
    });
  });

  describe('ngOnChanges', () => {
    it('should build rows and sync selection when elementControl.value is a non-empty array', () => {
      const createRowsSpy = jest.spyOn(component, 'createRows').mockImplementation(() => undefined);
      const syncSpy = jest.spyOn(component, 'syncSelectionFromElementControlValue').mockImplementation(() => undefined);
      Object.defineProperty(component, 'elementControl', {
        configurable: true,
        value: { value: [{ value: 'x' }] },
        writable: true,
      });

      component.ngOnChanges({ elementControl: {} as any });

      expect(createRowsSpy).toHaveBeenCalled();
      expect(syncSpy).toHaveBeenCalled();
    });

    it('should not build rows when elementControl.value is empty or not an array', () => {
      const createRowsSpy = jest.spyOn(component, 'createRows').mockImplementation(() => undefined);
      Object.defineProperty(component, 'elementControl', {
        configurable: true,
        value: { value: null },
        writable: true,
      });

      component.ngOnChanges({ elementControl: {} as any });

      expect(createRowsSpy).not.toHaveBeenCalled();
    });

    it('should do nothing when the elementControl input itself did not change', () => {
      const createRowsSpy = jest.spyOn(component, 'createRows').mockImplementation(() => undefined);

      component.ngOnChanges({});

      expect(createRowsSpy).not.toHaveBeenCalled();
    });
  });

  describe('watchFormUpdates (via ngOnInit)', () => {
    it('should clear selection and rebuild rows when the value becomes empty', () => {
      const valueChanges = new Subject<unknown>();
      const createRowsSpy = jest.spyOn(component, 'createRows').mockImplementation(() => undefined);
      Object.defineProperty(component, 'elementControl', {
        configurable: true,
        value: { valueChanges: valueChanges.asObservable(), value: [{ value: 'x' }] },
        writable: true,
      });
      component.selection.select({ value: 'x', name: '', criteriaValues: new Map() });

      component.ngOnInit();
      createRowsSpy.mockClear(); // ignore the initial startWith(current value) emission — value is non-empty, so it's a no-op anyway

      valueChanges.next([]);

      expect(component.selection.selected).toEqual([]);
      expect(createRowsSpy).toHaveBeenCalledTimes(1);
    });

    it('should also treat null/undefined values as empty', () => {
      const valueChanges = new Subject<unknown>();
      const createRowsSpy = jest.spyOn(component, 'createRows').mockImplementation(() => undefined);
      Object.defineProperty(component, 'elementControl', {
        configurable: true,
        value: { valueChanges: valueChanges.asObservable(), value: [] },
        writable: true,
      });

      component.ngOnInit();
      createRowsSpy.mockClear();

      valueChanges.next(undefined);
      valueChanges.next(null);

      expect(createRowsSpy).toHaveBeenCalledTimes(2);
    });

    it('should not clear selection or rebuild rows when the value has entries', () => {
      const valueChanges = new Subject<unknown>();
      const createRowsSpy = jest.spyOn(component, 'createRows').mockImplementation(() => undefined);
      Object.defineProperty(component, 'elementControl', {
        configurable: true,
        value: { valueChanges: valueChanges.asObservable(), value: [] },
        writable: true,
      });
      component.ngOnInit();
      createRowsSpy.mockClear();

      valueChanges.next([{ value: 'y' }]);

      expect(createRowsSpy).not.toHaveBeenCalled();
    });
  });

  describe('createRows (private, invoked via ngOnChanges/watchFormUpdates)', () => {
    it('should mark required fields touched and skip the API call when required fields are missing', () => {
      const genderControl = { value: null, markAsTouched: jest.fn() };
      const birthdateControl = { value: null, markAsTouched: jest.fn() };
      const clinicalControl = { value: null, markAsTouched: jest.fn() };
      const controls: Record<string, unknown> = {
        gender: genderControl,
        birthdate: birthdateControl,
        clinicalIndications: clinicalControl,
      };
      Object.defineProperty(component, 'elementControl', {
        configurable: true,
        value: {
          elementGroup: {
            get: jest.fn((field: string) => controls[field]),
            getOutputValue: jest.fn().mockReturnValue({}),
          },
        },
        writable: true,
      });

      component['createRows']();

      expect(genderControl.markAsTouched).toHaveBeenCalled();
      expect(birthdateControl.markAsTouched).toHaveBeenCalled();
      expect(clinicalControl.markAsTouched).toHaveBeenCalled();
      expect(pssServiceMock.getIndications).not.toHaveBeenCalled();
    });

    it('should derive age from birthdate and call the API when all required fields are present', () => {
      const birthdate = DateTime.now().minus({ years: 40 }).toISODate();
      const controls: Record<string, unknown> = {
        gender: { value: 'F', markAsTouched: jest.fn() },
        birthdate: { value: birthdate, markAsTouched: jest.fn() },
        clinicalIndications: { value: [criteriaOption], markAsTouched: jest.fn() },
      };
      Object.defineProperty(component, 'elementControl', {
        configurable: true,
        value: {
          elementGroup: {
            get: jest.fn((field: string) => controls[field]),
            getOutputValue: jest
              .fn()
              .mockReturnValue({ gender: 'F', birthdate, clinicalIndications: [criteriaOption] }),
          },
        },
        writable: true,
      });
      pssServiceMock.getIndications?.mockReturnValue(of({ exchangeId: '', indications: [] } as any));

      component['createRows']();

      expect(pssServiceMock.getIndications).toHaveBeenCalledWith(expect.objectContaining({ age: 40, gender: 'F' }));
    });
  });

  describe('getAgeBasedOnBirthdate (private)', () => {
    it('should compute age in whole years from a valid ISO birthdate', () => {
      const eighteenYearsAndADayAgo = DateTime.now().minus({ years: 18, days: 1 }).toISODate();
      expect(component['getAgeBasedOnBirthdate'](eighteenYearsAndADayAgo)).toBe(18);
    });

    it('should return 0 for an invalid birthdate string', () => {
      expect(component['getAgeBasedOnBirthdate']('not-a-date')).toBe(0);
    });
  });

  it('should call the API and update state when Annex 82 control succeeds', () => {
    const exchangeIdControl = { setValue: jest.fn() };
    const indicationResponse = createIndication('indication-1', 'Alpha', 'criterion-1');

    Object.defineProperty(component, 'elementControl', {
      configurable: true,
      value: {
        elementGroup: {
          get: jest.fn((field: string) => (field === 'exchangeId' ? exchangeIdControl : undefined)) as any,
        },
      },
      writable: true,
    });

    pssServiceMock.getIndications?.mockReturnValue(
      of({
        exchangeId: 'exchange-1',
        indications: [indicationResponse],
      } as any)
    );

    component['controlAnnex82'](34, 'M', [criteriaOption]);

    expect(pssServiceMock.getIndications).toHaveBeenCalledWith({
      age: 34,
      gender: 'M',
      indicationProposal: [
        {
          system: 'http://snomed.info/sct',
          code: 'criterion-1',
          translations: [
            { value: 'Criteria NL', language: 'NL' },
            { value: 'Critère FR', language: 'FR' },
            { value: 'Criteria EN', language: 'EN' },
            { value: 'Kriterium DE', language: 'DE' },
          ],
        },
      ],
    });
    expect(exchangeIdControl.setValue).toHaveBeenCalledWith('exchange-1');
    expect(component.rawIndications()).toEqual([indicationResponse]);
    expect(component.page).toBe(1);
    expect(component.isLoading()).toBe(false);
  });

  it('should show an error toast and clear indications when Annex 82 control fails', () => {
    component.rawIndications.set([createIndication('indication-1', 'Alpha', 'criterion-1')]);
    pssServiceMock.getIndications?.mockReturnValue(throwError(() => new Error('API failure')));

    component['controlAnnex82'](34, 'M', [criteriaOption]);

    expect(toastServiceMock.showSomethingWentWrong).toHaveBeenCalled();
    expect(component.rawIndications()).toBeUndefined();
    expect(component.isLoading()).toBe(false);
  });
});
