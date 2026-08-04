import { ChangeDetectionStrategy, Component, inject, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { v4 as uuidv4 } from 'uuid';
import { finalize, switchMap, tap } from 'rxjs/operators';
import { ProposalState } from '@reuse/code/states/api/proposal.state';
import { TemplateNamePipe } from '@reuse/code/pipes/template-name.pipe';
import { PersonResource, ReadRequestResource } from '@reuse/code/openapi';
import { catchError, EMPTY } from 'rxjs';
import { isProposal } from '@reuse/code/utils/utils';
import { TranslateByIntentPipe } from '@reuse/code/pipes/translate-by-intent.pipe';
import { OverlaySpinnerComponent } from '@reuse/code/components/progress-indicators/overlay-spinner/overlay-spinner.component';
import { AlertType } from '@reuse/code/interfaces';
import { MatInputModule } from '@angular/material/input';
import { AlertComponent } from '@reuse/code/components/alert-component/alert.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogLayoutComponent } from '@reuse/code/dialogs/dialog-layout/dialog-layout.component';
import { EncryptionHelperService } from '@reuse/code/states/privacy/encryption-helper.service';
import { AlertService } from '@reuse/code/services/helpers/alert.service';

interface CancelMedicalDocumentDialogData {
  prescription: ReadRequestResource;
  patient: PersonResource;
}

@Component({
  templateUrl: './cancel-prescription-dialog.component.html',
  styleUrls: ['./cancel-prescription-dialog.component.scss'],
  imports: [
    TranslateModule,
    MatDialogModule,
    MatButtonModule,
    OverlaySpinnerComponent,
    TemplateNamePipe,
    AlertComponent,
    TranslateByIntentPipe,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    DialogLayoutComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CancelPrescriptionDialog implements OnInit, OnDestroy {
  private readonly _fb = inject(FormBuilder);
  private readonly encryptionHelperService = inject(EncryptionHelperService);
  private readonly alertService = inject(AlertService);

  private readonly ERROR_CANCEL_DIALOG = 'cancel-dialog';
  protected readonly error = this.alertService.setTarget(this.ERROR_CANCEL_DIALOG);
  protected readonly AlertType = AlertType;
  protected readonly MAX_LENGTH_REASON = 400;
  protected readonly isProposal = isProposal;

  readonly prescription: ReadRequestResource;
  readonly patient?: PersonResource;
  loading = false;
  generatedUUID = '';
  reason = new FormControl('', [Validators.required, Validators.maxLength(this.MAX_LENGTH_REASON)]);
  formGroup: FormGroup = this._fb.group({
    reason: this.reason,
  });

  constructor(
    private readonly prescriptionStateService: PrescriptionState,
    private readonly proposalStateService: ProposalState,
    private readonly toastService: ToastService,
    private readonly dialogRef: MatDialogRef<CancelPrescriptionDialog>,
    @Inject(MAT_DIALOG_DATA) private readonly data: CancelMedicalDocumentDialogData
  ) {
    this.prescription = data.prescription;
    this.patient = data.patient;
  }

  ngOnInit() {
    this.generatedUUID = uuidv4();
    this.alertService.setActive(this.ERROR_CANCEL_DIALOG);
  }

  cancelPrescription() {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    if (!this.prescription.id) {
      this.alertService.showGeneralError(this.ERROR_CANCEL_DIALOG);
      return;
    }

    this.loading = true;
    const reasonValue = this.reason.value!;
    const isProposalIntent = isProposal(this.prescription.intent);
    const successPrefix = isProposalIntent ? 'proposal' : 'prescription';

    this.encryptionHelperService
      .getEncryptedReasonAndPseudoKey(reasonValue, this.prescription.pseudonymizedKey)
      .pipe(
        catchError(() => {
          this.alertService.showGeneralError(this.ERROR_CANCEL_DIALOG);
          return EMPTY;
        }),
        switchMap(result => {
          const payload = {
            reason: result?.encryptedText,
            kid: this.prescription.kid,
            pseudonymizedKey: result?.pseudonymizedKey,
          };

          const cancel$ = isProposalIntent
            ? this.proposalStateService.cancelProposal(this.prescription.id!, payload, this.generatedUUID)
            : this.prescriptionStateService.cancelPrescription(this.prescription.id!, payload, this.generatedUUID);
          return cancel$.pipe(this.getPrescriptionsOrProposals());
        }),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: () => {
          this.toastService.show(`${successPrefix}.cancel.success`);
          this.dialogRef.close(true);
        },
      });
  }

  private getPrescriptionsOrProposals() {
    if (isProposal(this.prescription.intent)) {
      return tap(() => this.proposalStateService.loadProposal(this.prescription.id!));
    }
    return tap(() => this.prescriptionStateService.loadPrescription(this.prescription.id!));
  }

  protected dismissError() {
    this.alertService.clear(this.ERROR_CANCEL_DIALOG);
  }

  ngOnDestroy() {
    this.clearAlertService();
  }

  clearAlertService() {
    this.alertService.resetActive();
    this.alertService.remove(this.ERROR_CANCEL_DIALOG);
  }
}
