import { Pipe, PipeTransform } from '@angular/core';
import { AccessMatrixState } from '@reuse/code/states/api/access-matrix.state';
import { ReadRequestResource, RequestStatus, Role } from '@reuse/code/openapi';
import { isProposal } from '@reuse/code/utils/utils';
import { Intent, UserInfo } from '@reuse/code/interfaces';

/**
 * This pipe determines whether the user can assign him/her self.
 *
 * The status of the prescription can be DRAFT, OPEN, PENDING or IN_PROGRESS
 * The access matrix needs to have assignProposal or assignPrescription
 * On a proposal only a prescriber can assign himself
 *
 * Example usage:
 * ```html
 * <button *ngIf="prescription | canSelfAssign>Assign Me</button>
 * ```
 *
 * @pipe
 * @name canSelfAssign
 */
@Pipe({ name: 'canSelfAssign', standalone: true })
export class CanSelfAssignPipe implements PipeTransform {
  constructor(private readonly accessMatrixState: AccessMatrixState) {}

  transform(prescription: ReadRequestResource, currentUser?: Partial<UserInfo>): boolean {
    const allowedStatuses: RequestStatus[] = [
      RequestStatus.Draft,
      RequestStatus.Pending,
      RequestStatus.Open,
      RequestStatus.InProgress,
    ];
    return (
      this.onlyPrescriberCanAssignToProposal(prescription.intent, currentUser) &&
      !!prescription.status &&
      allowedStatuses.includes(prescription.status) &&
      this.hasAssignPermissions(prescription)
    );
  }

  private onlyPrescriberCanAssignToProposal(intent?: string, currentUser?: Partial<UserInfo>): boolean {
    return !isProposal(intent) || this.isPrescriber(currentUser);
  }

  private isPrescriber(currentUser?: Partial<UserInfo>): boolean {
    return currentUser?.role === Role.Prescriber;
  }

  private hasAssignPermissions(prescription: ReadRequestResource) {
    if (isProposal(prescription.intent)) {
      return this.accessMatrixState.hasAtLeastOnePermission(['assignProposal'], prescription.templateCode);
    }
    return this.accessMatrixState.hasAtLeastOnePermission(['assignPrescription'], prescription.templateCode);
  }
}
