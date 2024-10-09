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
    return this.hasAssignPermissions(prescription)
      && prescription.status != null
      && [Status.DRAFT, Status.PENDING, Status.OPEN, Status.IN_PROGRESS].includes(prescription.status)
      && (task != null && task.status === TaskStatus.READY)
      && task.careGiverSsin == currentUserSsin;
  }

  private hasAssignPermissions(prescription: ReadPrescription) {
    const intent = prescription.intent
    if(intent === 'proposal') {
      return this.accessMatrixState.hasAtLeastOnePermission(['assignProposal'], prescription.templateCode);
    }
    return this.accessMatrixState.hasAtLeastOnePermission(['assignPrescription'], prescription.templateCode)
  }
}
