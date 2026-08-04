import { Pipe, PipeTransform } from '@angular/core';
import { AccessMatrixState } from '@reuse/code/states/api/access-matrix.state';
import { FhirR4TaskStatus, ReadRequestResource, RequestTaskResource } from '@reuse/code/openapi';
import TaskTypeEnum = RequestTaskResource.TaskTypeEnum;

/**
 * This pipe determines whether an assignation can be finished.
 *
 * The access matrix needs to have executeTreatment
 * The status of the performerTask needs to be IN PROGRESS
 *
 * Example usage:
 * ```html
 * <button *ngIf="prescription | canFinishTreatment : performerTask>Interrupt</button>
 * ```
 *
 * @pipe
 * @name canFinishTreatment
 */
@Pipe({ name: 'canFinishTreatment', standalone: true })
export class CanFinishTreatmentPipe implements PipeTransform {
  constructor(private readonly accessMatrixState: AccessMatrixState) {}

  transform(prescription: ReadRequestResource, task: RequestTaskResource): boolean {
    const allowedStatuses: FhirR4TaskStatus[] = [FhirR4TaskStatus.Inprogress];

    return (
      task?.taskType === TaskTypeEnum.PerformerTaskResource &&
      this.accessMatrixState.hasAtLeastOnePermission(['executeTreatment'], prescription.templateCode) &&
      !!task?.status &&
      allowedStatuses.includes(task.status)
    );
  }
}
