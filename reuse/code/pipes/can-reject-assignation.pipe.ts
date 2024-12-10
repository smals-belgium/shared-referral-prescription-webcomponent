import { Pipe } from '@angular/core';
import { PerformerTask, ReadPrescription, Status, TaskStatus } from '../interfaces';
import { AccessMatrixState } from '../states/access-matrix.state';

@Pipe({name: 'canRejectAssignation', standalone: true})
export class CanRejectAssignationPipe {

  constructor(private accessMatrixState: AccessMatrixState) {
  }

  transform(prescription: ReadPrescription, task: PerformerTask, currentUserSsin?: string): boolean {
    if (currentUserSsin == undefined)
      return false;
    return this.accessMatrixState.hasAtLeastOnePermission(['executeTreatment'], prescription.templateCode)
      && prescription.status != null && [Status.OPEN, Status.IN_PROGRESS].includes(prescription.status)
      && task?.status === TaskStatus.READY
      && currentUserSsin === task.careGiver.ssin;
  }
}
