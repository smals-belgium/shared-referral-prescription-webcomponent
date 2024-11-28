import { Injectable } from '@angular/core';
import { BehaviorSubject, first, from, mergeMap, Observable, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Buffer } from 'buffer';
import { AuthExchangeService } from './auth-exchange.service';
import { ConfigurationService } from './configuration.service';
import { AuthService } from './auth.service';
import {Discipline, IdToken} from "../interfaces";

@Injectable({providedIn: 'root'})
export class WcAuthService extends AuthService {

  private readonly ready$ = new BehaviorSubject<boolean>(false);
  private _getToken!: () => Promise<string>;
  private _getIdToken!: () => Promise<IdToken>;

  constructor(
    private configService: ConfigurationService,
    private authExchangeService: AuthExchangeService
  ) {
    super();
  }

  override init(getToken: () => Promise<string>, getIdToken?: () => Promise<IdToken>): void {
    this._getToken = getToken;
    if(getIdToken) {
      this._getIdToken = getIdToken;
    }
    this.ready$.next(true);
  }

  private getToken(): Observable<string> {
    return this.ready$.pipe(
      first((ready) => ready),
      switchMap(() => this._getToken())
    );
  }

  private getIdToken(): Observable<IdToken | string> {
    return this.ready$.pipe(
      first((ready) => ready),
      switchMap(() => typeof this._getIdToken === "function" ? this._getIdToken() : this._getToken())
    );
  }

  override getAccessToken(targetClientId?: string): Observable<string> {
    const keycloakConfig = this.configService.getEnvironmentVariable('keycloak');
    if (targetClientId) {
      const config = {
        authority: keycloakConfig.url + '/realms/' + keycloakConfig.realm,
        clientId: keycloakConfig.clientId
      }
      return from(this.getToken()).pipe(
        mergeMap((token) => this.authExchangeService.exchangeAccessToken(config, token, targetClientId))
      );
    } else {
      return from(this.getToken());
    }
  }

  override getClaims(): Observable<Record<string, any>> {
   return this.getIdToken().pipe(
        map((token) => (typeof token === 'string') ? JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()) : token))
  }

  override isProfessional(): Observable<boolean> {
    return this.getClaims().pipe(
      map((claims) => this.userProfileHasProfessionalKey(claims?.['userProfile']))
    );
  }

  private userProfileHasProfessionalKey(userProfile?: Record<string, any>): boolean {
    if(!userProfile) return false

    let professional: boolean = false;

    for(let value in Discipline) {
      if(userProfile.hasOwnProperty(value.toLowerCase())) {
        professional = true;
      }
    }

    if(userProfile.hasOwnProperty('organizations') && userProfile['organizations']?.['role_code'] === '144') {
      professional = true;
    }

    return professional;
  }
}
