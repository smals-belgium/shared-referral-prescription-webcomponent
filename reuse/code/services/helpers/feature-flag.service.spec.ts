import { TestBed } from '@angular/core/testing';
import { FeatureFlagService } from './feature-flag.service';
import { FeatureFlagService as FeatureFlagHttpService } from '@reuse/code/openapi';
import { Subject } from 'rxjs';

describe('FeatureFlagService', () => {
  let service: FeatureFlagService;
  let featureFlagsSource$: Subject<string[]>;

  const mockFeatureFlagHttpService = {
    getFeatureFlags: jest.fn(),
  };

  beforeEach(() => {
    featureFlagsSource$ = new Subject<string[]>();
    mockFeatureFlagHttpService.getFeatureFlags.mockReturnValue(featureFlagsSource$.asObservable());

    TestBed.configureTestingModule({
      providers: [FeatureFlagService, { provide: FeatureFlagHttpService, useValue: mockFeatureFlagHttpService }],
    });

    service = TestBed.inject(FeatureFlagService);
  });

  describe('features', () => {
    it('maps enabled flags from API payload', () => {
      featureFlagsSource$.next(['ui-filters']);

      expect(service.features()).toEqual(['ui-filters']);
    });

    it('returns disabled flags when API payload is empty', () => {
      featureFlagsSource$.next([]);

      expect(service.features()).toEqual([]);
    });

    it('falls back to disabled flags when API call fails', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      featureFlagsSource$.error(new Error('network failure'));

      expect(service.features()).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getFeature', () => {
    it('returns a signal that is true when feature exists', () => {
      featureFlagsSource$.next(['ui-filters']);

      expect(service.getFeature('ui-filters')()).toBe(true);
    });

    it('returns a signal that is false when feature is absent', () => {
      featureFlagsSource$.next([]);

      expect(service.getFeature('ui-filters')()).toBe(false);
    });

    it('defaults to false when feature key is undefined', () => {
      featureFlagsSource$.next([]);
      expect(service.getFeature(undefined)()).toBe(false);
    });

    it('reacts to subsequent API emissions', () => {
      const filtersFlag = service.getFeature('ui-filters');
      expect(filtersFlag()).toBe(false);

      featureFlagsSource$.next(['ui-filters']);
      expect(filtersFlag()).toBe(true);

      featureFlagsSource$.next([]);
      expect(filtersFlag()).toBe(false);
    });
  });
});
