import { Component, Inject, OnInit } from '@angular/core';
import { OverlaySpinnerComponent } from '../../components/overlay-spinner/overlay-spinner.component';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { MatButton } from '@angular/material/button';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { ReadPrescription } from '../../interfaces';
import { NgIf } from '@angular/common';
import { ToastService } from '../../services/toast.service';
import { v4 as uuidv4 } from 'uuid';
import { ProposalState } from '../../states/proposal.state';
import { ErrorCardComponent } from '../../components/error-card/error-card.component';
import { BaseDialog } from '../base.dialog';
import { catchError, switchMap } from 'rxjs';
import { EncryptionHelperService } from '@reuse/code/services/encryption-helper.service';
import { HttpErrorResponse } from '@angular/common/http';

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
    NgIf,
    ErrorCardComponent
  ],
  templateUrl: './reject-proposal.dialog.html',
  styleUrl: './reject-proposal.dialog.scss'
})
export class RejectProposalDialog extends BaseDialog implements OnInit {

  readonly formGroup = new FormGroup({
    reason: new FormControl<string>('')
  });

  loading = false;
  generatedUUID = '';

  constructor(
    private readonly toastService: ToastService,
    private readonly proposalStateService: ProposalState,
    private readonly encryptionHelperService: EncryptionHelperService,
    dialogRef: MatDialogRef<RejectProposalDialog>,
    @Inject(MAT_DIALOG_DATA) private readonly data: {
      proposal: ReadPrescription
    }) {
    super(dialogRef);
  }

  ngOnInit() {
    this.generatedUUID = uuidv4();
  }


  /**
   * Reject a proposal and encrypt the reason of rejection.
   * For the encryption : reuse the existing encryption key + kid if exists
   * see getPrescriptionKey() in prescription.details component for the loading of crypto key based on pseudonymizedKey
   */
  rejectProposal(): void {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.invalid) {
      return;
    }
    const reason = this.formGroup.get('reason')?.value ?? '';
    this.loading = true;

    if (!this.data.proposal.performerTasks?.length) {
      this.encryptionHelperService.getEncryptedReasonAndPseudoKey(reason, this.data.proposal?.pseudonymizedKey).pipe(
        switchMap((result) =>
          this.proposalStateService.rejectProposal(this.data.proposal.id, this.generatedUUID, result?.encryptedText, this.data.proposal?.kid,
            result?.pseudonymizedKey)
        .pipe(
          catchError((error) => {
            throw new Error("API rejection failed", error.message);
          })
        )
      )
    ).subscribe({
        next: () => {
          this.handleSuccess();
        },
        error: (error) => {
          this.handleError(error);
        }
      });

    } else {
      this.loading = false;
      const performerTasks = this.data.proposal.performerTasks;
      const lastPerformerTask = performerTasks[performerTasks.length - 1];
      this.proposalStateService
        .rejectProposalTask(this.data.proposal.id, lastPerformerTask.id, this.generatedUUID, reason)
        .subscribe({
          next: () => {
            this.handleSuccess();
          },
          error: (error) => {
            this.handleError(error);
          }
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
