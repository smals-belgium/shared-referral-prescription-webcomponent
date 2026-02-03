import { Pipe, PipeTransform } from '@angular/core';
import { AccessMatrixState } from '@reuse/code/states/api/access-matrix.state';
import { FhirR4TaskStatus, PerformerTaskResource, ReadRequestResource } from '@reuse/code/openapi';

@Pipe({ name: 'canFinishTreatment', standalone: true })
export class CanFinishTreatmentPipe implements PipeTransform {
  constructor(private accessMatrixState: AccessMatrixState) {}

  transform(prescription: ReadRequestResource, task: PerformerTaskResource): boolean {
    const allowedStatuses: FhirR4TaskStatus[] = [FhirR4TaskStatus.Inprogress];

    return (
      this.accessMatrixState.hasAtLeastOnePermission(['executeTreatment'], prescription.templateCode) &&
      !!task?.status &&
      allowedStatuses.includes(task.status)
    );
  }
}
