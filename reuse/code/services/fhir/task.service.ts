import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DateTime } from 'luxon';
import { HttpClient, HttpParams } from '@angular/common/http';
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

  assign(prescriptionId: string, referralTaskId: string, cargiver: { ssin: string; role: string; }): Observable<void> {
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

    return this.http.post<void>('fhir://Task', body);
  }

  startExecution(performerTaskId: string, executionStart: PrescriptionExecutionStart): Observable<void> {
    const body = {
      'start': executionStart.startDate
    };
    return this.http.patch<void>(`/prescriptions/${performerTaskId}/start`, body);
  }

  restartExecution(performerTaskId: string): Observable<void> {
    return this.http.patch<void>(`/prescriptions/${performerTaskId}/restart`, {});
  }

  finishExecution(performerTaskId: string, executionEnd: PrescriptionExecutionFinish): Observable<void> {
    const body = {
      'end': executionEnd.endDate
    };
    return this.http.patch<void>(`/prescriptions/${performerTaskId}/finish`, body);
  }

  cancelExecution(performerTaskId: string): Observable<void> {
    return this.http.patch<void>(`/prescriptions/${performerTaskId}/cancel`, {});
  }

  interruptExecution(performerTaskId: string): Observable<void> {
    return this.http.patch<void>(`/prescriptions/${performerTaskId}/interrupt`, {});
  }
}
