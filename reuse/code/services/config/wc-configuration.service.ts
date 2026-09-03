import { Injectable } from '@angular/core';
import { APP_CONFIG } from '@reuse/app.config';
import { ConfigurationService } from '@reuse/code/services/config/configuration.service';
import { EMPTY_OBJECT } from '@reuse/code/constants/common.constants';
import { ReferralEnv } from '@reuse/code/interfaces/environment.interface';

@Injectable({
  providedIn: 'root',
})
export class WcConfigurationService implements ConfigurationService {
  private get envHost(): typeof globalThis & { referralPrescriptionEnv?: ReferralEnv } {
    return globalThis as typeof globalThis & { referralPrescriptionEnv?: ReferralEnv };
  }

  get referralPrescriptionEnvironment(): ReferralEnv {
    return this.envHost.referralPrescriptionEnv || 'prodHcp';
  }

  private get configVariables() {
    const currentEnv = this.envHost.referralPrescriptionEnv;

    if (!currentEnv) return EMPTY_OBJECT;

    return APP_CONFIG.variables[currentEnv] || EMPTY_OBJECT;
  }

  getEnvironment() {
    return this.referralPrescriptionEnvironment;
  }

  getEnvironmentVariable(key: string) {
    return (this.configVariables as Record<string, unknown>)[key];
  }
}
