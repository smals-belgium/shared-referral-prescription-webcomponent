import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { BlindResult, PseudoHelper } from '@smals/vas-integrations-pseudojs';
import { map } from 'rxjs/operators';
import { Buffer } from 'buffer';
import { ConfigurationService } from './configuration.service';

interface PseudoResponse {
  x: string;
  y: string;
  crv: string;
  exp: string;
  iat: string;
  domain: string;
  transitInfo: string;
}

@Injectable({providedIn: 'root'})
export class PseudoService {

  private readonly pseudoHelper = new PseudoHelper();
  private readonly pseudoApiUrl = this.configService.getEnvironmentVariable('pseudoApiUrl');

  constructor(
    private http: HttpClient,
    private configService: ConfigurationService
  ) {
  }

  pseudonymize(value: string): Observable<string> {
    if (!this.configService.getEnvironmentVariable('enablePseudo')) {
      return of(value);
    }
    const bufferSize = 8;
    const blindResult = this.pseudoHelper.blindToBase64Point(value, bufferSize);
    const body = {
      x: blindResult.blindedPoint.x,
      y: blindResult.blindedPoint.y,
      crv: 'P-521',
      id: crypto.randomUUID?.() || '1' // to test without HTTPS
    }
    return this.http.post<PseudoResponse>(this.pseudoApiUrl + '/domains/uhmep_v1/pseudonymize', body)
      .pipe(
        map((result) => ({
          ...result,
          ...this.getUnblindedPoint(result, blindResult)
        })),
        map((result) => Buffer.from(JSON.stringify(result)).toString('base64'))
      );
  }

  private getUnblindedPoint(result: PseudoResponse, blindResult: BlindResult) {
    const unbldindedResult = this.pseudoHelper.unblindToBase64Point(result, blindResult.randomBigInt);

    return {
      x: unbldindedResult.x,
      y: unbldindedResult.y,
    };
  }
}
