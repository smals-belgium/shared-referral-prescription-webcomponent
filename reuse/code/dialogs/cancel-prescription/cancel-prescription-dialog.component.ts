import { ChangeDetectionStrategy, Component, inject, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { v4 as uuidv4 } from 'uuid';
import { BaseDialog } from '@reuse/code/dialogs/base.dialog';
import { tap } from 'rxjs/operators';
import { ProposalState } from '@reuse/code/states/api/proposal.state';
import { TemplateNamePipe } from '@reuse/code/pipes/template-name.pipe';
import { PersonResource, ReadRequestResource } from '@reuse/code/openapi';
import { Observable } from 'rxjs';
import { isProposal } from '@reuse/code/utils/utils';
import { TranslateByIntentPipe } from '@reuse/code/pipes/translate-by-intent.pipe';
import { OverlaySpinnerComponent } from '@reuse/code/components/progress-indicators/overlay-spinner/overlay-spinner.component';
import { AlertType } from '@reuse/code/interfaces';
import { MatInputModule } from '@angular/material/input';
import { AlertComponent } from '@reuse/code/components/alert-component/alert.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { DialogLayoutComponent } from '@reuse/code/dialogs/dialog-layout/dialog-layout.component';
import { EncryptionHelperService } from '@reuse/code/states/privacy/encryption-helper.service';
import { HttpErrorResponse } from '@angular/common/http';

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
    MatIcon,
    DialogLayoutComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CancelPrescriptionDialog extends BaseDialog implements OnInit {
  private readonly _fb = inject(FormBuilder);
  private readonly encryptionHelperService = inject(EncryptionHelperService);
  protected readonly AlertType = AlertType;
  protected readonly MAX_LENGTH_REASON = 400;
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
    dialogRef: MatDialogRef<CancelPrescriptionDialog>,
    @Inject(MAT_DIALOG_DATA) private readonly data: CancelMedicalDocumentDialogData
  ) {
    super(dialogRef);
    this.prescription = data.prescription;
    this.patient = data.patient;
  }

  ngOnInit() {
    this.generatedUUID = uuidv4();
  }

  cancelPrescription() {
    if (this.formGroup.invalid) {
      return;
    }
    if (!this.prescription.id) {
      this.showErrorCard('common.somethingWentWrong');
      return;
    }

    this.loading = true;
    const reasonValue = this.reason.value!;

    this.loading = true;
    this.encryptionHelperService
      .getEncryptedReasonAndPseudoKey(reasonValue, this.prescription.pseudonymizedKey)
      .subscribe({
        next: result => {
          if (isProposal(this.prescription.intent)) {
            this.executeCancel(
              () =>
                this.proposalStateService.cancelProposal(
                  this.prescription.id!,
                  {
                    reason: result?.encryptedText,
                    kid: this.prescription.kid,
                    pseudonymizedKey: result?.pseudonymizedKey,
                  },
                  this.generatedUUID
                ),
              'proposal'
            );
          } else {
            this.executeCancel(
              () =>
                this.prescriptionStateService.cancelPrescription(
                  this.prescription.id!,
                  {
                    reason: result?.encryptedText,
                    kid: this.prescription.kid,
                    pseudonymizedKey: result?.pseudonymizedKey,
                  },
                  this.generatedUUID
                ),
              'prescription'
            );
          }
        },
        error: (err: HttpErrorResponse) => {
          this.loading = false;
          this.showErrorCard('common.somethingWentWrong', err);
        },
      });
  }

  private executeCancel(serviceCall: () => Observable<unknown>, successPrefix: string) {
    serviceCall()
      .pipe(this.getPrescriptionsOrProposals())
      .subscribe({
        next: () => {
          this.closeErrorCard();
          this.toastService.show(successPrefix + '.cancel.success');
          this.closeDialog(true);
        },
        error: err => {
          this.loading = false;
          this.showErrorCard('common.somethingWentWrong', err);
        },
      });
  }

  private getPrescriptionsOrProposals() {
    if (isProposal(this.prescription.intent)) {
      return tap(() => this.proposalStateService.loadProposal(this.prescription.id!));
    }
    return tap(() => this.prescriptionStateService.loadPrescription(this.prescription.id!));
  }
}
