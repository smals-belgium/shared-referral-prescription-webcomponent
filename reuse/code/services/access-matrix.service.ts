import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AccessMatrix } from '../interfaces';

@Injectable({providedIn: 'root'})
export class AccessMatrixService {

  constructor(
    private readonly http: HttpClient
  ) {
  }

  findForConnectedUser(): Observable<AccessMatrix[]> {
    return this.http.get<AccessMatrix[]>('/accessMatrix');
  }
}
