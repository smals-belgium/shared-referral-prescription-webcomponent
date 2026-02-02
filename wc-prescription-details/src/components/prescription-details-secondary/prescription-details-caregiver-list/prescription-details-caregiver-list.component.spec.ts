import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { PrescriptionDetailsCaregiverListComponent } from './prescription-details-caregiver-list.component';
import { FhirR4TaskStatus } from '@reuse/code/openapi';
import { PrescriptionDetailsSecondaryService } from '../prescription-details-secondary.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('PrescriptionDetailsCaregiverListComponent', () => {
  let component: PrescriptionDetailsCaregiverListComponent;
  let fixture: ComponentFixture<PrescriptionDetailsCaregiverListComponent>;
  let mockService: {
    getPrescription: jest.Mock;
    getPatient: jest.Mock;
    getCurrentUser: jest.Mock;
    getPerformerTask: jest.Mock;
    openRejectAssignationDialog: jest.Mock;
    openInterruptExecutionDialog: jest.Mock;
    openRestartExecutionDialog: jest.Mock;
  };

  const createMockPerformerTask = (overrides = {}) => ({
    status: 'INPROGRESS' as FhirR4TaskStatus,
    careGiver: {
      healthcarePerson: { firstName: 'John', lastName: 'Doe', ssin: '12345' },
      nihii8: '01234567800',
      healthcareQualification: { id: { profession: 'NURSE' } },
    },
    executionPeriod: { start: '2024-01-01', end: '2024-12-31' },
    ...overrides,
  });

  const setupServiceMock = (
    overrides: Partial<{
      prescription: any;
      patient: any;
      currentUser: any;
      performerTask: any;
    }> = {}
  ) => {
    mockService.getPrescription.mockReturnValue({
      data: overrides.prescription ?? { performerTasks: [createMockPerformerTask()] },
    } as any);
    mockService.getPatient.mockReturnValue({
      data: overrides.patient ?? { ssin: '98765' },
    } as any);
    mockService.getCurrentUser.mockReturnValue({
      data: overrides.currentUser ?? { firstName: 'Current', lastName: 'User', ssin: '11111' },
    } as any);
    mockService.getPerformerTask.mockReturnValue({
      data: overrides.performerTask ?? null,
    } as any);
  };

  beforeEach(async () => {
    mockService = {
      getPrescription: jest.fn(),
      getPatient: jest.fn(),
      getCurrentUser: jest.fn(),
      getPerformerTask: jest.fn(),
      openRejectAssignationDialog: jest.fn(),
      openInterruptExecutionDialog: jest.fn(),
      openRestartExecutionDialog: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PrescriptionDetailsCaregiverListComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PrescriptionDetailsSecondaryService, useValue: mockService },
      ],
    }).compileComponents();
  });

  const createComponent = () => {
    fixture = TestBed.createComponent(PrescriptionDetailsCaregiverListComponent);
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
      expect(component.getStatusColor('INPROGRESS' as FhirR4TaskStatus)).toBe('mh-green');
    });
  });

  describe('template rendering', () => {
    it('should display caregiver full name when lastName exists', () => {
      setupServiceMock();
      createComponent();
      const nameElement = fixture.debugElement.query(By.css('.caregiver_info_fullName'));
      expect(nameElement.nativeElement.textContent).toContain('John');
      expect(nameElement.nativeElement.textContent).toContain('Doe');
    });

    it('should display current user name when caregiver ssin matches current user', () => {
      setupServiceMock({
        prescription: {
          performerTasks: [
            createMockPerformerTask({
              careGiver: {
                healthcarePerson: { ssin: '11111', lastName: null },
              },
            }),
          ],
        },
      });
      createComponent();
      const nameElement = fixture.debugElement.query(By.css('.caregiver_info_fullName'));
      expect(nameElement.nativeElement.textContent).toContain('Current');
      expect(nameElement.nativeElement.textContent).toContain('User');
    });

    it('should display not found message when caregiver has no lastName and does not match current user', () => {
      setupServiceMock({
        prescription: {
          performerTasks: [
            createMockPerformerTask({
              careGiver: {
                healthcarePerson: { ssin: '99999', lastName: null },
              },
            }),
          ],
        },
      });
      createComponent();
      const translated = fixture.debugElement.query(By.css('b'));
      expect(translated).toBeTruthy();
    });

    it('should display nihii when available', () => {
      setupServiceMock();
      createComponent();
      const nihiiElement = fixture.debugElement.query(By.css('.caregiver_info_nihii'));
      expect(nihiiElement.nativeElement.textContent).toContain('0-12345-67-800');
    });

    it('should display status chip with correct class when status is mappable', () => {
      setupServiceMock();
      createComponent();
      const chip = fixture.debugElement.query(By.css('mat-chip'));
      expect(chip).toBeTruthy();
      expect(chip.nativeElement.classList).toContain('mh-green');
    });

    it('should display execution period dates when provided', () => {
      setupServiceMock();
      createComponent();
      const container = fixture.debugElement.query(By.css('.caregiver_info'));
      expect(container.nativeElement.textContent).toContain('01/01/2024');
      expect(container.nativeElement.textContent).toContain('31/12/2024');
    });
  });
});
