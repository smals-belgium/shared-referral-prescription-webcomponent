import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Component, Pipe, PipeTransform, signal } from '@angular/core';
import * as uuid from 'uuid';
import { TranslateModule } from '@ngx-translate/core';
import { RestartExecutionPrescriptionDialog } from './restart-execution-prescription.dialog';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { PerformerTaskResource, PersonResource, ReadRequestResource } from '@reuse/code/openapi';
import { HttpErrorResponse } from '@angular/common/http';
import { TemplateNamePipe } from '@reuse/code/pipes/template-name.pipe';
import { OverlaySpinnerComponent } from '@reuse/code/components/progress-indicators/overlay-spinner/overlay-spinner.component';
import { AlertComponent } from '@reuse/code/components/alert-component/alert.component';
import { ResolvedError } from '@reuse/code/interfaces/error.interface';
import { AlertType } from '@reuse/code/interfaces';
import { AlertService } from '@reuse/code/services/helpers/alert.service';
import { mockTestAlertService } from '@reuse/code/utils/test.utils';

@Pipe({ name: 'templateName', standalone: true })
class MockTemplateNamePipe implements PipeTransform {
  transform(v: any) {
    return v;
  }
}
@Component({ selector: 'app-overlay-spinner', template: '', standalone: true })
class MockOverlaySpinnerComponent {}

describe('RestartExecutionPrescriptionDialog', () => {
  let component: RestartExecutionPrescriptionDialog;
  let fixture: ComponentFixture<RestartExecutionPrescriptionDialog>;
  const mockToastService = { show: jest.fn() };
  const mockPrescriptionState = { restartExecution: jest.fn() };
  const mockDialogRef = { close: jest.fn() };
  const mockDialogData = {
    prescription: { id: 'prescriptionId' } as ReadRequestResource,
    performerTask: { id: 'performerTaskId' } as PerformerTaskResource,
    patient: { id: 'patientId' } as PersonResource,
  };
  let mockAlertService: jest.Mocked<Partial<AlertService>>;

  beforeEach(async () => {
    mockAlertService = mockTestAlertService;
    jest.spyOn(uuid, 'v4').mockReturnValue('uuid-123' as any);
    await TestBed.configureTestingModule({
      imports: [
        RestartExecutionPrescriptionDialog,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
        MockTemplateNamePipe,
        MockOverlaySpinnerComponent,
      ],
      providers: [
        { provide: ToastService, useValue: mockToastService },
        { provide: PrescriptionState, useValue: mockPrescriptionState },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: AlertService, useValue: mockAlertService },
      ],
    })
      .overrideComponent(RestartExecutionPrescriptionDialog, {
        remove: { imports: [TemplateNamePipe, OverlaySpinnerComponent] },
        add: { imports: [MockTemplateNamePipe, MockOverlaySpinnerComponent] },
      })
      .compileComponents();
    fixture = TestBed.createComponent(RestartExecutionPrescriptionDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should restart execution successfully', () => {
    mockPrescriptionState.restartExecution.mockReturnValue(of(void 0));
    component.restartExecution();
    expect(mockPrescriptionState.restartExecution).toHaveBeenCalledWith(
      'prescriptionId',
      'performerTaskId',
      'uuid-123'
    );
    expect(mockToastService.show).toHaveBeenCalledWith('prescription.restartExecution.success');
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should show error when prescription id missing', () => {
    component.prescription.id = undefined;
    const alertServiceSpy = jest.spyOn(mockAlertService, 'showGeneralError');

    component.restartExecution();
    expect(alertServiceSpy).toHaveBeenCalledTimes(1);
    expect(alertServiceSpy).toHaveBeenCalledWith('restart-execution-dialog');
  });

  it('should show error when performerTask id missing', () => {
    component.performerTask.id = undefined;
    const alertServiceSpy = jest.spyOn(mockAlertService, 'showGeneralError');
    component.restartExecution();
    expect(alertServiceSpy).toHaveBeenCalledTimes(1);
    expect(alertServiceSpy).toHaveBeenCalledWith('restart-execution-dialog');
  });
});
