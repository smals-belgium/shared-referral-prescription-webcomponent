import { Injectable } from '@angular/core';
import { EHealthProblem, PseudonymInTransit, Value } from '@smals-belgium-shared/pseudo-helper';
import { pseudonymInTransitMock } from '@reuse/code/demo/mocks/pseudonymInTransit';

@Injectable({ providedIn: 'root' })
export class DemoPseudoService {
  pseudonymize(value: string): Promise<string> {
    return Promise.resolve(value);
  }

  identify(value: string): Promise<string> {
    return Promise.resolve(value);
  }

  async pseudonymizeValue(val: Value) {
    return val.pseudonymize().then(res => {
      if (res instanceof EHealthProblem) {
        throw new Error(res.title, { cause: res.detail });
      }
      return res.asShortString();
    });
  }

  byteArrayToValue() {
    this.handlePseudomizationNotEnabled();
    return null;
  }

  async identifyPseudonymInTransit(pseudonymInTransit: PseudonymInTransit) {
    const res = await pseudonymInTransit.identify();
    if (res instanceof EHealthProblem) {
      throw new Error(res.title, { cause: res.detail });
    }
    return res.asBytes();
  }

  toPseudonymInTransit() {
    return pseudonymInTransitMock;
  }

  private handlePseudomizationNotEnabled() {
    throw new Error('Pseudomization not enabled.');
  }
}
