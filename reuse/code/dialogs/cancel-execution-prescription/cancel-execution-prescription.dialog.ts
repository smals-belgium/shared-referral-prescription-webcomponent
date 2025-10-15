import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { TemplateNamePipe } from '@reuse/code/pipes/template-name.pipe';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { v4 as uuidv4 } from 'uuid';
import { ErrorCard } from '@reuse/code/interfaces/error-card.interface';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { PerformerTaskResource, PersonResource, ReadRequestResource } from '@reuse/code/openapi';
import { HttpErrorResponse } from '@angular/common/http';
import { OverlaySpinnerComponent } from '@reuse/code/components/progress-indicators/overlay-spinner/overlay-spinner.component';
import { AlertComponent } from '@reuse/code/components/alert-component/alert.component';
import { AlertType } from '@reuse/code/interfaces';

interface CancelExecutionPrescriptionDialogData {
  prescription: ReadRequestResource;
  performerTask: PerformerTaskResource;
  patient: PersonResource;
}

@Component({
  templateUrl: './cancel-execution-prescription.dialog.html',
  styleUrls: ['./cancel-execution-prescription.dialog.scss'],
  imports: [
    TranslateModule,
    MatDialogModule,
    MatButtonModule,
    OverlaySpinnerComponent,
    TemplateNamePipe,
    AlertComponent,
  ],
})
export class CancelExecutionPrescriptionDialog implements OnInit {
  protected readonly AlertType = AlertType;

  prescription: ReadRequestResource;
  patient?: PersonResource;
  performerTask: PerformerTaskResource;
  loading = false;
  generatedUUID = '';
  errorCard: ErrorCard = {
    show: false,
    message: '',
    errorResponse: undefined,
  };

  constructor(
    private readonly prescriptionStateService: PrescriptionState,
    private readonly toastService: ToastService,
    private readonly dialogRef: MatDialogRef<CancelExecutionPrescriptionDialog>,
    @Inject(MAT_DIALOG_DATA) private readonly data: CancelExecutionPrescriptionDialogData
  ) {
    this.prescription = data.prescription;
    this.patient = data.patient;
    this.performerTask = data.performerTask;
  }

  ngOnInit() {
    this.generatedUUID = uuidv4();
  }

  cancelPrescriptionExecution(): void {
    if (!this.prescription.id || !this.performerTask.id) {
      this.errorCard = {
        show: true,
        message: 'common.somethingWentWrong',
      };
      return;
    }

    this.loading = true;
    this.prescriptionStateService
      .cancelPrescriptionExecution(this.prescription.id, this.performerTask.id, this.generatedUUID)
      .subscribe({
        next: () => {
          this.closeErrorCard();
          this.toastService.show('prescription.cancelExecution.success');
          this.dialogRef.close(true);
        },
        error: (err: HttpErrorResponse) => {
          this.loading = false;
          this.errorCard = {
            show: true,
            message: 'common.somethingWentWrong',
            errorResponse: err,
          };
        },
      });
  }

  private closeErrorCard(): void {
    this.errorCard = {
      show: false,
      message: '',
      errorResponse: undefined,
    };
  }
}
