import { Injectable } from '@angular/core';
import { BehaviorSubject, first, from, mergeMap, Observable, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Buffer } from 'buffer';
import { AuthExchangeService } from './auth-exchange.service';
import { ConfigurationService } from './configuration.service';
import { AuthService } from './auth.service';
import {Discipline} from "../interfaces";

@Injectable({providedIn: 'root'})
export class WcAuthService extends AuthService {

  private readonly ready$ = new BehaviorSubject<boolean>(false);
  private _getToken!: () => Promise<string>;

  constructor(
    private configService: ConfigurationService,
    private authExchangeService: AuthExchangeService
  ) {
    super();
  }

  override init(getToken: () => Promise<string>): void {
    this._getToken = getToken;
    this.ready$.next(true);
  }

  private getToken(): Observable<string> {
    return this.ready$.pipe(
      first((ready) => ready),
      switchMap(() => this._getToken())
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
    return this.getToken().pipe(
      map((token) => JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()))
    )
  }

  override isProfessional(): Observable<boolean> {
    return this.getClaims().pipe(
      map((claims) => this.userProfileHasProfessionalKey(claims['userProfile']))
    );
  }

  private userProfileHasProfessionalKey(userProfile: Record<string, any>): boolean {
    let professional: boolean = false;

    for(let value in Discipline) {
      if(userProfile.hasOwnProperty(value.toLowerCase())) {
        professional = true;
      }
    }

    return professional;
  }
}
