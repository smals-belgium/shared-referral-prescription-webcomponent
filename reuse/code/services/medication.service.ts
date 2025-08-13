import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MedicationResults } from '../interfaces/medication.interface';

@Injectable({providedIn: 'root'})
export class MedicationService {

  constructor(
    private readonly http: HttpClient,
  ) {
  }

  findAll(input: string): Observable<MedicationResults> {
    let params = new HttpParams();
    const regex = /^\d{7}$/;
    if(regex.test(input.replace(/[^a-zA-Z0-9]/g, ''))){
      params = params.append('cnkCode', input.replace(/ \D/g, ''));
    }
    else{
      params = params.append('name', input);
    }
    return this.http.get<MedicationResults>('/medications', {params});
  }
}
