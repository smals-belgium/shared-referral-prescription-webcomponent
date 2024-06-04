import { Injectable } from '@angular/core';
import { PrescriptionService } from '../services/prescription.service';
import { TaskService } from '../services/fhir/task.service';
import {
  CreatePrescriptionRequest,
  PrescriptionCancellation,
  PrescriptionExecutionFinish,
  PrescriptionExecutionStart,
  Professional,
  ReadPrescription
} from '../interfaces';
import { BaseState } from './base.state';
import { tap } from 'rxjs/operators';
import { Organization } from '../interfaces/organization.interface';
import { HealthcareProvider } from '../interfaces/healthcareProvider.interface';

@Injectable({providedIn: 'root'})
export class PrescriptionState extends BaseState<ReadPrescription> {

  constructor(
    private prescriptionService: PrescriptionService,
    private performerTaskService: TaskService
  ) {
    super();
  }

  loadPrescription(id: string): void {
    this.load(this.prescriptionService.findOne(id));
  }

  assignPrescriptionPerformer(prescriptionId: string, referralTaskId: string, healthcareProvider: HealthcareProvider) {
    if(healthcareProvider.type === 'Professional') {
      return this.prescriptionService
        .assignCaregiver(prescriptionId, referralTaskId, {
          ssin: (healthcareProvider as Professional).ssin!,
          role: (healthcareProvider as Professional).profession
        })
        .pipe(tap(() => this.loadPrescription(prescriptionId)));
    }
    else{
      return this.prescriptionService
        .assignOrganization(prescriptionId, referralTaskId, {
          nihdi: (healthcareProvider as Organization).nihdi!,
          institutionTypeCode: (healthcareProvider as Organization).institutionTypeCode!
        })
        .pipe(tap(() => this.loadPrescription(prescriptionId)));
    }
  }



  assignPrescriptionToMe(prescriptionId: string, referralTaskId: string, professional: {
    ssin: string
  }) {
    return this.prescriptionService
      .assignCaregiver(prescriptionId, referralTaskId, {
        ssin: professional.ssin!,
        role: 'NURSE'
      })
      .pipe(tap(() => this.loadPrescription(prescriptionId)));
  }

  assignAndStartPrescriptionExecution(prescriptionId: string, referralTaskId: string, professional: {
    ssin: string
  }, executionStart: PrescriptionExecutionStart) {
    return this.prescriptionService
      .assignCaregiver(prescriptionId, referralTaskId, {
        ssin: professional.ssin!,
        role: 'NURSE'
      }, executionStart.startDate)
      .pipe(tap(() => this.loadPrescription(prescriptionId)));
  }

  transferAssignation(prescriptionId: string, referralTaskId: string, performerTaskId: string, professional: {
    ssin: string
  }) {
    return this.prescriptionService
      .transferAssignation(prescriptionId, referralTaskId, performerTaskId, {
        ssin: professional.ssin!,
        role: 'NURSE'
      })
      .pipe(tap(() => this.loadPrescription(prescriptionId)));
  }

  cancelPrescription(prescriptionId: string, _cancellation: PrescriptionCancellation) {
    return this.prescriptionService.cancel(prescriptionId)
      .pipe(tap(() => this.loadPrescription(prescriptionId)));
  }

  rejectAssignation(prescriptionId: string, performerTaskId: string) {
    return this.prescriptionService.rejectAssignation(prescriptionId, performerTaskId)
      .pipe(tap(() => this.loadPrescription(prescriptionId)));
  }

  startPrescriptionExecution(prescriptionId: string, performerTaskId: string, executionStart: PrescriptionExecutionStart) {
    return this.performerTaskService.startExecution(performerTaskId, executionStart)
      .pipe(tap(() => this.loadPrescription(prescriptionId)));
  }

  restartExecution(prescriptionId: string, performerTaskId: string) {
    return this.performerTaskService.restartExecution(performerTaskId)
      .pipe(tap(() => this.loadPrescription(prescriptionId)));
  }

  finishPrescriptionExecution(prescriptionId: string, performerTaskId: string, executionFinish: PrescriptionExecutionFinish) {
    return this.performerTaskService.finishExecution(performerTaskId, executionFinish)
      .pipe(tap(() => this.loadPrescription(prescriptionId)));
  }

  cancelPrescriptionExecution(prescriptionId: string, performerTaskId: string) {
    return this.performerTaskService.cancelExecution(performerTaskId)
      .pipe(tap(() => this.loadPrescription(prescriptionId)));
  }

  interruptPrescriptionExecution(prescriptionId: string, performerTaskId: string) {
    return this.performerTaskService.interruptExecution(performerTaskId)
      .pipe(tap(() => this.loadPrescription(prescriptionId)));
  }

  createPrescriptionFromProposal(proposalId: string, proposal: CreatePrescriptionRequest) {
    return this.prescriptionService.createPrescriptionFromProposal(proposalId, proposal)
      .pipe(tap(() => this.loadPrescription(proposalId)));
  }
}
