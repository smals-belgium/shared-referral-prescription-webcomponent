import { Pipe } from '@angular/core';
import { Intent, PerformerTask, ReadPrescription, Role, Status, TaskStatus, UserInfo } from '../interfaces';
import { AccessMatrixState } from '../states/access-matrix.state';
import { isProposal } from '@reuse/code/utils/utils';

/**
 * This pipe determines whether an assignation can be rejected.
 *
 * The access matrix needs to have removeAssignationPrescription or removeAssignationProposal depending on the intent
 * The status of the prescription can be OPEN or PENDING or IN_PROGRESS
 * The status of the performerTask needs to be READY
 * The caregiver assigned to the task and the patient assigned to the prescription can reject an assignation if they are logged in with the corresponding role
 *
 * Example usage:
 * ```html
 * <button *ngIf="assignation | canRejectAssignation : performertask : patientSSIN : currentUser">Reject</button>
 * ```
 *
 * @pipe
 * @name CanRejectAssignationPipe
 */
@Pipe({name: 'canRejectAssignation', standalone: true})
export class CanRejectAssignationPipe {

  constructor(private readonly accessMatrixState: AccessMatrixState) {
  }

  transform(prescription: ReadPrescription, task: PerformerTask, patientSsin: string, currentUser?: UserInfo): boolean {
    if (!currentUser)
      return false;

    return this.hasAssignPermissions(prescription)
      && prescription.status != null && [Status.OPEN, Status.PENDING, Status.IN_PROGRESS].includes(prescription.status)
      && task?.status === TaskStatus.READY
      && this.checkIfCurrentUserIsPatientOrAssignedCaregiver(currentUser, patientSsin, task.careGiver.id.ssin);
  }

  private checkIfCurrentUserIsPatientOrAssignedCaregiver(currentUser: UserInfo, patientSsin: string, caregiverSsin?: string): boolean {
      if (!caregiverSsin) return false;

      const isPatient = currentUser.role === Role.patient && currentUser.ssin === patientSsin;
      const isCaregiver = currentUser.role !== Role.patient && currentUser.ssin === caregiverSsin;

    return isPatient ?? isCaregiver;
  }

  private hasAssignPermissions(prescription: ReadPrescription) {
    if(isProposal(prescription.intent)) {
      return this.accessMatrixState.hasAtLeastOnePermission(['removeAssignationProposal'], prescription.templateCode);
    }
    return this.accessMatrixState.hasAtLeastOnePermission(['removeAssignationPrescription'], prescription.templateCode);
  }
}
