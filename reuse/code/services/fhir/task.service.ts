import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DateTime } from 'luxon';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { PrescriptionExecutionFinish, PrescriptionExecutionStart } from '../../interfaces';

@Injectable({providedIn: 'root'})
export class TaskService {

  constructor(
    private http: HttpClient
  ) {
  }

  findAll(prescriptionId?: string): Observable<any> {
    let params = new HttpParams();
    if (prescriptionId) {
      params = params.set('based-on', prescriptionId);
    }
    return this.http.get<any>('fhir://Task', {params});
  }

  assign(prescriptionId: string, referralTaskId: string, cargiver: { ssin: string; role: string; }, generatedUUID: string): Observable<void> {
    const headers = new HttpHeaders().set('If-None-Match', generatedUUID);
    const body = {
      resourceType: 'Task',
      meta: {
        profile: [
          'https://www.ehealth.fgov.be/standards/fhir/referral/StructureDefinition/be-performer-task'
        ]
      },
      partOf: {
        reference: 'Task/' + referralTaskId
      },
      basedOn: [
        {
          reference: 'ServiceRequest/' + prescriptionId
        }
      ],
      intent: 'order',
      status: 'ready',
      authoredOn: DateTime.now().toISO(),
      owner: {
        reference: 'PractitionerRole/' + cargiver.ssin + '-' + cargiver.role.toUpperCase()
      }
    };

    return this.http.post<void>('fhir://Task', body, {headers: headers});
  }

  startExecution(performerTaskId: string, executionStart: PrescriptionExecutionStart, generatedUUID: string): Observable<void> {
    const headers = new HttpHeaders().set('If-None-Match', generatedUUID);
    const body = {
      'start': executionStart.startDate
    };
    return this.http.patch<void>(`/prescriptions/${performerTaskId}/start`, body, {headers: headers});
  }

  restartExecution(performerTaskId: string, generatedUUID: string): Observable<void> {
    return this.http.patch<void>(`/prescriptions/${performerTaskId}/restart`, {});
  }

  finishExecution(performerTaskId: string, executionEnd: PrescriptionExecutionFinish, generatedUUID: string): Observable<void> {
    const headers = new HttpHeaders().set('If-None-Match', generatedUUID);
    const body = {
      'end': executionEnd.endDate
    };
    return this.http.patch<void>(`/prescriptions/${performerTaskId}/finish`, body, {headers: headers});
  }

  cancelExecution(performerTaskId: string, generatedUUID: string): Observable<void> {
    const headers = new HttpHeaders().set('If-None-Match', generatedUUID);
    return this.http.patch<void>(`/prescriptions/${performerTaskId}/cancel`, {}, {headers: headers});
  }

  interruptExecution(performerTaskId: string, generatedUUID: string): Observable<void> {
    const headers = new HttpHeaders().set('If-None-Match', generatedUUID);
    return this.http.patch<void>(`/prescriptions/${performerTaskId}/interrupt`, {}, {headers: headers});
  }
}
