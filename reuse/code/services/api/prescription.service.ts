import { inject, Injectable } from '@angular/core';
import { PrescriptionExecutionComplete, SearchPrescriptionCriteria } from '@reuse/code/interfaces';
import {
  AssignationType,
  AssignCareGiverResource,
  AssignOrganizationResource,
  CompletePrescriptionResource,
  CreateRequestResource,
  PerformerTaskIdResource,
  PrescriptionService as ApiPrescriptionService,
  ReasonResource,
} from '@reuse/code/openapi';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PrescriptionService {
  private readonly api = inject(ApiPrescriptionService);

  create(createRequestResource: CreateRequestResource, generatedUUID: string) {
    return this.api.createPrescription(generatedUUID, createRequestResource);
  }

  findAll(criteria: SearchPrescriptionCriteria | undefined, page: number, pageSize: number) {
    return this.api.getAllPrescriptions(
      criteria?.patient,
      criteria?.requester,
      criteria?.performer,
      criteria?.historical,
      page,
      pageSize
    );
  }

  findOne(prescriptionId: string, xActorCaregiverSsin?: string) {
    return this.api.getPrescription(prescriptionId, xActorCaregiverSsin);
  }

  findOneByShortCode(shortCode: string, ssin: string, xActorCaregiverSsin?: string) {
    return this.api.getPrescriptionByShortCode(ssin, shortCode, xActorCaregiverSsin);
  }

  cancel(prescriptionId: string, reason: ReasonResource, generatedUUID: string) {
    return this.api.cancelPrescription(prescriptionId, generatedUUID, reason);
  }

  assignCaregivers(
    prescriptionId: string,
    referralTaskId: string,
    caregiver: AssignCareGiverResource,
    generatedUUID: string,
    assignationType?: AssignationType,
    xActorOrganizationNihii11?: string
  ): Observable<PerformerTaskIdResource[]>;
  assignCaregivers(
    prescriptionId: string,
    referralTaskId: string,
    caregiver: AssignCareGiverResource[],
    generatedUUID: string,
    assignationType?: AssignationType,
    xActorOrganizationNihii11?: string
  ): Observable<PerformerTaskIdResource[]>;
  assignCaregivers(
    prescriptionId: string,
    referralTaskId: string,
    caregiver: AssignCareGiverResource | AssignCareGiverResource[],
    generatedUUID: string,
    assignationType?: AssignationType,
    xActorOrganizationNihii11?: string
  ) {
    const caregivers = Array.isArray(caregiver) ? caregiver : [caregiver];
    return this.api.assignCareGiversToPrescription(
      prescriptionId,
      referralTaskId,
      generatedUUID,
      caregivers,
      assignationType,
      xActorOrganizationNihii11
    );
  }

  assignOrganization(
    prescriptionId: string,
    referralTaskId: string,
    organization: AssignOrganizationResource,
    generatedUUID: string
  ) {
    return this.api.assignOrganizationToPrescription(prescriptionId, referralTaskId, generatedUUID, organization);
  }

  transferAssignation(
    prescriptionId: string,
    referralTaskId: string,
    performerTaskId: string,
    caregiver: AssignCareGiverResource,
    generatedUUID: string
  ) {
    return this.api.transferAssignationToPrescription(
      prescriptionId,
      referralTaskId,
      performerTaskId,
      generatedUUID,
      caregiver
    );
  }

  transferAssignationToOrganization(
    prescriptionId: string,
    referralTaskId: string,
    performerTaskId: string,
    organization: AssignOrganizationResource,
    generatedUUID: string
  ) {
    return this.api.transferAssignOrganizationToPrescription(
      prescriptionId,
      referralTaskId,
      performerTaskId,
      generatedUUID,
      organization
    );
  }

  rejectAssignation(prescriptionId: string, performerTaskId: string, generatedUUID: string) {
    return this.api.rejectAssignationToPrescription(prescriptionId, performerTaskId, generatedUUID);
  }
  completePrescription(prescriptionId: string, executionFinish: PrescriptionExecutionComplete, generatedUUID: string) {
    const completePrescriptionResource: CompletePrescriptionResource = {
      performerTaskId: executionFinish.performerTaskId,
      executionEndDate: executionFinish.endDate,
    };

    return this.api.completePrescription(prescriptionId, generatedUUID, completePrescriptionResource);
  }
  closePrescription(prescriptionId: string, generatedUUID: string) {
    return this.api.closePrescription(prescriptionId, generatedUUID);
  }
}
