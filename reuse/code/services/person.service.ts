import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Person } from '../interfaces';
import { tap } from 'rxjs/operators';

@Injectable({providedIn: 'root'})
export class PersonService {

  private cache: Record<string, Person> = {};

  constructor(
    private http: HttpClient
  ) {
  }

  findAll(criteria: Partial<Person>): Observable<Person[]> {
    const params = Object.keys(criteria)
      .filter((key) => !!criteria[key as keyof Person])
      .reduce((acc, cur) => acc.append(cur, criteria[cur as keyof Person]!.trim()), new HttpParams());
    return this.http.get<Person[]>(`/persons`, {params});
  }

  findOne(ssin: string): Observable<Person> {
    if (this.cache[ssin]) {
      return of(this.cache[ssin]);
    }
    return this.http.get<Person>(`/persons/${ssin}`)
      .pipe(tap((person) => this.cache[ssin] = person));
  }
}
