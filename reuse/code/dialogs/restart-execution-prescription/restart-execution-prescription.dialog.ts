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
    ErrorCardComponent,
  ],
})
export class RestartExecutionPrescriptionDialog extends BaseDialog implements OnInit {
  readonly prescription: ReadRequestResource;
  readonly patient: PersonResource;
  readonly performerTask: PerformerTaskResource;
  loading = false;
  generatedUUID = '';

  constructor(
    private prescriptionStateService: PrescriptionState,
    private toastService: ToastService,
    dialogRef: MatDialogRef<RestartExecutionPrescriptionDialog>,
    @Inject(MAT_DIALOG_DATA) private data: RejectAssignationDialogData
  ) {
    super(dialogRef);
    this.prescription = data.prescription;
    this.patient = data.patient;
    this.performerTask = data.performerTask;
  }

  ngOnInit() {
    this.generatedUUID = uuidv4();
  }

  restartExecution(): void {
    if (!this.prescription.id || !this.performerTask.id) {
      this.showErrorCard('common.somethingWentWrong');
      return;
    }

    this.loading = true;
    this.prescriptionStateService
      .restartExecution(this.prescription.id, this.performerTask.id, this.generatedUUID)
      .subscribe({
        next: () => {
          this.closeErrorCard();
          this.toastService.show('prescription.restartExecution.success');
          this.closeDialog(true);
        },
        error: err => {
          this.loading = false;
          this.showErrorCard('common.somethingWentWrong', err);
        },
      });
  }
}
