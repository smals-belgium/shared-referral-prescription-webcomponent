import { Pipe, PipeTransform } from '@angular/core';
import { UserInfo } from '@reuse/code/interfaces';
import { AccessMatrixState } from '@reuse/code/states/api/access-matrix.state';
import { FhirR4TaskStatus, PerformerTaskResource, ReadRequestResource, RequestStatus, Role } from '@reuse/code/openapi';
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
@Pipe({ name: 'canRejectAssignation', standalone: true })
export class CanRejectAssignationPipe implements PipeTransform {
  constructor(private accessMatrixState: AccessMatrixState) {}

  transform(
    prescription: ReadRequestResource,
    task: PerformerTaskResource,
    patientSsin?: string,
    currentUser?: Partial<UserInfo>
  ): boolean {
    if (!currentUser || !patientSsin) return false;

    const allowedStatuses: RequestStatus[] = [RequestStatus.Pending, RequestStatus.Open, RequestStatus.InProgress];

    return (
      this.hasAssignPermissions(prescription) &&
      prescription.status != null &&
      allowedStatuses.includes(prescription.status) &&
      task?.status === FhirR4TaskStatus.Ready &&
      this.checkIfCurrentUserIsPatientOrAssignedCaregiver(
        currentUser,
        patientSsin,
        task.careGiver?.healthcarePerson?.ssin
      )
    );
  }

  private checkIfCurrentUserIsPatientOrAssignedCaregiver(
    currentUser: Partial<UserInfo>,
    patientSsin: string,
    caregiverSsin?: string
  ): boolean {
    if (!caregiverSsin) return false;

    const isPatient = currentUser.role === Role.Patient && currentUser.ssin === patientSsin;
    const isCaregiver = currentUser.role !== Role.Patient && currentUser.ssin === caregiverSsin;

    return isPatient || isCaregiver;
  }

  private hasAssignPermissions(prescription: ReadRequestResource) {
    if (isProposal(prescription.intent)) {
      return this.accessMatrixState.hasAtLeastOnePermission(['removeAssignationProposal'], prescription.templateCode);
    }
    return this.accessMatrixState.hasAtLeastOnePermission(['removeAssignationPrescription'], prescription.templateCode);
  }
}
