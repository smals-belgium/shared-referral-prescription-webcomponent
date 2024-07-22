import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Pseudonym, PseudonymInTransit, PseudonymisationHelper, Value} from '@smals/vas-integrations-pseudojs';
import {ConfigurationService} from './configuration.service';
import {PseudonymisationClientImpl} from "./pseudonymisationClient.service";
import {Curve} from "@smals/vas-integrations-pseudojs/app/Curve";
import {from, Observable, of} from "rxjs";
import BN from 'bn.js';

declare class EHealthProblem {
  type: string;
  title: string;
  status: string;
  detail: string;
  inResponseTo: string;
}

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

  private readonly pseudoHelper = new PseudonymisationHelper(new PseudonymisationClientImpl(this.http, this.configService));
  private readonly pseudoApiUrl = this.configService.getEnvironmentVariable('pseudoApiUrl');
  private readonly domain = this.pseudoHelper.createDomain('uhmep_v1', <Curve>'p521', this.pseudoApiUrl, 8);

  constructor(
    private http: HttpClient,
    private configService: ConfigurationService
  ) {
  }

  pseudonymize(value: string): Observable<string> {
    if (!this.configService.getEnvironmentVariable('enablePseudo')) {
      return of(value);
    }

    let data = this.domain.valueFactory.fromString(value).pseudonymize().then(res => {
      console.log(res)
      if (res instanceof EHealthProblem) {
         return this.encode(res as unknown as BN)
      }
      return (res as PseudonymInTransit).asString()
    })


    console.log(data)
    return from(data)
  }

  identify(value: string): Observable<string> {
    const bn = this.decode(value)


    const data = this.domain.pseudonymInTransitFactory.from(bn as unknown as Pseudonym, (bn as any).transitInfo).identify().then(res => {
      console.log(res)
      if (!(res instanceof EHealthProblem)) {
        return (res as Value).asString()
      }
      return res.detail
    })

    console.log(data)
    return from(data)
  }


  private encode(bn: BN): string {
    const bytes = bn.toArrayLike(Buffer, 'be', 66);
    return Buffer.from(bytes).toString('base64');
  }

  private decode(base64: string): BN {
    const bytes = Buffer.from(base64, 'base64').valueOf();
    return new BN(bytes);
  }
}
