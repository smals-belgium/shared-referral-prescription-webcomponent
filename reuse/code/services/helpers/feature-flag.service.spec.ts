import { TestBed } from '@angular/core/testing';
import { FeatureFlagService } from './feature-flag.service';
import { ConfigurationService } from '../config/configuration.service';

type EnabledFeatures = { filters: boolean };

describe('FeatureFlagService', () => {
  let service: FeatureFlagService;

  const mockConfigurationService = {
    getEnvironmentVariable: jest.fn<unknown, [string]>(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FeatureFlagService, { provide: ConfigurationService, useValue: mockConfigurationService }],
    });

    service = TestBed.inject(FeatureFlagService);
    jest.clearAllMocks();
  });

  describe('getFeatureFlags', () => {
    it('should return defaults and set signal when env variable is missing', () => {
      mockConfigurationService.getEnvironmentVariable.mockReturnValue(undefined);

      const result = service.getFeatureFlags();

      expect(result).toEqual({ filters: false });
      expect(service.features()).toEqual({ filters: false });
      expect(mockConfigurationService.getEnvironmentVariable).toHaveBeenCalledWith('enabledFeatures');
    });

    it('should return defaults and set signal when env variable is invalid', () => {
      mockConfigurationService.getEnvironmentVariable.mockReturnValue({
        filters: 'not-a-boolean',
      });

      const result = service.getFeatureFlags();

      expect(result).toEqual({ filters: false });
      expect(service.features()).toEqual({ filters: false });
    });

    it('should return provided features and set signal when env variable is valid', () => {
      const validFeatures: EnabledFeatures = { filters: true };
      mockConfigurationService.getEnvironmentVariable.mockReturnValue(validFeatures);

      const result = service.getFeatureFlags();

      expect(result).toEqual(validFeatures);
      expect(service.features()).toEqual(validFeatures);
    });
  });

  describe('getFeature', () => {
    it('should return false if feature not set in signal', () => {
      service.features.set({ filters: false });

      expect(service.getFeature('filters')).toBe(false);
    });

    it('should return true if feature set to true in signal', () => {
      service.features.set({ filters: true });

      expect(service.getFeature('filters')).toBe(true);
    });

    it('should default to false if feature key is missing', () => {
      // @ts-expect-error forcing missing property
      service.features.set({});

      expect(service.getFeature('filters')).toBe(false);
    });
  });
});
