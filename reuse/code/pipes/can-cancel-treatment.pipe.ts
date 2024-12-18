import { Pipe } from '@angular/core';
import { PerformerTask, ReadPrescription, Role, TaskStatus, UserInfo } from '../interfaces';
import { AccessMatrixState } from '../states/access-matrix.state';

/**
 * This pipe determines whether an assignation can be revoked.
 *
 * The access matrix needs to have revokeTreatment
 * The status of the performerTask needs to be IN PROGRESS
 * The current user must be logged in as a caregiver
 * The current user must be the caregiver assigned to the task
 *
 * Example usage:
 * ```html
 * <button *ngIf="prescription | canCancelTreatment : performerTask : currentUser">Cancel</button>
 * ```
 *
 * @pipe
 * @name canCancelTreatment
 */
@Pipe({name: 'canCancelTreatment', standalone: true})
export class CanCancelTreatmentPipe {

  constructor(
    private accessMatrixState: AccessMatrixState,
  ) {
  }

  transform(prescription: ReadPrescription, task: PerformerTask, currentUser?: UserInfo): boolean {
    if (currentUser == undefined)
      return false;
    return currentUser.role === Role.professional && task.careGiverSsin == currentUser.ssin && this.accessMatrixState.hasAtLeastOnePermission(['revokeTreatment'], prescription.templateCode)
      && [TaskStatus.INPROGRESS].includes(task.status);
  }

}
