import { Pipe, PipeTransform } from '@angular/core';
import { AccessMatrixState } from '@reuse/code/states/api/access-matrix.state';
import { UserInfo } from '@reuse/code/interfaces';
import { ReadRequestResource, RequestStatus } from '@reuse/code/openapi';
import { isProfesionalBasedOnRole, isProposal } from '@reuse/code/utils/utils';

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
@Pipe({ name: 'canExtendPrescription', standalone: true })
export class CanExtendPrescriptionPipe implements PipeTransform {
  constructor(private accessMatrixState: AccessMatrixState) {}

  transform(prescription: ReadRequestResource, currentUser?: Partial<UserInfo>): boolean {
    if (currentUser == undefined || isProposal(prescription.intent)) return false;

    const now = new Date();
    const endDate = prescription.period?.end ? new Date(prescription.period.end) : false;

    const allowedStatuses: RequestStatus[] = [RequestStatus.Open, RequestStatus.InProgress];

    return (
      isProfesionalBasedOnRole(currentUser.role) &&
      this.accessMatrixState.hasAtLeastOnePermission(['createPrescription'], prescription.templateCode) &&
      !!prescription.status &&
      allowedStatuses.includes(prescription.status) &&
      endDate &&
      endDate > now
    );
  }
}
