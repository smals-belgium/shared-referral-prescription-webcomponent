import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, combineLatest, filter, first, Observable, of, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Buffer } from 'buffer';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { AccessToken, IdToken, ResourceAccess, UserProfile } from '@reuse/code/interfaces';
import { Discipline, Role } from '@reuse/code/openapi';

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
          ? (JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()) as IdToken)
          : token
      )
    );
  }

  getResourceAccess() {
    return this.getAccessToken().pipe(
      filter(token => token !== null),
      map(token => JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()) as AccessToken),
      catchError(() => of(null))
    );
  }

  override isProfessional(): Observable<boolean> {
    return combineLatest([this.getClaims(), this.getResourceAccess()]).pipe(
      map(([claims, accessToken]) =>
        this.userProfileHasProfessionalKey(claims?.['userProfile'], accessToken?.['resource_access'])
      )
    );
  }

  override discipline(): Observable<Discipline> {
    return this.getClaims().pipe(
      map(claims => {
        const keys = claims?.['userProfile'] ? Object.keys(claims?.['userProfile']).map(k => k.toLowerCase()) : [];
        const match = Object.values(Discipline).find(discipline => keys.includes(discipline.toLowerCase()));
        return match ?? Discipline.Patient;
      })
    );
  }

  override role(): Observable<string> {
    return this.getResourceAccess().pipe(
      map(accessToken => {
        const roles = accessToken?.['resource_access']?.['nihdi-uhmep-api']?.roles ?? [];
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

    const roles = resourceAccess['nihdi-uhmep-api'].roles;
    const isAdmin = Array.isArray(roles) && roles.includes('admin');

    return hasProfessionalKey || isAdmin || false;
  }
}
