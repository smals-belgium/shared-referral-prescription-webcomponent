import { HttpClient } from '@angular/common/http';
import { ConfigurationService } from '../services/config/configuration.service';
import { map, retry, take } from 'rxjs/operators';
import { lastValueFrom } from 'rxjs';
import { PseudonymisationClient } from '@smals-belgium-shared/pseudo-helper';
import { Injectable } from '@angular/core';

@Injectable({providedIn: 'root'})
export class PseudoClient implements PseudonymisationClient {
  private readonly pseudoApiUrl = this.configService.getEnvironmentVariable('pseudoApiUrl');

  constructor(
    private readonly http: HttpClient,
    private readonly configService: ConfigurationService
  ) {
  }

  getDomain(domainKey: string): Promise<string> {
    const request$ = this.http.get<string>(this.pseudoApiUrl + '/domains/' + domainKey).pipe(take(1), map(response => JSON.stringify(response)));

    return lastValueFrom(request$);
  }

  identify(domainKey: string, payload: string): Promise<string> {
    const request$ = this.http.post<{data: any}>(this.pseudoApiUrl + '/domains/' + domainKey + '/identify', payload).pipe(take(1), retry(1), map(response => JSON.stringify(response)));

    return lastValueFrom(request$);
  }

  identifyMultiple(domainKey: string, payload: string): Promise<string> {
    const request$ = this.http.post<{data: any}>(this.pseudoApiUrl + '/domains/' + domainKey + '/identifyMultiple', payload).pipe(take(1), retry(1), map(response => JSON.stringify(response.data)));

    return lastValueFrom(request$);
  }

  pseudonymize(domainKey: string, payload: string): Promise<string> {
    const request$ = this.http.post<{data: any}>(this.pseudoApiUrl + '/domains/' + domainKey + '/pseudonymize', payload).pipe(take(1), map(response => JSON.stringify(response)))

    return lastValueFrom(request$)
  }

  pseudonymizeMultiple(domainKey: string, payload: string): Promise<string> {
    const request$ = this.http.post<{data: any}>(this.pseudoApiUrl + '/domains/' + domainKey + '/pseudonymizeMultiple', payload).pipe(take(1), map(response => JSON.stringify(response.data)));

    return lastValueFrom(request$);
  }
}
