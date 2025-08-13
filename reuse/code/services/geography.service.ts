import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { City } from '../interfaces';
import { map } from 'rxjs/operators';

@Injectable({providedIn: 'root'})
export class GeographyService {

  constructor(
    private readonly http: HttpClient
  ) {
  }

  findAll(zipCodeOrCityName: string): Observable<City[]> {
    const params = new HttpParams()
      .set('query', zipCodeOrCityName);
    return this.http.get<{ items: City[] }>(`/geography/cities`, {params})
      .pipe(map(result => result.items));
  }
}
