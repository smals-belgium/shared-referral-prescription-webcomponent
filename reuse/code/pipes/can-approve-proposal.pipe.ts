import { Pipe } from '@angular/core';
import { ReadPrescription } from '../interfaces';
import { AccessMatrixState } from '../states/access-matrix.state';

@Pipe({name: 'canApproveProposal', standalone: true})
export class CanApproveProposalPipe {

  constructor(
    private accessMatrixState: AccessMatrixState,
  ) {
  }

  transform(prescription: ReadPrescription): boolean {
    return this.accessMatrixState.hasAtLeastOnePermission(['evaluateProposal'], prescription.templateCode);
  }
}
