import { Pipe, PipeTransform } from '@angular/core';
import { UserInfo } from '@reuse/code/interfaces';
import { AccessMatrixState } from '@reuse/code/states/api/access-matrix.state';
import { FhirR4TaskStatus, ReadRequestResource, RequestTaskResource } from '@reuse/code/openapi';
import { isProfesionalNotOrganizationBasedOnRole } from '@reuse/code/utils/utils';
import TaskTypeEnum = RequestTaskResource.TaskTypeEnum;
import { asPerformerTask } from '@reuse/code/utils/task-type.util';

/**
 * This pipe determines whether an assignation can be revoked.
 *
 * The access matrix needs to have revokeTreatment
 * The status of the performerTask needs to be IN PROGRESS
 * The current user must be logged in as a caregiver, not assigned to an organization
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
@Pipe({ name: 'canCancelTreatment', standalone: true })
export class CanCancelTreatmentPipe implements PipeTransform {
  constructor(private readonly accessMatrixState: AccessMatrixState) {}

  transform(prescription: ReadRequestResource, task: RequestTaskResource, currentUser?: Partial<UserInfo>): boolean {
    if (currentUser == undefined) return false;

    const allowedStatuses: FhirR4TaskStatus[] = [FhirR4TaskStatus.Inprogress];

    return (
      task?.taskType === TaskTypeEnum.PerformerTaskResource &&
      isProfesionalNotOrganizationBasedOnRole(currentUser.role) &&
      asPerformerTask(task).careGiverSsin == currentUser.ssin &&
      this.accessMatrixState.hasAtLeastOnePermission(['revokeTreatment'], prescription.templateCode) &&
      !!task.status &&
      allowedStatuses.includes(task.status)
    );
  }
}
