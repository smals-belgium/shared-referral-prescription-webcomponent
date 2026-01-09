import { inject, Injectable } from '@angular/core';
import { PrescriptionService } from '@reuse/code/services/api/prescription.service';
import { TaskService } from '@reuse/code/services/fhir/task.service';
import { PrescriptionExecutionFinish, PrescriptionExecutionStart } from '@reuse/code/interfaces';
import { BaseState } from '@reuse/code/states/helpers/base.state';
import { tap } from 'rxjs/operators';
import { HealthcareOrganizationResource, HealthcareProResource, ReadRequestResource } from '@reuse/code/openapi';

@Injectable({ providedIn: 'root' })
export class PrescriptionState extends BaseState<ReadRequestResource> {
  private prescriptionService = inject(PrescriptionService);
  private performerTaskService = inject(TaskService);

  loadPrescription(id: string) {
    this.load(this.prescriptionService.findOne(id));
  }

  resetPrescription() {
    this.reset();
  }

  loadPrescriptionByShortCode(shortCode: string, ssin: string): void {
    this.load(this.prescriptionService.findOneByShortCode(shortCode, ssin));
  }

  getNihdi = (ho: HealthcareOrganizationResource) => {
    return (ho.nihii8 || ho.nihii11) + (ho.qualificationCode ?? '');
  };

  assignPrescriptionPerformer(
    prescriptionId: string,
    referralTaskId: string,
    healthcareProvider: HealthcareProResource | HealthcareOrganizationResource,
    generatedUUID: string
  ) {
    if (healthcareProvider.type === 'Professional') {
      return this.prescriptionService
        .assignCaregiver(
          prescriptionId,
          referralTaskId,
          {
            ssin: (healthcareProvider as HealthcareProResource).healthcarePerson?.ssin || '',
            role: (healthcareProvider as HealthcareProResource).healthcareQualification?.id?.profession || '',
          },
          generatedUUID
        )
        .pipe(
          tap(() => {
            return this.loadPrescription(prescriptionId);
          })
        );
    } else {
      const ho = healthcareProvider as HealthcareOrganizationResource;
      const nihdi = this.getNihdi(ho);
      return this.prescriptionService
        .assignOrganization(
          prescriptionId,
          referralTaskId,
          {
            nihii: nihdi,
            institutionTypeCode: ho.typeCode || '',
          },
          generatedUUID
        )
        .pipe(tap(() => this.loadPrescription(prescriptionId)));
    }
  }

  assignPrescriptionToMe(
    prescriptionId: string,
    referralTaskId: string,
    professional: {
      ssin: string;
      discipline: string;
    },
    generatedUUID: string
  ) {
    return this.prescriptionService
      .assignCaregiver(
        prescriptionId,
        referralTaskId,
        {
          ssin: professional.ssin,
          role: professional.discipline.toUpperCase(),
        },
        generatedUUID
      )
      .pipe(tap(() => this.loadPrescription(prescriptionId)));
  }

  assignAndStartPrescriptionExecution(
    prescriptionId: string,
    referralTaskId: string,
    professional: {
      ssin: string;
      discipline: string;
    },
    generatedUUID: string,
    executionStart: PrescriptionExecutionStart
  ) {
    return this.prescriptionService
      .assignCaregiver(
        prescriptionId,
        referralTaskId,
        {
          ssin: professional.ssin,
          role: professional.discipline.toUpperCase(),
          executionStartDate: executionStart.startDate,
        },
        generatedUUID
      )
      .pipe(tap(() => this.loadPrescription(prescriptionId)));
  }

  transferAssignation(
    prescriptionId: string,
    referralTaskId: string,
    performerTaskId: string,
    professional: {
      ssin: string;
      discipline: string;
    },
    generatedUUID: string
  ) {
    return this.prescriptionService
      .transferAssignation(
        prescriptionId,
        referralTaskId,
        performerTaskId,
        {
          ssin: professional.ssin,
          role: professional.discipline.toUpperCase(),
        },
        generatedUUID
      )
      .pipe(tap(() => this.loadPrescription(prescriptionId)));
  }

  cancelPrescription(prescriptionId: string, generatedUUID: string) {
    return this.prescriptionService.cancel(prescriptionId, generatedUUID);
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

  finishPrescriptionExecution(
    prescriptionId: string,
    performerTaskId: string,
    executionFinish: PrescriptionExecutionFinish,
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
}
