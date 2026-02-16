import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import * as uuid from 'uuid';
import { TranslateModule } from '@ngx-translate/core';
import { StartExecutionPrescriptionDialog } from './start-execution-prescription.dialog';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { PerformerTaskResource, ReadRequestResource } from '@reuse/code/openapi';
import { HttpErrorResponse } from '@angular/common/http';
import { DateTime } from 'luxon';
import { provideLuxonDateAdapter } from '@angular/material-luxon-adapter';
import { SSIN_CLAIM_KEY, USER_PROFILE_CLAIM_KEY } from '@reuse/code/services/auth/auth-constants';

describe('StartExecutionPrescriptionDialog', () => {
  let component: StartExecutionPrescriptionDialog;
  let fixture: ComponentFixture<StartExecutionPrescriptionDialog>;
  let mockToastService: jest.Mocked<any>;
  let mockPrescriptionState: jest.Mocked<any>;
  let mockAuthService: jest.Mocked<any>;
  let mockDialogRef: jest.Mocked<any>;

  const createMockDialogData = (overrides = {}) => ({
    prescription: {
      id: 'prescription-123',
      authoredOn: '2024-01-15',
      period: { start: '2024-01-10' },
      referralTask: { id: 'referral-task-456' },
    } as ReadRequestResource,
    performerTask: { id: 'performer-task-789' } as PerformerTaskResource,
    startTreatmentDate: '2024-01-20',
    ...overrides,
  });

  beforeEach(async () => {
    mockToastService = { show: jest.fn() };
    mockPrescriptionState = {
      startPrescriptionExecution: jest.fn(),
      assignAndStartPrescriptionExecution: jest.fn(),
    };
    mockAuthService = {
      discipline: jest.fn(),
      getClaims: jest.fn(),
    };
    mockDialogRef = { close: jest.fn() };

    jest.spyOn(uuid, 'v4').mockReturnValue('uuid-123' as any);

    await TestBed.configureTestingModule({
      imports: [
        StartExecutionPrescriptionDialog,
        NoopAnimationsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        provideLuxonDateAdapter(),
        { provide: ToastService, useValue: mockToastService },
        { provide: PrescriptionState, useValue: mockPrescriptionState },
        { provide: AuthService, useValue: mockAuthService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: createMockDialogData() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StartExecutionPrescriptionDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Initialization', () => {
    it('should initialize prescription and performerTask from dialog data', () => {
      expect(component.prescription).toBeDefined();
      expect(component.prescription.id).toBe('prescription-123');
      expect(component.performerTask.id).toBe('performer-task-789');
    });

    it('should generate UUID on initialization', () => {
      component.ngOnInit();
      expect(component.generatedUUID).toBe('uuid-123');
    });
  });

  describe('computeMinDate', () => {
    beforeEach(()=> {
      component.minDate = '';
    })

    it('should set minDate to validityStartDate when it is before authoredOn', () => {
      const data = {
        prescription: {
          authoredOn: '2024-01-15',
          period: { start: '2024-01-10' },
        },
      } as any;

      (component as any).computeMinDate(data);
      expect(component.minDate).toBe('2024-01-10');
    });

    it('should set minDate to authoredOn when it is before validityStartDate', () => {
      const data = {
        prescription: {
          authoredOn: '2024-01-05',
          period: { start: '2024-01-10' },
        },
      } as any;

      (component as any).computeMinDate(data);
      expect(component.minDate).toBe('2024-01-05');
    });

    it('should set minDate to authoredOn when dates are equal', () => {
      const data = {
        prescription: {
          authoredOn: '2024-01-10',
          period: { start: '2024-01-10' },
        },
      } as any;

      (component as any).computeMinDate(data);
      expect(component.minDate).toBe('2024-01-10');
    });

    it('should not set minDate when validityStartDate is missing', () => {
      const data = {
        prescription: {
          authoredOn: '2024-01-15',
          period: {},
        },
      } as any;

      (component as any).computeMinDate(data);
      expect(component.minDate).toBe('');
    });

  });

  describe('startExecution', () => {
    describe('form validation', () => {
      it('should mark all fields as touched', () => {
        const spy = jest.spyOn(component.formGroup, 'markAllAsTouched');

        mockPrescriptionState.startPrescriptionExecution.mockReturnValue(of(''))
        component.startExecution();

        expect(spy).toHaveBeenCalled();
      });

      it('should not proceed when form is invalid', () => {
        component.formGroup.get('startDate')?.setErrors({ required: true });

        component.startExecution();

        expect(mockPrescriptionState.startPrescriptionExecution).not.toHaveBeenCalled();
        expect(mockPrescriptionState.assignAndStartPrescriptionExecution).not.toHaveBeenCalled();
      });

      it('should proceed when form is valid', () => {
        mockPrescriptionState.startPrescriptionExecution.mockReturnValue(of(""));
        component.formGroup.patchValue({
          startDate: DateTime.fromISO('2024-01-20'),
        });

        component.startExecution();

        expect(mockPrescriptionState.startPrescriptionExecution).toHaveBeenCalled();
      });
    });

    describe('routing logic', () => {
      it('should call startExecutionForTask when performerTask exists', () => {
        mockPrescriptionState.startPrescriptionExecution.mockReturnValue(of(void 0));
        component.formGroup.patchValue({
          startDate: DateTime.fromISO('2024-01-20'),
        });

        component.startExecution();

        expect(mockPrescriptionState.startPrescriptionExecution).toHaveBeenCalled();
        expect(mockPrescriptionState.assignAndStartPrescriptionExecution).not.toHaveBeenCalled();
      });

      it('should call assignAndStartExecution when performerTask is null', () => {
        (component as any).performerTask = null ;
        mockAuthService.discipline.mockReturnValue(of('NURSING'));
        mockAuthService.getClaims.mockReturnValue(
          of({
            [USER_PROFILE_CLAIM_KEY]: {
              [SSIN_CLAIM_KEY]: '12345678901'
            }
          })
        );

        mockPrescriptionState.assignAndStartPrescriptionExecution.mockReturnValue(of(void 0));
        component.formGroup.patchValue({
          startDate: DateTime.fromISO('2024-01-20'),
        });

        component.startExecution();

        expect(mockPrescriptionState.assignAndStartPrescriptionExecution).toHaveBeenCalled();
        expect(mockPrescriptionState.startPrescriptionExecution).not.toHaveBeenCalled();
      });
    });

  });

  describe('startExecutionForTask', () => {
    beforeEach(() => {
      component.formGroup.patchValue({
        startDate: DateTime.fromISO('2024-01-20'),
      });
    });


    it('should show error when prescription id is missing', () => {
      component.prescription.id = undefined;
      const spy = jest.spyOn(component as any, 'showErrorCard');

      component.startExecution();

      expect(spy).toHaveBeenCalledWith('common.somethingWentWrong');
      expect(mockPrescriptionState.startPrescriptionExecution).not.toHaveBeenCalled();
    });

    it('should show error when task id is missing', () => {
      component.performerTask.id = undefined;
      const spy = jest.spyOn(component as any, 'showErrorCard');

      component.startExecution();

      expect(spy).toHaveBeenCalledWith('common.somethingWentWrong');
      expect(mockPrescriptionState.startPrescriptionExecution).not.toHaveBeenCalled();
    });

    it('should format startDate correctly, start execution, display success toast call, close error card and close dialog when successful execution',() => {

      const closeErrorSpy = jest.spyOn(component as any, 'closeErrorCard');

      component.formGroup.patchValue({
        startDate: DateTime.fromISO('2024-03-15'),
      });

      mockPrescriptionState.startPrescriptionExecution.mockReturnValue(of(void 0));

      component.startExecution();

      expect(mockPrescriptionState.startPrescriptionExecution).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        { startDate: '2024-03-15' },
        expect.any(String)
      );

      expect(mockToastService.show).toHaveBeenCalledWith('prescription.startExecution.success');
      expect(closeErrorSpy).toHaveBeenCalled();
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });

    it('should handle API error', () => {
      const error = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });
      const spy = jest.spyOn(component as any, 'showErrorCard');
      mockPrescriptionState.startPrescriptionExecution.mockReturnValue(
        throwError(() => error)
      );

      component.startExecution();

      expect(spy).toHaveBeenCalledWith('common.somethingWentWrong', error);
    });

  });

  describe('getCurrentUserSsin', () => {
    it('should extract SSIN from claims', (done) => {
      mockAuthService.getClaims.mockReturnValue(
        of({
          [USER_PROFILE_CLAIM_KEY]: {
            [SSIN_CLAIM_KEY]: '12345678901'
          }
        })
      );

      (component as any).getCurrentUserSsin().subscribe((ssin: string) => {
        expect(ssin).toBe('12345678901');
        done();
      });
    });

    it('should return empty string when claims are null', (done) => {
      mockAuthService.getClaims.mockReturnValue(of(null));

      (component as any).getCurrentUserSsin().subscribe((ssin: string) => {
        expect(ssin).toBe('');
        done();
      });
    });
  });
});
