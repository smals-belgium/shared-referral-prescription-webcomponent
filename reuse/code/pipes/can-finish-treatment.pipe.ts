import { Pipe } from '@angular/core';
import { PerformerTask, ReadPrescription, TaskStatus } from '../interfaces';
import { AccessMatrixState } from '../states/access-matrix.state';

@Pipe({name: 'canFinishTreatment', standalone: true})
export class CanFinishTreatmentPipe {

  constructor(
    private accessMatrixState: AccessMatrixState,
  ) {
  }

  transform(prescription: ReadPrescription, task: PerformerTask): boolean {
    return this.accessMatrixState.hasAtLeastOnePermission(['executeTreatment'], prescription.templateCode)
      && [TaskStatus.INPROGRESS].includes(task.status);
  }
}
