import { Pipe } from '@angular/core';
import { ReadPrescription, Role, Status, UserInfo } from '../interfaces';
import { AccessMatrixState } from '../states/access-matrix.state';

/**
 * This pipe determines whether a proposal or a prescription can be canceled.
 *
 * The access matrix needs to have cancelPrescription or cancelProposal depending on the intent
 * The status of the prescription needs to be OPEN
 * The requester and the patient assigned to the prescription can cancel a prescription or proposal if they are logged in with the corresponding role
 *
 * Example usage:
 * ```html
 * <button *ngIf="prescription | canCancelPrescriptionOrProposal : patientSSIN : currentUser">Cancel</button>
 * ```
 *
 * @pipe
 * @name canCancelPrescriptionOrProposal
 */
@Pipe({name: 'canCancelPrescriptionOrProposal', standalone: true})
export class CanCancelPrescriptionOrProposalPipe {

  constructor(
    private accessMatrixState: AccessMatrixState,
  ) {
  }

  transform(prescription: ReadPrescription, patientSsin: string, currentUser?: UserInfo): boolean {
    if (!currentUser)
      return false;

    return this.hasCancelPermissions(prescription)
      && prescription.status === Status.OPEN
      && this.checkIfCurrentUserIsPatientOrAssignedCaregiver(currentUser, patientSsin, prescription.requester?.id.ssin);
  }

  private hasCancelPermissions(prescription: ReadPrescription) {
    const intent = prescription.intent?.toLowerCase()
    if(intent === 'proposal') {
      return this.accessMatrixState.hasAtLeastOnePermission(['cancelProposal'], prescription.templateCode);
    }
    return this.accessMatrixState.hasAtLeastOnePermission(['cancelPrescription'], prescription.templateCode)
  }

  private checkIfCurrentUserIsPatientOrAssignedCaregiver(currentUser: UserInfo, patientSsin: string, caregiverSsin?: string): boolean {
    if (!caregiverSsin) return false;

    const isPatient = currentUser.role === Role.patient && currentUser.ssin === patientSsin;
    const isCaregiver = currentUser.role !== Role.patient && currentUser.ssin === caregiverSsin;

    return isPatient || isCaregiver;
  }
}
