import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { PrescriptionDetailsProfessionalListComponent } from './prescription-details-professional-list.component';
import {
  FhirR4TaskStatus,
  OrganizationTaskResource,
  PerformerTaskResource,
  RequestStatus,
  Role,
} from '@reuse/code/openapi';
import { PrescriptionDetailsSecondaryService } from '../../services/prescription-details-secondary.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { ALERT_TARGET, ERROR_PRESCRIPTION_DETAILS } from '@reuse/code/constants/error';

describe('PrescriptionDetailsCaregiverListComponent', () => {
  let component: PrescriptionDetailsProfessionalListComponent;
  let fixture: ComponentFixture<PrescriptionDetailsProfessionalListComponent>;
  let mockService: {
    getPrescription: jest.Mock;
    getPatient: jest.Mock;
    getCurrentUser: jest.Mock;
    getRequestTask: jest.Mock;
    openRejectAssignationDialog: jest.Mock;
    openInterruptExecutionDialog: jest.Mock;
    openRestartExecutionDialog: jest.Mock;
  };

  const createMockPerformerTask = (overrides = {}) =>
    ({
      taskType: 'PerformerTaskResource',
      status: 'INPROGRESS' as FhirR4TaskStatus,
      careGiver: {
        healthcarePerson: { firstName: 'John', lastName: 'Doe', ssin: '12345' },
        nihii8: '01234567800',
        healthcareQualification: { id: { profession: 'NURSE' } },
      },
      executionPeriod: { start: '2024-01-01', end: '2024-12-31' },
      ...overrides,
    }) as PerformerTaskResource;

  const createMockOrganizationTask = (overrides = {}) =>
    ({
      taskType: 'OrganizationTaskResource',
      status: FhirR4TaskStatus.Ready,
      organizationNihii: '21345678210',
      ...overrides,
    }) as OrganizationTaskResource;

  const setupServiceMock = (
    overrides: Partial<{
      prescription: any;
      patient: any;
      currentUser: any;
      performerTask: any;
    }> = {}
  ) => {
    mockService.getPrescription.mockReturnValue({
      data: overrides.prescription ?? {
        performerTasks: {
          '12345': [createMockPerformerTask()],
        },
      },
    } as any);
    mockService.getPatient.mockReturnValue({
      data: overrides.patient ?? { ssin: '98765' },
    } as any);
    mockService.getCurrentUser.mockReturnValue({
      data: overrides.currentUser ?? { firstName: 'Current', lastName: 'User', ssin: '11111' },
    } as any);
    mockService.getRequestTask.mockReturnValue({
      data: overrides.performerTask ?? null,
    } as any);
  };

  beforeEach(async () => {
    mockService = {
      getPrescription: jest.fn(),
      getPatient: jest.fn(),
      getCurrentUser: jest.fn(),
      getRequestTask: jest.fn(),
      openRejectAssignationDialog: jest.fn(),
      openInterruptExecutionDialog: jest.fn(),
      openRestartExecutionDialog: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [
        PrescriptionDetailsProfessionalListComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
        MatIconTestingModule,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PrescriptionDetailsSecondaryService, useValue: mockService },
        { provide: ALERT_TARGET, useValue: ERROR_PRESCRIPTION_DETAILS },
      ],
    }).compileComponents();
  });

  const createComponent = () => {
    fixture = TestBed.createComponent(PrescriptionDetailsProfessionalListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  describe('component initialization', () => {
    it('should create', () => {
      setupServiceMock();
      createComponent();
      expect(component).toBeTruthy();
    });
  });

  describe('getReadableStatus', () => {
    beforeEach(() => {
      setupServiceMock();
      createComponent();
    });

    it('should return undefined when status is not provided', () => {
      expect(component.getReadableStatus(undefined)).toBeUndefined();
    });

    it('should return display status for valid FHIR status', () => {
      expect(component.getReadableStatus('INPROGRESS' as FhirR4TaskStatus)).toBe('active');
    });
  });

  describe('getStatusColor', () => {
    it('should return color for valid status', () => {
      setupServiceMock();
      createComponent();
      expect(component.getStatusColor('INPROGRESS' as FhirR4TaskStatus)).toBe('mh-green mh-no-overlay');
    });
  });

  describe('performerTaskEntries', () => {
    it('should return performerTasks entries in original order', () => {
      setupServiceMock({
        currentUser: { firstName: 'Current', lastName: 'User', ssin: '33333' },
        prescription: {
          performerTasks: {
            '11111': [
              createMockPerformerTask({
                careGiver: {
                  healthcarePerson: { ssin: '11111', lastName: null },
                },
              }),
            ],
            '22222': [
              createMockPerformerTask({
                careGiver: {
                  healthcarePerson: { ssin: '22222', lastName: null },
                },
              }),
            ],
          },
        },
      });
      createComponent();

      const result = component.performerTaskEntries;

      expect(result.map(([ssin]) => ssin)).toEqual(['11111', '22222']);
    });
  });

  describe('template rendering', () => {
    it('should display caregiver full name when lastName exists', () => {
      setupServiceMock();
      createComponent();
      const nameElement = fixture.debugElement.query(By.css('.professional_info_fullName'));
      expect(nameElement.nativeElement.textContent).toContain('John');
      expect(nameElement.nativeElement.textContent).toContain('Doe');
    });

    it('should display current user name when caregiver ssin matches current user', () => {
      setupServiceMock({
        prescription: {
          performerTasks: {
            '11111': [
              createMockPerformerTask({
                careGiver: {
                  healthcarePerson: { ssin: '11111', lastName: null },
                },
              }),
            ],
          },
        },
      });
      createComponent();
      const nameElement = fixture.debugElement.query(By.css('.professional_info_fullName'));
      expect(nameElement.nativeElement.textContent).toContain('Current');
      expect(nameElement.nativeElement.textContent).toContain('User');
    });

    it('should display not found message when caregiver has no lastName and does not match current user', () => {
      setupServiceMock({
        prescription: {
          performerTasks: {
            '99999': [
              createMockPerformerTask({
                careGiver: {
                  healthcarePerson: { ssin: '99999', lastName: null },
                },
              }),
            ],
          },
        },
      });
      createComponent();
      const translated = fixture.debugElement.query(By.css('.professional_info_fullName'));
      expect(translated.nativeElement.textContent).toContain('common.professional.notFound');
    });

    it('should display nihii when available', () => {
      setupServiceMock();
      createComponent();
      const nihiiElement = fixture.debugElement.query(By.css('.professional_info_nihii'));
      expect(nihiiElement.nativeElement.textContent).toContain('0-12345-67-800');
    });

    it('should display status chip with correct class when status is mappable', () => {
      setupServiceMock();
      createComponent();
      const chip = fixture.debugElement.query(By.css('mat-chip'));
      expect(chip).toBeTruthy();
      expect(chip.nativeElement.classList).toContain('mh-green');
    });

    it('should display only the active status chip when multiple statuses are provided', () => {
      const tasks = [
        createMockPerformerTask({ id: '1' }),
        createMockPerformerTask({ id: '2', status: FhirR4TaskStatus.Completed }),
        createMockPerformerTask({ id: '3', status: FhirR4TaskStatus.Completed }),
      ];

      setupServiceMock({
        prescription: {
          performerTasks: {
            '12345': tasks,
          },
        },
      });
      createComponent();
      const chips = fixture.debugElement.queryAll(By.css('mat-chip'));
      expect(chips).toHaveLength(1);
      expect(chips[0].nativeElement.classList).toContain('mh-green');
    });

    it('should display execution period dates when provided', () => {
      setupServiceMock();
      createComponent();
      const container = fixture.debugElement.query(By.css('.professional_info'));
      expect(container.nativeElement.textContent).toContain('01/01/2024');
      expect(container.nativeElement.textContent).toContain('31/12/2024');
    });

    it('should display multiple execution periods when provided', () => {
      const tasks = [
        createMockPerformerTask({ id: '1', executionPeriod: { start: '2024-05-01' } }),
        createMockPerformerTask({ id: '2', executionPeriod: { start: '2024-03-01', end: '2024-04-01' } }),
        createMockPerformerTask({ id: '3', executionPeriod: { start: '2024-01-01', end: '2024-02-01' } }),
      ];

      setupServiceMock({
        prescription: {
          performerTasks: {
            '12345': tasks,
          },
        },
      });
      createComponent();
      const periods = fixture.debugElement.queryAll(By.css('.performer_task_periods'));
      expect(periods).toHaveLength(3);
      expect(periods[0].nativeElement.textContent).toContain('01/05/2024 - ');
      expect(periods[1].nativeElement.textContent).toContain('01/03/2024 - 01/04/2024');
      expect(periods[2].nativeElement.textContent).toContain('01/01/2024 - 01/02/2024');
    });

    describe('Reject assignation button', () => {
      it('should display button when connected user is patient and there is an organization task', () => {
        const task = createMockOrganizationTask();

        setupServiceMock({
          prescription: {
            status: RequestStatus.Open,
            currentTask: { allowedActions: { canRejectAssignation: true } },
            performerTasks: {
              '12345': [task],
            },
          },
          currentUser: {
            firstName: 'Current',
            lastName: 'User',
            ssin: '11111',
            role: Role.Patient,
          },
          patient: {
            ssin: '11111',
          },
        });

        createComponent();

        expect(component.currentUserServiceData).toBeDefined();
        expect(component.prescriptionServiceData).toBeDefined();

        expect(component.patientServiceData()?.ssin).toBeDefined();
        expect(component.currentUserServiceData?.role).toEqual('patient');

        const rejectBtn = fixture.debugElement.query(By.css('[data-cy="prescription-reject-assignation-button"]'));
        expect(rejectBtn).toBeTruthy();
      });

      // The button will be displayed in task-button-group component
      it('should not display button when connected organization is the organization of the task', () => {
        const task = createMockOrganizationTask();

        setupServiceMock({
          prescription: {
            status: RequestStatus.Open,
            performerTasks: {
              '12345': [task],
            },
          },
          currentUser: {
            firstName: 'Current',
            lastName: 'User',
            ssin: '11111',
            organizations: [
              {
                otdPharmacy: {
                  nihii: '21345678210',
                  name: 'Test Hospital',
                },
              },
            ],
          },
        });

        createComponent();

        expect(component.patientServiceData()?.ssin).toBeDefined();

        const rejectBtn = fixture.debugElement.query(By.css('[data-cy="prescription-reject-assignation-button"]'));
        expect(rejectBtn).not.toBeTruthy();
      });
    });
  });
});
