import { Pipe } from '@angular/core';
import { PerformerTask, ReadPrescription, Status, TaskStatus } from '../interfaces';
import { AccessMatrixState } from '../states/access-matrix.state';

@Pipe({name: 'canStartTreatment', standalone: true})
export class CanStartTreatmentPipe {

  constructor(
    private accessMatrixState: AccessMatrixState,
  ) {
  }

  transform(prescription: ReadPrescription, task?: PerformerTask): boolean {
    return [Status.DRAFT, Status.PENDING, Status.OPEN, Status.IN_PROGRESS].includes(prescription.status!)
      && this.accessMatrixState.hasAtLeastOnePermission(['executeTreatment'], prescription.templateCode)
      && (task == null || task.status === TaskStatus.READY);
  }
}
