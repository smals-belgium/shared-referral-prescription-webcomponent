import { inject, Injectable } from '@angular/core';
import { SearchPrescriptionCriteria } from '@reuse/code/interfaces';
import {
  AssignCareGiverResource,
  AssignOrganizationResource,
  CreateRequestResource,
  PrescriptionService as ApiPrescriptionService,
  ReasonResource,
  PerformerTaskIdResource,
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

  findOne(prescriptionId: string) {
    return this.api.getPrescription(prescriptionId);
  }

  findOneByShortCode(shortCode: string, ssin: string) {
    return this.api.getPrescriptionByShortCode(ssin, shortCode);
  }

  cancel(prescriptionId: string, reason: ReasonResource, generatedUUID: string) {
    return this.api.cancelPrescription(prescriptionId, generatedUUID, reason);
  }

  assignCaregivers(
    prescriptionId: string,
    referralTaskId: string,
    caregiver: AssignCareGiverResource,
    generatedUUID: string
  ): Observable<PerformerTaskIdResource[]>;
  assignCaregivers(
    prescriptionId: string,
    referralTaskId: string,
    caregiver: AssignCareGiverResource[],
    generatedUUID: string
  ): Observable<PerformerTaskIdResource[]>;
  assignCaregivers(
    prescriptionId: string,
    referralTaskId: string,
    caregiver: AssignCareGiverResource | AssignCareGiverResource[],
    generatedUUID: string
  ) {
    const caregivers = Array.isArray(caregiver) ? caregiver : [caregiver];
    return this.api.assignCareGiversToPrescription(prescriptionId, referralTaskId, generatedUUID, caregivers);
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

  rejectAssignation(prescriptionId: string, performerTaskId: string, generatedUUID: string) {
    return this.api.rejectAssignationToPrescription(prescriptionId, performerTaskId, generatedUUID);
  }
}
