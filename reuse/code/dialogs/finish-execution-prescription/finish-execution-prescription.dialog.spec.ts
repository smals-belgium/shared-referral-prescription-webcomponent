import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Component, EventEmitter, Input, Output, Pipe, PipeTransform, signal } from '@angular/core';
import * as uuid from 'uuid';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { DateTime } from 'luxon';
import { provideLuxonDateAdapter } from '@angular/material-luxon-adapter';

import {
  ExecutionType,
  FinishExecutionPrescriptionDialog,
  FinishExecutionScenario,
} from './finish-execution-prescription.dialog';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { AlertService } from '@reuse/code/services/helpers/alert.service';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { PatientState } from '@reuse/code/states/api/patient.state';
import { FhirR4TaskStatus, PerformerTaskResource, ReadRequestResource } from '@reuse/code/openapi';
import { TemplateNamePipe } from '@reuse/code/pipes/template-name.pipe';
import * as prescriptionUtils from '@reuse/code/utils/prescription.util';
import { TemplatesState } from '@reuse/code/states/api/templates.state';
import { AlertComponent } from '@reuse/code/components/alert-component/alert.component';
import { OverlaySpinnerComponent } from '@reuse/code/components/progress-indicators/overlay-spinner/overlay-spinner.component';
import { DatePipe } from '@reuse/code/pipes/date.pipe';

@Pipe({ name: 'appDate', standalone: true })
class MockDatePipe implements PipeTransform {
  transform(v: any) {
    return v;
  }
}

@Pipe({ name: 'templateName', standalone: true })
class MockTemplateNamePipe implements PipeTransform {
  transform(v: any) {
    return 'MockTemplateName';
  }
}

@Component({ selector: 'app-overlay-spinner', template: '', standalone: true })
class MockOverlaySpinnerComponent {}

@Component({ selector: 'app-alert', template: '', standalone: true })
class MockAlertComponent {
  @Input() severity: any;
  @Input() title: any;
  @Input() subTitle: any;
  @Input() message: any;
  @Input() dismissible: any;
  @Input() retry: any;
  @Input() errorId: any;
  @Output() clickClose = new EventEmitter<void>();
}

describe('FinishExecutionPrescriptionDialog', () => {
  let component: FinishExecutionPrescriptionDialog;
  let fixture: ComponentFixture<FinishExecutionPrescriptionDialog>;
  let uuidSpy: jest.SpyInstance;

  const mockToastService = { show: jest.fn() };
  const mockPrescriptionState = {
    finishTaskExecution: jest.fn(),
    completePrescriptionExecution: jest.fn(),
    closePrescription: jest.fn(),
    loadPrescription: jest.fn(),
  };
  const mockDialogRef = { close: jest.fn() };

  const mockAlertService = {
    setTarget: jest.fn().mockReturnValue(signal(null)),
    setActive: jest.fn(),
    showGeneralError: jest.fn(),
    clear: jest.fn(),
    resetActive: jest.fn(),
    remove: jest.fn(),
  };

  const mockPatientState = {
    state: jest.fn().mockReturnValue({
      data: { firstName: 'Jane', lastName: 'Doe', ssin: '123456789' },
    }),
  };

  const mockTemplatesState = {
    state: signal({
      data: [{ code: 'TPL-001', labelTranslations: { fr: 'Template fr', nl: 'Template nl' } }],
    }),
  };

  let mockDialogData: any;

  beforeEach(async () => {
    mockDialogData = {
      prescription: { id: 'prescriptionId', templateCode: 'TPL-001' } as ReadRequestResource,
      performerTask: { id: 'performerTaskId', status: FhirR4TaskStatus.Inprogress } as PerformerTaskResource,
      connectedUser: { ssin: 'user-ssin-123' },
      startExecutionDate: DateTime.now(),
    };

    jest.spyOn(uuid, 'v4').mockReturnValue('mock-uuid-12345' as unknown as Uint8Array);
    jest.spyOn(prescriptionUtils, 'getAllPerformerTasksAsMap').mockReturnValue(new Map());

    await TestBed.configureTestingModule({
      imports: [
        FinishExecutionPrescriptionDialog,
        NoopAnimationsModule,
        ReactiveFormsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: ToastService, useValue: mockToastService },
        { provide: PrescriptionState, useValue: mockPrescriptionState },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: AlertService, useValue: mockAlertService },
        { provide: PatientState, useValue: mockPatientState },
        { provide: TemplatesState, useValue: mockTemplatesState },
        provideLuxonDateAdapter(),
      ],
    })
      .overrideComponent(FinishExecutionPrescriptionDialog, {
        remove: {
          imports: [TemplateNamePipe, AlertComponent, OverlaySpinnerComponent, DatePipe],
          providers: [TemplateNamePipe],
        },
        add: {
          imports: [MockDatePipe, MockOverlaySpinnerComponent, MockAlertComponent, MockTemplateNamePipe],
          providers: [{ provide: TemplateNamePipe, useClass: MockTemplateNamePipe }],
        },
      })
      .compileComponents();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const setupComponent = () => {
    fixture = TestBed.createComponent(FinishExecutionPrescriptionDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  describe('Initialization & Scenarios', () => {
    it('should setup FINISH_TASKS scenario when multiple caregivers are active', () => {
      const mockMap = new Map<string, PerformerTaskResource[]>([
        ['task1', [{ status: FhirR4TaskStatus.Inprogress, careGiverSsin: 'other-user' } as PerformerTaskResource]],
        ['task2', [{ status: FhirR4TaskStatus.Inprogress, careGiverSsin: 'user-ssin-123' } as PerformerTaskResource]],
      ]);
      jest.spyOn(prescriptionUtils, 'getAllPerformerTasksAsMap').mockReturnValue(mockMap);

      setupComponent();

      expect(component.finishExecutionContext()).toBe(FinishExecutionScenario.FINISH_TASKS);
      expect(component.title()).toBe('prescription.finishExecution.dialog.title.finishTasks');
      expect(component.formGroup.contains('endDate')).toBe(true);
      expect(component.formGroup.contains('executionType')).toBe(false);
    });

    it('should setup CLOSE_PRESCRIPTION_OR_FINISH_TASKS scenario when current user is the only active caregiver', () => {
      const mockMap = new Map<string, PerformerTaskResource[]>([
        ['task1', [{ status: FhirR4TaskStatus.Inprogress, careGiverSsin: 'user-ssin-123' } as PerformerTaskResource]],
        ['task2', [{ status: FhirR4TaskStatus.Completed, careGiverSsin: 'user-ssin-456' } as PerformerTaskResource]],
      ]);
      jest.spyOn(prescriptionUtils, 'getAllPerformerTasksAsMap').mockReturnValue(mockMap);

      setupComponent();

      expect(component.finishExecutionContext()).toBe(FinishExecutionScenario.CLOSE_PRESCRIPTION_OR_FINISH_TASKS);
      expect(component.title()).toBe('prescription.finishExecution.dialog.title.close');
      expect(component.formGroup.contains('endDate')).toBe(true);
      expect(component.formGroup.contains('executionType')).toBe(true);
      expect(component.formGroup.get('executionType')?.value).toBe(ExecutionType.FINISH);
    });

    it('should setup CLOSE_PRESCRIPTION scenario when no active caregivers and current caregiver handled execution', () => {
      mockDialogData.performerTask.status = FhirR4TaskStatus.Completed;
      jest.spyOn(prescriptionUtils, 'getAllPerformerTasksAsMap').mockReturnValue(new Map());

      setupComponent();

      expect(component.finishExecutionContext()).toBe(FinishExecutionScenario.CLOSE_PRESCRIPTION);
      expect(component.title()).toBe('prescription.finishExecution.dialog.title.closePrescription');
      expect(Object.keys(component.formGroup.controls).length).toBe(0);
    });
  });

  describe('Execution Actions', () => {
    const endDate = DateTime.now();
    const formattedDate = endDate.toFormat('yyyy-MM-dd');

    it('should show general error if prescription or task ID is missing', () => {
      mockDialogData.prescription.id = undefined;
      setupComponent();

      component.finishExecution();
      expect(mockAlertService.showGeneralError).toHaveBeenCalledWith('finish-execution-dialog');
    });

    it('should successfully execute FINISH_TASKS', () => {
      const mockMap = new Map([['task-1', [{ status: FhirR4TaskStatus.Inprogress, careGiverSsin: 'other' } as any]]]);
      jest.spyOn(prescriptionUtils, 'getAllPerformerTasksAsMap').mockReturnValue(mockMap);
      setupComponent();

      component.formGroup.patchValue({ endDate });
      mockPrescriptionState.finishTaskExecution.mockReturnValue(of(void 0));

      component.finishExecution();

      expect(mockPrescriptionState.finishTaskExecution).toHaveBeenCalledWith(
        'prescriptionId',
        'performerTaskId',
        { endDate: formattedDate },
        'mock-uuid-12345'
      );
      expect(mockToastService.show).toHaveBeenCalledWith('prescription.finishExecution.dialog.success.finishTasks', {
        interpolation: { templateName: 'MockTemplateName' },
      });
      expect(mockDialogRef.close).toHaveBeenCalledWith({ reload: false });
    });

    it('should successfully execute CLOSE_PRESCRIPTION_OR_FINISH_TASKS as FINISH', () => {
      const mockMap = new Map([
        ['task-1', [{ status: FhirR4TaskStatus.Inprogress, careGiverSsin: 'user-ssin-123' } as any]],
      ]);
      jest.spyOn(prescriptionUtils, 'getAllPerformerTasksAsMap').mockReturnValue(mockMap);
      setupComponent();

      component.formGroup.patchValue({ endDate, executionType: ExecutionType.FINISH });
      mockPrescriptionState.finishTaskExecution.mockReturnValue(of(void 0));

      component.finishExecution();

      expect(mockPrescriptionState.finishTaskExecution).toHaveBeenCalled();
    });

    it('should successfully execute CLOSE_PRESCRIPTION_OR_FINISH_TASKS as COMPLETE', () => {
      const mockMap = new Map([
        ['task-1', [{ status: FhirR4TaskStatus.Inprogress, careGiverSsin: 'user-ssin-123' } as any]],
      ]);
      jest.spyOn(prescriptionUtils, 'getAllPerformerTasksAsMap').mockReturnValue(mockMap);
      setupComponent();

      component.formGroup.patchValue({ endDate, executionType: ExecutionType.COMPLETE });
      mockPrescriptionState.completePrescriptionExecution.mockReturnValue(of(void 0));

      component.finishExecution();

      expect(mockPrescriptionState.completePrescriptionExecution).toHaveBeenCalledWith(
        'prescriptionId',
        { endDate: formattedDate, performerTaskId: 'performerTaskId' },
        'mock-uuid-12345'
      );
      expect(mockToastService.show).toHaveBeenCalledWith(
        'prescription.finishExecution.dialog.success.closePrescription',
        expect.any(Object)
      );
    });

    it('should successfully execute CLOSE_PRESCRIPTION', () => {
      mockDialogData.performerTask.status = FhirR4TaskStatus.Completed;
      jest.spyOn(prescriptionUtils, 'getAllPerformerTasksAsMap').mockReturnValue(new Map());
      setupComponent();

      mockPrescriptionState.closePrescription.mockReturnValue(of(void 0));

      component.finishExecution();

      expect(mockPrescriptionState.closePrescription).toHaveBeenCalledWith('prescriptionId', 'mock-uuid-12345');
      expect(mockToastService.show).toHaveBeenCalledWith(
        'prescription.finishExecution.dialog.success.closePrescription',
        expect.any(Object)
      );
    });

    it('should update closeDialogData when error is returned in ExecutionType.COMPLETE context', () => {
      const mockMap = new Map([
        ['task-1', [{ status: FhirR4TaskStatus.Inprogress, careGiverSsin: 'user-ssin-123' } as PerformerTaskResource]],
      ]);

      jest.spyOn(prescriptionUtils, 'getAllPerformerTasksAsMap').mockReturnValue(mockMap);

      setupComponent();

      component.formGroup.patchValue({
        endDate: DateTime.now(),
        executionType: ExecutionType.COMPLETE,
      });

      mockPrescriptionState.completePrescriptionExecution.mockReturnValue(throwError(() => new Error('API Error')));

      component.finishExecution();

      expect(component.closeDialogData).toEqual({ reload: true });
    });
  });

  describe('Lifecycle Hooks & Utils', () => {
    it('should clear alert service on destroy', () => {
      setupComponent();
      component.ngOnDestroy();
      expect(mockAlertService.resetActive).toHaveBeenCalled();
      expect(mockAlertService.remove).toHaveBeenCalledWith('finish-execution-dialog');
    });

    it('should dismiss error', () => {
      setupComponent();
      component['dismissError']();
      expect(mockAlertService.clear).toHaveBeenCalledWith('finish-execution-dialog');
    });
  });
});
