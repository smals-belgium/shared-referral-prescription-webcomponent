import { Pipe, PipeTransform } from '@angular/core';
import { AccessMatrixState } from '@reuse/code/states/api/access-matrix.state';
import { PerformerTaskResource, ReadRequestResource, RequestStatus } from '@reuse/code/openapi';

@Pipe({ name: 'canSelfAssign', standalone: true })
export class CanSelfAssignPipe implements PipeTransform {
  constructor(private accessMatrixState: AccessMatrixState) {}

  transform(prescription: ReadRequestResource, task?: PerformerTaskResource): boolean {
    const allowedStatuses: RequestStatus[] = [
      RequestStatus.Draft,
      RequestStatus.Pending,
      RequestStatus.Open,
      RequestStatus.InProgress,
    ];
    return (
      !!prescription.status &&
      allowedStatuses.includes(prescription.status) &&
      this.accessMatrixState.hasAtLeastOnePermission(['executeTreatment'], prescription.templateCode) &&
      !task
    );
  }
}
