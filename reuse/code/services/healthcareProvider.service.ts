import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {HealthcareProviderList} from "../interfaces/healthcareProvider.interface";

@Injectable({providedIn: 'root'})
export class HealthcareProviderService {

  constructor(
    private http: HttpClient,
  ) {
  }

  findAll(query: string, zipCodes: string[], disciplines: string[], institutionTypes: string[], page?: number, pageSize?: number): Observable<HealthcareProviderList> {
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

    params = params.set('page', page ?? 1)
    params = params.set('pageSize', pageSize ?? 10)
    return this.http.get<HealthcareProviderList>(`/healthCareProviders`, {params});
  }

}
