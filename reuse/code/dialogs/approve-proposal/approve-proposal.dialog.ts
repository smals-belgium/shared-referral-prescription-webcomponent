import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { v4 as uuidv4 } from 'uuid';
import { MatButton } from '@angular/material/button';
import { MatError, MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { OverlaySpinnerComponent } from '@reuse/code/components/progress-indicators/overlay-spinner/overlay-spinner.component';
import { TranslateModule } from '@ngx-translate/core';
import { BaseDialog } from '@reuse/code/dialogs/base.dialog';
import { ProposalState } from '@reuse/code/states/api/proposal.state';
import { PrescriptionResource, ReadRequestResource } from '@reuse/code/openapi';
import { catchError, switchMap } from 'rxjs';
import { EncryptionHelperService } from '@reuse/code/states/privacy/encryption-helper.service';
import { HttpErrorResponse } from '@angular/common/http';
import { AlertType } from '@reuse/code/interfaces';
import { AlertComponent } from '@reuse/code/components/alert-component/alert.component';

@Component({
  selector: 'approve-proposal',
  imports: [
    FormsModule,
    MatButton,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    MatError,
    MatFormField,
    MatInput,
    OverlaySpinnerComponent,
    TranslateModule,
    ReactiveFormsModule,
    MatDialogClose,
    AlertComponent,
  ],
  templateUrl: './approve-proposal.dialog.html',
  styleUrl: './approve-proposal.dialog.scss',
})
export class ApproveProposalDialog extends BaseDialog implements OnInit {
  protected readonly AlertType = AlertType;
  readonly formGroup = new FormGroup({
    reason: new FormControl<string>(''),
  });

  loading = false;
  generatedUUID = '';

  constructor(
    private readonly toastService: ToastService,
    private readonly proposalStateService: ProposalState,
    private readonly encryptionHelperService: EncryptionHelperService,
    dialogRef: MatDialogRef<ApproveProposalDialog>,
    @Inject(MAT_DIALOG_DATA)
    private readonly data: {
      proposal: ReadRequestResource;
    }
  ) {
    super(dialogRef);
  }

  ngOnInit() {
    this.generatedUUID = uuidv4();
  }

  approveProposal(): void {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.invalid) {
      return;
    }

    if (!this.data.proposal.id) {
      this.showErrorCard('common.somethingWentWrong');
      return;
    }
    this.loading = true;
    const reason = this.formGroup.get('reason')?.value ?? undefined;

    this.encryptionHelperService
      .getEncryptedReasonAndPseudoKey(reason, this.data.proposal?.pseudonymizedKey)
      .pipe(
        switchMap(result =>
          this.proposalStateService
            .approveProposal(
              this.data.proposal.id!,
              {
                reason: result?.encryptedText,
                kid: this.data.proposal?.kid,
                pseudonymizedKey: result?.pseudonymizedKey,
              },
              this.generatedUUID
            )
            .pipe(
              catchError(error => {
                throw new Error('API approval failed', error.message);
              })
            )
        )
      )
      .subscribe({
        next: e => {
          this.handleSuccess(e);
        },
        error: e => {
          this.handleError(e);
        },
      });
  }

  private handleSuccess(e: PrescriptionResource): void {
    this.loading = false;
    this.closeErrorCard();
    this.toastService.show('proposal.approve.success');
    this.closeDialog({ prescriptionId: e.prescriptionId });
  }

  private handleError(error?: HttpErrorResponse): void {
    this.loading = false;
    this.showErrorCard('common.somethingWentWrong', error);
  }
}
