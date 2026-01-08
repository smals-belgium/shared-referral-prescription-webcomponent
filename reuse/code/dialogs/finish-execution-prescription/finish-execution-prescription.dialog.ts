import { Component, Inject, OnInit } from '@angular/core';
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
import { BaseDialog } from '@reuse/code/dialogs/base.dialog';
import { PerformerTaskResource, ReadRequestResource } from '@reuse/code/openapi';

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
export class FinishExecutionPrescriptionDialog extends BaseDialog implements OnInit {
  protected readonly AlertType = AlertType;
  readonly formGroup = new FormGroup({
    endDate: new FormControl<DateTime>(DateTime.now()),
  });
  loading = false;
  readonly minDate = this.data.startExecutionDate;
  readonly maxDate = DateTime.now().toISO();
  generatedUUID = '';

  constructor(
    private prescriptionStateService: PrescriptionState,
    private toastService: ToastService,
    dialogRef: MatDialogRef<FinishExecutionPrescriptionDialog>,
    @Inject(MAT_DIALOG_DATA)
    private data: {
      prescription: ReadRequestResource;
      performerTask: PerformerTaskResource;
      startExecutionDate: string;
    }
  ) {
    super(dialogRef);
  }

  ngOnInit() {
    this.generatedUUID = uuidv4();
  }

  finishExecution(): void {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.valid) {
      const values = this.formGroup.value;
      const executionFinish: PrescriptionExecutionFinish = {
        endDate: values.endDate?.toFormat('yyyy-MM-dd'),
      };

      if (!this.data.prescription.id || !this.data.performerTask.id) {
        this.showErrorCard('common.somethingWentWrong');
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
        .subscribe({
          next: () => {
            this.closeErrorCard();
            this.toastService.show('prescription.finishExecution.success');
            this.closeDialog(true);
          },
          error: err => {
            this.loading = false;
            this.showErrorCard('common.somethingWentWrong', err);
          },
        });
    }
  }
}
