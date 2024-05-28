import { Pipe } from '@angular/core';
import { PerformerTask, ReadPrescription, TaskStatus } from '../interfaces';
import { AccessMatrixState } from '../states/access-matrix.state';

@Pipe({name: 'canCancelTreatment', standalone: true})
export class CanCancelTreatmentPipe {

  constructor(
    private accessMatrixState: AccessMatrixState,
  ) {
  }

  transform(prescription: ReadPrescription, task: PerformerTask, currentUserSsin?: string): boolean {
    if (currentUserSsin == undefined)
      return false;
    return task.careGiverSsin == currentUserSsin && this.accessMatrixState.hasAtLeastOnePermission(['revokeTreatment'], prescription.templateCode)
      && [TaskStatus.INPROGRESS].includes(task.status);
  }
}
