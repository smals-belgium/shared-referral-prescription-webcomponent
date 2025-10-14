import { Pipe, PipeTransform } from '@angular/core';
import { AccessMatrixState } from '@reuse/code/states/api/access-matrix.state';
import { ReadRequestResource, RequestStatus } from '@reuse/code/openapi';
import { isProposal } from '@reuse/code/utils/utils';

@Pipe({ name: 'canAssignCaregiver', standalone: true })
export class CanAssignCaregiverPipe implements PipeTransform {
  constructor(private accessMatrixState: AccessMatrixState) {}

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
