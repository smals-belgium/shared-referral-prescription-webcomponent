import { Pipe, PipeTransform } from '@angular/core';
import { UserInfo } from '@reuse/code/interfaces';
import { AccessMatrixState } from '@reuse/code/states/api/access-matrix.state';
import {
  FhirR4TaskStatus,
  OrganizationTaskResource,
  PerformerTaskResource,
  ReadRequestResource,
  RequestStatus,
  RequestTaskResource,
  Role,
} from '@reuse/code/openapi';
import {
  checkCareGiverSsinAndProfessionAgainstCurrentUserSsinAndDiscipline,
  isProposal,
} from '@reuse/code/utils/utils';
import {
  asOrganizationTask,
  asPerformerTask,
  isOrganizationTask,
  isPerformerTask,
} from '@reuse/code/utils/task-type.util';

/**
 * This pipe determines whether an assignation can be rejected.
 *
 * The access matrix needs to have removeAssignationPrescription or removeAssignationProposal depending on the intent
 * The status of the prescription can be OPEN or PENDING or IN_PROGRESS
 * The status of the task needs to be READY
 *
 * 3 different cases are handled :
 * - As a patient : the patient can reject assignation of performer/organization task related to him only if the task is not started
 * - As a professional  : the caregiver assigned can reject his own tasks
 * - As an organization : the organization can only reject his tasks
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
  constructor(private readonly accessMatrixState: AccessMatrixState) {}

  transform(
    prescription: ReadRequestResource,
    task: RequestTaskResource,
    patientSsin?: string,
    currentUser?: Partial<UserInfo>
  ): boolean {
    if (!currentUser || !patientSsin) return false;

    const allowedStatuses: RequestStatus[] = [RequestStatus.Pending, RequestStatus.Open, RequestStatus.InProgress];

    let typedTask: OrganizationTaskResource | PerformerTaskResource;
    let isAssignedActor: boolean;
    if (isPerformerTask(task)) {
      typedTask = asPerformerTask(task);
      isAssignedActor = this.checkIfCurrentUserIsPatientOrAssignedCaregiverNotAssignedToOrganization(
        currentUser,
        patientSsin,
        typedTask
      );
    } else if (isOrganizationTask(task)) {
      typedTask = asOrganizationTask(task);
      isAssignedActor = this.checkIfCurrentUserIsPatientOrAssignedOrganization(currentUser, patientSsin, typedTask);
    } else {
      return false;
    }

    return (
      this.hasAssignPermissions(prescription) &&
      prescription.status != null &&
      allowedStatuses.includes(prescription.status) &&
      typedTask?.status === FhirR4TaskStatus.Ready &&
      isAssignedActor
    );
  }

  private checkIfCurrentUserIsPatientOrAssignedCaregiverNotAssignedToOrganization(
    currentUser: Partial<UserInfo>,
    patientSsin: string,
    task: PerformerTaskResource
  ): boolean {
    if (currentUser.role === Role.Organization) return false;

    const caregiverSsin = task?.careGiver?.healthcarePerson?.ssin;

    if (!caregiverSsin) return false;

    const isPatient = currentUser.role === Role.Patient && currentUser.ssin === patientSsin;

    const isCaregiver =
      currentUser.role !== Role.Patient &&
      checkCareGiverSsinAndProfessionAgainstCurrentUserSsinAndDiscipline(task, currentUser);

    return isPatient || isCaregiver;
  }

  private checkIfCurrentUserIsPatientOrAssignedOrganization(
    currentUser: Partial<UserInfo>,
    patientSsin: string,
    task: OrganizationTaskResource
  ): boolean {
    if (currentUser.role === Role.Patient && currentUser.ssin === patientSsin) {
      return true;
    }

    if (!currentUser.organizations) {
      return false;
    }

    const organizationEntry = Object.entries(currentUser.organizations[0])[0];
    const currentOrganizationNihii = organizationEntry[1].nihii;
    if (!currentOrganizationNihii) {
      return false;
    }

    const organizationNihii = task.organizationNihii;
    return organizationNihii === currentOrganizationNihii;
  }

  private hasAssignPermissions(prescription: ReadRequestResource) {
    if (isProposal(prescription.intent)) {
      return this.accessMatrixState.hasAtLeastOnePermission(['removeAssignationProposal'], prescription.templateCode);
    }
    return this.accessMatrixState.hasAtLeastOnePermission(['removeAssignationPrescription'], prescription.templateCode);
  }
}
