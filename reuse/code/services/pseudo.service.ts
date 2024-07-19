import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Pseudonym, PseudonymisationHelper} from '@smals/vas-integrations-pseudojs';
import {ConfigurationService} from './configuration.service';
import {PseudonymisationClientImpl} from "./pseudonymisationClient.service";
import {EHealthProblem} from "@smals/vas-integrations-pseudojs/app/internal/EHealthProblem";
import {Curve} from "@smals/vas-integrations-pseudojs/app/Curve";
import {from, Observable, of} from "rxjs";
import {Base64} from "@smals/vas-integrations-pseudojs/app/utils/Base64";

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
         return Base64.encode(res)
      }
      return res.asString()
    })


    console.log(data)
    return from(data)
  }

  identify(value: string): Observable<string> {
    const bn = Base64.decode(value)


    const data = this.domain.pseudonymInTransitFactory.from(bn as Pseudonym, bn.transitInfo).identify().then(res => {
      console.log(res)
      if (!(res instanceof EHealthProblem)) {
        return res.asString()
      }
      return res.detail
    })

    console.log(data)
    return from(data)
  }
}
