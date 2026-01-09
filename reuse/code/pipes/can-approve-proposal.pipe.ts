import { Pipe, PipeTransform } from '@angular/core';
import { AccessMatrixState } from '@reuse/code/states/api/access-matrix.state';
import { ReadRequestResource, RequestStatus } from '@reuse/code/openapi';

@Pipe({ name: 'canApproveProposal', standalone: true })
export class CanApproveProposalPipe implements PipeTransform {
  constructor(private accessMatrixState: AccessMatrixState) {}

  transform(prescription: ReadRequestResource): boolean {
    const allowedStatuses: RequestStatus[] = [
      RequestStatus.Draft,
      RequestStatus.Pending,
      RequestStatus.Open,
      RequestStatus.InProgress,
    ];

    return (
      prescription.status != null &&
      allowedStatuses.includes(prescription.status) &&
      this.accessMatrixState.hasAtLeastOnePermission(['evaluateProposal'], prescription.templateCode)
    );
  }
}
