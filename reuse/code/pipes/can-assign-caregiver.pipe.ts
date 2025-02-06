import { Pipe } from '@angular/core';
import { ReadPrescription, Status } from '../interfaces';
import { AccessMatrixState } from '../states/access-matrix.state';

@Pipe({name: 'canAssignCaregiver', standalone: true})
export class CanAssignCaregiverPipe {

  constructor(
    private accessMatrixState: AccessMatrixState,
  ) {
  }

  transform(prescription: ReadPrescription): boolean {
    return this.hasAssignPermissions(prescription)
      && prescription.status != null
      && [Status.DRAFT, Status.PENDING, Status.OPEN, Status.IN_PROGRESS].includes(prescription.status);
  }

  private hasAssignPermissions(prescription: ReadPrescription) {
    const intent = prescription.intent?.toLowerCase()
    if(intent === 'proposal') {
      return this.accessMatrixState.hasAtLeastOnePermission(['assignProposal'], prescription.templateCode);
    }
    return this.accessMatrixState.hasAtLeastOnePermission(['assignPrescription'], prescription.templateCode)
  }
}
