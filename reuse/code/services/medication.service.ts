import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MedicationResults } from '../interfaces/medication.interface';

@Injectable({providedIn: 'root'})
export class MedicationService {

  constructor(
    private http: HttpClient,
  ) {
  }

  findAll(input: string): Observable<MedicationResults> {
    let params = new HttpParams();
    const regex = /^[0-9]{7}$/;
    if(regex.test(input.replace(/[^a-zA-Z0-9]/g, ''))){
      params = params.append('cnkCode', input.replace(/[^0-9]/g, ''));
    }
    else{
      params = params.append('name', input);
    }
    return this.http.get<MedicationResults>('/medications', {params});
  }
}
