import { Injectable } from '@angular/core';
import { SearchPrescriptionCriteria } from '../interfaces';
import { BaseState } from './base.state';
import { PrescriptionSummaryList } from '../interfaces/prescription-summary.interface';
import { ProposalService } from '../services/proposal.service';

@Injectable({providedIn: 'root'})
export class ProposalsState extends BaseState<PrescriptionSummaryList> {

  constructor(
    private readonly proposalService: ProposalService
  ) {
    super();
  }

  loadProposals(
    criteria?: SearchPrescriptionCriteria,
    page?: number,
    pageSize?: number
  ): void {
    const currentParams = this.state().params;
    pageSize = pageSize ?? currentParams?.['pageSize'] ?? 10;
    page = criteria?.patient === currentParams?.['criteria']?.['patient']
      ? page ?? currentParams?.['page'] ?? 1
      : page ?? 1;
    const params = {page, pageSize, criteria};
    this.load(
      this.proposalService.findAll(params.criteria, params.page, params.pageSize, false),
      params
    );
  }
}
