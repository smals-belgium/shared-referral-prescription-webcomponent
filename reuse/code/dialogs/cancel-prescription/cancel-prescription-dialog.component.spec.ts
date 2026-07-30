import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Component, Pipe, PipeTransform, signal } from '@angular/core';
import * as uuid from 'uuid';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CancelPrescriptionDialog } from './cancel-prescription-dialog.component';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { ProposalState } from '@reuse/code/states/api/proposal.state';
import { PersonResource, ReadRequestResource } from '@reuse/code/openapi';
import { HttpErrorResponse } from '@angular/common/http';
import { AlertType, Intent } from '@reuse/code/interfaces';
import { Lang } from '@reuse/code/constants/languages';
import { EncryptionHelperService } from '@reuse/code/states/privacy/encryption-helper.service';
import { DialogLayoutComponent } from '@reuse/code/dialogs/dialog-layout/dialog-layout.component';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { AlertService } from '@reuse/code/services/helpers/alert.service';
import { mockTestAlertService } from '@reuse/code/utils/test.utils';
import { AlertComponent } from '@reuse/code/components/alert-component/alert.component';
import { ResolvedError } from '@reuse/code/interfaces/error.interface';
import { By } from '@angular/platform-browser';

@Pipe({
  name: 'templateName',
  standalone: true,
})
class MockTemplateNamePipe implements PipeTransform {
  transform(value: any): any {
    return value;
  }
}

@Pipe({
  name: 'translateByIntent',
  standalone: true,
})
class MockTranslateByIntentPipe implements PipeTransform {
  transform(value: any): any {
    return value;
  }
}

@Component({
  selector: 'app-overlay-spinner',
  template: '',
  standalone: true,
})
class MockOverlaySpinnerComponent {}

const mockToastService = {
  show: jest.fn(),
};

const mockPrescriptionState = {
  cancelPrescription: jest.fn(),
  loadPrescription: jest.fn().mockReturnValue(of(void 0)),
};

const mockProposalState = {
  cancelProposal: jest.fn(),
  loadProposal: jest.fn().mockReturnValue(of(void 0)),
};

const mockDialogRef = {
  close: jest.fn(),
};

const mockDialogData = {
  prescription: {
    id: 'prescription-123',
    kid: 'kid-abc',
    pseudonymizedKey: 'existing-pseudo-key-xyz',
    intent: Intent.ORDER,
  } as ReadRequestResource,
  patient: {
    id: 'patient-789',
  } as PersonResource,
};

const mockEncryptionHelper = {
  getEncryptedReasonAndPseudoKey: jest.fn(),
};

describe('CancelPrescriptionDialog', () => {
  let component: CancelPrescriptionDialog;
  let fixture: ComponentFixture<CancelPrescriptionDialog>;
  let uuidSpy: jest.SpyInstance;
  let translate: TranslateService;
  let mockAlertService: jest.Mocked<Partial<AlertService>>;

  beforeEach(async () => {
    uuidSpy = jest.spyOn(uuid, 'v4').mockReturnValue('mock-uuid-12345' as unknown as Uint8Array);
    mockAlertService = mockTestAlertService;
    await TestBed.configureTestingModule({
      imports: [
        CancelPrescriptionDialog,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
        MockTemplateNamePipe,
        MockTranslateByIntentPipe,
        MockOverlaySpinnerComponent,
      ],
      providers: [
        { provide: ToastService, useValue: mockToastService },
        { provide: PrescriptionState, useValue: mockPrescriptionState },
        { provide: ProposalState, useValue: mockProposalState },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: EncryptionHelperService, useValue: mockEncryptionHelper },
        { provide: AlertService, useValue: mockAlertService },
      ],
    })
      .overrideComponent(CancelPrescriptionDialog, {
        set: {
          imports: [
            TranslateModule,
            MatDialogModule,
            MatButtonModule,
            MockOverlaySpinnerComponent,
            MockTemplateNamePipe,
            MockTranslateByIntentPipe,
            FormsModule,
            MatFormFieldModule,
            MatInputModule,
            ReactiveFormsModule,
            DialogLayoutComponent,
            MatIconTestingModule,
            AlertComponent,
          ],
        },
      })
      .compileComponents();

    translate = TestBed.inject(TranslateService);
    translate.setDefaultLang(Lang.FR.full);
    translate.use(Lang.FR.full);

    fixture = TestBed.createComponent(CancelPrescriptionDialog);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  afterEach(() => {
    uuidSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('cancelPrescription', () => {
    it('should NOT cancel prescription when reason is not filled', () => {
      mockPrescriptionState.cancelPrescription.mockReturnValue(of(void 0));

      component.cancelPrescription();

      expect(mockPrescriptionState.cancelPrescription).not.toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should cancel prescription and show success toast with a NEW pseudonymized key if generated', () => {
      const reasonText = 'Approval reason';
      const encryptedData = { encryptedText: 'encrypted-text', pseudonymizedKey: 'new-pseudo-key' };
      component.formGroup.get('reason')?.setValue(reasonText);
      mockEncryptionHelper.getEncryptedReasonAndPseudoKey.mockReturnValue(of(encryptedData));

      mockPrescriptionState.cancelPrescription.mockReturnValue(of(void 0));
      mockDialogData.prescription.pseudonymizedKey = undefined;

      component.cancelPrescription();

      expect(mockPrescriptionState.cancelPrescription).toHaveBeenCalledWith(
        'prescription-123',
        { kid: 'kid-abc', pseudonymizedKey: encryptedData.pseudonymizedKey, reason: encryptedData.encryptedText },
        'mock-uuid-12345'
      );
      expect(mockPrescriptionState.loadPrescription).toHaveBeenCalledWith('prescription-123');
      expect(mockToastService.show).toHaveBeenCalledWith('prescription.cancel.success');
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });

    it('should cancel prescription and show success toast with the EXISTING pseudonymized key if a new one is not generated', () => {
      const reasonText = 'Another reason';
      const encryptedData = { encryptedText: 'encrypted-text-2', pseudonymizedKey: undefined };
      component.formGroup.get('reason')?.setValue(reasonText);
      mockEncryptionHelper.getEncryptedReasonAndPseudoKey.mockReturnValue(of(encryptedData));

      mockPrescriptionState.cancelPrescription.mockReturnValue(of(void 0));

      component.cancelPrescription();

      expect(mockPrescriptionState.cancelPrescription).toHaveBeenCalledWith(
        'prescription-123',
        {
          kid: 'kid-abc',
          pseudonymizedKey: mockDialogData.prescription.pseudonymizedKey,
          reason: encryptedData.encryptedText,
        },
        'mock-uuid-12345'
      );
      expect(mockPrescriptionState.loadPrescription).toHaveBeenCalledWith('prescription-123');
      expect(mockToastService.show).toHaveBeenCalledWith('prescription.cancel.success');
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });

    it('should cancel proposal and show success toast', () => {
      component['prescription'].intent = Intent.PROPOSAL;
      const reasonText = 'Another reason';
      const encryptedData = { encryptedText: 'encrypted-text-2', pseudonymizedKey: undefined };
      component.formGroup.get('reason')?.setValue(reasonText);
      mockEncryptionHelper.getEncryptedReasonAndPseudoKey.mockReturnValue(of(encryptedData));

      mockProposalState.cancelProposal.mockReturnValue(of(void 0));

      component.cancelPrescription();

      expect(mockProposalState.cancelProposal).toHaveBeenCalledWith(
        'prescription-123',
        {
          kid: 'kid-abc',
          pseudonymizedKey: mockDialogData.prescription.pseudonymizedKey,
          reason: encryptedData.encryptedText,
        },
        'mock-uuid-12345'
      );
      expect(mockProposalState.loadProposal).toHaveBeenCalledWith('prescription-123');
      expect(mockToastService.show).toHaveBeenCalledWith('proposal.cancel.success');
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });

    it('should handle error from backend', () => {
      component.formGroup.get('reason')?.setValue('some reason');
      (component as any).error = signal<ResolvedError | null>({
        message: 'error.message',
        translationOptions: { count: 2 },
        severity: AlertType.Error,
        dismissible: true,
        retry: false,
      });

      fixture.detectChanges();
      component.cancelPrescription();

      expect(component.loading).toBe(false);

      const alerts = fixture.debugElement.queryAll(By.css('app-alert'));

      const errorAlert = alerts.find(alert => alert.componentInstance.severity() === 'error');
      expect(errorAlert).toBeTruthy();

      expect(mockPrescriptionState.cancelPrescription).not.toHaveBeenCalled();
    });

    it('should show error card when prescription id is missing', () => {
      component.formGroup.get('reason')?.setValue('Approval reason');
      component['prescription'].id = undefined;
      const alertServiceSpy = jest.spyOn(mockAlertService, 'showGeneralError');
      component.cancelPrescription();
      expect(alertServiceSpy).toHaveBeenCalledTimes(1);
      expect(alertServiceSpy).toHaveBeenCalledWith('cancel-dialog');
    });

    it('should handle error during prescription cancellation', () => {
      mockPrescriptionState.cancelPrescription.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 500 }))
      );

      component.cancelPrescription();

      expect(component.loading).toBe(false);
      expect(mockToastService.show).not.toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });
});
