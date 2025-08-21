import { Pipe, PipeTransform } from '@angular/core';
import { Intent, ReadPrescription, Role, Status, UserInfo } from '../interfaces';
import { AccessMatrixState } from '../states/access-matrix.state';
import { isProposal } from '@reuse/code/utils/utils';

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
export class CanCancelPrescriptionOrProposalPipe implements PipeTransform {

  constructor(
    private readonly accessMatrixState: AccessMatrixState,
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
    if(isProposal(prescription.intent)) {
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
