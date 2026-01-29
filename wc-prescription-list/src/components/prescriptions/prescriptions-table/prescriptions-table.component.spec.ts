import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrescriptionsTableComponent } from './prescriptions-table.component';
import { HealthcareProResource, ReadRequestListResource, RequestStatus } from '@reuse/code/openapi';
import { Intent } from '@reuse/code/interfaces';
import { FormatEnum, SkeletonComponent } from '@reuse/code/components/progress-indicators/skeleton/skeleton.component';
import { AlertComponent } from '@myhealth-belgium/myhealth-additional-ui-components';
import { MatTableModule } from '@angular/material/table';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AuthService } from '@reuse/code/services/auth/auth.service';

const requester: HealthcareProResource = {
  healthcarePerson: {
    ssin: '123',
    firstName: 'John',
    lastName: 'Smith',
  },
  healthcareQualification: {
    id: {
      profession: 'prescriber',
    },
  },
  nihii8: '456',
};

const mockPrescriptions: ReadRequestListResource = {
  total: 1,
  items: [
    {
      id: '1',
      authoredOn: '2024-01-01',
      status: RequestStatus.Pending,
      requester: requester,
      period: {
        start: '2024-01-01',
        end: '2024-01-31',
      },
      intent: Intent.ORDER,
    },
  ],
};

const mockAuthService = {
  isProfessional: jest.fn(() => {
    return of(true);
  }),
};

class FakeLoader implements TranslateLoader {
  getTranslation() {
    return of({});
  }
}

describe('PrescriptionsTableComponent', () => {
  let component: PrescriptionsTableComponent;
  let fixture: ComponentFixture<PrescriptionsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PrescriptionsTableComponent,
        SkeletonComponent,
        AlertComponent,
        MatTableModule,
        NoopAnimationsModule,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeLoader },
        }),
      ],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compileComponents();

    fixture = TestBed.createComponent(PrescriptionsTableComponent);
    component = fixture.componentInstance;
  });

  it('should create component with correct default values', () => {
    expect(component).toBeTruthy();
    expect(component.loading).toBe(false);
    expect(component.error).toBe(false);
    expect(component.displayedColumns).toEqual(['creationDate', 'status', 'author', 'typeOfCare', 'start', 'end']);
  });

  it('should return correct items from getter', () => {
    component.prescriptions = undefined;
    expect(component.items).toEqual([]);

    component.prescriptions = mockPrescriptions;
    expect(component.items).toEqual(mockPrescriptions.items);
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
    component.prescriptions = mockPrescriptions;
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

  describe('getStatusColor', () => {
    it('should return color for valid status', () => {
      expect(component.getStatusColor('IN_PROGRESS' as RequestStatus)).toBe('mh-green');
    });
  });

  it('should emit clickPrescription when prescription is selected', () => {
    const clickEmitSpy = jest.spyOn(component.clickPrescription, 'emit');
    const testPrescription = mockPrescriptions.items![0];

    component.clickPrescription.emit(testPrescription);

    expect(clickEmitSpy).toHaveBeenCalledWith(testPrescription);
  });

  it('should handle all input properties correctly', () => {
    const errorResponse = new HttpErrorResponse({ status: 404 });

    component.prescriptions = mockPrescriptions;
    component.loading = true;
    component.error = true;
    component.errorMsg = 'Error message';
    component.errorResponse = errorResponse;

    expect(component.prescriptions).toBe(mockPrescriptions);
    expect(component.loading).toBe(true);
    expect(component.error).toBe(true);
    expect(component.errorMsg).toBe('Error message');
    expect(component.errorResponse).toBe(errorResponse);
  });

  it('should display correct table structure with data', () => {
    component.prescriptions = mockPrescriptions;
    component.loading = false;
    component.error = false;
    fixture.detectChanges();

    const headerCells = fixture.debugElement.queryAll(By.css('th'));
    const rows = fixture.debugElement.queryAll(By.css('tr'));

    expect(headerCells.length).toBe(component.displayedColumns.length);
    //header row + 1 element row + footer row
    const rowsLength = 1 + mockPrescriptions.items!.length + 1;
    expect(rows.length).toBe(rowsLength);
  });

  it('should display the alert card AND the table', () => {
    component.loading = true;
    component.error = true;
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('[data-cy="skeleton"]'))).toBeFalsy();
    expect(fixture.debugElement.query(By.css('[data-cy="alert"]'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('table'))).toBeTruthy();
  });

  it('display the skeleton card AND the table', () => {
    component.loading = true;
    component.error = false;
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('[data-cy="skeleton"]'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('[data-cy="alert"]'))).toBeFalsy();
    expect(fixture.debugElement.query(By.css('table'))).toBeTruthy();
  });
});
