import { Pipe } from '@angular/core';
import { AccessMatrixState } from '../states/access-matrix.state';
import { Intent, ReadPrescription, Role, Status, UserInfo } from "../interfaces";
import { isProposal } from '@reuse/code/utils/utils';

/**
 * This pipe determines whether a prescription can be extended.
 *
 * The current user needs to be logged in as a professional
 * The access matrix needs to have createPrescription
 * The intent needs to be order
 * The status of the prescription can be OPEN or IN_PROGRESS
 * The end date needs to be in the future
 *
 * Example usage:
 * ```html
 * <button *ngIf="prescription | canExtendPrescription: currentUser">Extend</button>
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

  transform(prescription: ReadPrescription, currentUser?: UserInfo): boolean {
    if (currentUser == undefined || isProposal(prescription.intent))
      return false;

    const now = new Date();
    const endDate = prescription.period?.end ? new Date(prescription.period.end) : false

    return currentUser.role === Role.professional
      && this.accessMatrixState.hasAtLeastOnePermission(['createPrescription'], prescription.templateCode)
      && !!prescription.status
      && [Status.OPEN, Status.IN_PROGRESS].includes(prescription.status)
      && endDate
      && endDate > now;
  }
}
