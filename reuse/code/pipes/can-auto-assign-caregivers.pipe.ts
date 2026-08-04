import { Pipe, PipeTransform } from '@angular/core';
import { ReadRequestResource, RequestStatus, Role } from '@reuse/code/openapi';
import { UserInfo } from '@reuse/code/interfaces';
import { AccessMatrixState } from '@reuse/code/states/api/access-matrix.state';
import { isProposal } from '@reuse/code/utils/utils';

/**
 * This pipe determines whether the user can assign a multiple caregivers.
 *
 * The access matrix needs to have assignPrescription or assignProposal depending on the intent
 * The status of the prescription needs to be DRAFT, PENDING, OPEN, IN PROGRESS
 * Only an organization can assign multiple caregivers to the prescription or proposal
 *
 * Example usage:
 * ```html
 * <button *ngIf="prescription | canAutoAssignCaregivers: currentUser>Assign multiple Caregivers</button>
 * ```
 *
 * @pipe
 * @name canAutoAssignCaregivers
 */
@Pipe({ name: 'canAutoAssignCaregivers', standalone: true })
export class CanAutoAssignCaregiversPipe implements PipeTransform {
  constructor(private readonly accessMatrixState: AccessMatrixState) {}

  transform(prescription: ReadRequestResource, currentUser?: Partial<UserInfo>): boolean {
    const allowedStatuses: RequestStatus[] = [
      RequestStatus.Draft,
      RequestStatus.Pending,
      RequestStatus.Open,
      RequestStatus.InProgress,
    ];
    return (
      currentUser?.role === Role.Organization &&
      this.hasAssignPermissions(prescription) &&
      prescription.status != null &&
      allowedStatuses.includes(prescription.status)
    );
  }

  private hasAssignPermissions(prescription: ReadRequestResource) {
    if (isProposal(prescription.intent)) {
      return this.accessMatrixState.hasAtLeastOnePermission(['assignProposal'], prescription.templateCode);
    }
    return this.accessMatrixState.hasAtLeastOnePermission(['assignPrescription'], prescription.templateCode);
  }
}
