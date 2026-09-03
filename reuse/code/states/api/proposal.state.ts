import { inject, Injectable } from '@angular/core';
import { AssignCareGiverResource, ReadRequestResource, ReasonResource } from '@reuse/code/openapi';
import { ProposalService } from '@reuse/code/services/api/proposal.service';
import { BaseState } from '@reuse/code/states/helpers/base.state';
import { switchMap, tap } from 'rxjs/operators';
import { USER_PROFILE_CLAIM_KEY } from '@reuse/code/services/auth/auth-constants';
import { AuthService } from '@reuse/code/services/auth/auth.service';

@Injectable({ providedIn: 'root' })
export class ProposalState extends BaseState<ReadRequestResource> {
  private readonly proposalService = inject(ProposalService);
  private readonly authService = inject(AuthService);

  loadProposal(id: string): void {
    // Lazily fetch auth context only when loading
    const proposal$ = this.authService.isOrganization().pipe(
      switchMap(isOrganization =>
        this.authService.getClaims().pipe(
          switchMap(claims => {
            const token = claims?.[USER_PROFILE_CLAIM_KEY];
            const xActorCaregiverSsin = isOrganization ? token?.ssin : undefined;
            return this.proposalService.findOne(id, xActorCaregiverSsin);
          })
        )
      )
    );

    this.load(proposal$);
  }

  approveProposal(proposalId: string, reason: ReasonResource, generatedUUID: string) {
    return this.proposalService.approveProposal(proposalId, reason, generatedUUID);
  }

  cancelProposal(proposalId: string, reason: ReasonResource, generatedUUID: string) {
    return this.proposalService.cancelProposal(proposalId, reason, generatedUUID);
  }

  rejectProposal(proposalId: string, reason: ReasonResource, generatedUUID: string) {
    return this.proposalService
      .rejectProposal(proposalId, reason, generatedUUID)
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

  assignProposalPerformer(
    proposalId: string,
    referralTaskId: string,
    ssinOrNihdi: string,
    role: string,
    type: string,
    generatedUUID: string
  ) {
    if (type === 'Professional') {
      return this.proposalService
        .assignCaregiver(
          proposalId,
          referralTaskId,
          {
            ssin: ssinOrNihdi || '',
            role: role || '',
          },
          generatedUUID
        )
        .pipe(tap(() => this.loadProposal(proposalId)));
    } else {
      return this.proposalService
        .assignOrganization(
          proposalId,
          referralTaskId,
          {
            nihii: ssinOrNihdi,
            institutionTypeCode: type || '',
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
    ssinOrNihdi: string,
    role: string,
    type: string,
    generatedUUID: string
  ) {
    if (type === 'Professional') {
      return this.proposalService
        .transferAssignation(
          proposalId,
          referralTaskId,
          performerTaskId,
          {
            ssin: ssinOrNihdi || '',
            role: role || '',
          },
          generatedUUID
        )
        .pipe(tap(() => this.loadProposal(proposalId)));
    } else {
      return this.proposalService
        .transferAssignationOrganization(
          proposalId,
          referralTaskId,
          performerTaskId,
          {
            nihii: ssinOrNihdi,
            institutionTypeCode: type || '',
          },
          generatedUUID
        )
        .pipe(tap(() => this.loadProposal(proposalId)));
    }
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
