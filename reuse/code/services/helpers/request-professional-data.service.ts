import { inject, Injectable } from '@angular/core';
import { SearchProfessionalCriteria } from '@reuse/code/interfaces';
import { HealthCareProviderRequestResource, HealthCareProviderResource, ProviderType } from '@reuse/code/openapi';
import { HealthcareProviderService } from '@reuse/code/services/api/healthcareProvider.service';
import { BehaviorSubject, catchError, map, mergeScan, Observable, of, scan, startWith, Subject, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RequestProfessionalDataService {
  private readonly healthcareProviderService = inject(HealthcareProviderService);

  private static readonly PAGE_SIZE = 10;

  private readonly loadTrigger = new Subject<void>();
  private readonly dataSubject = new BehaviorSubject<HealthCareProviderResource[]>([]);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);

  readonly data$ = this.dataSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();

  initializeDataStream(initialData: HealthCareProviderResource[], loadConfig: SearchProfessionalCriteria): void {
    this.dataSubject.next(initialData);

    const dataStream$ = this.createDataStream(loadConfig);
    dataStream$.subscribe({
      next: data => this.dataSubject.next(data),
      error: error => this.handleStreamError(error),
    });
  }

  triggerLoad(): void {
    this.setLoadingState(true);
    this.loadTrigger.next();
  }

  retryLoad(currentDataCount: number): void {
    if (currentDataCount <= RequestProfessionalDataService.PAGE_SIZE) {
      throw new Error('INITIAL_RETRY_REQUIRED');
    } else {
      this.triggerLoad();
    }
  }

  reset(): void {
    this.dataSubject.next([]);
    this.loadingSubject.next(false);
  }

  private createDataStream(params: SearchProfessionalCriteria): Observable<HealthCareProviderResource[]> {
    return this.loadTrigger.pipe(
      startWith(null),
      scan(this.calculateNextPage, -1),
      mergeScan(
        (accumulatedData, page) => this.loadDataForPage(accumulatedData, page, params),
        [] as HealthCareProviderResource[]
      )
    );
  }

  private readonly calculateNextPage = (currentOffset: number): number => {
    return currentOffset + 1;
  };

  private loadDataForPage(
    accumulatedData: HealthCareProviderResource[],
    page: number,
    params: SearchProfessionalCriteria
  ): Observable<HealthCareProviderResource[]> {
    this.setLoadingState(true);

    const dataObservable$ =
      page === 0
        ? of(this.dataSubject.getValue()) // Return initial values for page 0
        : this.fetchData(page, params, accumulatedData);

    return dataObservable$.pipe(
      tap(() => this.setLoadingState(false)),
      catchError(() => {
        this.setLoadingState(false);
        return of(accumulatedData);
      })
    );
  }

  private fetchData(
    page: number,
    params: SearchProfessionalCriteria,
    accumulatedData: HealthCareProviderResource[]
  ): Observable<HealthCareProviderResource[]> {
    const serviceCall$ = this.fetchDataDirectly(params, page);

    return serviceCall$.pipe(
      map(response => {
        let newItems: HealthCareProviderResource[] = [];
        if (response && 'healthcarePro' in response) {
          newItems = response.healthcarePro ?? [];
        }

        if (!newItems || newItems.length === 0) return accumulatedData;
        return [...accumulatedData, ...newItems];
      })
    );
  }

  private fetchDataDirectly(
    params: SearchProfessionalCriteria,
    page: number
  ): Observable<HealthCareProviderRequestResource> {
    return this.callServiceMethod(params, page);
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
      criteria.language,
      page + 1,
      RequestProfessionalDataService.PAGE_SIZE
    );
  }

  private setLoadingState(isLoading: boolean): void {
    this.loadingSubject.next(isLoading);
  }

  private handleStreamError(error: any): void {
    console.error('Data stream error:', error);
    this.setLoadingState(false);
  }
}
