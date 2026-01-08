import { inject, Injectable } from '@angular/core';
import { SearchPrescriptionCriteria } from '@reuse/code/interfaces';
import {
  AssignCareGiverResource,
  AssignOrganizationResource,
  CreateRequestResource,
  PrescriptionService as ApiPrescriptionService,
} from '@reuse/code/openapi';

@Injectable({ providedIn: 'root' })
export class PrescriptionService {
  private api = inject(ApiPrescriptionService);

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

  cancel(prescriptionId: string, generatedUUID: string) {
    return this.api.cancelPrescription(prescriptionId, generatedUUID);
  }

  assignCaregiver(
    prescriptionId: string,
    referralTaskId: string,
    caregiver: AssignCareGiverResource,
    generatedUUID: string
  ) {
    return this.api.assignCareGiverToPrescription(prescriptionId, referralTaskId, generatedUUID, caregiver);
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
