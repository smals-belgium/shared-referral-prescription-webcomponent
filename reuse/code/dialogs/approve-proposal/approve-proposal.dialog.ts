import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast.service';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import { ReadPrescription } from '../../interfaces';
import { v4 as uuidv4 } from 'uuid';
import { MatButton } from '@angular/material/button';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { NgIf } from '@angular/common';
import { OverlaySpinnerComponent } from '../../components/overlay-spinner/overlay-spinner.component';
import { TranslateModule } from '@ngx-translate/core';
import { ProposalState } from '../../states/proposal.state';
import { ErrorCardComponent } from '../../components/error-card/error-card.component';
import { BaseDialog } from '../base.dialog';
import { catchError, switchMap } from 'rxjs';
import { EncryptionHelperService } from '@reuse/code/services/encryption-helper.service';
import { HttpErrorResponse } from '@angular/common/http';

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
    MatLabel,
    NgIf,
    OverlaySpinnerComponent,
    TranslateModule,
    ReactiveFormsModule,
    MatDialogClose,
    ErrorCardComponent
  ],
  templateUrl: './approve-proposal.dialog.html',
  styleUrl: './approve-proposal.dialog.scss'
})
export class ApproveProposalDialog extends BaseDialog implements OnInit {

  readonly formGroup = new FormGroup({
    reason: new FormControl<string>('')
  });

  loading = false;
  generatedUUID = '';

  constructor(
    private readonly toastService: ToastService,
    private readonly proposalStateService: ProposalState,
    private readonly encryptionHelperService: EncryptionHelperService,
    dialogRef: MatDialogRef<ApproveProposalDialog>,
    @Inject(MAT_DIALOG_DATA) private readonly data: {
      proposal: ReadPrescription
    }) {
    super(dialogRef);
  }

  ngOnInit() {
    this.generatedUUID = uuidv4();
  }

  /**
   * Approve a proposal and encrypt the reason of approval.
   * For the encryption : reuse the existing encryption key + kid if exists
   * If not, generate a new encryptionKey
   * see getPrescriptionKey() in prescription.details component for the loading of crypto key based on pseudonymizedKey
   */
  approveProposal(): void {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.invalid) {
      return;
    }
    this.loading = true;
    const reason = this.formGroup.get('reason')?.value ?? '';
    this.encryptionHelperService.getEncryptedReasonAndPseudoKey(reason, this.data.proposal?.pseudonymizedKey).pipe(
      switchMap((result) =>
        this.proposalStateService.approveProposal(this.data.proposal.id,
          this.generatedUUID,
          result?.encryptedText,
          this.data.proposal?.kid,
          result?.pseudonymizedKey
        ).pipe(
          catchError((error) => {
            throw new Error("API approval failed", error.message);
          })
        )
      )
    ).subscribe({
      next: () => {
        this.handleSuccess();
      },
      error: (e) => {
        this.handleError(e);
      }
    });

  }

  private handleSuccess(): void {
    this.loading = false;
    this.closeErrorCard();
    this.toastService.show('proposal.approve.success');
    this.closeDialog(true);

  }

  private handleError(error?: HttpErrorResponse): void {
    this.loading = false;
    this.showErrorCard('common.somethingWentWrong', error);
  }
}
