import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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

@Component({
  selector: 'approve-proposal',
  standalone: true,
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
    private toastService: ToastService,
    private proposalStateService: ProposalState,
    dialogRef: MatDialogRef<ApproveProposalDialog>,
    @Inject(MAT_DIALOG_DATA) private data: {
      proposal: ReadPrescription
    }) {
    super(dialogRef);
  }

  ngOnInit() {
    this.generatedUUID = uuidv4();
  }

  approveProposal(): void {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.valid) {
      const reason = this.formGroup.get('reason')?.value;

      this.loading = true;
      this.proposalStateService.approveProposal(this.data.proposal.id, reason!, this.generatedUUID)
        .subscribe({
          next: (value) => {
            this.closeErrorCard();
            this.toastService.show('proposal.approve.success');
            this.loading = false;
            if(value.prescriptionId) {
              this.closeDialog({prescriptionId: value.prescriptionId});
            }
          },
          error: (err) => {
            this.loading = false;
            this.showErrorCard('common.somethingWentWrong', err)
          }
        });
    }
  }
}
