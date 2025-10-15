import { Component, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
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
})
export class PrescriptionsCardComponent implements OnChanges {
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

  protected readonly FormatEnum = FormatEnum;
  protected readonly AlertType = AlertType;

  // Public signals from service
  readonly requestData = toSignal(this.dataService.requestSummaryData$, {
    initialValue: [],
  });
  readonly isLoading = toSignal(this.dataService.loading$, { initialValue: false });

  // Protected signals from service
  protected readonly isProfessional$ = toSignal(this.authService.isProfessional());

  // Scroll values
  private oldScroll: any;
  private scrollY: any;

  @HostListener('window:scroll', ['$event'])
  scrolled(): void {
    if (this.itemsLength <= 0 || !this.canLoadMore() || this.isLoading() || this.loading || this.error) {
      return;
    }

    const isNearBottom = this.isUserNearBottom();

    this.scrollY = window.scrollY;
    if (isNearBottom && this.oldScroll < this.scrollY) {
      this.loadMore();
    }

    this.oldScroll = this.scrollY;
  }

  constructor(
    private readonly dataService: RequestSummaryDataService,
    private readonly authService: AuthService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['requestSummaryListResource'] && this.requestSummaryListResource?.items?.length) {
      this.initializeDataStream();
    }
  }

  private isUserNearBottom(): boolean {
    const threshold = 50;
    const position = window.scrollY + window.innerHeight; // <- Measure position differently
    const height = document.body.scrollHeight; // <- Measure height differently
    return position > height - threshold;
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
}
