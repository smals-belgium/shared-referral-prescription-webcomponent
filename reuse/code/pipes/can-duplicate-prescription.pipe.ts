import { Pipe } from '@angular/core';
import { AccessMatrixState } from '../states/access-matrix.state';
import { ReadPrescription, Role, UserInfo } from "../interfaces";
import { isProposal } from '@reuse/code/utils/utils';


/**
 * This pipe determines whether a prescription can be duplicated.
 *
 * The current user needs to be logged in as a professional
 * The access matrix needs to have createPrescription
 * The intent needs to be order
 *
 * Example usage:
 * ```html
 * <button *ngIf="prescription | canDuplicatePrescription: currentUser">duplicate</button>
 * ```
 *
 * @pipe
 * @name canDuplicatePrescription
 */
@Pipe({name: 'canDuplicatePrescription', standalone: true})
export class CanDuplicatePrescriptionPipe {

  constructor(
    private accessMatrixState: AccessMatrixState,
  ) {
  }

  transform(prescription: ReadPrescription, currentUser?: UserInfo): boolean {
    if (currentUser == undefined || isProposal(prescription.intent))
      return false;

    return currentUser.role === Role.professional && this.accessMatrixState.hasAtLeastOnePermission(['createPrescription'], prescription.templateCode);
  }
}
