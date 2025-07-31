import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {IdToken, Token} from "../interfaces";

@Injectable({providedIn: 'root'})
export class AuthService {

  init(getAccessToken: (audience?: string) => Promise<string | null>, getIdToken?: () => IdToken): void {
    throw new Error('Not implemented');
  }

  getAccessToken(targetClientId?: string): Observable<string | null> {
    throw new Error('Not implemented');
  }

  getClaims(): Observable<Record<string, any>> {
    throw new Error('Not implemented');
  }

  isProfessional(): Observable<boolean> {
    throw new Error('Not implemented');
  }

  discipline(): Observable<string> {
    throw new Error('Not implemented');
  }
}
