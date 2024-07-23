import {PseudonymisationClient} from "@smals/vas-integrations-pseudojs"
import {HttpClient} from "@angular/common/http";
import {ConfigurationService} from "./configuration.service";
import {take} from "rxjs/operators";
import {lastValueFrom} from "rxjs";

export class PseudonymisationClientImpl implements PseudonymisationClient {
  private readonly pseudoApiUrl = this.configService.getEnvironmentVariable('pseudoApiUrl');

  constructor(
    private http: HttpClient,
    private configService: ConfigurationService
  ) {
  }

  getDomain(domainKey: string): Promise<string> {
    const request$ = this.http.get<string>(this.pseudoApiUrl + '/domains/' + domainKey).pipe(take(1));

    return lastValueFrom(request$).then(response => response);
  }

  identify(domainKey: string, payload: string): Promise<string> {
    const request$ = this.http.post<{data: any}>(this.pseudoApiUrl + '/domains/' + domainKey + '/identify', payload).pipe(take(1));

    return lastValueFrom(request$).then(response => JSON.stringify(response));
  }

  identifyMultiple(domainKey: string, payload: string): Promise<string> {
    const request$ = this.http.post<{data: any}>(this.pseudoApiUrl + '/domains/' + domainKey + '/identifyMultiple', payload).pipe(take(1));

    return lastValueFrom(request$).then(response => JSON.stringify(response.data));
  }

  pseudonymize(domainKey: string, payload: string): Promise<string> {
    const request$ = this.http.post<{data: any}>(this.pseudoApiUrl + '/domains/' + domainKey + '/pseudonymize', payload).pipe(take(1))

    return lastValueFrom(request$).then(response => JSON.stringify(response))
  }

  pseudonymizeMultiple(domainKey: string, payload: string): Promise<string> {
    const request$ = this.http.post<{data: any}>(this.pseudoApiUrl + '/domains/' + domainKey + '/pseudonymizeMultiple', payload).pipe(take(1));

    return lastValueFrom(request$).then(response => JSON.stringify(response.data));
  }
}
