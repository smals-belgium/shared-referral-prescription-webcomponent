import { Pipe } from '@angular/core';
import { Intent, ReadPrescription, Status } from '../interfaces';
import { AccessMatrixState } from '../states/access-matrix.state';
import { isProposal } from '@reuse/code/utils/utils';

@Pipe({name: 'canAssignCaregiver', standalone: true})
export class CanAssignCaregiverPipe {

  constructor(
    private readonly accessMatrixState: AccessMatrixState,
  ) {
  }

  transform(prescription: ReadPrescription): boolean {
    return this.hasAssignPermissions(prescription)
      && prescription.status != null
      && [Status.DRAFT, Status.PENDING, Status.OPEN, Status.IN_PROGRESS].includes(prescription.status);
  }

  private hasAssignPermissions(prescription: ReadPrescription) {
    if(isProposal(prescription.intent)) {
      return this.accessMatrixState.hasAtLeastOnePermission(['assignProposal'], prescription.templateCode);
    }
    return this.accessMatrixState.hasAtLeastOnePermission(['assignPrescription'], prescription.templateCode)
  }
}
