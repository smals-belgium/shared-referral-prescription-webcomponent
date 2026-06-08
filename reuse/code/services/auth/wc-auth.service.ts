import { inject, Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  filter,
  first,
  Observable,
  of,
  shareReplay,
  switchMap,
} from 'rxjs';
import { map } from 'rxjs/operators';
import { Buffer } from 'buffer';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { AccessToken, IdToken, ResourceAccess, UserProfile } from '@reuse/code/interfaces';
import { Discipline, OIDC, Role } from '@reuse/code/openapi';
import {
  CLIENT_ID,
  ORGANIZATIONS_CLAIM_KEY,
  RESOURCE_ACCESS_CLAIM_KEY,
  USER_PROFILE_CLAIM_KEY,
} from '@reuse/code/services/auth/auth-constants';
import { ConfigurationService } from '@reuse/code/services/config/configuration.service';

@Injectable({ providedIn: 'root' })
export class WcAuthService extends AuthService {
  private _getAccessToken!: (audience?: string) => Promise<string | null>;
  private _getIdToken!: () => IdToken;
  private readonly _configService = inject(ConfigurationService);

  private readonly ready$ = new BehaviorSubject<boolean>(false);
  private readonly exchangeToClientId = this._configService.getEnvironmentVariable('fhirGatewayClientId') as string;

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
      map(token => (typeof token === 'string' ? this.decodeJwt<IdToken>(token) : token)),
      shareReplay(1)
    );
  }

  getResourceAccess(audience: string) {
    return this.getAccessToken(audience).pipe(
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
    this.getResourceAccess(this.exchangeToClientId),
  ]).pipe(
    map(([claims, access]) => this.userProfileHasProfessionalKey(claims?.userProfile, access?.resource_access)),
    shareReplay(1)
  );

  override isProfessional(): Observable<boolean> {
    return this.isProfessional$Internal;
  }

  override discipline(): Observable<Discipline> {
    return this.getClaims().pipe(
      map(claims => {
        const keys = claims?.[USER_PROFILE_CLAIM_KEY]
          ? Object.keys(claims?.[USER_PROFILE_CLAIM_KEY]).map(k => k.toLowerCase())
          : [];
        const match = Object.values(Discipline).find(discipline => keys.includes(discipline.toLowerCase()));
        return match ?? Discipline.Patient;
      })
    );
  }

  override role() {
    return this.getResourceAccess(this.exchangeToClientId).pipe(
      map(accessToken => {
        const roles = accessToken?.[RESOURCE_ACCESS_CLAIM_KEY]?.[CLIENT_ID]?.roles ?? [];
        const match = Object.values(Role).find(role => roles.includes(role.toLowerCase()));
        return (match as Role) ?? '';
      })
    );
  }

  override oidc(): Observable<OIDC | null> {
    return this.getClaims().pipe(
      map(claims => {
        const keys = claims?.[USER_PROFILE_CLAIM_KEY]?.[ORGANIZATIONS_CLAIM_KEY]
          ? Object.keys(claims?.[USER_PROFILE_CLAIM_KEY]?.[ORGANIZATIONS_CLAIM_KEY]).map(k => k.toLowerCase())
          : [];
        const match = Object.values(OIDC).find(oidc => keys.includes(oidc.toLowerCase()));
        return match ?? null; //null as default value
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
    if (userProfile) {
      const hasProfessionalKey = Object.values(Discipline).some(discipline =>
        Object.hasOwn(userProfile, discipline.toLowerCase())
      );

      return hasProfessionalKey;
    }

    if (resourceAccess) {
      const roles = resourceAccess[CLIENT_ID].roles;
      const isAdmin = Array.isArray(roles) && roles.includes('admin');

      return isAdmin;
    }

    return false;
  }
}
