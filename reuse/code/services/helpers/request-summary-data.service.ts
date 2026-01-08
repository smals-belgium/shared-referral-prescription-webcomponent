import { inject, Injectable } from '@angular/core';
import {
  ModelEntityDto,
  PageModelEntityDto,
  RequestSummaryListResource,
  RequestSummaryResource,
} from '@reuse/code/openapi';
import {
  BehaviorSubject,
  catchError,
  from,
  map,
  mergeScan,
  Observable,
  of,
  scan,
  startWith,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { PrescriptionService } from '@reuse/code/services/api/prescription.service';
import { ProposalService } from '@reuse/code/services/api/proposal.service';
import { PseudoService } from '@reuse/code/services/privacy/pseudo.service';
import { isPrescription } from '@reuse/code/utils/utils';
import { Intent, SearchPrescriptionCriteria } from '@reuse/code/interfaces';
import { PrescriptionModelService } from '@reuse/code/services/api/prescriptionModel.service';

// Configuration interface
export interface DataLoadConfig {
  intent?: Intent;
  patientSsin?: string;
  requesterSsin?: string;
  performerSsin?: string;
  historical?: boolean;
}

@Injectable({ providedIn: 'root' })
export class RequestSummaryDataService {
  private readonly prescriptionService = inject(PrescriptionService);
  private readonly proposalService = inject(ProposalService);
  private readonly pseudoService = inject(PseudoService);
  private readonly modelService = inject(PrescriptionModelService);

  private static readonly PAGE_SIZE = 10;

  private readonly loadTrigger = new Subject<void>();
  private readonly dataSubject = new BehaviorSubject<(RequestSummaryResource | ModelEntityDto)[]>([]);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);

  readonly data$ = this.dataSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();

  // Typed data streams - these filter and type-guard the data
  readonly requestSummaryData$ = this.data$.pipe(
    map(items =>
      items.filter(
        (item): item is RequestSummaryResource => 'authoredOn' in item && typeof item.authoredOn === 'string'
      )
    )
  );

  readonly modelEntityData$ = this.data$.pipe(
    map(items => items.filter((item): item is ModelEntityDto => 'label' in item && typeof item.label === 'string'))
  );

  initializeDataStream(initialData: (RequestSummaryResource | ModelEntityDto)[], loadConfig: DataLoadConfig): void {
    // set initial prescriptions or proposals
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
    if (currentDataCount <= RequestSummaryDataService.PAGE_SIZE) {
      throw new Error('INITIAL_RETRY_REQUIRED');
    } else {
      this.triggerLoad();
    }
  }

  reset(): void {
    this.dataSubject.next([]);
    this.loadingSubject.next(false);
  }

  private createDataStream(config: DataLoadConfig): Observable<(RequestSummaryResource | ModelEntityDto)[]> {
    return this.loadTrigger.pipe(
      startWith(null),
      scan(this.calculateNextPage, -1),
      mergeScan(
        (accumulatedData, page) => this.loadDataForPage(accumulatedData, page, config),
        [] as (RequestSummaryResource | ModelEntityDto)[]
      )
    );
  }

  private calculateNextPage = (currentOffset: number): number => {
    return currentOffset + 1;
  };

  private loadDataForPage(
    accumulatedData: (RequestSummaryResource | ModelEntityDto)[],
    page: number,
    config: DataLoadConfig
  ): Observable<(RequestSummaryResource | ModelEntityDto)[]> {
    this.setLoadingState(true);

    const dataObservable$ =
      page === 0
        ? of(this.dataSubject.getValue()) // Return initial values for page 0
        : this.fetchDataByIntent(page, config, accumulatedData);

    return dataObservable$.pipe(
      tap(() => this.setLoadingState(false)),
      catchError(() => {
        this.setLoadingState(false);
        return of(accumulatedData);
      })
    );
  }

  private fetchDataByIntent(
    page: number,
    config: DataLoadConfig,
    accumulatedData: (RequestSummaryResource | ModelEntityDto)[]
  ): Observable<(RequestSummaryResource | ModelEntityDto)[]> {
    const requestParams = this.buildSearchPrescriptionCriteria(config);

    const serviceCall$ = config.patientSsin
      ? this.fetchDataWithPseudonymization(requestParams, page, config.intent)
      : this.fetchDataDirectly(requestParams, page, config.intent);

    return serviceCall$.pipe(
      map(response => {
        const newItems = 'items' in response ? response.items : 'content' in response ? response.content : [];
        if (!newItems) return accumulatedData;
        return newItems.length > 0 ? [...accumulatedData, ...newItems] : accumulatedData;
      })
    );
  }

  private fetchDataWithPseudonymization(
    params: SearchPrescriptionCriteria,
    page: number,
    intent?: Intent
  ): Observable<RequestSummaryListResource | PageModelEntityDto> {
    return from(this.pseudoService.pseudonymize(params.patient!)).pipe(
      switchMap(identifier => this.callServiceMethod({ ...params, patient: identifier }, page, intent))
    );
  }

  private fetchDataDirectly(
    params: SearchPrescriptionCriteria,
    page: number,
    intent?: Intent
  ): Observable<RequestSummaryListResource | PageModelEntityDto> {
    return this.callServiceMethod(params, page, intent);
  }

  private callServiceMethod(
    params: SearchPrescriptionCriteria,
    page: number,
    intent?: Intent
  ): Observable<RequestSummaryListResource | PageModelEntityDto> {
    if (intent === Intent.MODEL) {
      return this.modelService.findAll(page, RequestSummaryDataService.PAGE_SIZE);
    }

    const service = isPrescription(intent) ? this.prescriptionService : this.proposalService;
    return service.findAll(params, page + 1, RequestSummaryDataService.PAGE_SIZE);
  }

  private buildSearchPrescriptionCriteria(config: DataLoadConfig): SearchPrescriptionCriteria {
    return {
      patient: config.patientSsin,
      requester: config.requesterSsin,
      performer: config.performerSsin,
      historical: config.historical,
    };
  }

  private setLoadingState(isLoading: boolean): void {
    this.loadingSubject.next(isLoading);
  }

  private handleStreamError(error: any): void {
    console.error('Data stream error:', error);
    this.setLoadingState(false);
  }
}
