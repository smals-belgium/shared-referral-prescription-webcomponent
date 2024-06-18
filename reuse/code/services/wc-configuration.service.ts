import { Injectable } from '@angular/core';
import { APP_CONFIG } from '../../app.config';
import { ConfigurationService } from './configuration.service';

@Injectable({
  providedIn: 'root'
})
export class WcConfigurationService extends ConfigurationService {

  private readonly referralPrescriptionEnvironment: 'local' | 'test' | 'intExt' | 'intPub' | 'intPatient' | 'acc' | 'accIn' | 'accUp' | 'prod' | 'prodIn' | 'prodUp';
  private readonly configVariables: Record<string, any>;

  constructor() {
    super();
    this.referralPrescriptionEnvironment = (window as any).referralPrescriptionEnv || 'prod';
    this.configVariables = APP_CONFIG.variables[this.referralPrescriptionEnvironment] || {};
  }

  override getEnvironment() {
    return this.referralPrescriptionEnvironment;
  }

  override getEnvironmentVariable(key: string): any {
    return this.configVariables[key];
  }
}
