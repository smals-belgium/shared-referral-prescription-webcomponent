import { Pipe, PipeTransform } from '@angular/core';
import { AccessMatrixState } from '@reuse/code/states/api/access-matrix.state';
import { FhirR4TaskStatus, PerformerTaskResource, ReadRequestResource, RequestStatus } from '@reuse/code/openapi';
import { isProposal } from '@reuse/code/utils/utils';

@Pipe({ name: 'canStartTreatment', standalone: true })
export class CanStartTreatmentPipe implements PipeTransform {
  constructor(private accessMatrixState: AccessMatrixState) {}

  transform(prescription: ReadRequestResource, task?: PerformerTaskResource): boolean {
    const allowedStatuses: RequestStatus[] = [
      RequestStatus.Draft,
      RequestStatus.Pending,
      RequestStatus.Open,
      RequestStatus.InProgress,
    ];
    return (
      !isProposal(prescription.intent) &&
      allowedStatuses.includes(prescription.status!) &&
      this.accessMatrixState.hasAtLeastOnePermission(['executeTreatment'], prescription.templateCode) &&
      (!task || task.status === FhirR4TaskStatus.Ready)
    );
  }
}
