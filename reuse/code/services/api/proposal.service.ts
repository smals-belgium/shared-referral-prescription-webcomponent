import { inject, Injectable } from '@angular/core';
import { SearchPrescriptionCriteria } from '@reuse/code/interfaces';
import {
  AssignCareGiverResource,
  AssignOrganizationResource,
  CreateRequestResource,
  ProposalService as ApiProposalService,
  ReasonResource,
} from '@reuse/code/openapi';

@Injectable({ providedIn: 'root' })
export class ProposalService {
  private api = inject(ApiProposalService);

  create(createRequestResource: CreateRequestResource, generatedUUID: string) {
    return this.api.createProposal(generatedUUID, createRequestResource);
  }

  findAll(criteria: SearchPrescriptionCriteria | undefined, page: number, pageSize: number) {
    return this.api.getAllProposals(
      criteria?.patient,
      criteria?.requester,
      criteria?.performer,
      criteria?.historical,
      page,
      pageSize
    );
  }

  findOne(proposalId: string) {
    return this.api.getProposal(proposalId);
  }

  assignCaregiver(
    prescriptionId: string,
    referralTaskId: string,
    caregiver: AssignCareGiverResource,
    generatedUUID: string
  ) {
    return this.api.assignCareGiverToProposal(prescriptionId, referralTaskId, generatedUUID, caregiver);
  }

  assignOrganization(
    prescriptionId: string,
    referralTaskId: string,
    organization: AssignOrganizationResource,
    generatedUUID: string
  ) {
    return this.api.assignOrganizationToProposal(prescriptionId, referralTaskId, generatedUUID, organization);
  }

  transferAssignation(
    prescriptionId: string,
    referralTaskId: string,
    performerTaskId: string,
    caregiver: AssignCareGiverResource,
    generatedUUID: string
  ) {
    return this.api.transferAssignationToProposal(
      prescriptionId,
      referralTaskId,
      performerTaskId,
      generatedUUID,
      caregiver
    );
  }

  rejectAssignation(prescriptionId: string, performerTaskId: string, generatedUUID: string) {
    return this.api.rejectAssignationToProposal(prescriptionId, performerTaskId, generatedUUID);
  }

  approveProposal(proposalId: string, reason: ReasonResource, generatedUUID: string) {
    return this.api.approveProposal(proposalId, generatedUUID, reason);
  }

  cancelProposal(proposalId: string, generatedUUID: string) {
    return this.api.cancelProposal(proposalId, generatedUUID);
  }

  rejectProposal(proposalId: string, reason: ReasonResource, generatedUUID: string) {
    return this.api.rejectProposal(proposalId, generatedUUID, reason);
  }

  rejectProposalTask(performerTaskId: string, reason: ReasonResource, generatedUUID: string) {
    return this.api.rejectProposalTask(performerTaskId, generatedUUID, reason);
  }
}
