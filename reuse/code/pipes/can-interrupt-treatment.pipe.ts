import { Pipe } from '@angular/core';
import { PerformerTask, ReadPrescription, Role, TaskStatus, UserInfo } from '../interfaces';
import { AccessMatrixState } from '../states/access-matrix.state';

/**
 * This pipe determines whether an assignation can be interrupted.
 *
 * The access matrix needs to have interruptTreatment
 * The status of the performerTask needs to be IN PROGRESS
 * The current user must be logged in as a caregiver
 * The current user must be the caregiver assigned to the task
 *
 * Example usage:
 * ```html
 * <button *ngIf="prescription | canInterruptTreatment : performerTask : currentUser">Interrupt</button>
 * ```
 *
 * @pipe
 * @name canInterruptTreatment
 */
@Pipe({name: 'canInterruptTreatment', standalone: true})
export class CanInterruptTreatmentPipe {

  constructor(private accessMatrixState: AccessMatrixState) {
  }

  transform(prescription: ReadPrescription, task: PerformerTask, currentUser?: UserInfo): boolean {
    if (currentUser == undefined)
      return false;
    return currentUser.role === Role.professional && task.careGiverSsin == currentUser.ssin && this.accessMatrixState.hasAtLeastOnePermission(['interruptTreatment'], prescription.templateCode)
      && [TaskStatus.INPROGRESS].includes(task.status);
  }
}
