import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, filter, first, Observable, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Buffer } from 'buffer';
import { AuthService } from './auth.service';
import { Discipline, IdToken } from '../interfaces';

@Injectable({providedIn: 'root'})
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

  private getIdToken(): Observable<IdToken | string | null> {
    return this.ready$.pipe(
      first((ready) => ready),
      switchMap(async () => typeof this._getIdToken === "function" ? this._getIdToken() : this._getAccessToken())
    );
  }

  override getAccessToken(audience?: string): Observable<string | null> {
    return this.ready$.pipe(
      first((ready) => ready),
      switchMap(() => this._getAccessToken(audience))
    );
  }

  override getClaims(): Observable<Record<string, any>> {
    return this.getIdToken().pipe(
      map((token) => (typeof token === 'string') ? JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()) : token))
  }

  getResourceAccess(): Observable<Record<string, any>> {
    return this.getAccessToken().pipe(
      filter(token => token !== null),
      map((token) => JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())))
  }

  override isProfessional(): Observable<boolean> {
    return combineLatest([this.getClaims(), this.getResourceAccess()]).pipe(
      map(([claims, accessToken]) => {
        return this.userProfileHasProfessionalKey(claims?.['userProfile'], accessToken?.['resource_access']);
      })
    );
  }

  override discipline(): Observable<string> {
    return this.getClaims().pipe(
      map(claims => {
        const keys = Object.keys(claims?.['userProfile']).map(k => k.toLowerCase());
        const match = Object.values(Discipline).find(discipline =>
          keys.includes(discipline.toLowerCase())
        );
        return match ?? "";
      })
    );
  }

  private userProfileHasProfessionalKey(userProfile?: Record<string, any>, resourceAccess?: Record<string, any>): boolean {
    if (!userProfile || !resourceAccess) return false;

    const hasProfessionalKey = Object.values(Discipline).some((discipline) =>
      Object.hasOwn(userProfile, discipline.toLowerCase())
    );

    return hasProfessionalKey ?? resourceAccess['nihdi-uhmep-api']?.roles?.includes('admin') ?? false;
  }
}
