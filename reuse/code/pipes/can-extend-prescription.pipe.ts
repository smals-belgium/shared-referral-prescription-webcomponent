import { Pipe } from '@angular/core';
import { AccessMatrixState } from '../states/access-matrix.state';
import {ReadPrescription, Status} from "../interfaces";

/**
 * This pipe determines whether a prescription can be extended.
 *
 * The access matrix needs to have createPrescription
 * The status of the prescription can be OPEN or IN_PROGRESS
 * The end date needs to be in the future
 *
 * Example usage:
 * ```html
 * <button *ngIf="prescription | canExtendPrescription">Extend</button>
 * ```
 *
 * @pipe
 * @name canExtendPrescription
 */
@Pipe({name: 'canExtendPrescription', standalone: true})
export class CanExtendPrescriptionPipe {

  constructor(
    private accessMatrixState: AccessMatrixState,
  ) {
  }

  transform(prescription: ReadPrescription): boolean {
    const now = new Date();
    const endDate = prescription.period?.end ? new Date(prescription.period.end) : false

    return this.accessMatrixState.hasAtLeastOnePermission(['createPrescription'], prescription.templateCode)
      && !!prescription.status
      && [Status.OPEN, Status.IN_PROGRESS].includes(prescription.status)
      && endDate
      && endDate > now;
  }
}
