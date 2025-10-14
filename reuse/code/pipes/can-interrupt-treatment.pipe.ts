import { Pipe, PipeTransform } from '@angular/core';
import { UserInfo } from '@reuse/code/interfaces';
import { AccessMatrixState } from '@reuse/code/states/api/access-matrix.state';
import { FhirR4TaskStatus, PerformerTaskResource, ReadRequestResource } from '@reuse/code/openapi';
import { isProfesionalBasedOnRole } from '@reuse/code/utils/utils';

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
@Pipe({ name: 'canInterruptTreatment', standalone: true })
export class CanInterruptTreatmentPipe implements PipeTransform {
  constructor(private accessMatrixState: AccessMatrixState) {}

  transform(prescription: ReadRequestResource, task: PerformerTaskResource, currentUser?: Partial<UserInfo>): boolean {
    if (currentUser == undefined) return false;

    const allowedStatuses: FhirR4TaskStatus[] = [FhirR4TaskStatus.Inprogress];

    return (
      isProfesionalBasedOnRole(currentUser.role) &&
      task.careGiverSsin == currentUser.ssin &&
      this.accessMatrixState.hasAtLeastOnePermission(['interruptTreatment'], prescription.templateCode) &&
      !!task.status &&
      allowedStatuses.includes(task.status)
    );
  }
}
