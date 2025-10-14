import { Pipe, PipeTransform } from '@angular/core';
import { UserInfo } from '@reuse/code/interfaces';
import { AccessMatrixState } from '@reuse/code/states/api/access-matrix.state';
import { ReadRequestResource, RequestStatus, Role } from '@reuse/code/openapi';
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
@Pipe({ name: 'canCancelPrescriptionOrProposal', standalone: true })
export class CanCancelPrescriptionOrProposalPipe implements PipeTransform {
  constructor(private accessMatrixState: AccessMatrixState) {}

  transform(prescription: ReadRequestResource, patientSsin?: string, currentUser?: Partial<UserInfo>): boolean {
    if (!currentUser) return false;

    return (
      this.hasCancelPermissions(prescription) &&
      prescription.status === RequestStatus.Open &&
      this.checkIfCurrentUserIsPatientOrAssignedCaregiver(
        currentUser,
        patientSsin,
        prescription.requester?.healthcarePerson?.ssin
      )
    );
  }

  private hasCancelPermissions(prescription: ReadRequestResource) {
    if (isProposal(prescription.intent)) {
      return this.accessMatrixState.hasAtLeastOnePermission(['cancelProposal'], prescription.templateCode);
    }
    return this.accessMatrixState.hasAtLeastOnePermission(['cancelPrescription'], prescription.templateCode);
  }

  private checkIfCurrentUserIsPatientOrAssignedCaregiver(
    currentUser: Partial<UserInfo>,
    patientSsin?: string,
    caregiverSsin?: string
  ): boolean {
    if (!caregiverSsin || !patientSsin) return false;

    const isPatient = currentUser.role === Role.Patient && currentUser.ssin === patientSsin;
    const isCaregiver = currentUser.role !== Role.Patient && currentUser.ssin === caregiverSsin;

    return isPatient || isCaregiver;
  }
}
