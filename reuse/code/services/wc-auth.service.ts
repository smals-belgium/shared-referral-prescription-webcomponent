import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, first, from, mergeMap, Observable, of, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Buffer } from 'buffer';
import { AuthService } from './auth.service';
import {Discipline, IdToken} from "../interfaces";

@Injectable({providedIn: 'root'})
export class WcAuthService extends AuthService {

  private readonly ready$ = new BehaviorSubject<boolean>(false);
  private _getToken!: () => string;
  private _getIdToken!: () => IdToken;
  private _getAuthExchangeToken!: (targetClientId?: string) => Observable<string>;

  constructor(
  ) {
    super();
  }

  override init(getToken: () => string, getAuthExchangeToken: (targetClientId?: string) => Observable<string>, getIdToken?: () => IdToken): void {
    this._getToken = getToken;
    if(getIdToken) {
      this._getIdToken = getIdToken;
    }
    this._getAuthExchangeToken = getAuthExchangeToken;
    this.ready$.next(true);
  }

  private getIdToken(): Observable<IdToken | string> {
    return this.ready$.pipe(
      first((ready) => ready),
      switchMap(async () => typeof this._getIdToken === "function" ? this._getIdToken() : this._getToken())
    );
  }

  override getAccessToken(targetClientId?: string): Observable<string> {
    return this.ready$.pipe(
      first((ready) => ready),
      switchMap( () => this._getAuthExchangeToken(targetClientId))
    );
  }

  override getClaims(): Observable<Record<string, any>> {
   return this.getIdToken().pipe(
        map((token) => (typeof token === 'string') ? JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()) : token))
  }

  getResourceAccess(): Observable<Record<string, any>> {
    return this.getAccessToken().pipe(
      map((token) => JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())))
  }

  override isProfessional(): Observable<boolean> {
    return combineLatest([this.getClaims(), this.getResourceAccess()]).pipe(
      map(([claims, accessToken]) => {
        return this.userProfileHasProfessionalKey(claims?.['userProfile'], accessToken?.['resource_access']);
      })
    );
  }

  private userProfileHasProfessionalKey(userProfile?: Record<string, any>, resourceAccess?: Record<string, any>): boolean {
    if (!userProfile || !resourceAccess) return false;

    const hasProfessionalKey = Object.values(Discipline).some((discipline) =>
      Object.hasOwn(userProfile, discipline.toLowerCase())
    );

    return hasProfessionalKey || resourceAccess['nihdi-uhmep-api']?.roles?.includes('admin') || false;

  }
}
