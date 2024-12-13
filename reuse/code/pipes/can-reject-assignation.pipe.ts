import { Pipe } from '@angular/core';
import { PerformerTask, ReadPrescription, Status, TaskStatus } from '../interfaces';
import { AccessMatrixState } from '../states/access-matrix.state';

/**
 * This pipe determines whether an assignation can be rejected.
 *
 * The access matrix needs to have removeAssignationPrescription or removeAssignationProposal depending on the intent
 * The status of the prescription can be OPEN or PENDING or IN_PROGRESS
 * The caregiver assigned to the task and the patient assigned to the prescription can reject an assignation
 *
 * Example usage:
 * ```html
 * <button *ngIf="assignation | canRejectAssignation : performertask : patientSSIN : currentUserSSIN">Reject</button>
 * ```
 *
 * @pipe
 * @name CanRejectAssignationPipe
 */
@Pipe({name: 'canRejectAssignation', standalone: true})
export class CanRejectAssignationPipe {

  constructor(private accessMatrixState: AccessMatrixState) {
  }

  transform(prescription: ReadPrescription, task: PerformerTask, patientSsin: string, currentUserSsin?: string): boolean {
    if (!currentUserSsin)
      return false;
    return this.hasAssignPermissions(prescription)
      && prescription.status != null && [Status.OPEN, Status.PENDING, Status.IN_PROGRESS].includes(prescription.status)
      && this.checkIfCurrentUserIsPatientOrAssignedCaregiver(currentUserSsin, patientSsin, task.careGiver.ssin);
  }

  private checkIfCurrentUserIsPatientOrAssignedCaregiver(currentUserSsin:string, patientSsin:string, caregiverSsin: string) {
    return currentUserSsin === caregiverSsin || currentUserSsin === patientSsin
  }

  private hasAssignPermissions(prescription: ReadPrescription) {
    const intent = prescription.intent
    if(intent === 'proposal') {
      return this.accessMatrixState.hasAtLeastOnePermission(['removeAssignationProposal'], prescription.templateCode);
    }
    return this.accessMatrixState.hasAtLeastOnePermission(['removeAssignationPrescription'], prescription.templateCode);
  }
}
