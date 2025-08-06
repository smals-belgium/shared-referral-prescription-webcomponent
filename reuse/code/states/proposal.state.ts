import { Injectable } from '@angular/core';
import { PrescriptionCancellation, Professional, ReadPrescription } from '../interfaces';
import { BaseState } from './base.state';
import { ProposalService } from '../services/proposal.service';
import { tap } from 'rxjs/operators';
import { HealthcareProvider } from '@reuse/code/interfaces/healthcareProvider.interface';
import { Organization } from '@reuse/code/interfaces/organization.interface';

@Injectable({providedIn: 'root'})
export class ProposalState extends BaseState<ReadPrescription> {

  constructor(
    private readonly proposalService: ProposalService
  ) {
    super();
  }

  loadProposal(id: string): void {
    this.load(this.proposalService.findOne(id));
  }

  assignProposal(proposalId: string, referralTaskId: string, healthcareProvider: HealthcareProvider, generatedUUID: string) {
    if(healthcareProvider.type === 'Professional') {
      return this.proposalService
        .assignCaregiver(proposalId, referralTaskId, {
          ssin: (healthcareProvider as Professional).id!.ssin!,
          role: (healthcareProvider as Professional).id!.profession!
        }, generatedUUID)
        .pipe(tap(() => this.loadProposal(proposalId)));
    }
    else{
      const ho = healthcareProvider as Organization
      const nihdi = (ho.nihii8 ?? ho.nihii8) + ho.qualificationCode;
      return this.proposalService
        .assignOrganization(proposalId, referralTaskId, {
          nihdi: nihdi,
          institutionTypeCode: ho.typeCode
        }, generatedUUID)
        .pipe(tap(() => this.loadProposal(proposalId)));
    }
  }

  assignProposalToMe(proposalId: string, referralTaskId: string, professional: {
    ssin: string,
    discipline: string
  }, generatedUUID: string) {
    return this.proposalService
      .assignCaregiver(proposalId, referralTaskId, {
        ssin: professional.ssin!,
        role: professional.discipline.toUpperCase()
      }, generatedUUID)
      .pipe(tap(() => this.loadProposal(proposalId)));
  }

  transferAssignation(proposalId: string, referralTaskId: string, performerTaskId: string, professional: {
    ssin: string,
    discipline: string
  }, generatedUUID: string) {
    return this.proposalService
      .transferAssignation(proposalId, referralTaskId, performerTaskId, {
        ssin: professional.ssin!,
        role: professional.discipline.toUpperCase()
      }, generatedUUID)
      .pipe(tap(() => this.loadProposal(proposalId)));
  }

  cancelProposal(proposalId: string, _cancellation: PrescriptionCancellation, generatedUUID: string) {
    return this.proposalService.cancel(proposalId, generatedUUID)
      .pipe(tap(() => this.loadProposal(proposalId)));
  }

  rejectAssignation(proposalId: string, performerTaskId: string, generatedUUID: string) {
    return this.proposalService.rejectAssignation(proposalId, performerTaskId, generatedUUID)
      .pipe(tap(() => this.loadProposal(proposalId)));
  }

  approveProposal(proposalId: string, generatedUUID: string, reason?: string, kid?: string, pseudonymizedKey?: string) {
    return this.proposalService.approveProposal(proposalId, generatedUUID, reason, kid, pseudonymizedKey)
      .pipe(tap(() => this.loadProposal(proposalId)));
  }

  rejectProposal(proposalId: string, generatedUUID: string, reason?: string, kid?: string, pseudonymizedKey?: string) {
    return this.proposalService.rejectProposal(proposalId, generatedUUID, reason, kid, pseudonymizedKey)
      .pipe(tap(() => this.loadProposal(proposalId)));
  }

  rejectProposalTask(proposalId: string, performerTaskId: string, generatedUUID: string, reason?: string | null) {
    return this.proposalService.rejectProposalTask(performerTaskId, generatedUUID, reason)
      .pipe(tap(() => this.loadProposal(proposalId)));
  }

  resetProposal() {
    this.reset();
  }
}
