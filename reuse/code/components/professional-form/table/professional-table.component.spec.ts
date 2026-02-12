import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfessionalTableComponent } from './professional-table.component';
import { By } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';

const mockProfessionals = [
  { firstname: 'Jan', lastname: 'Janssens', address: 'Kerkstraat 1', city: 'Brussel' },
  { firstname: 'Piet', lastname: 'Peeters', address: 'Dorpstraat 5', city: 'Antwerpen' },
] as any[];

describe('ProfessionalTableComponent', () => {
  let component: ProfessionalTableComponent;
  let fixture: ComponentFixture<ProfessionalTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfessionalTableComponent, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfessionalTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the correct column headers', () => {
    fixture.componentRef.setInput('professionals', mockProfessionals);
    fixture.componentRef.setInput('currentLang', 'nl');
    fixture.detectChanges();

    const headerCells = fixture.debugElement.queryAll(By.css('th'));
    const headerTexts = headerCells.map(cell => cell.nativeElement.textContent.trim());

    expect(headerTexts.length).toBe(component['displayedColumns'].length);
  });

  it('should render a row for each professional', () => {
    fixture.componentRef.setInput('professionals', mockProfessionals);
    fixture.componentRef.setInput('currentLang', 'nl');
    fixture.detectChanges();

    const rows = fixture.debugElement.queryAll(By.css('tbody tr, mat-row'));

    expect(rows.length).toBe(2);
  });

  it('should show no rows when professionals list is empty', () => {
    fixture.componentRef.setInput('professionals', []);
    fixture.componentRef.setInput('currentLang', 'nl');
    fixture.detectChanges();

    const rows = fixture.debugElement.queryAll(By.css('tbody tr, mat-row'));

    expect(rows.length).toBe(0);
  });

  it('should show loading state when loading is true', () => {
    fixture.componentRef.setInput('professionals', []);
    fixture.componentRef.setInput('loading', true);
    fixture.componentRef.setInput('currentLang', 'nl');
    fixture.detectChanges();

    const loadingEl = fixture.debugElement.query(By.css('[data-cy="skeleton"]'));

    expect(loadingEl).toBeTruthy();
  });

  it('should emit selectProfessional when a row action is triggered', () => {
    fixture.componentRef.setInput('professionals', mockProfessionals);
    fixture.componentRef.setInput('currentLang', 'nl');
    fixture.detectChanges();

    const emitSpy = jest.spyOn(component.selectProfessional, 'emit');

    const actionButton = fixture.debugElement.query(By.css('[data-cy="professional-actions-cell"] button'));
    actionButton.nativeElement.click();
    fixture.detectChanges();

    expect(emitSpy).toHaveBeenCalledWith(mockProfessionals[0]);
  });
});
