import { Pipe, PipeTransform } from '@angular/core';
import { AccessMatrixState } from '@reuse/code/states/api/access-matrix.state';
import { ReadRequestResource, RequestStatus } from '@reuse/code/openapi';
import { isProposal } from '@reuse/code/utils/utils';

/**
 * This pipe determines whether the user can assign a caregiver.
 *
 * The access matrix needs to have assignPrescription or assignProposal depending on the intent
 * The status of the prescription needs to be DRAFT, PENDING, OPEN, IN PROGRESS
 *
 * Example usage:
 * ```html
 * <button *ngIf="prescription | canAssignCaregiver>Assign Caregiver</button>
 * ```
 *
 * @pipe
 * @name canAssignCaregiver
 */
@Pipe({ name: 'canAssignCaregiver', standalone: true })
export class CanAssignCaregiverPipe implements PipeTransform {
  constructor(private readonly accessMatrixState: AccessMatrixState) {}

  transform(prescription: ReadRequestResource): boolean {
    const allowedStatuses: RequestStatus[] = [
      RequestStatus.Draft,
      RequestStatus.Pending,
      RequestStatus.Open,
      RequestStatus.InProgress,
    ];
    return (
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
