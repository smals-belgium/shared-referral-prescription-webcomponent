import { inject, Injectable } from '@angular/core';
import { BaseState } from '@reuse/code/states/helpers/base.state';
import { ProposalService } from '@reuse/code/services/api/proposal.service';
import { tap } from 'rxjs/operators';
import {
  AssignCareGiverResource,
  HealthcareOrganizationResource,
  HealthcareProResource,
  ReadRequestResource,
  ReasonResource,
} from '@reuse/code/openapi';
import { isProfessional } from '@reuse/code/utils/assignment-disciplines.utils';

@Injectable({ providedIn: 'root' })
export class ProposalState extends BaseState<ReadRequestResource> {
  private proposalService = inject(ProposalService);

  loadProposal(id: string): void {
    this.load(this.proposalService.findOne(id));
  }

  approveProposal(proposalId: string, reason: ReasonResource, generatedUUID: string) {
    return this.proposalService.approveProposal(proposalId, reason, generatedUUID);
  }

  cancelProposal(proposalId: string, generatedUUID: string) {
    return this.proposalService.cancelProposal(proposalId, generatedUUID);
  }

  rejectProposal(proposalId: string, reason: ReasonResource, generatedUUID: string) {
    return this.proposalService
      .rejectProposal(proposalId, reason, generatedUUID)
      .pipe(tap(() => this.loadProposal(proposalId)));
  }

  rejectProposalTask(proposalId: string, performerTaskId: string, reason: ReasonResource, generatedUUID: string) {
    return this.proposalService
      .rejectProposalTask(performerTaskId, reason, generatedUUID)
      .pipe(tap(() => this.loadProposal(proposalId)));
  }

  assignCaregiver(
    prescriptionId: string,
    referralTaskId: string,
    caregiver: AssignCareGiverResource,
    generatedUUID: string
  ) {
    return this.proposalService.assignCaregiver(prescriptionId, referralTaskId, caregiver, generatedUUID);
  }

  assignProposalToMe(
    proposalId: string,
    referralTaskId: string,
    professional: {
      ssin: string;
      discipline: string;
    },
    generatedUUID: string
  ) {
    return this.proposalService
      .assignCaregiver(
        proposalId,
        referralTaskId,
        {
          ssin: professional.ssin!,
          role: professional.discipline.toUpperCase(),
        },
        generatedUUID
      )
      .pipe(tap(() => this.loadProposal(proposalId)));
  }

  assignProposalPerformer(
    proposalId: string,
    referralTaskId: string,
    healthcareProvider: HealthcareProResource | HealthcareOrganizationResource,
    generatedUUID: string
  ) {
    if (isProfessional(healthcareProvider)) {
      return this.proposalService
        .assignCaregiver(
          proposalId,
          referralTaskId,
          {
            ssin: healthcareProvider.healthcarePerson?.ssin ?? '',
            role: healthcareProvider.id?.profession ?? '',
          },
          generatedUUID
        )
        .pipe(tap(() => this.loadProposal(proposalId)));
    } else {
      const nihdi =
        (healthcareProvider.nihii8 ?? healthcareProvider.nihii8) + (healthcareProvider.qualificationCode ?? '');
      return this.proposalService
        .assignOrganization(
          proposalId,
          referralTaskId,
          {
            nihii: nihdi,
            institutionTypeCode: healthcareProvider.typeCode ?? '',
          },
          generatedUUID
        )
        .pipe(tap(() => this.loadProposal(proposalId)));
    }
  }

  transferAssignation(
    proposalId: string,
    referralTaskId: string,
    performerTaskId: string,
    professional: {
      ssin: string;
      discipline: string;
    },
    generatedUUID: string
  ) {
    return this.proposalService
      .transferAssignation(
        proposalId,
        referralTaskId,
        performerTaskId,
        {
          ssin: professional.ssin,
          role: professional.discipline.toUpperCase(),
        },
        generatedUUID
      )
      .pipe(tap(() => this.loadProposal(proposalId)));
  }

  rejectAssignation(proposalId: string, performerTaskId: string, generatedUUID: string) {
    return this.proposalService
      .rejectAssignation(proposalId, performerTaskId, generatedUUID)
      .pipe(tap(() => this.loadProposal(proposalId)));
  }

  resetProposal() {
    this.reset();
  }
}
