import { Pipe } from '@angular/core';
import { ReadPrescription, Status } from '../interfaces';
import { AccessMatrixState } from '../states/access-matrix.state';

@Pipe({name: 'canApproveProposal', standalone: true})
export class CanApproveProposalPipe {

  constructor(
    private readonly accessMatrixState: AccessMatrixState,
  ) {
  }

  transform(prescription: ReadPrescription): boolean {
    return prescription.status != null && [Status.DRAFT, Status.PENDING, Status.OPEN, Status.IN_PROGRESS].includes(prescription.status) && this.accessMatrixState.hasAtLeastOnePermission(['evaluateProposal'], prescription.templateCode);
  }
}
