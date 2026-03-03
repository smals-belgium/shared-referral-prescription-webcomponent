import {
  AfterViewChecked,
  Component,
  ElementRef,
  inject,
  input,
  OnChanges,
  OnDestroy,
  output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { AlertComponent } from '@reuse/code/components/alert-component/alert.component';
import { FormatNihdiPipe } from '@reuse/code/pipes/format-nihdi.pipe';
import { MatCard, MatCardContent } from '@angular/material/card';
import { FormatEnum, SkeletonComponent } from '@reuse/code/components/progress-indicators/skeleton/skeleton.component';
import { TranslatePipe } from '@ngx-translate/core';
import { HealthcareOrganizationResource, HealthcareProResource, ProviderType } from '@reuse/code/openapi';
import { MatIconModule } from '@angular/material/icon';
import { RequestProfessionalDataService } from '@reuse/code/services/helpers/request-professional-data.service';
import { getAssignableProfessionalDisciplines, isProfessional } from '@reuse/code/utils/assignment-disciplines.utils';
import { AlertType, Intent, SearchProfessionalCriteria } from '@reuse/code/interfaces';
import { FormatMultilingualObjectPipe } from '@reuse/code/pipes/format-multilingual-object.pipe';
import { TranslationType } from '@reuse/code/components/professional-form/table/professional-table.component';
import { MatRadioModule, MatRadioChange } from '@angular/material/radio';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'professional-cards',
  imports: [
    AlertComponent,
    FormatNihdiPipe,
    MatCard,
    MatCardContent,
    MatIconModule,
    SkeletonComponent,
    TranslatePipe,
    FormatMultilingualObjectPipe,
    MatRadioModule,
  ],
  templateUrl: './professional-cards.component.html',
  styleUrl: './professional-cards.component.scss',
})
export class ProfessionalCardsComponent implements OnChanges, AfterViewChecked, OnDestroy {
  private readonly dataService = inject(RequestProfessionalDataService);

  protected readonly AlertType = AlertType;
  protected readonly FormatEnum = FormatEnum;
  protected readonly isProfessional = isProfessional;

  readonly professionals = input<(HealthcareProResource | HealthcareOrganizationResource)[]>([]);
  readonly total = input<number | null>(null);
  readonly prescriptionId = input.required<string>();
  readonly category = input.required<string>();
  readonly intent = input.required<Intent>();
  readonly query = input<string>('');
  readonly zipCodes = input<number[]>([]);
  readonly initialDataLoading = input<boolean>(false);
  readonly error = input<boolean>(false);
  readonly currentLang = input.required<TranslationType | undefined>();

  readonly selectProfessional = output<HealthcareProResource | HealthcareOrganizationResource | undefined>();

  get itemsLength() {
    if (this.total() === undefined) return -1;
    return this.total() ?? -1;
  }

  // Public signals from service
  readonly requestData = this.dataService.data;
  readonly isLoading = this.dataService.loading;
  private observer?: IntersectionObserver;
  private destroyed = false;
  observerInitialized = false;

  @ViewChild('anchor', { static: true }) anchor!: ElementRef<HTMLElement>;
  @ViewChild('scrollframe', { static: true }) scrollframe!: ElementRef<HTMLElement>;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['professionals'] && this.professionals()?.length) {
      this.initializeDataStream();
    }
  }

  ngAfterViewChecked(): void {
    if (!this.observerInitialized && this.total() != null && this.professionals()?.length) {
      this.observerInitialized = true;
      this.setupObserver();
    }
  }

  // When user scrolls close from the bottom of the results container (60px), it can load more data
  private setupObserver(): void {
    const root = this.getScrollContainer(this.scrollframe.nativeElement);

    this.observer = new IntersectionObserver(
      entries => {
        if (this.destroyed) return;
        if (entries.some(e => e.isIntersecting)) {
          if (
            this.itemsLength <= 0 ||
            !this.canLoadMore() ||
            this.isLoading() ||
            this.initialDataLoading() ||
            this.error()
          ) {
            return;
          }
          this.loadMore();
        }
      },
      {
        root,
        rootMargin: '60px',
        threshold: 0,
      }
    );

    this.observer.observe(this.anchor.nativeElement);
  }

  private initializeDataStream(): void {
    const initialData = this.professionals() ?? [];
    const disciplines: string[] = getAssignableProfessionalDisciplines(this.category(), this.intent());
    const config: SearchProfessionalCriteria = {
      query: this.query(),
      zipCodes: this.zipCodes(),
      disciplines,
      institutionTypes: [],
      providerType: ProviderType.Professional,
      prescriptionId: this.prescriptionId(),
      intent: this.intent(),
    };

    this.dataService.initializeCardsDataStream(initialData, config);
  }

  private getScrollContainer(el: HTMLElement): HTMLElement | null {
    let resultsParent = el.closest<HTMLElement>('.search-results');

    while (resultsParent) {
      const style = window.getComputedStyle(resultsParent);
      const overflowY = style.overflowY;
      const canScroll =
        (overflowY === 'auto' || overflowY === 'scroll') && resultsParent.scrollHeight > resultsParent.clientHeight;

      if (canScroll) return resultsParent;
      resultsParent = resultsParent.parentElement;
    }

    return null;
  }

  canLoadMore(): boolean {
    if (this.total() == null) return true;
    const totalItems = this.requestData()?.length ?? 0;
    const total = this.total() ?? 0;
    return total > totalItems;
  }

  loadMore(): void {
    this.dataService.triggerLoad();
  }

  changeValue(event: MatRadioChange) {
    if (event.source.checked) {
      this.selectProfessional.emit(event.value as HealthcareProResource | HealthcareOrganizationResource);
    } else {
      this.selectProfessional.emit(undefined);
    }
  }

  trackById(profession: HealthcareProResource | HealthcareOrganizationResource) {
    if (isProfessional(profession)) {
      if (profession.id?.ssin && profession.id?.qualificationCode)
        return profession.id.ssin + profession.id.qualificationCode;
      return uuidv4();
    } else {
      return profession.id?.organizationId ?? uuidv4();
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.observer?.disconnect();
    this.dataService.reset();
  }
}
