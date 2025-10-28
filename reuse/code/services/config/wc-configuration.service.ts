import { Injectable } from '@angular/core';
import { APP_CONFIG } from '@reuse/app.config';
import { ConfigurationService } from '@reuse/code/services/config/configuration.service';
import { EMPTY_OBJECT } from '@reuse/code/constants/common.constants';

@Injectable({
  providedIn: 'root',
})
export class WcConfigurationService extends ConfigurationService {
  private readonly referralPrescriptionEnvironment:
    | 'demo'
    | 'local'
    | 'testHcp'
    | 'testPatient'
    | 'intExtHcp'
    | 'intExtPatient'
    | 'intPubHcp'
    | 'intPubPatient'
    | 'accHcp'
    | 'accPatient'
    | 'accInHcp'
    | 'accInPatient'
    | 'accUpHcp'
    | 'accUpPatient'
    | 'prodHcp'
    | 'prodPatient'
    | 'prodInHcp'
    | 'prodInPatient'
    | 'prodUpHcp'
    | 'prodUpPatient';

  private readonly configVariables: Record<string, any>;

  constructor() {
    super();
    this.referralPrescriptionEnvironment = (window as any).referralPrescriptionEnv || 'prodHcp';
    this.configVariables = APP_CONFIG.variables[this.referralPrescriptionEnvironment] || EMPTY_OBJECT;
  }

  override getEnvironment() {
    return this.referralPrescriptionEnvironment;
  }

  override getEnvironmentVariable(key: string): any {
    return this.configVariables[key];
  }
}
