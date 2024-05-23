import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreatePrescriptionRequest, ReadPrescription, SearchPrescriptionCriteria, ServiceRequest } from '../interfaces';
import { HttpClient, HttpParams } from '@angular/common/http';
import { PrescriptionSummaryList } from '../interfaces/prescription-summary.interface';

@Injectable({providedIn: 'root'})
export class ProposalService {


  constructor(
    private http: HttpClient
  ) {
  }

  create(createPrescriptionRequest: CreatePrescriptionRequest): Observable<void> {
    return this.http.post<void>('/proposals', createPrescriptionRequest);
  }

  findAll(criteria: SearchPrescriptionCriteria | undefined, page: any, pageSize: any, includePerformer: boolean): Observable<PrescriptionSummaryList> {
    let params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize)
      .set('includePerformer', includePerformer);
    if (criteria) {
      Object.entries(criteria).forEach(([key, value]) => {
        if (value) {
          params = params.set(key, value);
        }
      });
    }
    return this.http.get<PrescriptionSummaryList>(`/proposals/summary`, {params});
  }

  findOne(prescriptionId: string): Observable<ReadPrescription> {
    return this.http.get<ReadPrescription>(`/proposals/${prescriptionId}`);
  }

  cancel(prescriptionId: string): Observable<void> {
    return this.http.post<void>(`/proposals/${prescriptionId}/cancel`, {});
  }

  assignCaregiver(prescriptionId: string, referralTaskId: string, caregiver: {
    ssin: string;
    role: string;
  }, executionStartDate?: string): Observable<void> {
    const body = {
      ssin: caregiver.ssin,
      role: caregiver.role,
      executionStartDate: executionStartDate
    };
    return this.http.post<void>(`/proposals/${prescriptionId}/assign/${referralTaskId}`, body);
  }

  assignOrganization(prescriptionId: string, referralTaskId: string, organization: {
    nihdi: string;
    institutionTypeCode: string;
  }, executionStartDate?: string): Observable<void> {
    const body = {
      nihdi: organization.nihdi,
      institutionTypeCode: organization.institutionTypeCode,
      executionStartDate: executionStartDate
    };
    return this.http.post<void>(`/proposals/${prescriptionId}/assignOrganization/${referralTaskId}`, body);
  }

  transferAssignation(prescriptionId: string, referralTaskId: string, performerTaskId: string, caregiver: {
    ssin: string;
    role: string;
  }, executionStartDate?: string): Observable<void> {
    const body = {
      ssin: caregiver.ssin,
      role: caregiver.role,
      executionStartDate: executionStartDate
    };
    return this.http.post<void>(`/proposals/${prescriptionId}/${referralTaskId}/transfer/${performerTaskId}`, body);
  }

  rejectAssignation(prescriptionId: string, performerTaskId: string): Observable<void> {
    return this.http.post<void>(`/proposals/${prescriptionId}/reject/${performerTaskId}`, {});
  }

  rejectProposal(proposalId: string, reason: string): Observable<void> {
    return this.http.post<void>(`/proposals/${proposalId}/reject`, {reason: reason});
  }

  rejectProposalTask(performerTaskId: string, reason: string): Observable<void> {
    return this.http.patch<void>(`/proposals/${performerTaskId}/reject`, {reason: reason});
  }
}

export function getPatientSsin(serviceRequest: ServiceRequest): string {
  return serviceRequest?.subject?.identifier?.value;
}
