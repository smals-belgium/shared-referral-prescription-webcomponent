import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckbox } from '@angular/material/checkbox';
import { By } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { Subject } from 'rxjs';

import { Lang } from '@reuse/code/constants/languages';
import { SupportOption } from '@reuse/code/openapi';
import { AutocompleteOption, EvfTranslateService, Language } from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { PssRadiologyResultComponent } from './pss-radiology-result.component';
import { PSS_DEFAULT_INDICATIONS } from '@reuse/code/constants/pss.constants';
import { MatIconTestingModule } from '@angular/material/icon/testing';

describe('PssRadiologyResultComponent', () => {
  let component: PssRadiologyResultComponent;
  let fixture: ComponentFixture<PssRadiologyResultComponent>;
  let mockEvfTranslateService: jest.Mocked<Partial<EvfTranslateService>>;
  let currentLangSubject: Subject<Language>;

  const mockSupportOptions: SupportOption[] = [
    {
      id: '1',
      score: 7,
      instruction: { system: 'pss', code: '123', translations: [] },
      evidenceSummary: { code: '123', system: 'snomed', translations: [], version: '1' },
      supportOptionMetadata: { isRequested: true, radiationLevel: 2, relativeCost: 3 },
    },
    {
      id: '2',
      score: 7,
      instruction: { system: 'pss', code: '123', translations: [] },
      evidenceSummary: { code: '123', system: 'snomed', translations: [], version: '1' },
      supportOptionMetadata: { isRequested: true, radiationLevel: 4, relativeCost: 1 },
    },
    ...PSS_DEFAULT_INDICATIONS,
  ];

  const mockPrescribedExam: AutocompleteOption[] = [{ value: '2', label: { nl: 'Exam 2' } } as AutocompleteOption];

  beforeEach(async () => {
    currentLangSubject = new Subject<Language>();

    mockEvfTranslateService = {
      currentLang: Lang.NL.short,
      currentLang$: currentLangSubject.asObservable(),
      instant: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PssRadiologyResultComponent, TranslateModule.forRoot(), MatIconTestingModule],
      providers: [{ provide: EvfTranslateService, useValue: mockEvfTranslateService }],
    }).compileComponents();

    fixture = TestBed.createComponent(PssRadiologyResultComponent);
    component = fixture.componentInstance;
  });

  function setInputs(partial: {
    supportOptions?: SupportOption[];
    prescribedExam?: AutocompleteOption[];
    isLoading?: boolean;
    hasProposedImaging?: boolean;
  }) {
    Object.entries(partial).forEach(([key, value]) => {
      fixture.componentRef.setInput(key, value);
    });
    fixture.detectChanges();
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect((component as any).currentLang()).toBe(Lang.NL.short);
    expect((component as any).selectedRow()).toBeUndefined();
    expect(component['displayedColumns']).toEqual(['select', 'relevance', 'typesOfImagery', 'radiationRate']);
  });

  it('should default isLoading to true and hasProposedImaging to true', () => {
    expect(component.isLoading()).toBe(true);
    expect(component.hasProposedImaging()).toBe(true);
  });

  it('should react to currentLang$ emissions', () => {
    currentLangSubject.next(Lang.EN.short as unknown as Language);
    fixture.detectChanges();
    expect((component as any).currentLang()).toBe(Lang.EN.short);
  });

  it('should accept supportOptions input and populate dataSource', () => {
    setInputs({ supportOptions: mockSupportOptions });
    expect(component.supportOptions()).toEqual(mockSupportOptions);
    expect(component.dataSource.data).toEqual(mockSupportOptions);
  });

  it('should set selectedRow and emit selectSupportOption on toggle', () => {
    setInputs({ hasProposedImaging: true });
    const mockSupportOption = mockSupportOptions[0];
    const emitSpy = jest.spyOn(component.selectSupportOption, 'emit');

    component.toggle(mockSupportOption);

    expect((component as any).selectedRow()).toBe(mockSupportOption);
    expect(emitSpy).toHaveBeenCalledWith(mockSupportOption);
  });

  it('should not toggle when hasProposedImaging is false and supportOption is other', () => {
    setInputs({ hasProposedImaging: false });
    const emitSpy = jest.spyOn(component.selectSupportOption, 'emit');

    component.toggle(mockSupportOptions[2]);

    expect((component as any).selectedRow()).toBeUndefined();
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should update selectedRow when toggled multiple times', () => {
    setInputs({ hasProposedImaging: true });
    const [first, second] = mockSupportOptions;

    component.toggle(first);
    expect((component as any).selectedRow()).toBe(first);

    component.toggle(second);
    expect((component as any).selectedRow()).toBe(second);
  });

  describe('isSelected', () => {
    it('should return true for the currently selected row', () => {
      setInputs({ hasProposedImaging: true });
      component.toggle(mockSupportOptions[0]);
      expect(component.isSelected(mockSupportOptions[0])).toBe(true);
    });

    it('should return false for a non-selected row', () => {
      setInputs({ hasProposedImaging: true });
      component.toggle(mockSupportOptions[0]);
      expect(component.isSelected(mockSupportOptions[1])).toBe(false);
    });
  });

  describe('shouldAutoExpand', () => {
    it('should be true when no row is selected', () => {
      expect(component.shouldAutoExpand()).toBe(true);
    });

    it('should be true when the selected row score is below 7', () => {
      setInputs({ hasProposedImaging: true });
      component.toggle({ ...mockSupportOptions[0], score: 5 });
      expect(component.shouldAutoExpand()).toBe(true);
    });

    it('should be false when the selected row score is 7 or above', () => {
      setInputs({ hasProposedImaging: true });
      component.toggle({ ...mockSupportOptions[0], score: 7 });
      expect(component.shouldAutoExpand()).toBe(false);
    });
  });

  describe('ngOnChanges auto-selection', () => {
    it('should auto-select and emit when prescribedExam matches a supportOption', () => {
      const emitSpy = jest.spyOn(component.selectSupportOption, 'emit');

      setInputs({ supportOptions: mockSupportOptions, prescribedExam: mockPrescribedExam });

      expect((component as any).selectedRow()).toEqual(mockSupportOptions[1]); // id '2'
      expect(emitSpy).toHaveBeenCalledWith(mockSupportOptions[1]);
    });

    it('should not auto-select when prescribedExam has no matching id', () => {
      setInputs({
        supportOptions: mockSupportOptions,
        prescribedExam: [{ value: 'no-match', label: { nl: 'x' } } as AutocompleteOption],
      });

      expect((component as any).selectedRow()).toBeUndefined();
    });

    it('should not throw when prescribedExam is set without supportOptions', () => {
      expect(() => setInputs({ prescribedExam: mockPrescribedExam })).not.toThrow();
      expect(component.dataSource.data).toEqual([]);
    });
  });

  it('should render table when supportOptions are provided', () => {
    setInputs({ supportOptions: mockSupportOptions });
    const tableElement = fixture.nativeElement.querySelector('table[mat-table]');
    expect(tableElement).toBeTruthy();
  });

  it('should always render table even when supportOptions is undefined', () => {
    fixture.detectChanges();
    const tableElement = fixture.nativeElement.querySelector('table[mat-table]');
    expect(tableElement).toBeTruthy();
  });

  it('should render all column headers', () => {
    setInputs({ supportOptions: mockSupportOptions });
    const headerCells = fixture.nativeElement.querySelectorAll('th[mat-header-cell]');
    expect(headerCells).toHaveLength(4);
    expect(headerCells[0].textContent).toContain(''); //checkbox
    expect(headerCells[1].textContent).toContain('prescription.create.control.table.relevance');
    expect(headerCells[2].textContent).toContain('prescription.create.control.table.typesOfImagery');
    expect(headerCells[3].textContent).toContain('prescription.create.control.table.radiationRate');
  });

  it('should render correct number of data rows', () => {
    setInputs({ supportOptions: mockSupportOptions });
    const dataRows = fixture.nativeElement.querySelectorAll('tr[mat-row]');
    // 4 default rows + 4 detail rows + 4 gap rows
    expect(dataRows).toHaveLength(12);
  });

  it('should render checkboxes for each row', () => {
    setInputs({ supportOptions: mockSupportOptions });
    const checkboxes = fixture.nativeElement.querySelectorAll('mat-checkbox');
    expect(checkboxes).toHaveLength(4);
  });

  it('should check checkbox when row is selected', () => {
    setInputs({ supportOptions: mockSupportOptions, hasProposedImaging: true });
    component.toggle(mockSupportOptions[0]);
    fixture.detectChanges();

    const checkboxDebug = fixture.debugElement.query(By.directive(MatCheckbox));
    expect(checkboxDebug).toBeTruthy();
    expect((checkboxDebug.componentInstance as MatCheckbox).checked).toBe(true);
  });

  it('should display score with error class for score < 4', () => {
    setInputs({ supportOptions: [{ ...mockSupportOptions[0], score: 2 }] });
    const scoreElement = fixture.nativeElement.querySelector('.pss-score div');
    expect(scoreElement.textContent.trim()).toBe('2');
    const childScoreElement = scoreElement.querySelector('div');
    expect(childScoreElement.className).toContain('pss-error');
    expect(childScoreElement.className).toContain('pss-score-2');
  });

  it('should display score with warning class for score 4-6', () => {
    setInputs({ supportOptions: [{ ...mockSupportOptions[0], score: 5 }] });
    const scoreElement = fixture.nativeElement.querySelector('.pss-score div');
    expect(scoreElement.textContent.trim()).toBe('5');
    const childScoreElement = scoreElement.querySelector('div');
    expect(childScoreElement.className).toContain('pss-warning');
    expect(childScoreElement.className).toContain('pss-score-5');
  });

  it('should display score with success class for score > 6', () => {
    setInputs({ supportOptions: [mockSupportOptions[1]] });
    const scoreElement = fixture.nativeElement.querySelector('.pss-score div');
    expect(scoreElement.textContent.trim()).toBe('7');
    const childScoreElement = scoreElement.querySelector('div');
    expect(childScoreElement.className).toContain('pss-success');
    expect(childScoreElement.className).toContain('pss-score-7');
  });

  it('should render correct number of radiation icons', () => {
    setInputs({ supportOptions: [mockSupportOptions[0]] }); // radiationLevel: 2
    const radiationIcons = fixture.nativeElement.querySelectorAll('mat-icon[data-mat-icon-name="radiation_active"]');
    expect(radiationIcons).toHaveLength(2);

    const radiationInactiveIcons = fixture.nativeElement.querySelectorAll(
      'mat-icon[data-mat-icon-name="radiation_inactive"]'
    );
    expect(radiationInactiveIcons).toHaveLength(3);
  });

  it('should call toggle when row is clicked', () => {
    const toggleSpy = jest.spyOn(component, 'toggle');
    setInputs({ supportOptions: mockSupportOptions });

    const firstRow = fixture.nativeElement.querySelector('tr[mat-row]');
    firstRow.click();

    expect(toggleSpy).toHaveBeenCalledWith(mockSupportOptions[0]);
  });

  it('should apply clicked class to selected row', () => {
    setInputs({ supportOptions: mockSupportOptions, hasProposedImaging: true });
    component.toggle(mockSupportOptions[0]);
    fixture.detectChanges();

    const firstRow = fixture.nativeElement.querySelector('tr[mat-row]');
    expect(firstRow.className).toContain('select-row selected');
  });

  it('should not apply clicked class to unselected rows', () => {
    setInputs({ supportOptions: mockSupportOptions, hasProposedImaging: true });
    component.toggle(mockSupportOptions[0]);
    fixture.detectChanges();

    const secondRow = fixture.nativeElement.querySelectorAll('tr[mat-row]')[1];
    expect(secondRow.className).not.toContain('select-row selected');
  });

  it('should not apply clickable class to rows when hasProposedImaging is false', () => {
    setInputs({ supportOptions: mockSupportOptions, hasProposedImaging: false });
    const firstRow = fixture.nativeElement.querySelector('tr[mat-row]');
    expect(firstRow.className).not.toContain('row-is-clickable');
  });
});
