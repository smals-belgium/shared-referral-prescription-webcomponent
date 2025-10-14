import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IdToken } from '@reuse/code/interfaces';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  init(getAccessToken: (audience?: string) => Promise<string | null>, getIdToken?: () => IdToken): void {
    throw new Error('Not implemented');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getAccessToken(targetClientId?: string): Observable<string | null> {
    throw new Error('Not implemented');
  }

  getClaims(): Observable<IdToken | null> {
    throw new Error('Not implemented');
  }

  isProfessional(): Observable<boolean> {
    throw new Error('Not implemented');
  }

  discipline(): Observable<string> {
    throw new Error('Not implemented');
  }

  role(): Observable<string> {
    throw new Error('Not implemented');
  }
}
