import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrescriptionDetailsSecondaryService } from '../../../prescription-details-secondary/services/prescription-details-secondary.service';
import {
  FakeLoader,
  mockOrganisationTask,
  mockPerformerTask,
  mockPro,
  prescriptionDetailsSecondaryMockService,
  prescriptionResponse,
} from '../../../../../test.utils';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AccessMatrixState } from '@reuse/code/states/api/access-matrix.state';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { FhirR4TaskStatus, Role } from '@reuse/code/openapi';
import { TaskButtonGroupComponent } from './task-button-group.component';
import { ALERT_TARGET, ERROR_PRESCRIPTION_DETAILS } from '@reuse/code/constants/error';

describe('PrescriptionButtonGroupComponent', () => {
  let component: TaskButtonGroupComponent;
  let fixture: ComponentFixture<TaskButtonGroupComponent>;
  let mockAccessMatrixState: jest.Mocked<AccessMatrixState>;

  beforeEach(async () => {
    mockAccessMatrixState = {
      hasAtLeastOnePermission: jest.fn().mockReturnValue(true),
    } as unknown as jest.Mocked<AccessMatrixState>;

    await TestBed.configureTestingModule({
      imports: [
        TaskButtonGroupComponent,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeLoader },
        }),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PrescriptionDetailsSecondaryService, useValue: prescriptionDetailsSecondaryMockService },
        { provide: AccessMatrixState, useValue: mockAccessMatrixState },
        { provide: ALERT_TARGET, useValue: ERROR_PRESCRIPTION_DETAILS },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    fixture = TestBed.createComponent(TaskButtonGroupComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should not display a button when there is no current user, nor prescription data', () => {
    fixture = TestBed.createComponent(TaskButtonGroupComponent);
    component = fixture.componentInstance;

    prescriptionDetailsSecondaryMockService.getRequestTask.mockReturnValue({ data: mockPerformerTask });

    fixture.detectChanges();
    const { debugElement } = fixture;
    const buttons = debugElement.queryAll(By.css('button'));
    expect(buttons.length).toBe(0);
  });

  it('should display the start excecution button when there is a current user, prescription data and the performertask is ready', () => {
    prescriptionDetailsSecondaryMockService.getCurrentUser.mockReturnValue({ data: mockPro });
    prescriptionDetailsSecondaryMockService.getPatient.mockReturnValue({ data: mockPro });

    prescriptionDetailsSecondaryMockService.getPrescription.mockReturnValue({ data: prescriptionResponse() });
    prescriptionDetailsSecondaryMockService.getRequestTask.mockReturnValue({ data: mockPerformerTask });

    const fixture = TestBed.createComponent(TaskButtonGroupComponent);
    fixture.detectChanges();

    const { debugElement } = fixture;
    const buttons = debugElement.queryAll(By.css('button'));
    expect(buttons.length).toBe(1);
    expect(buttons[0].nativeElement.textContent).toContain('prescription.startExecution.action');
  });

  it('should display the finish excecution button when there is a current user, prescription data and the performertask is in progress, but current user ssin is NOT the same as task caregiver ssin', () => {
    prescriptionDetailsSecondaryMockService.getCurrentUser.mockReturnValue({ data: mockPro });
    prescriptionDetailsSecondaryMockService.getPatient.mockReturnValue({ data: mockPro });

    mockPerformerTask.status = FhirR4TaskStatus.Inprogress;

    prescriptionDetailsSecondaryMockService.getPrescription.mockReturnValue({
      data: prescriptionResponse(null, [mockPerformerTask]),
    });
    prescriptionDetailsSecondaryMockService.getRequestTask.mockReturnValue({ data: mockPerformerTask });

    const fixture = TestBed.createComponent(TaskButtonGroupComponent);
    fixture.detectChanges();

    const { debugElement } = fixture;
    const buttons = debugElement.queryAll(By.css('button'));
    expect(buttons.length).toBe(1);
    expect(buttons[0].nativeElement.textContent).toContain('prescription.finishExecution.action');
  });

  it('should display the finish execution, cancel execution, transfer button and interrupt button when the current user is a professional and current user ssin is the same as task caregiver ssin and the performertask is in progress', () => {
    prescriptionDetailsSecondaryMockService.getCurrentUser.mockReturnValue({ data: mockPro });
    prescriptionDetailsSecondaryMockService.getPatient.mockReturnValue({ data: mockPro });

    mockPerformerTask.status = FhirR4TaskStatus.Inprogress;
    mockPerformerTask.careGiverSsin = mockPro.ssin;

    prescriptionDetailsSecondaryMockService.getPrescription.mockReturnValue({
      data: prescriptionResponse(null, [mockPerformerTask]),
    });
    prescriptionDetailsSecondaryMockService.getRequestTask.mockReturnValue({ data: mockPerformerTask });

    const fixture = TestBed.createComponent(TaskButtonGroupComponent);
    fixture.detectChanges();

    const { debugElement } = fixture;
    const buttons = debugElement.queryAll(By.css('button'));
    expect(buttons.length).toBe(4);
    expect(buttons[0].nativeElement.textContent).toContain('prescription.finishExecution.action');
    expect(buttons[1].nativeElement.textContent).toContain('prescription.cancelExecution.action');
    expect(buttons[2].nativeElement.textContent).toContain('prescription.transfer');
    expect(buttons[3].nativeElement.textContent).toContain('prescription.ariaLabel.interrupt');
  });

  describe('canRejectAssignation', () => {
    it('should display reject assignation button when user is an organization with own task', () => {
      const userOrg = {
        role: Role.Organization,
        ssin: '10022500123',
        organizations: [{ otdpharmacy: { nihii: '10000000009' } }],
      };
      prescriptionDetailsSecondaryMockService.getCurrentUser.mockReturnValue({ data: userOrg });
      prescriptionDetailsSecondaryMockService.getPatient.mockReturnValue({ data: userOrg });

      prescriptionDetailsSecondaryMockService.getPrescription.mockReturnValue({
        data: prescriptionResponse(null, [mockOrganisationTask]),
      });

      prescriptionDetailsSecondaryMockService.getRequestTask.mockReturnValue({ data: mockOrganisationTask });

      const fixture = TestBed.createComponent(TaskButtonGroupComponent);
      fixture.detectChanges();
      const { debugElement } = fixture;

      const button = debugElement.query(By.css('[data-cy="prescription-reject-assignation-button"]'));
      expect(button).toBeTruthy();
    });
  });
});
