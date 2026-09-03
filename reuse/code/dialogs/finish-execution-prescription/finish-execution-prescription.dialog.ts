import { Component, computed, inject, Inject, OnDestroy, OnInit, Signal, signal, WritableSignal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DateTime } from 'luxon';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { DatePipe } from '@reuse/code/pipes/date.pipe';
import { OverlaySpinnerComponent } from '@reuse/code/components/progress-indicators/overlay-spinner/overlay-spinner.component';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { AlertType, UserInfo } from '@reuse/code/interfaces';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { v4 as uuidv4 } from 'uuid';
import { AlertComponent } from '@reuse/code/components/alert-component/alert.component';
import { FhirR4TaskStatus, PerformerTaskResource, ReadRequestResource } from '@reuse/code/openapi';
import { finalize } from 'rxjs/operators';
import { getAllPerformerTasksAsMap } from '@reuse/code/utils/prescription.util';
import { AlertService } from '@reuse/code/services/helpers/alert.service';
import { PatientState } from '@reuse/code/states/api/patient.state';
import { catchError, EMPTY, Observable, of } from 'rxjs';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { TemplateNamePipe } from '@reuse/code/pipes/template-name.pipe';
import { DialogLayoutComponent } from '@reuse/code/dialogs/dialog-layout/dialog-layout.component';
import { FormatSsinPipe } from '@reuse/code/pipes/format-ssin.pipe';

export enum FinishExecutionScenario {
  CLOSE_PRESCRIPTION_OR_FINISH_TASKS = 'CLOSE_PRESCRIPTION_OR_FINISH_TASKS',
  FINISH_TASKS = 'FINISH_TASKS',
  CLOSE_PRESCRIPTION = 'CLOSE_PRESCRIPTION',
}

export enum ExecutionType {
  FINISH = 'FINISH',
  COMPLETE = 'COMPLETE',
}
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
    MatRadioGroup,
    MatRadioButton,
    TemplateNamePipe,
    DialogLayoutComponent,
    FormatSsinPipe,
  ],
  providers: [TemplateNamePipe],
})
export class FinishExecutionPrescriptionDialog implements OnInit, OnDestroy {
  protected readonly AlertType = AlertType;
  protected readonly FinishExecutionScenario = FinishExecutionScenario;

  protected readonly ExecutionType = ExecutionType;
  private readonly _alertService = inject(AlertService);
  private readonly _fb = inject(FormBuilder);
  private readonly _templateNamePipe = inject(TemplateNamePipe);

  protected readonly patient = inject(PatientState).state().data;

  private readonly ERROR_FINISH_EXECUTION_DIALOG = 'finish-execution-dialog';
  protected readonly error = this._alertService.setTarget(this.ERROR_FINISH_EXECUTION_DIALOG);

  formGroup: FormGroup = this._fb.group({});
  loading: WritableSignal<boolean> = signal(false);
  title: WritableSignal<string> = signal('');
  readonly minDate = this.data.startExecutionDate;
  readonly maxDate = DateTime.now().toISO();
  closeDialogData: { reload?: boolean } = { reload: false };
  generatedUUID = '';

  activeCaregivers: WritableSignal<Map<string, PerformerTaskResource[]> | undefined> = signal(undefined);

  finishExecutionContext: Signal<FinishExecutionScenario> = computed(() => {
    if (this.activeCaregivers()?.size === 0 && this.currentCaregiverHasHandledExecution()) {
      return FinishExecutionScenario.CLOSE_PRESCRIPTION;
    } else if (this.activeCaregivers()?.size === 1 && this.isCurrentCaregiver()) {
      return FinishExecutionScenario.CLOSE_PRESCRIPTION_OR_FINISH_TASKS;
    } else {
      return FinishExecutionScenario.FINISH_TASKS;
    }
  });
  constructor(
    private readonly prescriptionStateService: PrescriptionState,
    private readonly toastService: ToastService,
    private readonly dialogRef: MatDialogRef<FinishExecutionPrescriptionDialog>,
    @Inject(MAT_DIALOG_DATA)
    protected readonly data: {
      prescription: ReadRequestResource;
      performerTask: PerformerTaskResource;
      connectedUser: Partial<UserInfo>;
      startExecutionDate: string;
    }
  ) {}

  ngOnInit() {
    this.generatedUUID = uuidv4();
    this._alertService.setActive(this.ERROR_FINISH_EXECUTION_DIALOG);

    this.setActiveCaregivers();

    this.initFormByScenario();
  }

  private initFormByScenario() {
    const scenario = this.finishExecutionContext();

    switch (scenario) {
      case FinishExecutionScenario.CLOSE_PRESCRIPTION_OR_FINISH_TASKS:
        this.title.set('prescription.finishExecution.dialog.title.close');
        this.formGroup = this._fb.group({
          endDate: [DateTime.now(), Validators.required],
          executionType: [ExecutionType.FINISH, Validators.required],
        });
        break;

      case FinishExecutionScenario.FINISH_TASKS:
        this.title.set('prescription.finishExecution.dialog.title.finishTasks');
        this.formGroup = this._fb.group({
          endDate: [DateTime.now(), Validators.required],
        });
        break;

      case FinishExecutionScenario.CLOSE_PRESCRIPTION:
        this.title.set('prescription.finishExecution.dialog.title.closePrescription');
        this.formGroup = this._fb.group({});
        break;
    }
  }

  finishExecution(): void {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.valid) {
      if (!this.data.prescription.id || !this.data.performerTask.id) {
        this._alertService.showGeneralError(this.ERROR_FINISH_EXECUTION_DIALOG);
        return;
      }

      this.loading.set(true);
      let serviceCalled: Observable<unknown> = of('');
      let successMessage: string = '';

      switch (this.finishExecutionContext()) {
        case FinishExecutionScenario.CLOSE_PRESCRIPTION_OR_FINISH_TASKS: {
          const endDate = this.formGroup.get('endDate')?.value as DateTime | undefined;
          const executionType = this.formGroup.get('executionType')?.value as ExecutionType | undefined;
          if (!endDate || !executionType) break;
          if (executionType === ExecutionType.FINISH) {
            serviceCalled = this.prescriptionStateService.finishTaskExecution(
              this.data.prescription.id,
              this.data.performerTask.id,
              {
                endDate: endDate?.toFormat('yyyy-MM-dd'),
              },
              this.generatedUUID
            );
            successMessage = `prescription.finishExecution.dialog.success.finishTasks`;
          } else if (executionType === ExecutionType.COMPLETE) {
            serviceCalled = this.prescriptionStateService
              .completePrescriptionExecution(
                this.data.prescription.id,
                {
                  endDate: endDate.toFormat('yyyy-MM-dd'),
                  performerTaskId: this.data.performerTask.id.toString(),
                },
                this.generatedUUID
              )
              .pipe(
                catchError(() => {
                  this.closeDialogData = { reload: true };
                  return EMPTY;
                })
              );
            successMessage = `prescription.finishExecution.dialog.success.closePrescription`;
          }
          break;
        }

        case FinishExecutionScenario.FINISH_TASKS: {
          const endDate = this.formGroup.get('endDate')?.value as DateTime | undefined;
          if (!endDate) break;

          serviceCalled = this.prescriptionStateService.finishTaskExecution(
            this.data.prescription.id,
            this.data.performerTask.id,
            {
              endDate: endDate?.toFormat('yyyy-MM-dd'),
            },
            this.generatedUUID
          );
          successMessage = `prescription.finishExecution.dialog.success.finishTasks`;
          break;
        }
        case FinishExecutionScenario.CLOSE_PRESCRIPTION:
          serviceCalled = this.prescriptionStateService.closePrescription(
            this.data.prescription.id,
            this.generatedUUID
          );
          successMessage = `prescription.finishExecution.dialog.success.closePrescription`;
          break;
      }

      serviceCalled.pipe(finalize(() => this.loading.set(false))).subscribe({
        next: () => {
          this.toastService.show(successMessage, {
            interpolation: {
              templateName: this._templateNamePipe.transform(this.data.prescription.templateCode),
            },
          });
          this.dialogRef.close(this.closeDialogData);
        },
      });
    }
  }

  protected dismissError() {
    this._alertService.clear(this.ERROR_FINISH_EXECUTION_DIALOG);
  }

  setActiveCaregivers() {
    // We assume here that there is always at least a task within the prescription, otherwise the prescription dialog wouldn't be callable
    const taskMap: Map<string, PerformerTaskResource[]> = getAllPerformerTasksAsMap(this.data.prescription)!;

    const performerTasks = new Map<string, PerformerTaskResource[]>();

    for (const [key, tasks] of taskMap.entries()) {
      const activeTasks = tasks.filter(task => task.status === FhirR4TaskStatus.Inprogress);

      if (activeTasks.length > 0) {
        performerTasks.set(key, activeTasks);
      }
    }
    this.activeCaregivers.set(performerTasks);
  }

  currentCaregiverHasHandledExecution() {
    return (
      this.data.performerTask.status === FhirR4TaskStatus.Completed ||
      this.data.performerTask.status === FhirR4TaskStatus.Onhold
    );
  }
  isCurrentCaregiver() {
    const currentSsin = this.data.connectedUser.ssin;
    const tasks = this.activeCaregivers()?.values().next().value;
    if (!tasks || tasks.length === 0) return false;
    return tasks[0].careGiverSsin === currentSsin;
  }

  ngOnDestroy() {
    this.clearAlertService();
  }

  clearAlertService() {
    this._alertService.resetActive();
    this._alertService.remove(this.ERROR_FINISH_EXECUTION_DIALOG);
  }
}
