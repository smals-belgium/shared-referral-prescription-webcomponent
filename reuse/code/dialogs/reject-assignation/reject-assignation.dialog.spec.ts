import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Component, Pipe, PipeTransform, signal } from '@angular/core';
import * as uuid from 'uuid';
import { TranslateModule } from '@ngx-translate/core';
import { RejectAssignationDialog } from './reject-assignation.dialog';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { ProposalState } from '@reuse/code/states/api/proposal.state';
import { PersonResource, ReadRequestResource, RequestTaskResource } from '@reuse/code/openapi';
import { Intent } from '@reuse/code/interfaces';
import { TemplateNamePipe } from '@reuse/code/pipes/template-name.pipe';
import { TranslateByIntentPipe } from '@reuse/code/pipes/translate-by-intent.pipe';
import { OverlaySpinnerComponent } from '@reuse/code/components/progress-indicators/overlay-spinner/overlay-spinner.component';
import { AlertComponent } from '@reuse/code/components/alert-component/alert.component';
import { AlertService } from '@reuse/code/services/helpers/alert.service';
import { mockTestAlertService } from '@reuse/code/utils/test.utils';

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
    requestTask: { id: 'requestTaskId' } as RequestTaskResource,
    patient: { id: 'patientId' } as PersonResource,
  };
  let mockAlertService: jest.Mocked<Partial<AlertService>>;

  beforeEach(async () => {
    jest.spyOn(uuid, 'v4').mockReturnValue('uuid-123' as any);
    mockAlertService = { ...mockTestAlertService, setTarget: jest.fn().mockReturnValue(signal(null)) };
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
        { provide: AlertService, useValue: mockAlertService },
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

  it('should reject prescription assignment successfully', () => {
    mockPrescriptionState.rejectAssignation.mockReturnValue(of(void 0));
    component.onReject();
    expect(mockPrescriptionState.rejectAssignation).toHaveBeenCalledWith('prescriptionId', 'requestTaskId', 'uuid-123');
    expect(mockToastService.show).toHaveBeenCalledWith('prescription.rejectAssignation.success');
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should reject proposal assignment successfully', () => {
    component['prescription'].intent = Intent.PROPOSAL;
    mockProposalState.rejectAssignation.mockReturnValue(of(void 0));
    component.onReject();
    expect(mockProposalState.rejectAssignation).toHaveBeenCalledWith('prescriptionId', 'requestTaskId', 'uuid-123');
    expect(mockToastService.show).toHaveBeenCalledWith('proposal.rejectAssignation.success');
  });

  it('should show error when required ids are missing', () => {
    const alertServiceSpy = jest.spyOn(mockAlertService, 'showGeneralError');

    component.prescription.id = undefined;
    component.onReject();

    expect(alertServiceSpy).toHaveBeenCalledTimes(1);
    expect(alertServiceSpy).toHaveBeenCalledWith('reject-assignation-dialog');
    expect(mockPrescriptionState.rejectAssignation).not.toHaveBeenCalled();
    expect(mockProposalState.rejectAssignation).not.toHaveBeenCalled();
    expect(component.loading).toBe(false);
  });
});
