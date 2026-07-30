import { Component, inject, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DateTime } from 'luxon';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { DatePipe } from '@reuse/code/pipes/date.pipe';
import { OverlaySpinnerComponent } from '@reuse/code/components/progress-indicators/overlay-spinner/overlay-spinner.component';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { AlertType, PrescriptionExecutionFinish } from '@reuse/code/interfaces';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { v4 as uuidv4 } from 'uuid';
import { AlertComponent } from '@reuse/code/components/alert-component/alert.component';
import { PerformerTaskResource, ReadRequestResource } from '@reuse/code/openapi';
import { AlertService } from '@reuse/code/services/helpers/alert.service';
import { finalize } from 'rxjs/operators';

@Component({
  templateUrl: 'finish-execution-prescription.dialog.html',
  styleUrls: ['finish-execution-prescription.dialog.scss'],
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    MatDialogModule,
    MatButtonModule,
    MatDatepickerModule,
    MatInputModule,
    OverlaySpinnerComponent,
    DatePipe,
    AlertComponent,
  ],
})
export class FinishExecutionPrescriptionDialog implements OnInit, OnDestroy {
  protected readonly AlertType = AlertType;
  private readonly alertService = inject(AlertService);

  private readonly ERROR_FINISH_EXECUTION_DIALOG = 'finish-execution-dialog';
  protected readonly error = this.alertService.setTarget(this.ERROR_FINISH_EXECUTION_DIALOG);

  readonly formGroup = new FormGroup({
    endDate: new FormControl<DateTime>(DateTime.now()),
  });
  loading = false;
  readonly minDate = this.data.startExecutionDate;
  readonly maxDate = DateTime.now().toISO();
  generatedUUID = '';

  constructor(
    private readonly prescriptionStateService: PrescriptionState,
    private readonly toastService: ToastService,
    private readonly dialogRef: MatDialogRef<FinishExecutionPrescriptionDialog>,
    @Inject(MAT_DIALOG_DATA)
    private readonly data: {
      prescription: ReadRequestResource;
      performerTask: PerformerTaskResource;
      startExecutionDate: string;
    }
  ) {}

  ngOnInit() {
    this.generatedUUID = uuidv4();
    this.alertService.setActive(this.ERROR_FINISH_EXECUTION_DIALOG);
  }

  finishExecution(): void {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.valid) {
      const values = this.formGroup.value;
      const executionFinish: PrescriptionExecutionFinish = {
        endDate: values.endDate?.toFormat('yyyy-MM-dd'),
      };

      if (!this.data.prescription.id || !this.data.performerTask.id) {
        this.alertService.showGeneralError(this.ERROR_FINISH_EXECUTION_DIALOG);
        return;
      }

      this.loading = true;
      this.prescriptionStateService
        .finishPrescriptionExecution(
          this.data.prescription.id,
          this.data.performerTask.id,
          executionFinish,
          this.generatedUUID
        )
        .pipe(finalize(() => (this.loading = false)))
        .subscribe({
          next: () => {
            this.toastService.show('prescription.finishExecution.success');
            this.dialogRef.close(true);
          },
        });
    }
  }

  protected dismissError() {
    this.alertService.clear(this.ERROR_FINISH_EXECUTION_DIALOG);
  }

  ngOnDestroy() {
    this.clearAlertService();
  }

  clearAlertService() {
    this.alertService.resetActive();
    this.alertService.remove(this.ERROR_FINISH_EXECUTION_DIALOG);
  }
}
