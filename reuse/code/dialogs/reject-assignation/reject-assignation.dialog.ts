import { Component, inject, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { TemplateNamePipe } from '@reuse/code/pipes/template-name.pipe';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { v4 as uuidv4 } from 'uuid';
import { AlertComponent } from '@reuse/code/components/alert-component/alert.component';
import { PersonResource, ReadRequestResource, RequestTaskResource } from '@reuse/code/openapi';
import { ProposalState } from '@reuse/code/states/api/proposal.state';
import { isProposal } from '@reuse/code/utils/utils';
import { Observable } from 'rxjs';
import { TranslateByIntentPipe } from '@reuse/code/pipes/translate-by-intent.pipe';
import { AlertType } from '@reuse/code/interfaces';
import { OverlaySpinnerComponent } from '@reuse/code/components/progress-indicators/overlay-spinner/overlay-spinner.component';
import { AlertService } from '@reuse/code/services/helpers/alert.service';
import { finalize } from 'rxjs/operators';

interface RejectAssignationDialogData {
  prescription: ReadRequestResource;
  requestTask: RequestTaskResource;
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
    AlertComponent,
    TranslateByIntentPipe,
  ],
})
export class RejectAssignationDialog implements OnInit, OnDestroy {
  private readonly alertService = inject(AlertService);

  private readonly ERROR_REJECT_ASSIGNATION_DIALOG = 'reject-assignation-dialog';
  protected readonly error = this.alertService.setTarget(this.ERROR_REJECT_ASSIGNATION_DIALOG);

  protected readonly AlertType = AlertType;
  readonly prescription: ReadRequestResource;
  readonly patient?: PersonResource;
  readonly requestTask: RequestTaskResource;
  loading = false;
  generatedUUID = '';

  constructor(
    private readonly prescriptionStateService: PrescriptionState,
    private readonly proposalStateService: ProposalState,
    private readonly toastService: ToastService,
    private readonly dialogRef: MatDialogRef<RejectAssignationDialog>,
    @Inject(MAT_DIALOG_DATA) private readonly data: RejectAssignationDialogData
  ) {
    this.prescription = data.prescription;
    this.patient = data.patient;
    this.requestTask = data.requestTask;
  }

  ngOnInit() {
    this.generatedUUID = uuidv4();
    this.alertService.setActive(this.ERROR_REJECT_ASSIGNATION_DIALOG);
  }

  onReject(): void {
    if (!this.prescription.id || !this.requestTask.id) {
      this.alertService.showGeneralError(this.ERROR_REJECT_ASSIGNATION_DIALOG);
      return;
    }

    this.loading = true;
    if (isProposal(this.prescription.intent)) {
      this.rejectAssignment(
        () =>
          this.proposalStateService.rejectAssignation(this.prescription.id!, this.requestTask.id!, this.generatedUUID),
        'proposal'
      );
    } else {
      this.rejectAssignment(
        () =>
          this.prescriptionStateService.rejectAssignation(
            this.prescription.id!,
            this.requestTask.id!,
            this.generatedUUID
          ),
        'prescription'
      );
    }
  }

  private rejectAssignment(serviceCall: () => Observable<void>, successPrefix: string) {
    serviceCall()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.toastService.show(successPrefix + '.rejectAssignation.success');
          this.dialogRef.close(true);
        },
      });
  }

  protected dismissError() {
    this.alertService.clear(this.ERROR_REJECT_ASSIGNATION_DIALOG);
  }

  ngOnDestroy() {
    this.clearAlertService();
  }

  clearAlertService() {
    this.alertService.resetActive();
    this.alertService.remove(this.ERROR_REJECT_ASSIGNATION_DIALOG);
  }
}
