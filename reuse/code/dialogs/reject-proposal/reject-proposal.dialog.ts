import { Component, Inject, OnInit } from '@angular/core';
import { OverlaySpinnerComponent } from '../../components/overlay-spinner/overlay-spinner.component';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { MatButton } from '@angular/material/button';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { ReadPrescription } from '../../interfaces';
import { NgIf } from '@angular/common';
import { PrescriptionState } from '../../states/prescription.state';
import {ToastService} from "../../services/toast.service";
import { v4 as uuidv4 } from 'uuid';
import { ProposalState } from '../../states/proposal.state';
import { ErrorCardComponent } from '../../components/error-card/error-card.component';
import { BaseDialog } from '../base.dialog';

@Component({
  standalone: true,
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
    private toastService: ToastService,
    private proposalStateService: ProposalState,
    dialogRef: MatDialogRef<RejectProposalDialog>,
    @Inject(MAT_DIALOG_DATA) private data: {
      proposal: ReadPrescription
    }) {
    super(dialogRef)
  }

  ngOnInit() {
    this.generatedUUID = uuidv4();
  }


  rejectProposal(): void {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.valid) {
      const reason = this.formGroup.get('reason')?.value;

      this.loading = true;
      if(!this.data.proposal.performerTasks?.length) {
        this.proposalStateService
          .rejectProposal(this.data.proposal.id, reason!, this.generatedUUID)
          .subscribe({
            next: () => {
              this.loading = false;
              this.closeErrorCard();
              this.toastService.show('proposal.reject.success');
              this.closeDialog(true);
            },
            error: (err) => {
              this.loading = false;
              this.showErrorCard('common.somethingWentWrong', err)
            }
          });
      } else {
        this.loading = false;
        const performerTasks =  this.data.proposal.performerTasks
        const lastPerformerTask = performerTasks[performerTasks.length-1]
        this.proposalStateService
          .rejectProposalTask(this.data.proposal.id, lastPerformerTask.id, reason!, this.generatedUUID)
          .subscribe({
            next: () => {
              this.loading = false;
              this.closeErrorCard();
              this.toastService.show('proposal.reject.success');
              this.closeDialog(true);
            },
            error: (err) => {
              this.loading = false;
              this.showErrorCard('common.somethingWentWrong', err)
            }
          });
      }
    }
  }
}
