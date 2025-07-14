import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreatePrescriptionRequest,
  ProposalApproveResponse,
  ReadPrescription,
  SearchPrescriptionCriteria,
  ServiceRequest
} from '../interfaces';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { PrescriptionSummaryList } from '../interfaces/prescription-summary.interface';

@Injectable({providedIn: 'root'})
export class PrescriptionService {


  constructor(
    private http: HttpClient
  ) {
  }

  create(createPrescriptionRequest: CreatePrescriptionRequest, generatedUUID: string): Observable<void> {
    const headers = new HttpHeaders().set('If-None-Match', generatedUUID);
    return this.http.post<void>('/prescriptions', createPrescriptionRequest, {headers: headers});
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
    return this.http.get<PrescriptionSummaryList>(`/prescriptions/summary`, {params});
  }

  findOne(prescriptionId: string): Observable<ReadPrescription> {
    return this.http.get<ReadPrescription>(`/prescriptions/${prescriptionId}`);
  }

  findOneByShortCode(shortCode: string, ssin: string): Observable<ReadPrescription> {
    let params = new HttpParams()
      .set('ssin', ssin)
      .set('shortCode', shortCode)

    return this.http.get<ReadPrescription>(`/prescription`, {params});
  }

  cancel(prescriptionId: string, generatedUUID: string): Observable<void> {
    const headers = new HttpHeaders().set('If-None-Match', generatedUUID);
    return this.http.post<void>(`/prescriptions/${prescriptionId}/cancel`, {}, {headers: headers});
  }

  assignCaregiver(prescriptionId: string, referralTaskId: string, caregiver: {
    ssin: string;
    role: string;
  }, generatedUUID: string, executionStartDate?: string): Observable<void> {
    const headers = new HttpHeaders().set('If-None-Match', generatedUUID);
    const body = {
      ssin: caregiver.ssin,
      role: caregiver.role,
      executionStartDate: executionStartDate
    };
    return this.http.post<void>(`/prescriptions/${prescriptionId}/assign/${referralTaskId}`, body, {headers: headers});
  }

  assignOrganization(prescriptionId: string, referralTaskId: string, organization: {
    nihdi: string;
    institutionTypeCode: string;
  }, generatedUUID: string, executionStartDate?: string): Observable<void> {
    const headers = new HttpHeaders().set('If-None-Match', generatedUUID);
    const body = {
      nihdi: organization.nihdi,
      institutionTypeCode: organization.institutionTypeCode,
      executionStartDate: executionStartDate
    };
    return this.http.post<void>(`/prescriptions/${prescriptionId}/assignOrganization/${referralTaskId}`, body, {headers: headers});
  }

  transferAssignation(prescriptionId: string, referralTaskId: string, performerTaskId: string, caregiver: {
    ssin: string;
    role: string;
  }, generatedUUID: string, executionStartDate?: string): Observable<void> {
    const headers = new HttpHeaders().set('If-None-Match', generatedUUID);
    const body = {
      ssin: caregiver.ssin,
      role: caregiver.role,
      executionStartDate: executionStartDate
    };
    return this.http.post<void>(`/prescriptions/${prescriptionId}/${referralTaskId}/transfer/${performerTaskId}`, body, {headers: headers});
  }

  rejectAssignation(prescriptionId: string, performerTaskId: string, generatedUUID: string): Observable<void> {
    const headers = new HttpHeaders().set('If-None-Match', generatedUUID);
    return this.http.post<void>(`/prescriptions/${prescriptionId}/rejections/${performerTaskId}`, {}, {headers: headers});
  }
}

export function getPatientSsin(serviceRequest: ServiceRequest): string {
  return serviceRequest?.subject?.identifier?.value;
}
