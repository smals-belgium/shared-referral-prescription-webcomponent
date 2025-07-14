import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { NgIf } from '@angular/common';
import { Person, PrescriptionCancellation, ReadPrescription } from '../../interfaces';
import { OverlaySpinnerComponent } from '../../components/overlay-spinner/overlay-spinner.component';
import { ToastService } from '../../services/toast.service';
import { PrescriptionState } from '../../states/prescription.state';
import { v4 as uuidv4 } from 'uuid';
import { ErrorCardComponent } from '../../components/error-card/error-card.component';
import { BaseDialog } from '../base.dialog';
import { tap } from 'rxjs/operators';
import { ProposalState } from '@reuse/code/states/proposal.state';
import { TemplateNamePipe } from '@reuse/code/pipes/template-name.pipe';

interface CancelMedicalDocumentDialogData {
  prescription: ReadPrescription;
  patient: Person;
}

@Component({
  templateUrl: './cancel-medical-document-dialog.component.html',
  styleUrls: ['./cancel-medical-document-dialog.component.scss'],
  imports: [
    TranslateModule,
    MatDialogModule,
    MatButtonModule,
    OverlaySpinnerComponent,
    NgIf,
    ErrorCardComponent,
    TemplateNamePipe
  ]
})
export class CancelMedicalDocumentDialog extends BaseDialog implements OnInit {

  readonly prescription: ReadPrescription;
  readonly patient: Person;
  loading = false;
  generatedUUID = '';

  constructor(
    private readonly prescriptionStateService: PrescriptionState,
    private readonly proposalStateService: ProposalState,
    private readonly toastService: ToastService,
    dialogRef: MatDialogRef<CancelMedicalDocumentDialog>,
    @Inject(MAT_DIALOG_DATA) private readonly data: CancelMedicalDocumentDialogData,
  ) {
    super(dialogRef)
    this.prescription = data.prescription;
    this.patient = data.patient;
  }

  ngOnInit() {
    this.generatedUUID = uuidv4();
  }

  cancelPrescription(): void {
    const cancellation = {
      reason: undefined,
    } as PrescriptionCancellation;

    this.loading = true;
    this.prescriptionStateService
      .cancelMedicalDocument(this.prescription.id, cancellation, this.generatedUUID)
      .pipe(this.getMedicalDocument())
      .subscribe({
        next: () => {
          this.closeErrorCard();
          this.toastService.show(this.isProposal() ? 'proposal.cancel.success' : 'prescription.cancel.success');
          this.closeDialog(true);
        },
        error: (err) => {
          this.loading = false;
          this.showErrorCard('common.somethingWentWrong', err)
        },
      });
  }

  private getMedicalDocument() {
    if (this.isProposal()) {
      return tap(() => this.proposalStateService.loadProposal(this.prescription.id));
    }
    return tap(() => this.prescriptionStateService.loadPrescription(this.prescription.id));
  }

  protected isProposal(): boolean {
    return this.prescription.intent?.toLowerCase() === 'proposal'
  }
}
