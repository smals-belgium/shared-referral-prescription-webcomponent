import { HttpClient } from '@angular/common/http';
import { ConfigurationService } from '../services/config/configuration.service';
import { retry, take } from 'rxjs/operators';
import { lastValueFrom } from 'rxjs';
import { PseudonymisationClient } from '@smals-belgium-shared/pseudo-helper';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PseudoClient implements PseudonymisationClient {
  private readonly pseudoApiUrl = this.configService.getEnvironmentVariable('pseudoApiUrl');

  constructor(
    private readonly http: HttpClient,
    private readonly configService: ConfigurationService
  ) {}

  getDomain(domainKey: string): Promise<string> {
    const request$ = this.http.get(this.pseudoApiUrl + '/domains/' + domainKey, { responseType: 'text' }).pipe(take(1));

    return lastValueFrom(request$);
  }

  identify(domainKey: string, payload: string): Promise<string> {
    const request$ = this.http
      .post(this.pseudoApiUrl + '/domains/' + domainKey + '/identify', payload, { responseType: 'text' })
      .pipe(take(1), retry(1));

    return lastValueFrom(request$);
  }

  identifyMultiple(domainKey: string, payload: string): Promise<string> {
    const request$ = this.http
      .post(this.pseudoApiUrl + '/domains/' + domainKey + '/identifyMultiple', payload, { responseType: 'text' })
      .pipe(take(1), retry(1));

    return lastValueFrom(request$);
  }

  pseudonymize(domainKey: string, payload: string): Promise<string> {
    const request$ = this.http
      .post(this.pseudoApiUrl + '/domains/' + domainKey + '/pseudonymize', payload, { responseType: 'text' })
      .pipe(take(1));

    return lastValueFrom(request$);
  }

  pseudonymizeMultiple(domainKey: string, payload: string): Promise<string> {
    const request$ = this.http
      .post(this.pseudoApiUrl + '/domains/' + domainKey + '/pseudonymizeMultiple', payload, { responseType: 'text' })
      .pipe(take(1));

    return lastValueFrom(request$);
  }
}
