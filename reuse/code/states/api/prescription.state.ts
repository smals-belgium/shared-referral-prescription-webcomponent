import { inject, Injectable } from '@angular/core';
import { PrescriptionService } from '@reuse/code/services/api/prescription.service';
import { TaskService } from '@reuse/code/services/fhir/task.service';
import { PrescriptionExecutionComplete, PrescriptionExecutionStart, TaskExecutionFinish } from '@reuse/code/interfaces';
import { BaseState } from '@reuse/code/states/helpers/base.state';
import { switchMap, tap } from 'rxjs/operators';
import {
  AssignationType,
  AssignCareGiverResource,
  PerformerTaskIdResource,
  ReadRequestResource,
  ReasonResource,
} from '@reuse/code/openapi';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { USER_PROFILE_CLAIM_KEY } from '@reuse/code/services/auth/auth-constants';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PrescriptionState extends BaseState<ReadRequestResource> {
  private readonly prescriptionService = inject(PrescriptionService);
  private readonly performerTaskService = inject(TaskService);
  private readonly authService = inject(AuthService);

  loadPrescription(id: string) {
    // Lazily fetch auth context only when loading
    const prescription$ = this.authService.isOrganization().pipe(
      switchMap(isOrganization =>
        this.authService.getClaims().pipe(
          switchMap(claims => {
            const token = claims?.[USER_PROFILE_CLAIM_KEY];
            const xActorCaregiverSsin = isOrganization ? token?.ssin : undefined;
            return this.prescriptionService.findOne(id, xActorCaregiverSsin);
          })
        )
      )
    );

    this.load(prescription$);
  }

  resetPrescription() {
    this.reset();
  }

  loadPrescriptionByShortCode(shortCode: string, ssin: string): void {
    const prescription$ = this.authService.isOrganization().pipe(
      switchMap(isOrganization =>
        this.authService.getClaims().pipe(
          switchMap(claims => {
            const token = claims?.[USER_PROFILE_CLAIM_KEY];
            const xActorCaregiverSsin = isOrganization ? token?.ssin : undefined;
            return this.prescriptionService.findOneByShortCode(shortCode, ssin, xActorCaregiverSsin);
          })
        )
      )
    );

    this.load(prescription$);
  }

  assignPrescriptionPerformer(
    prescriptionId: string,
    referralTaskId: string,
    ssinOrNihdi: string,
    role: string,
    type: string,
    generatedUUID: string,
    assignationType?: AssignationType,
    xActorOrganizationNihii11?: string
  ): Observable<PerformerTaskIdResource | PerformerTaskIdResource[]> {
    if (type.toLowerCase() === 'professional' || type.toLowerCase() === 'internal') {
      return this.prescriptionService
        .assignCaregivers(
          prescriptionId,
          referralTaskId,
          {
            ssin: ssinOrNihdi || '',
            role: role || '',
          },
          generatedUUID,
          assignationType,
          xActorOrganizationNihii11
        )
        .pipe(
          tap(() => {
            return this.loadPrescription(prescriptionId);
          })
        );
    } else {
      return this.prescriptionService
        .assignOrganization(
          prescriptionId,
          referralTaskId,
          {
            nihii: ssinOrNihdi,
            institutionTypeCode: type || '',
          },
          generatedUUID
        )
        .pipe(tap(() => this.loadPrescription(prescriptionId)));
    }
  }

  assignAndStartPrescriptionExecution(
    prescriptionId: string,
    referralTaskId: string,
    professional: {
      ssin: string;
      discipline: string;
    },
    generatedUUID: string,
    executionStart: PrescriptionExecutionStart,
    assignationType: AssignationType,
    xActorOrganization: string | undefined
  ) {
    return this.prescriptionService
      .assignCaregivers(
        prescriptionId,
        referralTaskId,
        {
          ssin: professional.ssin,
          role: professional.discipline.toUpperCase(),
          executionStartDate: executionStart.startDate,
        },
        generatedUUID,
        assignationType,
        xActorOrganization
      )
      .pipe(tap(() => this.loadPrescription(prescriptionId)));
  }

  assignMultipleCaregivers(
    prescriptionId: string,
    referralTaskId: string,
    caregivers: AssignCareGiverResource[],
    generatedUUID: string,
    assignationType: AssignationType,
    xActorOrganization: string | undefined
  ) {
    return this.prescriptionService
      .assignCaregivers(prescriptionId, referralTaskId, caregivers, generatedUUID, assignationType, xActorOrganization)
      .pipe(tap(() => this.loadPrescription(prescriptionId)));
  }

  transferAssignation(
    prescriptionId: string,
    referralTaskId: string,
    performerTaskId: string,
    ssinOrNihdi: string,
    role: string,
    type: string,
    generatedUUID: string
  ) {
    if (type.toLocaleLowerCase() === 'professional') {
      return this.prescriptionService
        .transferAssignation(
          prescriptionId,
          referralTaskId,
          performerTaskId,
          {
            ssin: ssinOrNihdi || '',
            role: role || '',
          },
          generatedUUID
        )
        .pipe(tap(() => this.loadPrescription(prescriptionId)));
    } else {
      return this.prescriptionService
        .transferAssignationToOrganization(
          prescriptionId,
          referralTaskId,
          performerTaskId,
          {
            nihii: ssinOrNihdi || '',
            institutionTypeCode: type || '',
          },
          generatedUUID
        )
        .pipe(tap(() => this.loadPrescription(prescriptionId)));
    }
  }

  cancelPrescription(prescriptionId: string, reason: ReasonResource, generatedUUID: string) {
    return this.prescriptionService.cancel(prescriptionId, reason, generatedUUID);
  }

  rejectAssignation(prescriptionId: string, performerTaskId: string, generatedUUID: string) {
    return this.prescriptionService
      .rejectAssignation(prescriptionId, performerTaskId, generatedUUID)
      .pipe(tap(() => this.loadPrescription(prescriptionId)));
  }

  startPrescriptionExecution(
    prescriptionId: string,
    performerTaskId: string,
    executionStart: PrescriptionExecutionStart,
    generatedUUID: string
  ) {
    return this.performerTaskService
      .startExecution(performerTaskId, executionStart, generatedUUID)
      .pipe(tap(() => this.loadPrescription(prescriptionId)));
  }

  restartExecution(prescriptionId: string, performerTaskId: string, generatedUUID: string) {
    return this.performerTaskService
      .restartExecution(performerTaskId, generatedUUID)
      .pipe(tap(() => this.loadPrescription(prescriptionId)));
  }

  finishTaskExecution(
    prescriptionId: string,
    performerTaskId: string,
    executionFinish: TaskExecutionFinish,
    generatedUUID: string
  ) {
    return this.performerTaskService
      .finishExecution(performerTaskId, executionFinish, generatedUUID)
      .pipe(tap(() => this.loadPrescription(prescriptionId)));
  }

  cancelPrescriptionExecution(prescriptionId: string, performerTaskId: string, generatedUUID: string) {
    return this.performerTaskService
      .cancelExecution(performerTaskId, generatedUUID)
      .pipe(tap(() => this.loadPrescription(prescriptionId)));
  }

  interruptPrescriptionExecution(prescriptionId: string, performerTaskId: string, generatedUUID: string) {
    return this.performerTaskService
      .interruptExecution(performerTaskId, generatedUUID)
      .pipe(tap(() => this.loadPrescription(prescriptionId)));
  }

  completePrescriptionExecution(
    prescriptionId: string,
    executionComplete: PrescriptionExecutionComplete,
    generatedUUID: string
  ) {
    return this.prescriptionService
      .completePrescription(prescriptionId, executionComplete, generatedUUID)
      .pipe(tap(() => this.loadPrescription(prescriptionId)));
  }

  closePrescription(prescriptionId: string, generatedUUID: string) {
    return this.prescriptionService
      .closePrescription(prescriptionId, generatedUUID)
      .pipe(tap(() => this.loadPrescription(prescriptionId)));
  }
}
