import { Component, Inject, OnInit } from '@angular/core';
import { OverlaySpinnerComponent } from '@reuse/code/components/progress-indicators/overlay-spinner/overlay-spinner.component';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { MatButton } from '@angular/material/button';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { v4 as uuidv4 } from 'uuid';
import { ProposalState } from '@reuse/code/states/api/proposal.state';
import { AlertComponent } from '@reuse/code/components/alert-component/alert.component';
import { BaseDialog } from '@reuse/code/dialogs/base.dialog';
import { ReadRequestResource } from '@reuse/code/openapi';
import { catchError, switchMap } from 'rxjs';
import { EncryptionHelperService } from '@reuse/code/states/privacy/encryption-helper.service';
import { HttpErrorResponse } from '@angular/common/http';
import { AlertType } from '@reuse/code/interfaces';

@Component({
  imports: [
    OverlaySpinnerComponent,
    MatDialogModule,
    TranslateModule,
    MatButton,
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatError,
    MatLabel,
    FormsModule,
    AlertComponent,
  ],
  templateUrl: './reject-proposal.dialog.html',
  styleUrl: './reject-proposal.dialog.scss',
})
export class RejectProposalDialog extends BaseDialog implements OnInit {
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
    dialogRef: MatDialogRef<RejectProposalDialog>,
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

  rejectProposal(): void {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.invalid) {
      return;
    }

    const reason = this.formGroup.get('reason')?.value ?? undefined;

    if (!this.data.proposal.id) {
      this.showErrorCard('common.somethingWentWrong');
      return;
    }

    this.loading = true;
    if (!this.data.proposal.performerTasks?.length) {
      this.encryptionHelperService
        .getEncryptedReasonAndPseudoKey(reason, this.data.proposal?.pseudonymizedKey)
        .pipe(
          switchMap(result =>
            this.proposalStateService
              .rejectProposal(
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
                  throw new Error('API rejection failed', error.message);
                })
              )
          )
        )
        .subscribe({
          next: () => {
            this.handleSuccess();
          },
          error: error => {
            this.handleError(error);
          },
        });
    } else {
      const performerTasks = this.data.proposal.performerTasks;
      const lastPerformerTask = performerTasks[performerTasks.length - 1];

      if (!lastPerformerTask.id) {
        this.loading = false;
        this.showErrorCard('common.somethingWentWrong');
        return;
      }

      this.proposalStateService
        .rejectProposalTask(this.data.proposal.id, lastPerformerTask.id, { reason: reason }, this.generatedUUID)
        .subscribe({
          next: () => {
            this.handleSuccess();
          },
          error: error => {
            this.handleError(error);
          },
        });
    }
  }

  private handleSuccess(): void {
    this.loading = false;
    this.closeErrorCard();
    this.toastService.show('proposal.reject.success');
    this.closeDialog(true);
  }

  private handleError(error?: HttpErrorResponse): void {
    this.loading = false;
    this.showErrorCard('common.somethingWentWrong', error);
  }
}
