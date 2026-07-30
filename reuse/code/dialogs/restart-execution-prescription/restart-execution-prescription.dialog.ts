import { Component, inject, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { TemplateNamePipe } from '@reuse/code/pipes/template-name.pipe';
import { OverlaySpinnerComponent } from '@reuse/code/components/progress-indicators/overlay-spinner/overlay-spinner.component';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { v4 as uuidv4 } from 'uuid';
import { AlertComponent } from '@reuse/code/components/alert-component/alert.component';
import { PerformerTaskResource, PersonResource, ReadRequestResource } from '@reuse/code/openapi';
import { AlertType } from '@reuse/code/interfaces';
import { AlertService } from '@reuse/code/services/helpers/alert.service';
import { finalize } from 'rxjs/operators';

interface RejectAssignationDialogData {
  prescription: ReadRequestResource;
  performerTask: PerformerTaskResource;
  patient: PersonResource;
}

@Component({
  templateUrl: './restart-execution-prescription.dialog.html',
  styleUrls: ['./restart-execution-prescription.dialog.scss'],
  imports: [
    TranslateModule,
    MatDialogModule,
    MatButtonModule,
    OverlaySpinnerComponent,
    TemplateNamePipe,
    AlertComponent,
  ],
})
export class RestartExecutionPrescriptionDialog implements OnInit, OnDestroy {
  private readonly alertService = inject(AlertService);

  private readonly ERROR_RESTART_EXECUTION_DIALOG = 'restart-execution-dialog';
  protected readonly error = this.alertService.setTarget(this.ERROR_RESTART_EXECUTION_DIALOG);

  protected readonly AlertType = AlertType;
  readonly prescription: ReadRequestResource;
  readonly patient: PersonResource;
  readonly performerTask: PerformerTaskResource;
  loading = false;
  generatedUUID = '';

  constructor(
    private readonly prescriptionStateService: PrescriptionState,
    private readonly toastService: ToastService,
    private readonly dialogRef: MatDialogRef<RestartExecutionPrescriptionDialog>,
    @Inject(MAT_DIALOG_DATA) private readonly data: RejectAssignationDialogData
  ) {
    this.prescription = data.prescription;
    this.patient = data.patient;
    this.performerTask = data.performerTask;
  }

  ngOnInit() {
    this.generatedUUID = uuidv4();
    this.alertService.setActive(this.ERROR_RESTART_EXECUTION_DIALOG);
  }

  restartExecution(): void {
    if (!this.prescription.id || !this.performerTask.id) {
      this.alertService.showGeneralError(this.ERROR_RESTART_EXECUTION_DIALOG);
      return;
    }

    this.loading = true;
    this.prescriptionStateService
      .restartExecution(this.prescription.id, this.performerTask.id, this.generatedUUID)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.toastService.show('prescription.restartExecution.success');
          this.dialogRef.close(true);
        },
      });
  }

  protected dismissError() {
    this.alertService.clear(this.ERROR_RESTART_EXECUTION_DIALOG);
  }

  ngOnDestroy() {
    this.clearAlertService();
  }

  clearAlertService() {
    this.alertService.resetActive();
    this.alertService.remove(this.ERROR_RESTART_EXECUTION_DIALOG);
  }
}
