import { Pipe } from '@angular/core';
import { PerformerTask, ReadPrescription, Status, TaskStatus } from '../interfaces';
import { AccessMatrixState } from '../states/access-matrix.state';

/**
 * This pipe determines whether an assignation can be transferred.
 *
 * The access matrix needs to have assignPrescription or assignProposal depending on the intent
 * The status of the prescription needs to be OPEN or IN PROGRESS
 * The status of the task needs to be READY or IN PROGRESS
 * The current user must be the caregiver assigned to the task
 *
 * Example usage:
 * ```html
 * <button *ngIf="prescription | canTransferAssignation : performerTask : currentUserSSIN">Cancel</button>
 * ```
 *
 * @pipe
 * @name canTransferAssignation
 */
@Pipe({name: 'canTransferAssignation', standalone: true})
export class CanTransferAssignationPipe {

  constructor(private accessMatrixState: AccessMatrixState) {
  }

  transform(prescription: ReadPrescription, task?: PerformerTask, currentUserSsin?: string): boolean {
    if (currentUserSsin == undefined)
      return false;

    return this.hasAssignPermissions(prescription)
      && prescription.status != null
      && [Status.OPEN, Status.IN_PROGRESS].includes(prescription.status)
      && task != null
      && [TaskStatus.READY, TaskStatus.INPROGRESS].includes(task.status)
      && task.careGiverSsin == currentUserSsin;
  }

  private hasAssignPermissions(prescription: ReadPrescription) {
    const intent = prescription.intent
    if(intent === 'proposal') {
      return this.accessMatrixState.hasAtLeastOnePermission(['assignProposal'], prescription.templateCode);
    }
    return this.accessMatrixState.hasAtLeastOnePermission(['assignPrescription'], prescription.templateCode)
  }
}
