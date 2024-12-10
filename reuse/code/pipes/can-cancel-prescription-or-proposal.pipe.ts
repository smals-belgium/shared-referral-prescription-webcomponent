import { Pipe } from '@angular/core';
import { ReadPrescription, Status, TaskStatus } from '../interfaces';
import { AccessMatrixState } from '../states/access-matrix.state';

/**
 * This pipe determines whether a proposal or a prescription can be canceled.
 *
 * The access matrix needs to have removePrescription or removeProposal depending on the intent
 * The status of the prescription needs to be OPEN
 * The requester and the patient assigned to the prescription can reject a prescription or proposal
 *
 * Example usage:
 * ```html
 * <button *ngIf="prescription | canCancelPrescriptionOrProposal : patientSSIN : currentUserSSIN">Cancel</button>
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

  transform(prescription: ReadPrescription, patientSsin: string, currentUserSsin?: string): boolean {
    if (!currentUserSsin)
      return false;

    return this.hasCancelPermissions(prescription)
      && prescription.status === Status.OPEN
      && this.checkIfCurrentUserIsPatientOrAssignedCaregiver(currentUserSsin, patientSsin, prescription.requester?.ssin);
  }

  private hasCancelPermissions(prescription: ReadPrescription) {
    const intent = prescription.intent
    if(intent === 'proposal') {
      return this.accessMatrixState.hasAtLeastOnePermission(['cancelProposal'], prescription.templateCode);
    }
    return this.accessMatrixState.hasAtLeastOnePermission(['cancelPrescription'], prescription.templateCode)
  }

  private checkIfCurrentUserIsPatientOrAssignedCaregiver(currentUserSsin:string, patientSsin:string, caregiverSsin?: string) {
    if(!caregiverSsin)
      return false
    return currentUserSsin === caregiverSsin || currentUserSsin === patientSsin
  }
}
