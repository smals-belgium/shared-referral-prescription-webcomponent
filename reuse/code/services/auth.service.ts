import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {IdToken, Token} from "../interfaces";

@Injectable({providedIn: 'root'})
export class AuthService {

  init(getToken: () => Promise<string>, getIdToken?: () => Promise<IdToken>): void {
    throw new Error('Not implemented');
  }

  getAccessToken(targetClientId?: string): Observable<string> {
    throw new Error('Not implemented');
  }

  getClaims(): Observable<Record<string, any>> {
    throw new Error('Not implemented');
  }

  isProfessional(): Observable<boolean> {
    throw new Error('Not implemented');
  }
}
