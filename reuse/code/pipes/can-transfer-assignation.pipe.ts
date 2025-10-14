import { Pipe, PipeTransform } from '@angular/core';
import { UserInfo } from '@reuse/code/interfaces';
import { AccessMatrixState } from '@reuse/code/states/api/access-matrix.state';
import { FhirR4TaskStatus, PerformerTaskResource, ReadRequestResource, RequestStatus } from '@reuse/code/openapi';
import { isProfesionalBasedOnRole, isProposal } from '@reuse/code/utils/utils';

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
@Pipe({ name: 'canTransferAssignation', standalone: true })
export class CanTransferAssignationPipe implements PipeTransform {
  constructor(private accessMatrixState: AccessMatrixState) {}

  transform(prescription: ReadRequestResource, task?: PerformerTaskResource, currentUser?: Partial<UserInfo>): boolean {
    if (currentUser == undefined) return false;

    const allowedStatuses: RequestStatus[] = [RequestStatus.Pending, RequestStatus.Open, RequestStatus.InProgress];
    const allowedTaskStatuses: FhirR4TaskStatus[] = [FhirR4TaskStatus.Ready, FhirR4TaskStatus.Inprogress];

    return (
      this.hasAssignPermissions(prescription) &&
      !!prescription.status &&
      allowedStatuses.includes(prescription.status) &&
      !!task &&
      !!task.status &&
      allowedTaskStatuses.includes(task.status) &&
      isProfesionalBasedOnRole(currentUser.role) &&
      task.careGiverSsin == currentUser.ssin
    );
  }

  private hasAssignPermissions(prescription: ReadRequestResource) {
    if (isProposal(prescription.intent)) {
      return this.accessMatrixState.hasAtLeastOnePermission(['assignProposal'], prescription.templateCode);
    }
    return this.accessMatrixState.hasAtLeastOnePermission(['assignPrescription'], prescription.templateCode);
  }
}
