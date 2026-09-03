import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfessionalTableComponent } from './professional-table.component';
import { By } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import {
  HealthcareOrganizationResource,
  HealthcareProResource,
  HealthCareProviderResource,
  ProviderType,
} from '@reuse/code/openapi';
import { Lang } from '@reuse/code/constants/languages';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { PaginatorComponent } from '@reuse/code/components/paginator/paginator.component';

const mockHealthcareProviders = [
  { id: { ssin: '123', qualificationCode: 'Q1' }, address: {}, type: 'PROFESSIONAL' } as HealthcareProResource,
  { id: { ssin: '456', qualificationCode: 'Q2' }, address: {}, type: 'PROFESSIONAL' } as HealthcareProResource,
  {
    id: { ssin: '789', qualificationCode: 'Q3' },
    address: {},
    type: 'ORGANIZATION',
  } as HealthcareOrganizationResource,
  {
    id: { ssin: '1011112', qualificationCode: 'Q3' },
    address: {},
    type: 'ORGANIZATION',
  } as HealthcareOrganizationResource,
] as HealthCareProviderResource[];

describe('ProfessionalTableComponent', () => {
  let component: ProfessionalTableComponent;
  let fixture: ComponentFixture<ProfessionalTableComponent>;

  const mockProviderTypeOptions: ProviderType[] = [
    ProviderType.All,
    ProviderType.Professional,
    ProviderType.Organization,
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfessionalTableComponent, TranslateModule.forRoot(), MatIconTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfessionalTableComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('currentLang', Lang.NL.short);

    fixture.componentRef.setInput('providerTypeOptions', mockProviderTypeOptions);
    fixture.componentRef.setInput('selectedType', ProviderType.All);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Data rendering', () => {
    it('should render a row for each professional', () => {
      fixture.componentRef.setInput('requestData', mockHealthcareProviders);

      fixture.detectChanges();

      const rows = fixture.debugElement.queryAll(By.css('tbody tr, mat-row'));
      expect(rows.length).toBe(4);
    });
  });

  it('should display the correct column headers (displayedColumns and filterColumns)', () => {
    fixture.componentRef.setInput('requestData', mockHealthcareProviders);

    const headerCells = fixture.debugElement.queryAll(By.css('th'));
    const headerTexts = headerCells.map(cell => cell.nativeElement.textContent.trim());

    const totalLengthExpected = component['displayedColumns'].length + component['filterColumns'].length;

    expect(headerTexts.length).toBe(totalLengthExpected);
  });

  it('should show no rows when professionals list is empty', () => {
    fixture.componentRef.setInput('requestData', []);

    const rows = fixture.debugElement.queryAll(By.css('tbody tr, mat-row'));

    expect(rows.length).toBe(0);
  });

  it('should show loading state when loading is true', () => {
    fixture.componentRef.setInput('requestData', []);
    fixture.componentRef.setInput('loading', true);

    fixture.detectChanges();

    const loadingEl = fixture.debugElement.query(By.css('[data-cy="skeleton"]'));

    expect(loadingEl).toBeTruthy();
  });

  it('should emit selectProfessional when a row action is triggered', () => {
    fixture.componentRef.setInput('requestData', mockHealthcareProviders);
    fixture.detectChanges();

    const emitSpy = jest.spyOn(component.selectProfessional, 'emit');

    const actionButton = fixture.debugElement.query(By.css('[data-cy="professional-actions-cell"] button'));
    actionButton.nativeElement.click();
    fixture.detectChanges();

    expect(emitSpy).toHaveBeenCalledWith(mockHealthcareProviders[0]);
  });
  describe('pagination', () => {
    it('should emit changePage when paginator triggers an event', () => {
      const emitSpy = jest.spyOn(component.changePage, 'emit');
      const paginator = fixture.debugElement.query(By.directive(PaginatorComponent));

      const mockEvent = { pageIndex: 2, pageSize: 10 };
      paginator.componentInstance.changePage.emit(mockEvent);

      expect(emitSpy).toHaveBeenCalledWith(mockEvent);
    });
  });

  describe('column filters', () => {
    describe('type filter', () => {
      it('should bind selectedType model correctly', () => {
        fixture.componentRef.setInput('selectedType', ProviderType.Professional);
        fixture.detectChanges();

        expect(component.selectedType()).toBe(ProviderType.Professional);
      });

      it('should update selectedType model when mat-select changes', () => {
        fixture.componentRef.setInput('selectedType', ProviderType.All);
        fixture.detectChanges();

        const selectElement = fixture.debugElement.query(By.css('mat-select'));
        expect(selectElement).toBeTruthy();

        selectElement.componentInstance.valueChange.emit(ProviderType.Professional);
        fixture.detectChanges();

        expect(component.selectedType()).toBe(ProviderType.Professional);
      });

      it('should display all healthcareProviders when selected type is ALL', () => {
        fixture.componentRef.setInput('requestData', mockHealthcareProviders);
        fixture.detectChanges();

        const rows = fixture.debugElement.queryAll(By.css('tbody tr, mat-row'));

        expect(rows.length).toBe(4);
      });

      it('should update selectedType model when user selects a new type in mat-select', () => {
        const selectDebugEl = fixture.debugElement.query(By.css('mat-select'));
        selectDebugEl.componentInstance.valueChange.emit(ProviderType.Professional);
        fixture.detectChanges();
        expect(component.selectedType()).toBe(ProviderType.Professional);
      });
    });
  });
});
