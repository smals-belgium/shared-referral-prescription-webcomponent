import { Pipe } from '@angular/core';
import { PerformerTask, ReadPrescription, Status, TaskStatus } from '../interfaces';
import { AccessMatrixState } from '../states/access-matrix.state';

@Pipe({name: 'canTransferAssignation', standalone: true})
export class CanTransferAssignationPipe {

  constructor(private accessMatrixState: AccessMatrixState) {
  }

  transform(prescription: ReadPrescription, task?: PerformerTask, currentUserSsin?: string): boolean {
    if (currentUserSsin == undefined)
      return false;
    return this.accessMatrixState.hasAtLeastOnePermission(['assignCaregiver'], prescription.templateCode)
      && prescription.status != null
      && [Status.DRAFT, Status.PENDING, Status.OPEN, Status.IN_PROGRESS].includes(prescription.status)
      && (task != null && task.status === TaskStatus.READY)
      && task.careGiverSsin == currentUserSsin;
  }
}
