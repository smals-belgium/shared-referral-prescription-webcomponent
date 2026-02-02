import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Component, Pipe, PipeTransform } from '@angular/core';
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

@Pipe({ name: 'templateName', standalone: true })
class MockTemplateNamePipe implements PipeTransform {
  transform(v: any) {
    return v;
  }
}
@Component({ selector: 'app-overlay-spinner', template: '', standalone: true })
class MockOverlaySpinnerComponent {}
@Component({ selector: 'app-alert', template: '', standalone: true })
class MockAlertComponent {}

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

  beforeEach(async () => {
    jest.spyOn(uuid, 'v4').mockReturnValue('uuid-123' as any);
    await TestBed.configureTestingModule({
      imports: [
        RestartExecutionPrescriptionDialog,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
        MockTemplateNamePipe,
        MockOverlaySpinnerComponent,
        MockAlertComponent,
      ],
      providers: [
        { provide: ToastService, useValue: mockToastService },
        { provide: PrescriptionState, useValue: mockPrescriptionState },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    })
      .overrideComponent(RestartExecutionPrescriptionDialog, {
        remove: { imports: [TemplateNamePipe, OverlaySpinnerComponent, AlertComponent] },
        add: { imports: [MockTemplateNamePipe, MockOverlaySpinnerComponent, MockAlertComponent] },
      })
      .compileComponents();
    fixture = TestBed.createComponent(RestartExecutionPrescriptionDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should restart execution successfully', fakeAsync(() => {
    mockPrescriptionState.restartExecution.mockReturnValue(of(void 0));
    component.restartExecution();
    tick();
    expect(mockPrescriptionState.restartExecution).toHaveBeenCalledWith(
      'prescriptionId',
      'performerTaskId',
      'uuid-123'
    );
    expect(mockToastService.show).toHaveBeenCalledWith('prescription.restartExecution.success');
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  }));

  it('should show error when prescription id missing', () => {
    component.prescription.id = undefined;
    const spy = jest.spyOn(component as any, 'showErrorCard');
    component.restartExecution();
    expect(spy).toHaveBeenCalledWith('common.somethingWentWrong');
  });

  it('should show error when performerTask id missing', () => {
    component.performerTask.id = undefined;
    const spy = jest.spyOn(component as any, 'showErrorCard');
    component.restartExecution();
    expect(spy).toHaveBeenCalledWith('common.somethingWentWrong');
  });

  it('should handle API error', fakeAsync(() => {
    const error = new HttpErrorResponse({ status: 500 });
    const spy = jest.spyOn(component as any, 'showErrorCard');
    mockPrescriptionState.restartExecution.mockReturnValue(throwError(() => error));
    component.restartExecution();
    tick();
    expect(component.loading).toBe(false);
    expect(spy).toHaveBeenCalledWith('common.somethingWentWrong');
  }));
});
