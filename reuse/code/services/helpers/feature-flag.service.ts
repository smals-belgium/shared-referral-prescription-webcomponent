import { computed, inject, Injectable, Signal } from '@angular/core';
import { FeatureFlag } from '@reuse/app.config';
import { FeatureFlagService as FeatureFlagHttpService } from '@reuse/code/openapi';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
  private readonly _featureFlagHttpService = inject(FeatureFlagHttpService);

  public features: Signal<FeatureFlag[]> = toSignal(this.fetchFeatures(), { initialValue: [] });

  public getFeature(feature?: FeatureFlag): Signal<boolean> {
    return computed(() => feature !== undefined && this.features().includes(feature));
  }

  private fetchFeatures(): Observable<FeatureFlag[]> {
    return this._featureFlagHttpService.getFeatureFlags().pipe(
      catchError(err => {
        console.error('failed to load feature flags', err);
        return of([]);
      }),
      map(stringFlags => stringFlags as FeatureFlag[])
    );
  }
}
