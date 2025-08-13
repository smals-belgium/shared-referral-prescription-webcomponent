import { Injectable } from '@angular/core';
import {
  Curve,
  Domain,
  EHealthProblem,
  PseudonymInTransit,
  PseudonymisationHelper,
  Value
} from '@smals-belgium-shared/pseudo-helper';
import { ConfigurationService } from './configuration.service';

@Injectable({providedIn: 'root'})
export class PseudoService {
  private readonly pseudonymizationDomain: Domain | undefined;
  private readonly pseudoApiUrl = this.configService.getEnvironmentVariable('pseudoApiUrl');

  constructor(
    private readonly configService: ConfigurationService,
    private readonly pseudonymizationHelper: PseudonymisationHelper,
  ) {
    if (this.configService.getEnvironmentVariable('enablePseudo')) {
      this.pseudonymizationDomain = this.pseudonymizationHelper.createDomain('uhmep_v1', <Curve>'p521', this.pseudoApiUrl, 8);
    }
  }

  async pseudonymize(value: string): Promise<string> {
    if (!this.pseudonymizationDomain) {
      return value;
    }

    return await this.pseudonymizationDomain.valueFactory.fromString(value).pseudonymize().then((res: PseudonymInTransit | EHealthProblem) => {
      if (res instanceof EHealthProblem) {
        throw new Error(res.detail);
      }
      return res.asString();
    })
  }

  async identify(value: string): Promise<string> {
    if (!this.pseudonymizationDomain) {
      return value;
    }

    return await this.pseudonymizationDomain.pseudonymInTransitFactory.fromSec1AndTransitInfo(value).identify().then((res: Value | EHealthProblem) => {
      if (res instanceof EHealthProblem) {
        throw new Error(res.detail);
      }
      return res.asString();
    })
  }

  async pseudonymizeValue(val: Value) {
    return val.pseudonymize().then((res) =>
    {
      if (res instanceof EHealthProblem) {
        throw new Error(res.title, { cause: res.detail });
      }
      return res.asShortString();
    });
  }

  byteArrayToValue(str: Uint8Array) {
    if (!this.pseudonymizationDomain) {
      this.handlePseudomizationNotEnabled();
      return null;
    }
    return this.pseudonymizationDomain.valueFactory.fromArray(str);
  }

  async identifyPseudonymInTransit(pseudonymInTransit: PseudonymInTransit) {
    const res = await pseudonymInTransit.identify();
    if (res instanceof EHealthProblem) {
      throw new Error(res.title, {cause: res.detail});
    }
    return res.asBytes();
  }

  toPseudonymInTransit(asn1Compressed: string){
    if (!this.pseudonymizationDomain) {
      this.handlePseudomizationNotEnabled();
      return null;
    }
    return this.pseudonymizationDomain.pseudonymInTransitFactory.fromSec1AndTransitInfo(
      asn1Compressed
    )
  }

  private handlePseudomizationNotEnabled() {
    throw new Error('Pseudomization not enabled.');
  }
}
