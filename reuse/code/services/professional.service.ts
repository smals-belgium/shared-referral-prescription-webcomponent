import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Professional } from '../interfaces';

@Injectable({providedIn: 'root'})
export class ProfessionalService {

  constructor(
    private readonly http: HttpClient,
  ) {
  }

  findAll(query: string, zipCodes: string[], disciplines: string[]): Observable<Professional[]> {
    let params = new HttpParams()
      .set('query', query);
    zipCodes.forEach(z => params = params.append('zipCode', z));
    disciplines.forEach(d => params = params.append('discipline', d));
    return this.http.get<Professional[]>(`/professionals`, {params});
  }

}
