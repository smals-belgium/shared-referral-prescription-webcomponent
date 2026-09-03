import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IdToken } from '@reuse/code/interfaces';
import { Discipline, OIDC, Role } from '@reuse/code/openapi';

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

  getConnectedOrganizationNihii(): Observable<string | undefined> {
    throw new Error('Not implemented');
  }

  isProfessional(): Observable<boolean> {
    throw new Error('Not implemented');
  }

  isOrganization(): Observable<boolean> {
    throw new Error('Not implemented');
  }

  isOrganizationAndNotActingForProfessional(): Observable<boolean> {
    throw new Error('Not implemented');
  }
  isOrganizationAndActingForProfessional(): Observable<boolean> {
    throw new Error('Not implemented');
  }

  isPatient(): Observable<boolean> {
    throw new Error('Not implemented');
  }

  discipline(): Observable<Discipline> {
    throw new Error('Not implemented');
  }

  role(): Observable<Role> {
    throw new Error('Not implemented');
  }

  oidc(): Observable<OIDC | null> {
    throw new Error('Not implemented');
  }
}
