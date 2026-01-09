import { inject, Injectable } from '@angular/core';
import { SearchPrescriptionCriteria } from '@reuse/code/interfaces';
import { BaseState } from '@reuse/code/states/helpers/base.state';
import { ProposalService } from '@reuse/code/services/api/proposal.service';
import { ReadRequestListResource } from '@reuse/code/openapi';

@Injectable({ providedIn: 'root' })
export class ProposalsState extends BaseState<ReadRequestListResource> {
  private proposalService = inject(ProposalService);

  loadProposals(criteria?: SearchPrescriptionCriteria, page?: number, pageSize?: number): void {
    const currentParams = this.state().params;
    pageSize = pageSize || currentParams?.['pageSize'] || 10;
    page =
      criteria?.patient === currentParams?.['criteria']?.['patient'] ? page || currentParams?.['page'] || 1 : page || 1;

    const params = { page, pageSize, criteria };
    this.load(this.proposalService.findAll(params.criteria, params.page, params.pageSize), params);
  }
}
