import { Injectable } from '@angular/core';
import { ReadPrescription } from '../interfaces';
import { BaseState } from './base.state';
import { ProposalService } from '../services/proposal.service';

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
}
