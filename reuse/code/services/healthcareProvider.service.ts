import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Professional } from '../interfaces';
import { Organization } from '../interfaces/organization.interface';

@Injectable({providedIn: 'root'})
export class HealthcareProviderService {

  constructor(
    private http: HttpClient,
  ) {
  }

  findAll(query: string, zipCodes: string[], disciplines: string[], institutionTypes: string[]): Observable<(Professional | Organization)[]> {
    let params = new HttpParams();
    if(query.length) {
      params = params.set('query', query);
    }
    if (zipCodes.length) {
      params = params.set('zipCode', zipCodes.join(','));
    }
    if (disciplines.length) {
      params = params.set('discipline', disciplines.join(','));
    }
    if (institutionTypes.length) {
      params = params.set('institutionType', institutionTypes.join(','));
    }
    return this.http.get<(Professional | Organization)[]>(`/healthCareProviders`, {params});
  }

}
