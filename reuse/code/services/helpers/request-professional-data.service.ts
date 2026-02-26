import { inject, Injectable, signal } from '@angular/core';
import {
  HealthcareOrganizationResource,
  HealthcareProResource,
  HealthCareProviderRequestResource,
  ProviderType,
} from '@reuse/code/openapi';
import { catchError, EMPTY, expand, map, mergeScan, Observable, of, scan, startWith, Subject, tap } from 'rxjs';
import { SearchProfessionalCriteria } from '@reuse/code/interfaces';
import { HealthcareProviderService } from '@reuse/code/services/api/healthcareProvider.service';
import { DeviceService } from '@reuse/code/services/helpers/device.service';

type HealthcareResource = HealthcareProResource | HealthcareOrganizationResource;
/**
 * Service that handles healthcare professional/organization data loading and aggregation for cards (mobile) and table (desktop)
 *
 */
@Injectable({ providedIn: 'root' })
export class RequestProfessionalDataService {
  private readonly healthcareProviderService = inject(HealthcareProviderService);
  private readonly _deviceService = inject(DeviceService);

  protected readonly isDesktop = this._deviceService.isDesktop;

  private readonly PAGE_SIZE: number = this.isDesktop() ? 20 : 10;

  private readonly _data = signal<HealthcareResource[]>([]);
  private readonly _loading = signal<boolean>(false);

  readonly data = this._data.asReadonly();
  readonly loading = this._loading.asReadonly();

  private readonly loadTrigger = new Subject<void>();

  initializeCardsDataStream(initialData: HealthcareResource[], loadConfig: SearchProfessionalCriteria): void {
    this._data.set(initialData);
    this.createCardsDataStream(initialData, loadConfig).subscribe({
      next: data => this._data.set(data),
      error: error => this.handleStreamError(error),
    });
  }

  initializeTableDataStream(initialData: HealthcareResource[], loadConfig: SearchProfessionalCriteria): void {
    this._data.set(initialData);
    this.createTableDataStream(initialData, loadConfig).subscribe({
      next: data => this._data.set(data),
      error: error => this.handleStreamError(error),
    });
  }

  triggerLoad(): void {
    this._loading.set(true);
    this.loadTrigger.next();
  }

  retryLoad(currentDataCount: number): void {
    if (currentDataCount <= this.PAGE_SIZE) {
      throw new Error('INITIAL_RETRY_REQUIRED');
    } else {
      this.triggerLoad();
    }
  }

  reset(): void {
    this._data.set([]);
    this._loading.set(false);
  }

  /**
   * Loads additional cards when loadTrigger emits a value.
   * */
  private createCardsDataStream(
    initialData: HealthcareResource[],
    params: SearchProfessionalCriteria
  ): Observable<HealthcareResource[]> {
    return this.loadTrigger.pipe(
      startWith(null),
      scan(this.calculateNextPage, -1),
      mergeScan((accumulated, pageIndex) => {
        if (pageIndex === 0) return of(initialData);
        return this.fetchRawItems(pageIndex, params).pipe(map(({ newItems }) => [...accumulated, ...newItems]));
      }, [] as HealthcareResource[])
    );
  }

  /**
   * Loads all professionals sequentially as soon as each one completes until all professional are being fetched
   */
  private createTableDataStream(
    initialData: HealthcareResource[],
    params: SearchProfessionalCriteria
  ): Observable<HealthcareResource[]> {
    // Emit initial data with the already loaded one
    return of({ accumulated: initialData, pageIndex: 0, total: 999 }).pipe(
      expand(({ accumulated, pageIndex, total }) => {
        const nextIndex = pageIndex + 1;

        if (accumulated.length >= total) return EMPTY;

        return this.fetchRawItems(nextIndex, params).pipe(
          map(res => ({
            accumulated: [...accumulated, ...res.newItems],
            pageIndex: nextIndex,
            total: res.total,
          }))
        );
      }),
      map(state => state.accumulated)
    );
  }

  private fetchRawItems(
    pageIndex: number,
    params: SearchProfessionalCriteria
  ): Observable<{ newItems: HealthcareResource[]; total: number }> {
    this._loading.set(true);

    return this.callServiceMethod(params, pageIndex).pipe(
      map(response => ({
        newItems: [...(response.healthcareProfessionals ?? []), ...(response.healthcareOrganizations ?? [])],
        total: response.total ?? 0,
      })),
      tap(() => this._loading.set(false)),
      catchError(() => {
        this._loading.set(false);
        return of({ newItems: [], total: 0 });
      })
    );
  }

  private callServiceMethod(
    criteria: SearchProfessionalCriteria,
    page: number
  ): Observable<HealthCareProviderRequestResource> {
    return this.healthcareProviderService.findAll(
      criteria.query,
      criteria.zipCodes,
      criteria.disciplines,
      [],
      ProviderType.Professional,
      criteria.prescriptionId,
      criteria.intent,
      page + 1,
      this.PAGE_SIZE
    );
  }

  private readonly calculateNextPage = (currentOffset: number): number => {
    return currentOffset + 1;
  };

  private handleStreamError(error: any): void {
    console.error('Data stream error:', error);
    this._loading.set(false);
  }
}
