import { Pipe } from '@angular/core';
import { AccessMatrixState } from '../states/access-matrix.state';
import {ReadPrescription, Status} from "../interfaces";

@Pipe({name: 'canExtendPrescription', standalone: true})
export class CanExtendPrescriptionPipe {

  constructor(
    private accessMatrixState: AccessMatrixState,
  ) {
  }

  transform(templateCode: string, prescription: ReadPrescription): boolean {
    return this.accessMatrixState.hasAtLeastOnePermission(['createPrescription'], templateCode)
      && !!prescription.status
      && [Status.OPEN, Status.ON_HOLD, Status.IN_PROGRESS, Status.CANCELLED].includes(prescription.status);
  }
}
