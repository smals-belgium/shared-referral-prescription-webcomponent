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
import {ProposalService} from "../services/proposal.service";

@Injectable({providedIn: 'root'})
export class PrescriptionState extends BaseState<ReadPrescription> {

  constructor(
    private prescriptionService: PrescriptionService,
    private performerTaskService: TaskService,
    private proposalService: ProposalService
  ) {
    super();
  }

  loadPrescription(id: string): void {
    this.load(this.prescriptionService.findOne(id));
  }

  loadPrescriptionByShortCode(shortCode: string, ssin: string): void {
    this.load(this.prescriptionService.findOneByShortCode(shortCode, ssin));
  }

  assignPrescriptionPerformer(prescriptionId: string, referralTaskId: string, healthcareProvider: HealthcareProvider, generatedUUID: string) {
    if(healthcareProvider.type === 'Professional') {
      return this.prescriptionService
        .assignCaregiver(prescriptionId, referralTaskId, {
          ssin: (healthcareProvider as Professional).ssin!,
          role: (healthcareProvider as Professional).profession
        }, generatedUUID)
        .pipe(tap(() => this.loadPrescription(prescriptionId)));
    }
    else{
      return this.prescriptionService
        .assignOrganization(prescriptionId, referralTaskId, {
          nihdi: (healthcareProvider as Organization).nihdi!,
          institutionTypeCode: (healthcareProvider as Organization).institutionTypeCode!
        }, generatedUUID)
        .pipe(tap(() => this.loadPrescription(prescriptionId)));
    }
  }



  assignPrescriptionToMe(prescriptionId: string, referralTaskId: string, professional: {
    ssin: string
  }, generatedUUID: string) {
    return this.prescriptionService
      .assignCaregiver(prescriptionId, referralTaskId, {
        ssin: professional.ssin!,
        role: 'NURSE'
      }, generatedUUID)
      .pipe(tap(() => this.loadPrescription(prescriptionId)));
  }

  assignAndStartPrescriptionExecution(prescriptionId: string, referralTaskId: string, professional: {
    ssin: string
  }, generatedUUID: string, executionStart: PrescriptionExecutionStart) {
    return this.prescriptionService
      .assignCaregiver(prescriptionId, referralTaskId, {
        ssin: professional.ssin!,
        role: 'NURSE'
      }, generatedUUID, executionStart.startDate)
      .pipe(tap(() => this.loadPrescription(prescriptionId)));
  }

  transferAssignation(prescriptionId: string, referralTaskId: string, performerTaskId: string, professional: {
    ssin: string
  }, generatedUUID: string) {
    return this.prescriptionService
      .transferAssignation(prescriptionId, referralTaskId, performerTaskId, {
        ssin: professional.ssin!,
        role: 'NURSE'
      }, generatedUUID)
      .pipe(tap(() => this.loadPrescription(prescriptionId)));
  }

  cancelPrescription(prescriptionId: string, _cancellation: PrescriptionCancellation, generatedUUID: string) {
    return this.prescriptionService.cancel(prescriptionId, generatedUUID)
      .pipe(tap(() => this.loadPrescription(prescriptionId)));
  }

  rejectAssignation(prescriptionId: string, performerTaskId: string, generatedUUID: string) {
    return this.prescriptionService.rejectAssignation(prescriptionId, performerTaskId, generatedUUID)
      .pipe(tap(() => this.loadPrescription(prescriptionId)));
  }

  startPrescriptionExecution(prescriptionId: string, performerTaskId: string, executionStart: PrescriptionExecutionStart, generatedUUID: string) {
    return this.performerTaskService.startExecution(performerTaskId, executionStart, generatedUUID)
      .pipe(tap(() => this.loadPrescription(prescriptionId)));
  }

  restartExecution(prescriptionId: string, performerTaskId: string, generatedUUID: string) {
    return this.performerTaskService.restartExecution(performerTaskId, generatedUUID)
      .pipe(tap(() => this.loadPrescription(prescriptionId)));
  }

  finishPrescriptionExecution(prescriptionId: string, performerTaskId: string, executionFinish: PrescriptionExecutionFinish, generatedUUID: string) {
    return this.performerTaskService.finishExecution(performerTaskId, executionFinish, generatedUUID)
      .pipe(tap(() => this.loadPrescription(prescriptionId)));
  }

  cancelPrescriptionExecution(prescriptionId: string, performerTaskId: string, generatedUUID: string) {
    return this.performerTaskService.cancelExecution(performerTaskId, generatedUUID)
      .pipe(tap(() => this.loadPrescription(prescriptionId)));
  }

  interruptPrescriptionExecution(prescriptionId: string, performerTaskId: string, generatedUUID: string) {
    return this.performerTaskService.interruptExecution(performerTaskId, generatedUUID)
      .pipe(tap(() => this.loadPrescription(prescriptionId)));
  }

  createPrescriptionFromProposal(proposalId: string, proposal: CreatePrescriptionRequest, generatedUUID: string) {
    return this.prescriptionService.createPrescriptionFromProposal(proposalId, proposal, generatedUUID)
      .pipe(tap(() => this.loadPrescription(proposalId)));
  }

  rejectProposal(proposalId: string, reason: string, generatedUUID: string) {
    return this.proposalService.rejectProposal(proposalId, reason, generatedUUID)
      .pipe(tap(() => this.loadPrescription(proposalId)));
  }

  rejectProposalTask(proposalId: string, performerTaskId: string, reason: string, generatedUUID: string) {
    return this.proposalService.rejectProposalTask(performerTaskId, reason, generatedUUID)
      .pipe(tap(() => this.loadPrescription(proposalId)));
  }
}
