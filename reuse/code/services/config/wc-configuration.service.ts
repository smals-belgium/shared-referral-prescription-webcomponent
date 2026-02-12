import { Injectable } from '@angular/core';
import { APP_CONFIG } from '@reuse/app.config';
import { ConfigurationService } from '@reuse/code/services/config/configuration.service';
import { EMPTY_OBJECT } from '@reuse/code/constants/common.constants';
import { ReferralEnv } from '@reuse/code/interfaces/environment.interface';

@Injectable({
  providedIn: 'root',
})
export class WcConfigurationService implements ConfigurationService {
  private loaded = false;

  get referralPrescriptionEnvironment(): ReferralEnv {
    if (!this.loaded) {
      throw new Error('ConfigurationService accessed before load() completed');
    }
    return window.referralPrescriptionEnv || 'prodHcp';
  }

  async waitUntilReady(): Promise<void> {
    await this.waitForReferralPrescriptionEnv();
    this.loaded = true;
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

  private waitForReferralPrescriptionEnv(interval = 50, timeout = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.referralPrescriptionEnv) {
        return resolve();
      }

      const deadline = Date.now() + timeout;
      const id = setInterval(() => {
        if (window.referralPrescriptionEnv) {
          clearInterval(id);
          resolve();
        } else if (Date.now() >= deadline) {
          clearInterval(id);
          reject(new Error('referralPrescriptionEnv was not set in time'));
        }
      }, interval);
    });
  }
}
