import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  HealthcareProResource,
  RequestStatus,
  RequestSummaryListResource,
  RequestSummaryResource,
} from '@reuse/code/openapi';
import { FormatEnum, SkeletonComponent } from '@reuse/code/components/progress-indicators/skeleton/skeleton.component';
import { MatChip } from '@angular/material/chips';
import { TranslatePipe } from '@ngx-translate/core';
import { TemplateNamePipe } from '@reuse/code/pipes/template-name.pipe';
import { FormatNihdiPipe } from '@reuse/code/pipes/format-nihdi.pipe';
import { ProfessionalDisplayComponent } from '@reuse/code/components/professional-display/professional-display.component';
import { MatCardModule } from '@angular/material/card';
import { DatePipe } from '@reuse/code/pipes/date.pipe';
import { HttpErrorResponse } from '@angular/common/http';
import { AlertComponent } from '@reuse/code/components/alert-component/alert.component';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { toSignal } from '@angular/core/rxjs-interop';
import { AlertType, Intent } from '@reuse/code/interfaces';
import { DataLoadConfig, RequestSummaryDataService } from '@reuse/code/services/helpers/request-summary-data.service';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { getStatusClassFromMap } from '@reuse/code/utils/utils';

@Component({
  selector: 'app-prescriptions-card',
  imports: [
    MatChip,
    TranslatePipe,
    TemplateNamePipe,
    FormatNihdiPipe,
    ProfessionalDisplayComponent,
    MatCardModule,
    DatePipe,
    SkeletonComponent,
    AlertComponent,
    MatButton,
    MatIcon,
  ],
  templateUrl: './prescriptions-card.component.html',
  styleUrls: ['./prescriptions-card.component.scss'],
  providers: [RequestSummaryDataService],
})
export class PrescriptionsCardComponent implements OnChanges, AfterViewInit, OnDestroy {
  // Input properties
  @Input() intent?: Intent;
  @Input() requestSummaryListResource?: RequestSummaryListResource;
  get itemsLength() {
    if (this.requestSummaryListResource?.total == null) return -1;
    return this.requestSummaryListResource?.items?.length ?? -1;
  }
  @Input() loading: boolean = false;
  @Input() historical: boolean = false;
  @Input() patientSsin?: string;
  @Input() requesterSsin?: string;
  @Input() performerSsin?: string;
  @Input() error: boolean = false;
  @Input() errorMsg: string = '';
  @Input() errorResponse?: HttpErrorResponse;

  // Output events
  @Output() clickPrescription = new EventEmitter<RequestSummaryResource>();
  @Output() retryOnError = new EventEmitter<void>();

  @ViewChild('anchor', { static: true }) anchor!: ElementRef<HTMLElement>;
  @ViewChild('scrollframe', { static: true }) scrollframe!: ElementRef<HTMLElement>;

  protected readonly FormatEnum = FormatEnum;
  protected readonly AlertType = AlertType;

  private observer?: IntersectionObserver;
  private destroyed = false;

  // Public signals from service
  readonly requestData = toSignal(this.dataService.requestSummaryData$, {
    initialValue: [],
  });
  readonly isLoading = toSignal(this.dataService.loading$, { initialValue: false });

  // Protected signals from service
  protected readonly isProfessional$ = toSignal(this.authService.isProfessional());

  constructor(
    private readonly dataService: RequestSummaryDataService,
    private readonly authService: AuthService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['requestSummaryListResource'] && this.requestSummaryListResource?.items?.length) {
      this.initializeDataStream();
    }
  }

  ngAfterViewInit() {
    const root = this.getScrollContainer(this.scrollframe.nativeElement);

    this.observer = new IntersectionObserver(
      entries => {
        if (this.destroyed) return;
        if (entries.some(e => e.isIntersecting)) {
          if (this.itemsLength <= 0 || !this.canLoadMore() || this.isLoading() || this.loading || this.error) {
            return;
          } else {
            this.loadMore();
          }
        }
      },
      {
        root,
        rootMargin: '0px',
        threshold: 1.0,
      }
    );

    this.observer.observe(this.anchor.nativeElement);
  }

  private getScrollContainer(el: HTMLElement): HTMLElement | null {
    let current: HTMLElement | null = el.parentElement;

    while (current) {
      const style = window.getComputedStyle(current);
      const overflowY = style.overflowY;
      const canScroll = (overflowY === 'auto' || overflowY === 'scroll') && current.scrollHeight > current.clientHeight;

      if (canScroll) return current;
      current = current.parentElement;
    }

    return null;
  }

  onErrorRetryClick(): void {
    this.clearErrorState();

    try {
      const currentDataCount = this.requestData()?.length ?? 0;
      this.dataService.retryLoad(currentDataCount);
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        (error as { message: unknown }).message === 'INITIAL_RETRY_REQUIRED'
      ) {
        this.retryOnError.emit();
      }
    }
  }

  loadMore(): void {
    this.dataService.triggerLoad();
  }

  private initializeDataStream(): void {
    const initialData = this.requestSummaryListResource?.items ?? [];
    const config: DataLoadConfig = {
      intent: this.intent,
      patientSsin: this.patientSsin,
      requesterSsin: this.requesterSsin,
      performerSsin: this.performerSsin,
      historical: this.historical,
    };

    this.dataService.initializeDataStream(initialData, config);
  }

  private clearErrorState(): void {
    this.error = false;
  }

  trackById(item: RequestSummaryResource): number | string {
    return item.id ?? 0;
  }

  canLoadMore(): boolean {
    if (!this.requestSummaryListResource?.total) return true;
    const totalItems = this.requestData() ? this.requestData().length : 0;
    const total = this.requestSummaryListResource.total ?? 0;
    return total > totalItems;
  }

  getStatusClass(status?: RequestStatus): string {
    return getStatusClassFromMap(status);
  }

  getProfessional(requester?: HealthcareProResource) {
    if (!requester) {
      return null;
    }
    return requester as unknown as any;
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.observer?.disconnect();
    this.dataService.reset();
  }
}
