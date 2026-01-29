import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  filter,
  first,
  Observable,
  of,
  shareReplay,
  startWith,
  switchMap
} from 'rxjs';
import { map } from 'rxjs/operators';
import { Buffer } from 'buffer';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { AccessToken, IdToken, ResourceAccess, UserProfile } from '@reuse/code/interfaces';
import { Discipline, Role } from '@reuse/code/openapi';
import { CLIENT_ID, RESOURCE_ACCESS_CLAIM_KEY, USER_PROFILE_CLAIM_KEY } from '@reuse/code/services/auth/auth-constants';

@Injectable({ providedIn: 'root' })
export class WcAuthService extends AuthService {
  private readonly ready$ = new BehaviorSubject<boolean>(false);
  private _getAccessToken!: (audience?: string) => Promise<string | null>;
  private _getIdToken!: () => IdToken;

  constructor() {
    super();
  }

  override init(getAccessToken: (audience?: string) => Promise<string | null>, getIdToken?: () => IdToken): void {
    this._getAccessToken = getAccessToken;
    if (getIdToken) {
      this._getIdToken = getIdToken;
    }
    this.ready$.next(true);
  }

  override getAccessToken(audience?: string): Observable<string | null> {
    return this.ready$.pipe(
      first(ready => ready),
      switchMap(() => this._getAccessToken(audience))
    );
  }

  override getClaims() {
    return this.getIdToken().pipe(
      map(token =>
        typeof token === 'string'
          ? this.decodeJwt<IdToken>(token)
          : token
      ),
      shareReplay(1)
    );
  }

  getResourceAccess() {
    return this.getAccessToken().pipe(
      filter(token => token !== null),
      map(token => this.decodeJwt<AccessToken>(token)),
      catchError(() => of(null))
    );
  }

  decodeJwt<T>(token: string): T {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
  }

  private readonly isProfessional$Internal = combineLatest([
    this.getClaims(),
    this.getResourceAccess()
  ]).pipe(
    map(([claims, access]) =>
      this.userProfileHasProfessionalKey(claims?.userProfile, access?.resource_access)
    ),
    shareReplay(1)
  );

  override isProfessional(): Observable<boolean> {
    return this.isProfessional$Internal;
  }

  override discipline(): Observable<Discipline> {
    return this.getClaims().pipe(
      map(claims => {
        const keys = claims?.[USER_PROFILE_CLAIM_KEY] ? Object.keys(claims?.[USER_PROFILE_CLAIM_KEY]).map(k => k.toLowerCase()) : [];
        const match = Object.values(Discipline).find(discipline => keys.includes(discipline.toLowerCase()));
        return match ?? Discipline.Patient;
      })
    );
  }

  override role(): Observable<string> {
    return this.getResourceAccess().pipe(
      map(accessToken => {
        const roles = accessToken?.[RESOURCE_ACCESS_CLAIM_KEY]?.[CLIENT_ID]?.roles ?? [];
        const match = Object.values(Role).find(role => roles.includes(role.toLowerCase()));
        return match ?? '';
      })
    );
  }

  private getIdToken(): Observable<IdToken | string | null> {
    return this.ready$.pipe(
      first(ready => ready),
      switchMap(async () => (typeof this._getIdToken === 'function' ? this._getIdToken() : this._getAccessToken()))
    );
  }

  private userProfileHasProfessionalKey(userProfile?: UserProfile, resourceAccess?: ResourceAccess): boolean {
    if (!userProfile || !resourceAccess) return false;

    const hasProfessionalKey = Object.values(Discipline).some(discipline =>
      Object.hasOwn(userProfile, discipline.toLowerCase())
    );

    const roles = resourceAccess[CLIENT_ID].roles;
    const isAdmin = Array.isArray(roles) && roles.includes('admin');

    return hasProfessionalKey || isAdmin || false;
  }
}
