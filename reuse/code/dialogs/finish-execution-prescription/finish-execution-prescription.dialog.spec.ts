import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Component, Pipe, PipeTransform } from '@angular/core';
import * as uuid from 'uuid';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { DateTime } from 'luxon';
import { FinishExecutionPrescriptionDialog } from './finish-execution-prescription.dialog';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { PerformerTaskResource, ReadRequestResource } from '@reuse/code/openapi';
import { provideLuxonDateAdapter } from '@angular/material-luxon-adapter';

@Pipe({ name: 'appDate', standalone: true })
class MockDatePipe implements PipeTransform { transform(v: any) { return v; } }
@Component({ selector: 'app-overlay-spinner', template: '', standalone: true })
class MockOverlaySpinnerComponent {}
@Component({ selector: 'app-alert', template: '', standalone: true })
class MockAlertComponent {}

describe('FinishExecutionPrescriptionDialog', () => {
  let component: FinishExecutionPrescriptionDialog;
  let fixture: ComponentFixture<FinishExecutionPrescriptionDialog>;
  const mockToastService = { show: jest.fn() };
  const mockPrescriptionState = { finishPrescriptionExecution: jest.fn() };
  const mockDialogRef = { close: jest.fn() };
  const mockDialogData = {
    prescription: { id: 'prescriptionId' } as ReadRequestResource,
    performerTask: { id: 'performerTaskId' } as PerformerTaskResource,
    startExecutionDate: DateTime.now().minus({ days: 5 }).toISO(),
  };

  beforeEach(async () => {
    jest.spyOn(uuid, 'v4').mockReturnValue('uuid-123' as any);
    await TestBed.configureTestingModule({
      imports: [FinishExecutionPrescriptionDialog, NoopAnimationsModule, ReactiveFormsModule,
        TranslateModule.forRoot(), MockDatePipe, MockOverlaySpinnerComponent, MockAlertComponent],
      providers: [
        { provide: ToastService, useValue: mockToastService },
        { provide: PrescriptionState, useValue: mockPrescriptionState },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        provideLuxonDateAdapter(),
      ],
    }).overrideComponent(FinishExecutionPrescriptionDialog, {
      remove: { imports: [] },
      add: { imports: [MockDatePipe, MockOverlaySpinnerComponent, MockAlertComponent] },
    }).compileComponents();
    fixture = TestBed.createComponent(FinishExecutionPrescriptionDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should finish execution successfully', fakeAsync(() => {
    const endDate = DateTime.now();
    component.formGroup.patchValue({ endDate });
    mockPrescriptionState.finishPrescriptionExecution.mockReturnValue(of(void 0));
    component.finishExecution();
    tick();
    expect(mockPrescriptionState.finishPrescriptionExecution).toHaveBeenCalledWith(
      'prescriptionId', 'performerTaskId', { endDate: endDate.toFormat('yyyy-MM-dd') }, 'uuid-123'
    );
    expect(mockToastService.show).toHaveBeenCalledWith('prescription.finishExecution.success');
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  }));
});
