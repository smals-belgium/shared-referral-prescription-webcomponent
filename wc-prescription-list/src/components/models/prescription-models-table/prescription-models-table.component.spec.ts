import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModelEntityDto } from '@reuse/code/openapi';
import { FormatEnum, SkeletonComponent } from '@reuse/code/components/progress-indicators/skeleton/skeleton.component';
import { AlertComponent } from '@myhealth-belgium/myhealth-additional-ui-components';
import { MatTableModule } from '@angular/material/table';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { PrescriptionModelsTableComponent } from './prescription-models-table.component';
import { DateAdapter } from '@angular/material/core';

const mockPrescriptionModels: ModelEntityDto[] = [
  {
    id: 1,
    creationDate: '2024-01-01',
    modelData: {
      period: {
        start: '2024-01-01',
        end: '2024-01-31',
      },
    },
  },
];

class FakeLoader implements TranslateLoader {
  getTranslation() {
    return of({});
  }
}

const mockDateAdapter = {
  parse: jest.fn((value: string) => {
    if (!value) return null;
    return new Date('2023-12-01');
  }),
  format: jest.fn((date: Date, format: string) => {
    if (!date) return '';
    return '2023-12-01';
  }),
  localeChanges: of(),
};

describe('PrescriptionModelsTableComponent', () => {
  let component: PrescriptionModelsTableComponent;
  let fixture: ComponentFixture<PrescriptionModelsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PrescriptionModelsTableComponent,
        SkeletonComponent,
        AlertComponent,
        MatTableModule,
        NoopAnimationsModule,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeLoader },
        }),
      ],
      providers: [{ provide: DateAdapter, useValue: mockDateAdapter }],
    }).compileComponents();

    fixture = TestBed.createComponent(PrescriptionModelsTableComponent);
    component = fixture.componentInstance;
  });

  it('should create component with correct default values', () => {
    expect(component).toBeTruthy();
    expect(component.loading).toBe(false);
    expect(component.error).toBe(false);
    expect(component.displayedColumns).toEqual(['creationDate', 'label', 'template', 'actions']);
  });

  it('should show skeleton when loading is true', () => {
    component.loading = true;
    fixture.detectChanges();

    const skeleton = fixture.debugElement.query(By.css('[data-cy="skeleton"]'));
    expect(skeleton).toBeTruthy();

    const skeletonDebugElement = fixture.debugElement.query(By.css('app-skeleton'));
    const skeletonComponent = skeletonDebugElement.componentInstance;
    expect(skeletonComponent).toBeTruthy();
    expect(skeletonComponent.items()).toBe(3);
    expect(skeletonComponent.format()).toBe(FormatEnum.LINE);
  });

  it('should show alert when error is true and emit retry event', () => {
    const retryEmitSpy = jest.spyOn(component.retryOnError, 'emit');
    const mockError = new HttpErrorResponse({ status: 500 });

    component.error = true;
    component.errorMsg = 'Test error';
    component.errorResponse = mockError;
    fixture.detectChanges();

    const alert = fixture.debugElement.query(By.css('[data-cy="alert"]'));
    const alertComponent = fixture.debugElement.query(By.css('app-alert'));

    expect(alert).toBeTruthy();
    expect(alertComponent.componentInstance.alert).toBe('error');
    expect(alertComponent.componentInstance.message).toBe('Test error');
    expect(alertComponent.componentInstance.error).toBe(mockError);

    alertComponent.triggerEventHandler('clickRetry', null);
    expect(retryEmitSpy).toHaveBeenCalledWith();
  });

  it('should show table when not loading and no error', () => {
    component.prescriptionModels = mockPrescriptionModels;
    component.loading = false;
    component.error = false;
    fixture.detectChanges();

    const table = fixture.debugElement.query(By.css('table'));
    const skeleton = fixture.debugElement.query(By.css('[data-cy="skeleton"]'));
    const alert = fixture.debugElement.query(By.css('[data-cy="alert"]'));

    expect(table).toBeTruthy();
    expect(skeleton).toBeFalsy();
    expect(alert).toBeFalsy();
  });

  it('should emit clickPrescription when prescription is selected', () => {
    const clickEmitSpy = jest.spyOn(component.openPrescriptionModel, 'emit');
    const testPrescription = mockPrescriptionModels[0];

    component.openPrescriptionModel.emit(testPrescription);

    expect(clickEmitSpy).toHaveBeenCalledWith(testPrescription);
  });

  it('should handle all input properties correctly', () => {
    const errorResponse = new HttpErrorResponse({ status: 404 });

    component.prescriptionModels = mockPrescriptionModels;
    component.loading = true;
    component.error = true;
    component.errorMsg = 'Error message';
    component.errorResponse = errorResponse;

    expect(component.prescriptionModels).toBe(mockPrescriptionModels);
    expect(component.loading).toBe(true);
    expect(component.error).toBe(true);
    expect(component.errorMsg).toBe('Error message');
    expect(component.errorResponse).toBe(errorResponse);
  });

  it('should display correct table structure with data', () => {
    component.prescriptionModels = mockPrescriptionModels;
    component.loading = false;
    component.error = false;
    fixture.detectChanges();

    const headerCells = fixture.debugElement.queryAll(By.css('th'));
    const rows = fixture.debugElement.queryAll(By.css('tr'));

    expect(headerCells.length).toBe(component.displayedColumns.length);
    //header row + 1 element row + footer row
    const rowsLength = 1 + mockPrescriptionModels.length + 1;
    expect(rows.length).toBe(rowsLength);
  });

  it('should display the alert card', () => {
    component.loading = true;
    component.error = true;
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('[data-cy="skeleton"]'))).toBeFalsy();
    expect(fixture.debugElement.query(By.css('[data-cy="alert"]'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('table'))).toBeFalsy();
  });

  it('display the skeleton card', () => {
    component.loading = true;
    component.error = false;
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('[data-cy="skeleton"]'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('[data-cy="alert"]'))).toBeFalsy();
    expect(fixture.debugElement.query(By.css('table'))).toBeFalsy();
  });
});
