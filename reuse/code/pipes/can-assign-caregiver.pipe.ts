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
    return this.accessMatrixState.hasAtLeastOnePermission(['assignCaregiver'], prescription.templateCode)
      && prescription.status != null
      && [Status.DRAFT, Status.PENDING, Status.OPEN, Status.IN_PROGRESS].includes(prescription.status);
  }
}
