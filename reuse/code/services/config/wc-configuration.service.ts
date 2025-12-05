import { Injectable } from '@angular/core';
import { APP_CONFIG } from '@reuse/app.config';
import { ConfigurationService } from '@reuse/code/services/config/configuration.service';
import { EMPTY_OBJECT } from '@reuse/code/constants/common.constants';
import { ReferralEnv } from '@reuse/code/interfaces/environment.interface';

@Injectable({
  providedIn: 'root',
})
export class WcConfigurationService implements ConfigurationService {
  get referralPrescriptionEnvironment(): ReferralEnv {
    return window.referralPrescriptionEnv || 'prodHcp';
  }

  private get configVariables() {
    if (!window.referralPrescriptionEnv) return EMPTY_OBJECT;

    return APP_CONFIG.variables[window.referralPrescriptionEnv] || EMPTY_OBJECT;
  }

  getEnvironment() {
    return this.referralPrescriptionEnvironment;
  }

  getEnvironmentVariable(key: string) {
    return (this.configVariables as Record<string, unknown>)[key];
  }
}
