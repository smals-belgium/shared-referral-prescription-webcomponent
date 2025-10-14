import { Pipe, PipeTransform } from '@angular/core';
import { AccessMatrixState } from '@reuse/code/states/api/access-matrix.state';
import { UserInfo } from '@reuse/code/interfaces';
import { ReadRequestResource } from '@reuse/code/openapi';
import { isProfesionalBasedOnRole, isProposal } from '@reuse/code/utils/utils';

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
@Pipe({ name: 'canDuplicatePrescription', standalone: true })
export class CanDuplicatePrescriptionPipe implements PipeTransform {
  constructor(private accessMatrixState: AccessMatrixState) {}

  transform(prescription: ReadRequestResource, currentUser?: Partial<UserInfo>): boolean {
    if (currentUser == undefined || isProposal(prescription.intent)) return false;

    return (
      isProfesionalBasedOnRole(currentUser.role) &&
      this.accessMatrixState.hasAtLeastOnePermission(['createPrescription'], prescription.templateCode)
    );
  }
}
