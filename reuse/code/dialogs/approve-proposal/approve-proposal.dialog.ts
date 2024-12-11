import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastService } from '../../services/toast.service';
import { PrescriptionState } from '../../states/prescription.state';
import {
  MAT_DIALOG_DATA,
  MatDialogActions, MatDialogClose,
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
    MatDialogClose
  ],
  templateUrl: './approve-proposal.dialog.html',
  styleUrl: './approve-proposal.dialog.scss'
})
export class ApproveProposalDialog implements OnInit {

  readonly formGroup = new FormGroup({
    reason: new FormControl<string>('', Validators.required)
  });

  loading = false;
  generatedUUID = '';

  constructor(
    private toastService: ToastService,
    private prescriptionStateService: PrescriptionState,
    private dialogRef: MatDialogRef<ApproveProposalDialog>,
    @Inject(MAT_DIALOG_DATA) private data: {
      proposal: ReadPrescription
    }) {

  }

  ngOnInit() {
    this.generatedUUID = uuidv4();
  }


  approveProposal(): void {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.valid) {
      const reason = this.formGroup.get('reason')?.value;

      this.loading = true;
      this.prescriptionStateService.approveProposal(this.data.proposal.id, reason!, this.generatedUUID)
        .subscribe({
          next: (value) => {
            this.toastService.show('proposal.approve.success');
            this.loading = false;
            if(value.prescriptionId) {
              this.dialogRef.close({prescriptionId: value.prescriptionId});
            }
          },
          error: () => {
            this.loading = false;
            this.toastService.showSomethingWentWrong();
          }
        });
    }
  }
}
