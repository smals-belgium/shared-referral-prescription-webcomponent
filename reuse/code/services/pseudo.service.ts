import {Injectable} from '@angular/core';
import {PseudonymisationHelper, EHealthProblem, Value, PseudonymInTransit, Domain} from '@smals-belgium-shared/pseudo-helper/dist';
import {ConfigurationService} from './configuration.service';
import {Curve} from "@smals-belgium-shared/pseudo-helper/dist/app/Curve";

@Injectable({providedIn: 'root'})
export class PseudoService {
  private pseudonymisationDomain: Domain;
  private readonly pseudoApiUrl = this.configService.getEnvironmentVariable('pseudoApiUrl');

  constructor(
    private configService: ConfigurationService,
    private pseudomationHelper: PseudonymisationHelper,
  ) {
    this.pseudonymisationDomain = this.pseudomationHelper.createDomain('uhmep_v1', <Curve>'p521', this.pseudoApiUrl, 8);
  }

  async pseudonymize(value: string): Promise<string> {
    if (!this.configService.getEnvironmentVariable('enablePseudo')) {
      return value;
    }

    return await this.pseudonymisationDomain.valueFactory.fromString(value).pseudonymize().then((res: PseudonymInTransit | EHealthProblem) => {
      if (res instanceof EHealthProblem) {
        throw new Error(res.detail);
      }
      return res.asString();
    })
  }

  async identify(value: string): Promise<string> {
    if (!this.configService.getEnvironmentVariable('enablePseudo')) {
      return value;
    }

    return await this.pseudonymisationDomain.pseudonymInTransitFactory.fromSec1AndTransitInfo(value).identify().then((res: Value | EHealthProblem) => {
      if (res instanceof EHealthProblem) {
        throw new Error(res.detail);
      }
      return res.asString();
    })
  }
}
