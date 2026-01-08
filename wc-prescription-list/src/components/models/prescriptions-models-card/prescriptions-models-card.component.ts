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
import { TranslatePipe } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ModelEntityDto, PageModelEntityDto, RequestSummaryResource } from '@reuse/code/openapi';
import { AlertType, Intent } from '@reuse/code/interfaces';
import { HttpErrorResponse } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { DataLoadConfig, RequestSummaryDataService } from '@reuse/code/services/helpers/request-summary-data.service';
import { TemplateNamePipe } from '@reuse/code/pipes/template-name.pipe';
import { MatCardModule } from '@angular/material/card';
import { DatePipe } from '@reuse/code/pipes/date.pipe';
import { FormatEnum, SkeletonComponent } from '@reuse/code/components/progress-indicators/skeleton/skeleton.component';
import { AlertComponent } from '@reuse/code/components/alert-component/alert.component';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';

@Component({
  selector: 'app-prescriptions-models-card',
  imports: [
    TranslatePipe,
    TemplateNamePipe,
    MatCardModule,
    DatePipe,
    SkeletonComponent,
    AlertComponent,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
  ],
  templateUrl: './prescriptions-models-card.component.html',
  styleUrls: ['./prescriptions-models-card.component.scss'],
  providers: [RequestSummaryDataService],
})
export class PrescriptionsModelsCardComponent implements OnChanges, AfterViewInit, OnDestroy {
  // Input properties
  @Input() intent?: Intent;
  @Input() modelEntityPage?: PageModelEntityDto;
  get itemsLength() {
    return this.modelEntityPage?.numberOfElements ?? -1;
  }
  @Input() loading: boolean = false;
  @Input() error: boolean = false;
  @Input() errorMsg: string = '';
  @Input() errorResponse?: HttpErrorResponse;

  // Output events
  @Output() openPrescriptionModel = new EventEmitter<ModelEntityDto>();
  @Output() deletePrescriptionModel = new EventEmitter<ModelEntityDto>();
  @Output() retryOnError = new EventEmitter<void>();

  protected readonly FormatEnum = FormatEnum;
  protected readonly AlertType = AlertType;

  private observer?: IntersectionObserver;
  private destroyed = false;

  // Public signals from service
  readonly modelData = toSignal(this.dataService.modelEntityData$, { initialValue: [] });
  readonly isLoading = toSignal(this.dataService.loading$, { initialValue: false });

  @ViewChild(MatMenuTrigger) menuTrigger: MatMenuTrigger | undefined;
  @ViewChild('anchor', { static: true }) anchor!: ElementRef<HTMLElement>;
  @ViewChild('scrollframe', { static: true }) scrollframe!: ElementRef<HTMLElement>;

  constructor(private readonly dataService: RequestSummaryDataService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['modelEntityPage'] && this.modelEntityPage?.content?.length) {
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
      const currentDataCount = this.modelData()?.length ?? 0;
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
    const initialData = this.modelEntityPage?.content ?? [];
    const config: DataLoadConfig = {
      intent: this.intent,
    };

    this.dataService.initializeDataStream(initialData, config);
  }

  private clearErrorState(): void {
    this.error = false;
  }

  trackById(item: ModelEntityDto | RequestSummaryResource): number | string {
    return item.id ?? 0;
  }

  canLoadMore(): boolean {
    if (!this.modelEntityPage?.totalElements) return true;
    const totalItems = this.modelData() ? this.modelData().length : 0;
    const total = this.modelEntityPage.totalElements ?? 0;
    return total > totalItems;
  }

  onActionButtonClick = (event: Event, model: ModelEntityDto) => {
    event.stopPropagation();

    this.deletePrescriptionModel.emit(model);

    this.menuTrigger?.closeMenu();
  };

  ngOnDestroy(): void {
    this.destroyed = true;
    this.observer?.disconnect();
    this.dataService.reset();
  }
}
