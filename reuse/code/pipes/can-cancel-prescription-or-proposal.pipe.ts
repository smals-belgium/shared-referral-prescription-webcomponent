import { inject, Pipe, PipeTransform } from '@angular/core';
import { UserInfo } from '@reuse/code/interfaces';
import { AccessMatrixState } from '@reuse/code/states/api/access-matrix.state';
import { FhirR4TaskStatus, ReadRequestResource, RequestStatus, Role } from '@reuse/code/openapi';
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
  private readonly _accessMatrixState = inject(AccessMatrixState);

  transform(prescription: ReadRequestResource, patientSsin?: string, currentUser?: Partial<UserInfo>): boolean {
    if (!currentUser) return false;

    const checkThatNoOneStartedTheExecution = Array.isArray(prescription?.performerTasks)
      ? prescription.performerTasks?.some(task => task?.status !== undefined && task?.status != FhirR4TaskStatus.Ready)
      : false;

    const checkStatus = prescription.status === RequestStatus.Open || prescription.status === RequestStatus.Pending;

    return (
      this.hasCancelPermissions(prescription) &&
      checkStatus &&
      this.checkIfCurrentUserIsPatientOrAssignedCaregiver(
        currentUser,
        patientSsin,
        prescription.requester?.healthcarePerson?.ssin
      ) &&
      !checkThatNoOneStartedTheExecution
    );
  }

  private hasCancelPermissions(prescription: ReadRequestResource) {
    if (isProposal(prescription.intent)) {
      return this._accessMatrixState.hasAtLeastOnePermission(['cancelProposal'], prescription.templateCode);
    }
    return this._accessMatrixState.hasAtLeastOnePermission(['cancelPrescription'], prescription.templateCode);
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
