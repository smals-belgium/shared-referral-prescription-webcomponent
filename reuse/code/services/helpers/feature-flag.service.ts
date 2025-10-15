import { inject, Injectable, signal } from '@angular/core';
import { EnabledFeatures, FeatureFlagKeys } from '@reuse/app.config';
import { ConfigurationService } from '@reuse/code/services/config/configuration.service';

@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
  configurationService = inject(ConfigurationService);
  features = signal<EnabledFeatures>({
    filters: false,
  });

  getFeatureFlags() {
    const raw: unknown = this.configurationService.getEnvironmentVariable('enabledFeatures');

    if (!this.isEnabledFeatures(raw)) {
      const defaults: EnabledFeatures = {
        filters: false,
      };
      this.features.set(defaults);
      return defaults;
    }

    this.features.set(raw);
    return raw;
  }

  getFeature(feature: FeatureFlagKeys): boolean {
    return this.features()[feature] ?? false;
  }

  private isEnabledFeatures(value: unknown): value is EnabledFeatures {
    return typeof value === 'object' && value !== null && typeof (value as { filters: unknown }).filters === 'boolean';
  }
}
