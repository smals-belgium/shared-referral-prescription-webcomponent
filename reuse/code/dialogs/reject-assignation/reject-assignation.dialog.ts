import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { TemplateNamePipe } from '@reuse/code/pipes/template-name.pipe';
import { OverlaySpinnerComponent } from '@reuse/code/components/overlay-spinner/overlay-spinner.component';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { v4 as uuidv4 } from 'uuid';
import { ErrorCardComponent } from '@reuse/code/components/error-card/error-card.component';
import { BaseDialog } from '@reuse/code/dialogs/base.dialog';
import { PerformerTaskResource, PersonResource, ReadRequestResource } from '@reuse/code/openapi';
import { ProposalState } from '@reuse/code/states/api/proposal.state';
import { isProposal } from '@reuse/code/utils/utils';
import { Observable } from 'rxjs';
import { TranslateByIntentPipe } from '@reuse/code/pipes/translate-by-intent.pipe';
import { HttpErrorResponse } from '@angular/common/http';

interface RejectAssignationDialogData {
  prescription: ReadRequestResource;
  performerTask: PerformerTaskResource;
  patient: PersonResource;
}

@Component({
  templateUrl: './reject-assignation.dialog.html',
  styleUrls: ['./reject-assignation.dialog.scss'],
  imports: [
    TranslateModule,
    MatDialogModule,
    MatButtonModule,
    OverlaySpinnerComponent,
    TemplateNamePipe,
    ErrorCardComponent,
    TranslateByIntentPipe,
  ],
})
export class RejectAssignationDialog extends BaseDialog implements OnInit {
  readonly prescription: ReadRequestResource;
  readonly patient?: PersonResource;
  readonly performerTask: PerformerTaskResource;
  loading = false;
  generatedUUID = '';

  constructor(
    private readonly prescriptionStateService: PrescriptionState,
    private readonly proposalStateService: ProposalState,
    private readonly toastService: ToastService,
    dialogRef: MatDialogRef<RejectAssignationDialog>,
    @Inject(MAT_DIALOG_DATA) private readonly data: RejectAssignationDialogData
  ) {
    super(dialogRef);
    this.prescription = data.prescription;
    this.patient = data.patient;
    this.performerTask = data.performerTask;
  }

  ngOnInit() {
    this.generatedUUID = uuidv4();
  }

  onReject(): void {
    if (!this.prescription.id || !this.performerTask.id) {
      this.showErrorCard('common.somethingWentWrong');
      return;
    }

    this.loading = true;
    if (isProposal(this.prescription.intent)) {
      this.rejectAssignment(
        () =>
          this.proposalStateService.rejectAssignation(
            this.prescription.id!,
            this.performerTask.id!,
            this.generatedUUID
          ),
        'proposal'
      );
    } else {
      this.rejectAssignment(
        () =>
          this.prescriptionStateService.rejectAssignation(
            this.prescription.id!,
            this.performerTask.id!,
            this.generatedUUID
          ),
        'prescription'
      );
    }
  }

  private rejectAssignment(serviceCall: () => Observable<void>, successPrefix: string) {
    serviceCall().subscribe({
      next: () => {
        this.loading = false;
        this.closeErrorCard();
        this.toastService.show(successPrefix + '.rejectAssignation.success');
        this.closeDialog(true);
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.showErrorCard('common.somethingWentWrong', err);
      },
    });
  }
}
