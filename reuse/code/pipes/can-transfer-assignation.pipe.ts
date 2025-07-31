import { Pipe } from '@angular/core';
import { Intent, PerformerTask, ReadPrescription, Role, Status, TaskStatus, UserInfo } from '../interfaces';
import { AccessMatrixState } from '../states/access-matrix.state';
import { isProposal } from '@reuse/code/utils/utils';

/**
 * This pipe determines whether an assignation can be transferred.
 *
 * The access matrix needs to have assignPrescription or assignProposal depending on the intent
 * The status of the prescription needs to be OPEN, PENDING or IN PROGRESS
 * The status of the performerTask needs to be READY or IN PROGRESS
 * The current user must be logged in as a caregiver
 * The current user must be the caregiver assigned to the task
 *
 * Example usage:
 * ```html
 * <button *ngIf="prescription | canTransferAssignation : performerTask : currentUser">Transfer</button>
 * ```
 *
 * @pipe
 * @name canTransferAssignation
 */
@Pipe({name: 'canTransferAssignation', standalone: true})
export class CanTransferAssignationPipe {

  constructor(private accessMatrixState: AccessMatrixState) {
  }

  transform(prescription: ReadPrescription, task?: PerformerTask, currentUser?: UserInfo): boolean {
    if (currentUser == undefined)
      return false;

    return this.hasAssignPermissions(prescription)
      && prescription.status != null
      && [Status.OPEN, Status.PENDING, Status.IN_PROGRESS].includes(prescription.status)
      && task != null
      && [TaskStatus.READY, TaskStatus.INPROGRESS].includes(task.status)
      && currentUser.role === Role.professional
      && task.careGiverSsin == currentUser.ssin;
  }

  private hasAssignPermissions(prescription: ReadPrescription) {
    if(isProposal(prescription.intent)) {
      return this.accessMatrixState.hasAtLeastOnePermission(['assignProposal'], prescription.templateCode);
    }
    return this.accessMatrixState.hasAtLeastOnePermission(['assignPrescription'], prescription.templateCode)
  }
}
