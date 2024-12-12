import { Injectable } from '@angular/core';
import { ReadPrescription } from '../interfaces';
import { BaseState } from './base.state';
import { ProposalService } from '../services/proposal.service';
import { tap } from 'rxjs/operators';

@Injectable({providedIn: 'root'})
export class ProposalState extends BaseState<ReadPrescription> {

  constructor(
    private proposalService: ProposalService
  ) {
    super();
  }

  loadProposal(id: string): void {
    this.load(this.proposalService.findOne(id));
  }

  approveProposal(proposalId: string, reason: string, generatedUUID: string) {
    return this.proposalService.approveProposal(proposalId, reason, generatedUUID);
  }

  rejectProposal(proposalId: string, reason: string, generatedUUID: string) {
    return this.proposalService.rejectProposal(proposalId, reason, generatedUUID)
      .pipe(tap(() => this.loadProposal(proposalId)));
  }

  rejectProposalTask(proposalId: string, performerTaskId: string, reason: string, generatedUUID: string) {
    return this.proposalService.rejectProposalTask(performerTaskId, reason, generatedUUID)
      .pipe(tap(() => this.loadProposal(proposalId)));
  }
}
