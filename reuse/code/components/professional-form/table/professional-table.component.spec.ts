import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfessionalTableComponent } from './professional-table.component';
import { By } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { signal, SimpleChange, SimpleChanges } from '@angular/core';
import { RequestProfessionalDataService } from '@reuse/code/services/helpers/request-professional-data.service';
import { HealthcareProResource } from '@reuse/code/openapi';
import { Lang } from '@reuse/code/constants/languages';

const mockProfessionals: HealthcareProResource[] = [
  { id: { ssin: '123', qualificationCode: 'Q1' }, address: { street: '', zipCode: '' } },
  { id: { ssin: '456', qualificationCode: 'Q2' }, address: { street: '', zipCode: '' } },
] as any[];

describe('ProfessionalTableComponent', () => {
  let component: ProfessionalTableComponent;
  let fixture: ComponentFixture<ProfessionalTableComponent>;
  let dataServiceMock: jest.Mocked<RequestProfessionalDataService>;

  beforeEach(async () => {
    dataServiceMock = {
      data: signal([]),
      loading: signal(false),
      initializeTableDataStream: jest.fn(),
      triggerLoad: jest.fn(),
      tableReset: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [ProfessionalTableComponent, TranslateModule.forRoot()],
      providers: [{ provide: RequestProfessionalDataService, useValue: dataServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfessionalTableComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('prescriptionId', 'RX-001');
    fixture.componentRef.setInput('category', 'physiotherapy');
    fixture.componentRef.setInput('intent', 'prescribe');
    fixture.componentRef.setInput('currentLang', Lang.NL.short);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnChanges', () => {
    it('should call initializeTableDataStream when professionals change with data', () => {
      fixture.componentRef.setInput('professionals', mockProfessionals);

      const changes: SimpleChanges = {
        professionals: new SimpleChange(null, mockProfessionals, true),
      };
      component.ngOnChanges(changes);

      expect(dataServiceMock.initializeTableDataStream).toHaveBeenCalled();
    });

    it('should not call initializeTableDataStream when professionals change to empty', () => {
      fixture.componentRef.setInput('professionals', []);

      const changes: SimpleChanges = {
        professionals: new SimpleChange(null, [], true),
      };
      component.ngOnChanges(changes);

      expect(dataServiceMock.initializeTableDataStream).not.toHaveBeenCalled();
    });

    it('should not call initializeTableDataStream for unrelated changes', () => {
      dataServiceMock.initializeTableDataStream.mockClear();

      const changes: SimpleChanges = {
        loading: new SimpleChange(false, true, false),
      };
      component.ngOnChanges(changes);

      expect(dataServiceMock.initializeTableDataStream).not.toHaveBeenCalled();
    });

    it('should render a row for each professional', () => {
      dataServiceMock.initializeTableDataStream.mockClear();

      (component as any).requestData.set(mockProfessionals);

      fixture.detectChanges();

      const rows = fixture.debugElement.queryAll(By.css('tbody tr, mat-row'));
      expect(rows.length).toBe(2);
    });
  });

  it('should display the correct column headers', () => {
    fixture.componentRef.setInput('professionals', mockProfessionals);

    const headerCells = fixture.debugElement.queryAll(By.css('th'));
    const headerTexts = headerCells.map(cell => cell.nativeElement.textContent.trim());

    expect(headerTexts.length).toBe(component['displayedColumns'].length);
  });

  it('should show no rows when professionals list is empty', () => {
    fixture.componentRef.setInput('professionals', []);

    const rows = fixture.debugElement.queryAll(By.css('tbody tr, mat-row'));

    expect(rows.length).toBe(0);
  });

  it('should show loading state when loading is true', () => {
    fixture.componentRef.setInput('professionals', []);
    fixture.componentRef.setInput('loading', true);

    fixture.detectChanges();

    const loadingEl = fixture.debugElement.query(By.css('[data-cy="skeleton"]'));

    expect(loadingEl).toBeTruthy();
  });

  it('should emit selectProfessional when a row action is triggered', () => {
    const emitSpy = jest.spyOn(component.selectProfessional, 'emit');

    (component as any).requestData.set(mockProfessionals);

    fixture.detectChanges();

    const actionButton = fixture.debugElement.query(By.css('[data-cy="professional-actions-cell"] button'));
    actionButton.nativeElement.click();

    expect(emitSpy).toHaveBeenCalledWith(mockProfessionals[0]);
  });
});
