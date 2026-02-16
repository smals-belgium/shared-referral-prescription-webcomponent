import { Component, inject, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DateTime } from 'luxon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { TranslateModule } from '@ngx-translate/core';
import { DatePipe } from '@reuse/code/pipes/date.pipe';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { map, Observable, switchMap } from 'rxjs';
import { AlertType, PrescriptionExecutionStart } from '@reuse/code/interfaces';
import { OverlaySpinnerComponent } from '@reuse/code/components/progress-indicators/overlay-spinner/overlay-spinner.component';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { MatFormFieldModule } from '@angular/material/form-field';
import { v4 as uuidv4 } from 'uuid';
import { AlertComponent } from '@reuse/code/components/alert-component/alert.component';
import { BaseDialog } from '@reuse/code/dialogs/base.dialog';
import { PerformerTaskResource, ReadRequestResource } from '@reuse/code/openapi';
import { SSIN_CLAIM_KEY, USER_PROFILE_CLAIM_KEY } from '@reuse/code/services/auth/auth-constants';

interface StartExecutionPrescriptionDialogData {
  prescription: ReadRequestResource;
  performerTask: PerformerTaskResource;
  startTreatmentDate: string;
}

@Component({
  templateUrl: './start-execution-prescription.dialog.html',
  styleUrls: ['./start-execution-prescription.dialog.scss'],
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    TranslateModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatDatepickerModule,
    OverlaySpinnerComponent,
    DatePipe,
    AlertComponent,
  ],
})
export class StartExecutionPrescriptionDialog extends BaseDialog implements OnInit {

  private readonly _prescriptionStateService = inject(PrescriptionState);
  private readonly _authService = inject(AuthService);
  private readonly _toastService = inject(ToastService);

  protected readonly AlertType = AlertType;
  readonly prescription: ReadRequestResource;
  readonly performerTask: PerformerTaskResource;

  readonly formGroup = new FormGroup({
    startDate: new FormControl<DateTime>(DateTime.now()),
  });
  loading = false;
  minDate: string = "";
  readonly maxDate = DateTime.now().toISO();
  generatedUUID = '';

  constructor(
    dialogRef: MatDialogRef<StartExecutionPrescriptionDialog>,
    @Inject(MAT_DIALOG_DATA) private readonly data: StartExecutionPrescriptionDialogData
  ) {
    super(dialogRef);
    this.prescription = data.prescription;
    this.performerTask = data.performerTask;

    this.computeMinDate(data)
  }

  ngOnInit() {
    this.generatedUUID = uuidv4();
  }

  startExecution(): void {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.valid) {
      const values = this.formGroup.value;
      const executionStart: PrescriptionExecutionStart = {
        startDate: values.startDate?.toFormat('yyyy-MM-dd'),
      };
      this.loading = true;
      if (this.performerTask) {
        this.startExecutionForTask(this.performerTask, executionStart);
      } else {
        this.assignAndStartExecution(executionStart);
      }
    }
  }

  private startExecutionForTask(task: PerformerTaskResource, executionStart: PrescriptionExecutionStart): void {
    if (!this.prescription.id || !task.id) {
      this.showErrorCard('common.somethingWentWrong');
      return;
    }

    this._prescriptionStateService
      .startPrescriptionExecution(this.prescription.id, task.id, executionStart, this.generatedUUID)
      .subscribe({
        next: () => {
          this.closeErrorCard();
          this._toastService.show('prescription.startExecution.success');
          this.closeDialog(true);
        },
        error: err => {
          this.loading = false;
          this.showErrorCard('common.somethingWentWrong', err);
        },
      });
  }

  private assignAndStartExecution(executionStart: PrescriptionExecutionStart): void {
    if (!this.prescription.id || !this.prescription.referralTask?.id) {
      this.showErrorCard('common.somethingWentWrong');
      return;
    }

    let discipline: string;
    this._authService.discipline().subscribe(disc => {
      discipline = disc;
    });
    this.getCurrentUserSsin()
      .pipe(
        switchMap(ssin =>
          this._prescriptionStateService.assignAndStartPrescriptionExecution(
            this.prescription.id!,
            this.prescription.referralTask!.id!,
            { ssin, discipline },
            this.generatedUUID,
            executionStart
          )
        )
      )
      .subscribe({
        next: () => {
          this.closeErrorCard();
          this._toastService.show('prescription.startExecution.success');
          this.closeDialog(true);
        },
        error: err => {
          this.loading = false;
          this.showErrorCard('common.somethingWentWrong', err);
        },
      });
  }

  private getCurrentUserSsin(): Observable<string> {
    return this._authService.getClaims().pipe(map(claims => claims?.[USER_PROFILE_CLAIM_KEY]?.[SSIN_CLAIM_KEY] ?? ''));
  }

  private computeMinDate(data: StartExecutionPrescriptionDialogData){

    const authoredOn = data?.prescription?.authoredOn;
    const validityStartDate = data.prescription?.period?.start;

    if (validityStartDate && authoredOn){
      if(validityStartDate < authoredOn){
        this.minDate = validityStartDate
      }else if(
        (validityStartDate >= authoredOn)
      ){
        this.minDate = authoredOn
      }
    }
  }
}
