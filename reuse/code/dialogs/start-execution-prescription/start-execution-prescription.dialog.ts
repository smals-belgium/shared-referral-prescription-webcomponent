import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DateTime } from 'luxon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { TranslateModule } from '@ngx-translate/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { DatePipe } from '../../pipes/date.pipe';
import { TranslationPipe } from '../../pipes/translation.pipe';
import { AuthService } from '../../services/auth.service';
import { map, Observable, switchMap } from 'rxjs';
import {
  PerformerTask,
  PrescriptionExecutionStart,
  ReadPrescription
} from '../../interfaces';
import { OverlaySpinnerComponent } from '../../components/overlay-spinner/overlay-spinner.component';
import { ToastService } from '../../services/toast.service';
import { PrescriptionState } from '../../states/prescription.state';
import { MatFormFieldModule } from '@angular/material/form-field';

interface StartExecutionPrescriptionDialogData {
  prescription: ReadPrescription;
  performerTask: PerformerTask;
  startTreatmentDate: string;
}

@Component({
  standalone: true,
  templateUrl: './start-execution-prescription.dialog.html',
  styleUrls: ['./start-execution-prescription.dialog.scss'],
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    TranslateModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    TranslationPipe,
    MatDatepickerModule,
    OverlaySpinnerComponent,
    DatePipe,
    NgIf,
    AsyncPipe
  ]
})
export class StartExecutionPrescriptionDialog {

  readonly prescription: ReadPrescription;
  readonly performerTask: PerformerTask;

  readonly formGroup = new FormGroup({
    startDate: new FormControl<DateTime>(DateTime.now())
  });
  loading = false;
  readonly minDate;
  readonly maxDate = DateTime.now().toISO();

  constructor(
    private prescriptionStateService: PrescriptionState,
    private authService: AuthService,
    private toastService: ToastService,
    private dialogRef: MatDialogRef<StartExecutionPrescriptionDialog>,
    @Inject(MAT_DIALOG_DATA) private data: StartExecutionPrescriptionDialogData) {
      this.prescription = data.prescription;
      this.performerTask = data.performerTask;
      this.minDate = data.startTreatmentDate;
  }

  startExecution(): void {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.valid) {
      const values = this.formGroup.value;
      const executionStart: PrescriptionExecutionStart = {
        startDate: values.startDate?.toFormat('yyyy-MM-dd')
      };
      this.loading = true;
      if (this.performerTask) {
        this.startExecutionForTask(this.performerTask, executionStart);
      } else {
        this.assignAndStartExecution(executionStart);
      }
    }
  }

  private startExecutionForTask(task: PerformerTask, executionStart: PrescriptionExecutionStart): void {
    this.prescriptionStateService
      .startPrescriptionExecution(this.prescription.id, task.id, executionStart)
      .subscribe({
        next: () => {
          this.toastService.show('prescription.startExecution.success');
          this.dialogRef.close();
        },
        error: () => {
          this.loading = false;
          this.toastService.showSomethingWentWrong();
        }
      });
  }

  private assignAndStartExecution(executionStart: PrescriptionExecutionStart): void {
    this.getCurrentUserSsin()
      .pipe(switchMap(ssin => this.prescriptionStateService.assignAndStartPrescriptionExecution(
        this.prescription.id!,
        this.prescription.referralTask.id!,
        {ssin},
        executionStart
      )))
      .subscribe({
        next: () => {
          this.toastService.show('prescription.startExecution.success');
          this.dialogRef.close();
        },
        error: () => {
          this.loading = false;
          this.toastService.showSomethingWentWrong();
        }
      });
  }

  private getCurrentUserSsin(): Observable<string> {
    return this.authService.getClaims()
      .pipe(map(claims => claims['userProfile']['ssin']));
  }
}
