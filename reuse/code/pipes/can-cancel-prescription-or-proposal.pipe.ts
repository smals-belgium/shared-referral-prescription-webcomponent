import { Pipe } from '@angular/core';
import { ReadPrescription, Status } from '../interfaces';
import { AccessMatrixState } from '../states/access-matrix.state';

@Pipe({name: 'canCancelPrescriptionOrProposal', standalone: true})
export class CanCancelPrescriptionOrProposalPipe {

  constructor(
    private accessMatrixState: AccessMatrixState,
  ) {
  }

  transform(prescription: ReadPrescription, currentUserSsin?: string): boolean {
    if(!currentUserSsin) {
      return false;
    }
    return this.hasCancelPermissions(prescription)
      && prescription.status != null
      && [Status.DRAFT, Status.OPEN, Status.PENDING, Status.IN_PROGRESS].includes(prescription.status)
      && prescription.requester?.ssin === currentUserSsin;
  }

  private hasCancelPermissions(prescription: ReadPrescription) {
    const intent = prescription.intent
    if(intent === 'proposal') {
      return this.accessMatrixState.hasAtLeastOnePermission(['cancelProposal'], prescription.templateCode);
    }
    return this.accessMatrixState.hasAtLeastOnePermission(['cancelPrescription'], prescription.templateCode)
  }
}
