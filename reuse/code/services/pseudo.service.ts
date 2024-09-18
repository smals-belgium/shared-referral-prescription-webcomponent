import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ConfigurationService} from './configuration.service';
import {PseudonymisationClientImpl} from "./pseudonymisationClient.service";
import {EHealthProblem, PseudonymInTransit, PseudonymisationHelper} from "@smals/vas-integrations-pseudojs";
import {Curve} from "@smals/vas-integrations-pseudojs/app/Curve";


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

  async pseudonymize(value: string): Promise<string> {
    if (!this.configService.getEnvironmentVariable('enablePseudo')) {
      return value;
    }

    return await this.domain.valueFactory.fromString(value).pseudonymize().then((res: PseudonymInTransit | EHealthProblem) => {
      if (res instanceof EHealthProblem) {
        throw new Error(res.detail)
      }
      return res.asString()
    })
  }
}
