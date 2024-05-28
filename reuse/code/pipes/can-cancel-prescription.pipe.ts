import { Pipe } from '@angular/core';
import { ReadPrescription, Status } from '../interfaces';
import { AccessMatrixState } from '../states/access-matrix.state';

@Pipe({name: 'canCancelPrescription', standalone: true})
export class CanCancelPrescriptionPipe {

  constructor(
    private accessMatrixState: AccessMatrixState,
  ) {
  }

  transform(prescription: ReadPrescription, currentUserSsin: string): boolean {
    return this.accessMatrixState.hasAtLeastOnePermission(['cancelPrescription'], prescription.templateCode)
      && prescription.status != null
      && [Status.DRAFT, Status.OPEN, Status.PENDING, Status.IN_PROGRESS].includes(prescription.status)
      && prescription.requester?.ssin === currentUserSsin;
  }
}
