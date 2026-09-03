import { Component, inject, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DateTime } from 'luxon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { TranslateModule } from '@ngx-translate/core';
import { DatePipe } from '@reuse/code/pipes/date.pipe';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { combineLatest, map, Observable, switchMap, of, EMPTY } from 'rxjs';
import { AlertType, PrescriptionExecutionStart } from '@reuse/code/interfaces';
import { OverlaySpinnerComponent } from '@reuse/code/components/progress-indicators/overlay-spinner/overlay-spinner.component';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { MatFormFieldModule } from '@angular/material/form-field';
import { v4 as uuidv4 } from 'uuid';
import { AlertComponent } from '@reuse/code/components/alert-component/alert.component';
import { AssignationType, FhirR4TaskStatus, PerformerTaskResource, ReadRequestResource } from '@reuse/code/openapi';
import { SSIN_CLAIM_KEY, USER_PROFILE_CLAIM_KEY } from '@reuse/code/services/auth/auth-constants';
import { AlertService } from '@reuse/code/services/helpers/alert.service';
import { finalize, tap } from 'rxjs/operators';

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
export class StartExecutionPrescriptionDialog implements OnInit, OnDestroy {
  private readonly _prescriptionStateService = inject(PrescriptionState);
  private readonly _authService = inject(AuthService);
  private readonly _toastService = inject(ToastService);

  private readonly alertService = inject(AlertService);

  private readonly ERROR_START_EXECUTION_DIALOG = 'start-execution-dialog';
  protected readonly error = this.alertService.setTarget(this.ERROR_START_EXECUTION_DIALOG);

  protected readonly AlertType = AlertType;
  readonly prescription: ReadRequestResource;
  readonly performerTask: PerformerTaskResource;

  readonly formGroup = new FormGroup({
    startDate: new FormControl<DateTime>(DateTime.now()),
  });
  loading = false;
  minDate: string = '';
  readonly maxDate = DateTime.now().toISO();
  generatedUUID = '';

  constructor(
    private readonly dialogRef: MatDialogRef<StartExecutionPrescriptionDialog>,
    @Inject(MAT_DIALOG_DATA) private readonly data: StartExecutionPrescriptionDialogData
  ) {
    this.prescription = data.prescription;
    this.performerTask = data.performerTask;

    this.computeMinDate(data);
  }

  ngOnInit() {
    this.generatedUUID = uuidv4();
    this.alertService.setActive(this.ERROR_START_EXECUTION_DIALOG);
  }

  startExecution(): void {
    const allowedTaskStatuses: FhirR4TaskStatus[] = [
      FhirR4TaskStatus.Completed,
      FhirR4TaskStatus.Cancelled,
      FhirR4TaskStatus.Onhold,
    ];

    this.formGroup.markAllAsTouched();
    if (this.formGroup.valid) {
      const values = this.formGroup.value;
      const executionStart: PrescriptionExecutionStart = {
        startDate: values.startDate?.toFormat('yyyy-MM-dd'),
      };
      this.loading = true;
      this.shouldAssignAndStartExecution(allowedTaskStatuses)
        .pipe(
          switchMap(shouldAssign =>
            shouldAssign
              ? this.assignAndStartExecution(executionStart)
              : this.startExecutionForTask(this.performerTask, executionStart)
          ),
          finalize(() => (this.loading = false))
        )
        .subscribe(() => this.dialogRef.close(true));
    }
  }

  private shouldAssignAndStartExecution(allowedTaskStatuses: FhirR4TaskStatus[]): Observable<boolean> {
    if (
      !this.performerTask ||
      (!!this.performerTask.status && allowedTaskStatuses.includes(this.performerTask.status))
    ) {
      return of(true);
    }
    if (!this.performerTask.careGiverSsin) {
      return of(false);
    }
    return this.getCurrentUserSsin().pipe(
      map(currentUserSsin => !!currentUserSsin && currentUserSsin !== this.performerTask.careGiverSsin)
    );
  }

  private startExecutionForTask(
    task: PerformerTaskResource,
    executionStart: PrescriptionExecutionStart
  ): Observable<any> {
    if (!this.prescription.id || !task.id) {
      this.alertService.showGeneralError(this.ERROR_START_EXECUTION_DIALOG);
      return EMPTY;
    }

    return this._prescriptionStateService
      .startPrescriptionExecution(this.prescription.id, task.id, executionStart, this.generatedUUID)
      .pipe(tap(() => this._toastService.show('prescription.startExecution.success')));
  }

  private assignAndStartExecution(executionStart: PrescriptionExecutionStart): Observable<any> {
    if (!this.prescription.id || !this.prescription.referralTask?.id) {
      this.alertService.showGeneralError(this.ERROR_START_EXECUTION_DIALOG);
      return EMPTY;
    }

    return combineLatest({
      ssin: this.getCurrentUserSsin(),
      discipline: this._authService.discipline(),
      organizationNihii: this._authService.getConnectedOrganizationNihii(),
    }).pipe(
      switchMap(({ ssin, discipline, organizationNihii }) =>
        this._prescriptionStateService.assignAndStartPrescriptionExecution(
          this.prescription.id!,
          this.prescription.referralTask!.id!,
          { ssin, discipline },
          this.generatedUUID,
          executionStart,
          organizationNihii ? AssignationType.Internal : AssignationType.External,
          organizationNihii
        )
      ),
      tap(() => this._toastService.show('prescription.startExecution.success'))
    );
  }

  private getCurrentUserSsin(): Observable<string> {
    return this._authService.getClaims().pipe(map(claims => claims?.[USER_PROFILE_CLAIM_KEY]?.[SSIN_CLAIM_KEY] ?? ''));
  }

  private computeMinDate(data: StartExecutionPrescriptionDialogData) {
    const authoredOn = data?.prescription?.authoredOn;
    const validityStartDate = data.prescription?.period?.start;

    if (validityStartDate && authoredOn) {
      if (validityStartDate < authoredOn) {
        this.minDate = validityStartDate;
      } else if (validityStartDate >= authoredOn) {
        this.minDate = authoredOn;
      }
    }
  }

  protected dismissError() {
    this.alertService.clear(this.ERROR_START_EXECUTION_DIALOG);
  }

  ngOnDestroy() {
    this.clearAlertService();
  }

  clearAlertService() {
    this.alertService.resetActive();
    this.alertService.remove(this.ERROR_START_EXECUTION_DIALOG);
  }
}
