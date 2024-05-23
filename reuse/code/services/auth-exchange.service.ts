import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, mergeMap, Observable, of, throwError } from 'rxjs';
import { first } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { DataState, LoadingStatus } from '../interfaces';

interface OpenIdConfiguration {
  authority: string;
  clientId: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthExchangeService {

  private exchangeStatus: Record<string, BehaviorSubject<DataState<any>>> = {};

  constructor(
    private http: HttpClient
  ) {
  }

  exchangeAccessToken(config: OpenIdConfiguration, sourceAccessToken: string, targetClientId: string): Observable<string> {
    if (!this.exchangeStatus[targetClientId]) {
      this.exchangeStatus[targetClientId] = new BehaviorSubject<DataState<any>>({status: LoadingStatus.INITIAL});
    }
    if (!this.isAccessTokenLoading(targetClientId) && !this.isTokenValid(targetClientId)) {
      this.executeNewAccessTokenExchange(config, sourceAccessToken, targetClientId);
    }
    return this.exchangeStatus[targetClientId].pipe(
      first(state => state.status !== LoadingStatus.LOADING),
      mergeMap(state => state.status === LoadingStatus.SUCCESS
        ? of(state.data)
        : throwError(() => state.error))
    );
  }

  private isAccessTokenLoading(targetClientId: string) {
    return this.exchangeStatus[targetClientId].value.status === LoadingStatus.LOADING;
  }

  private isTokenValid(targetClientId: string): boolean {
    const token = this.exchangeStatus[targetClientId].value.data;
    if (!token) {
      return false;
    }
    const decodedToken = jwtDecode(token) as Record<string, any>;
    return Date.now() <= (decodedToken['exp'] * 1000) - 10000;
  }

  private executeNewAccessTokenExchange(config: OpenIdConfiguration, sourceAccessToken: string, targetClientId: string) {
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/x-www-form-urlencoded')
    const body = new HttpParams()
      .set('requested_token_type', 'urn:ietf:params:oauth:token-type:access_token')
      .set('grant_type', 'urn:ietf:params:oauth:grant-type:token-exchange')
      .set('subject_token_type', 'urn:ietf:params:oauth:token-type:access_token')
      .set('subject_token', sourceAccessToken)
      .set('client_id', config.clientId)
      .set('audience', targetClientId);


    this.exchangeStatus[targetClientId].next({status: LoadingStatus.LOADING});
    this.http.post<any>(config.authority + '/protocol/openid-connect/token', body, {headers})
      .subscribe({
        next: (response) => {
          this.exchangeStatus[targetClientId].next({status: LoadingStatus.SUCCESS, data: response.access_token});
        },
        error: (error) => {
          this.exchangeStatus[targetClientId].next({status: LoadingStatus.ERROR, error});
        }
      });
  }
}
