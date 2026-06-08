import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfessionalTableComponent } from './professional-table.component';
import { By } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { HealthcareProResource } from '@reuse/code/openapi';
import { Lang } from '@reuse/code/constants/languages';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { PaginatorComponent } from '@reuse/code/components/paginator/paginator.component';

const mockProfessionals: HealthcareProResource[] = [
  { id: { ssin: '123', qualificationCode: 'Q1' }, address: { street: '', zipCode: '' } },
  { id: { ssin: '456', qualificationCode: 'Q2' }, address: { street: '', zipCode: '' } },
] as any[];

describe('ProfessionalTableComponent', () => {
  let component: ProfessionalTableComponent;
  let fixture: ComponentFixture<ProfessionalTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfessionalTableComponent, TranslateModule.forRoot(), MatIconTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfessionalTableComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('currentLang', Lang.NL.short);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Data rendering', () => {
    it('should render a row for each professional', () => {
      fixture.componentRef.setInput('requestData', mockProfessionals);

      fixture.detectChanges();

      const rows = fixture.debugElement.queryAll(By.css('tbody tr, mat-row'));
      expect(rows.length).toBe(2);
    });
  });

  it('should display the correct column headers', () => {
    fixture.componentRef.setInput('requestData', mockProfessionals);

    const headerCells = fixture.debugElement.queryAll(By.css('th'));
    const headerTexts = headerCells.map(cell => cell.nativeElement.textContent.trim());

    expect(headerTexts.length).toBe(component['displayedColumns'].length);
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
    fixture.componentRef.setInput('requestData', mockProfessionals);
    fixture.detectChanges();

    const emitSpy = jest.spyOn(component.selectProfessional, 'emit');

    const actionButton = fixture.debugElement.query(By.css('[data-cy="professional-actions-cell"] button'));
    actionButton.nativeElement.click();
    fixture.detectChanges();

    expect(emitSpy).toHaveBeenCalledWith(mockProfessionals[0]);
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
});
