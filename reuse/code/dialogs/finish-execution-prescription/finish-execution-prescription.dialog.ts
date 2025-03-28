import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DateTime } from 'luxon';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { NgIf } from '@angular/common';
import { DatePipe } from '../../pipes/date.pipe';
import { OverlaySpinnerComponent } from '../../components/overlay-spinner/overlay-spinner.component';
import { ToastService } from '../../services/toast.service';
import { PerformerTask, PrescriptionExecutionFinish, ReadPrescription } from '../../interfaces';
import { PrescriptionState } from '../../states/prescription.state';
import { v4 as uuidv4 } from 'uuid';
import { ErrorCardComponent } from '../../components/error-card/error-card.component';
import { BaseDialog } from '../base.dialog';

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
        NgIf,
        ErrorCardComponent
    ]
})
export class FinishExecutionPrescriptionDialog extends BaseDialog implements OnInit {

  readonly formGroup = new FormGroup({
    endDate: new FormControl<DateTime>(DateTime.now())
  });
  loading = false;
  readonly minDate = this.data.startExecutionDate;
  readonly maxDate = DateTime.now().toISO();
  generatedUUID = '';

  constructor(
    private prescriptionStateService: PrescriptionState,
    private toastService: ToastService,
    dialogRef: MatDialogRef<FinishExecutionPrescriptionDialog>,
    @Inject(MAT_DIALOG_DATA) private data: {
      prescription: ReadPrescription,
      performerTask: PerformerTask,
      startExecutionDate: string
    }
  ) {
    super(dialogRef)
  }

  ngOnInit() {
    this.generatedUUID = uuidv4();
  }

  finishExecution(): void {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.valid) {
      const values = this.formGroup.value;
      const executionFinish: PrescriptionExecutionFinish = {
        endDate: values.endDate?.toFormat('yyyy-MM-dd')
      };
      this.loading = true;
      this.prescriptionStateService
        .finishPrescriptionExecution(this.data.prescription.id!, this.data.performerTask.id, executionFinish, this.generatedUUID)
        .subscribe({
          next: () => {
            this.closeErrorCard();
            this.toastService.show('prescription.finishExecution.success');
            this.closeDialog(true);
          },
          error: (err) => {
            this.loading = false;
            this.showErrorCard('common.somethingWentWrong', err)
          }
        });
    }
  }
}
