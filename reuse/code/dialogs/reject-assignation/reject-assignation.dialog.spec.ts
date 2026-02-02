import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Component, Pipe, PipeTransform } from '@angular/core';
import * as uuid from 'uuid';
import { TranslateModule } from '@ngx-translate/core';
import { RejectAssignationDialog } from './reject-assignation.dialog';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { ProposalState } from '@reuse/code/states/api/proposal.state';
import { PerformerTaskResource, PersonResource, ReadRequestResource } from '@reuse/code/openapi';
import { Intent } from '@reuse/code/interfaces';
import { TemplateNamePipe } from '@reuse/code/pipes/template-name.pipe';
import { TranslateByIntentPipe } from '@reuse/code/pipes/translate-by-intent.pipe';
import { OverlaySpinnerComponent } from '@reuse/code/components/progress-indicators/overlay-spinner/overlay-spinner.component';
import { AlertComponent } from '@reuse/code/components/alert-component/alert.component';

@Pipe({ name: 'templateName', standalone: true })
class MockTemplateNamePipe implements PipeTransform {
  transform(v: any) {
    return v;
  }
}
@Pipe({ name: 'translateByIntent', standalone: true })
class MockTranslateByIntentPipe implements PipeTransform {
  transform(v: any) {
    return v;
  }
}
@Component({ selector: 'app-overlay-spinner', template: '', standalone: true })
class MockOverlaySpinnerComponent {}
@Component({ selector: 'app-alert', template: '', standalone: true })
class MockAlertComponent {}

describe('RejectAssignationDialog', () => {
  let component: RejectAssignationDialog;
  let fixture: ComponentFixture<RejectAssignationDialog>;
  const mockToastService = { show: jest.fn() };
  const mockPrescriptionState = { rejectAssignation: jest.fn() };
  const mockProposalState = { rejectAssignation: jest.fn() };
  const mockDialogRef = { close: jest.fn() };
  const mockDialogData = {
    prescription: { id: 'prescriptionId', intent: Intent.ORDER } as ReadRequestResource,
    performerTask: { id: 'performerTaskId' } as PerformerTaskResource,
    patient: { id: 'patientId' } as PersonResource,
  };

  beforeEach(async () => {
    jest.spyOn(uuid, 'v4').mockReturnValue('uuid-123' as any);
    await TestBed.configureTestingModule({
      imports: [
        RejectAssignationDialog,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
        MockTemplateNamePipe,
        MockTranslateByIntentPipe,
        MockOverlaySpinnerComponent,
        MockAlertComponent,
      ],
      providers: [
        { provide: ToastService, useValue: mockToastService },
        { provide: PrescriptionState, useValue: mockPrescriptionState },
        { provide: ProposalState, useValue: mockProposalState },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    })
      .overrideComponent(RejectAssignationDialog, {
        remove: { imports: [TemplateNamePipe, TranslateByIntentPipe, OverlaySpinnerComponent, AlertComponent] },
        add: {
          imports: [MockTemplateNamePipe, MockTranslateByIntentPipe, MockOverlaySpinnerComponent, MockAlertComponent],
        },
      })
      .compileComponents();
    fixture = TestBed.createComponent(RejectAssignationDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should reject prescription assignment successfully', fakeAsync(() => {
    mockPrescriptionState.rejectAssignation.mockReturnValue(of(void 0));
    component.onReject();
    tick();
    expect(mockPrescriptionState.rejectAssignation).toHaveBeenCalledWith(
      'prescriptionId',
      'performerTaskId',
      'uuid-123'
    );
    expect(mockToastService.show).toHaveBeenCalledWith('prescription.rejectAssignation.success');
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  }));

  it('should reject proposal assignment successfully', fakeAsync(() => {
    component['prescription'].intent = Intent.PROPOSAL;
    mockProposalState.rejectAssignation.mockReturnValue(of(void 0));
    component.onReject();
    tick();
    expect(mockProposalState.rejectAssignation).toHaveBeenCalledWith('prescriptionId', 'performerTaskId', 'uuid-123');
    expect(mockToastService.show).toHaveBeenCalledWith('proposal.rejectAssignation.success');
  }));

  it('should show error when required ids are missing', () => {
    const showErrorSpy = jest.spyOn(component as any, 'showErrorCard');

    component.prescription.id = undefined;
    component.onReject();

    expect(showErrorSpy).toHaveBeenCalledWith('common.somethingWentWrong');
    expect(mockPrescriptionState.rejectAssignation).not.toHaveBeenCalled();
    expect(mockProposalState.rejectAssignation).not.toHaveBeenCalled();
    expect(component.loading).toBe(false);

    showErrorSpy.mockClear();

    component.prescription.id = 'prescriptionId';
    component.performerTask.id = undefined;
    component.onReject();

    expect(showErrorSpy).toHaveBeenCalledWith('common.somethingWentWrong');
    expect(mockPrescriptionState.rejectAssignation).not.toHaveBeenCalled();
    expect(mockProposalState.rejectAssignation).not.toHaveBeenCalled();
    expect(component.loading).toBe(false);
  });
});
