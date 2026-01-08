import { Component, Inject, OnInit } from '@angular/core';
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
import { AlertComponent } from '@reuse/code/components/alert-component/alert.component';
import { AlertType } from '@reuse/code/interfaces';

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
    AlertComponent,
    TemplateNamePipe,
    TranslateByIntentPipe,
  ],
})
export class CancelPrescriptionDialog extends BaseDialog implements OnInit {
  protected readonly AlertType = AlertType;
  readonly prescription: ReadRequestResource;
  readonly patient?: PersonResource;
  loading = false;
  generatedUUID = '';

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
    if (!this.prescription.id) {
      this.showErrorCard('common.somethingWentWrong');
      return;
    }

    this.loading = true;

    if (isProposal(this.prescription.intent)) {
      this.executeCancel(
        () => this.proposalStateService.cancelProposal(this.prescription.id!, this.generatedUUID),
        'proposal'
      );
    } else {
      this.executeCancel(
        () => this.prescriptionStateService.cancelPrescription(this.prescription.id!, this.generatedUUID),
        'prescription'
      );
    }
  }

  private executeCancel(serviceCall: () => Observable<void>, successPrefix: string) {
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
