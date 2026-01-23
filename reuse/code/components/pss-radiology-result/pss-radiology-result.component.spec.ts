import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { EvfTranslateService, Language } from '@smals/vas-evaluation-form-ui-core';
import { PssRadiologyResultComponent } from '@reuse/code/components/pss-radiology-result/pss-radiology-result.component';
import { SupportOption } from '@reuse/code/openapi';
import { MatCheckbox } from '@angular/material/checkbox';
import { By } from '@angular/platform-browser';

describe('PssRadiologyResultComponent', () => {
  let component: PssRadiologyResultComponent;
  let fixture: ComponentFixture<PssRadiologyResultComponent>;
  let mockEvfTranslateService: jest.Mocked<Partial<EvfTranslateService>>;
  let currentLangSubject: Subject<Language>;

  const mockSupportOptions: SupportOption[] = [
    {
      id: '1',
      score: 7,
      instruction: {
        system: 'pss',
        code: '123',
        translations: [],
      },
      evidenceSummary: {
        code: '123',
        translations: [],
        version: '1',
      },
      supportOptionMetadata: {
        isRequested: true,
        radiationLevel: 2,
        relativeCost: 3,
      },
    },
    {
      id: '2',
      score: 7,
      instruction: {
        system: 'pss',
        code: '123',
        translations: [],
      },
      evidenceSummary: {
        code: '123',
        translations: [],
        version: '1',
      },
      supportOptionMetadata: {
        isRequested: true,
        radiationLevel: 4,
        relativeCost: 1,
      },
    },
  ];

  beforeEach(async () => {
    currentLangSubject = new Subject<Language>();

    mockEvfTranslateService = {
      currentLang: 'nl',
      currentLang$: currentLangSubject.asObservable(),
    };

    await TestBed.configureTestingModule({
      imports: [PssRadiologyResultComponent, TranslateModule.forRoot()],
      providers: [{ provide: EvfTranslateService, useValue: mockEvfTranslateService }],
    }).compileComponents();

    fixture = TestBed.createComponent(PssRadiologyResultComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component['language']).toBe('nl');
    expect(component['radiationLevel']).toEqual(Array(5));
    expect(component['clickedRow']).toBeUndefined();
    expect(component['displayedColumns']).toEqual(['select', 'relevance', 'typesOfImagery', 'radiationRate']);
  });

  it('should accept supportOptions input', () => {
    component.supportOptions = mockSupportOptions;
    expect(component.supportOptions).toEqual(mockSupportOptions);

    component.supportOptions = undefined;
    expect(component.supportOptions).toBeUndefined();
  });

  it('should set clickedRow and emit selectSupportOption', () => {
    const mockSupportOption = mockSupportOptions[0];
    const emitSpy = jest.spyOn(component.selectSupportOption, 'next');

    component.confirm(mockSupportOption);

    expect(component['clickedRow']).toBe(mockSupportOption);
    expect(emitSpy).toHaveBeenCalledWith(mockSupportOption);
  });

  it('should update clickedRow when called multiple times', () => {
    const firstOption = mockSupportOptions[0];
    const secondOption = mockSupportOptions[1];

    component.confirm(firstOption);
    expect(component['clickedRow']).toBe(firstOption);

    component.confirm(secondOption);
    expect(component['clickedRow']).toBe(secondOption);
  });

  it('should emit selectSupportOption event', () => {
    let emittedValue: SupportOption | undefined;
    component.selectSupportOption.subscribe(value => (emittedValue = value));

    const testOption = mockSupportOptions[0];
    component.confirm(testOption);

    expect(emittedValue).toBe(testOption);
  });

  it('should render table when supportOptions are provided', () => {
    component.supportOptions = mockSupportOptions;
    fixture.detectChanges();

    const tableElement = fixture.nativeElement.querySelector('table[mat-table]');
    expect(tableElement).toBeTruthy();
  });

  it('should not render table when supportOptions is undefined', () => {
    component.supportOptions = undefined;
    fixture.detectChanges();

    const tableElement = fixture.nativeElement.querySelector('table[mat-table]');
    expect(tableElement).toBeFalsy();
  });

  it('should render all column headers', () => {
    component.supportOptions = mockSupportOptions;
    fixture.detectChanges();

    const headerCells = fixture.nativeElement.querySelectorAll('th[mat-header-cell]');
    expect(headerCells.length).toBe(4);

    expect(headerCells[0].textContent).toContain('prescription.create.control.table.select');
    expect(headerCells[1].textContent).toContain('prescription.create.control.table.relevance');
    expect(headerCells[2].textContent).toContain('prescription.create.control.table.typesOfImagery');
    expect(headerCells[3].textContent).toContain('prescription.create.control.table.radiationRate');
  });

  it('should render correct number of data rows', () => {
    component.supportOptions = mockSupportOptions;
    fixture.detectChanges();

    const dataRows = fixture.nativeElement.querySelectorAll('tr[mat-row]');
    expect(dataRows.length).toBe(2);
  });

  it('should render checkboxes for each row', () => {
    component.supportOptions = mockSupportOptions;
    fixture.detectChanges();

    const checkboxes = fixture.nativeElement.querySelectorAll('mat-checkbox');
    expect(checkboxes.length).toBe(2);
  });

  it('should check checkbox when row is selected', () => {
    component.supportOptions = mockSupportOptions;
    component.confirm(mockSupportOptions[0]);
    fixture.detectChanges();

    const checkboxDebug = fixture.debugElement.query(
      By.directive(MatCheckbox)
    );
    expect(checkboxDebug).toBeTruthy();

    const checkbox = checkboxDebug.componentInstance as MatCheckbox;

    expect(checkbox.checked).toBe(true);
  });

  it('should display score with error class for score < 4', () => {
    const lowScoreOption = { ...mockSupportOptions[0], score: 2 };
    component.supportOptions = [lowScoreOption];
    fixture.detectChanges();

    const scoreElement = fixture.nativeElement.querySelector('.pss-score div');
    expect(scoreElement.textContent.trim()).toBe('2');
    expect(scoreElement.className).toContain('pss-error');
    expect(scoreElement.className).toContain('pss-score-2');
  });

  it('should display score with warning class for score 4-6', () => {
    const mediumScoreOption = { ...mockSupportOptions[0], score: 5 };
    component.supportOptions = [mediumScoreOption];
    fixture.detectChanges();

    const scoreElement = fixture.nativeElement.querySelector('.pss-score div');
    expect(scoreElement.textContent.trim()).toBe('5');
    expect(scoreElement.className).toContain('pss-warning');
    expect(scoreElement.className).toContain('pss-score-5');
  });

  it('should display score with success class for score > 6', () => {
    component.supportOptions = [mockSupportOptions[1]];
    fixture.detectChanges();

    const scoreElement = fixture.nativeElement.querySelector('.pss-score div');
    expect(scoreElement.textContent.trim()).toBe('7');
    expect(scoreElement.className).toContain('pss-success');
    expect(scoreElement.className).toContain('pss-score-7');
  });

  it('should render correct number of radiation icons', () => {
    component.supportOptions = [mockSupportOptions[0]];
    fixture.detectChanges();

    const radiationIcons = fixture.nativeElement.querySelectorAll('mat-icon[svgIcon="radiation"]');
    expect(radiationIcons.length).toBe(5);
  });

  it('should apply active class to icons based on radiation level', () => {
    component.supportOptions = [mockSupportOptions[0]]; // radiationLevel: 2
    fixture.detectChanges();

    const radiationIcons = fixture.nativeElement.querySelectorAll('mat-icon[svgIcon="radiation"]');

    expect(radiationIcons[0].className).toContain('radiation-active');
    expect(radiationIcons[1].className).toContain('radiation-active');
    expect(radiationIcons[2].className).toContain('radiation-inactive');
    expect(radiationIcons[3].className).toContain('radiation-inactive');
    expect(radiationIcons[4].className).toContain('radiation-inactive');
  });

  it('should call confirm when row is clicked', () => {
    const confirmSpy = jest.spyOn(component, 'confirm');
    component.supportOptions = mockSupportOptions;
    fixture.detectChanges();

    const firstRow = fixture.nativeElement.querySelector('tr[mat-row]');
    firstRow.click();

    expect(confirmSpy).toHaveBeenCalledWith(mockSupportOptions[0]);
  });

  it('should apply clicked class to selected row', () => {
    component.supportOptions = mockSupportOptions;
    component['clickedRow'] = mockSupportOptions[0];
    fixture.detectChanges();

    const firstRow = fixture.nativeElement.querySelector('tr[mat-row]');
    expect(firstRow.className).toContain('row-is-clicked');
  });

  it('should not apply clicked class to unselected rows', () => {
    component.supportOptions = mockSupportOptions;
    component['clickedRow'] = mockSupportOptions[0];
    component['isClickable'] = true;
    fixture.detectChanges();

    const secondRow = fixture.nativeElement.querySelectorAll('tr[mat-row]')[1];
    expect(secondRow.className).not.toContain('row-is-clicked');
  });

  it('should display checkbox if isClickable is true', () => {
    component.supportOptions = mockSupportOptions;
    component['isClickable'] = true;
    fixture.detectChanges();

    const firstRow = fixture.nativeElement.querySelector('tr[mat-row]');
    expect(firstRow.className).toContain('row-is-clickable');
  });

  it('should not display checkbox if isClickable is false', () => {
    component.supportOptions = mockSupportOptions;
    component['isClickable'] = false;
    fixture.detectChanges();

    const firstRow = fixture.nativeElement.querySelector('tr[mat-row]');
    expect(firstRow.className).not.toContain('row-is-clickable');
  });

  it('should not apply selected class to selected rows', () => {
    component['isClickable'] = false;
    component.supportOptions = mockSupportOptions;
    component['selectedRow'] = mockSupportOptions[0];
    fixture.detectChanges();

    const firstRow = fixture.nativeElement.querySelector('tr[mat-row]');
    expect(firstRow.className).toContain('row-is-selected');
  });
});
