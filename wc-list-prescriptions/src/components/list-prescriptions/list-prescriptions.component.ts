import {
  Component,
  EventEmitter,
  HostBinding,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  signal,
  Signal,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DateAdapter, MatOptionModule } from '@angular/material/core';
import { DateTime } from 'luxon';
import { combineSignalDataState } from '@reuse/code/utils/rxjs.utils';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { DataState } from '@reuse/code/interfaces';
import { OverlaySpinnerComponent } from '@reuse/code/components/overlay-spinner/overlay-spinner.component';
import { IfStatusLoadingDirective } from '@reuse/code/directives/if-status-loading.directive';
import { PaginatorComponent } from '@reuse/code/components/paginator/paginator.component';
import { PrescriptionsTableComponent } from '@reuse/code/components/prescriptions-table/prescriptions-table.component';
import { MatSelectModule } from '@angular/material/select';
import { ActivePageComponent } from '@reuse/code/components/active-page/active-page.component';
import { IfStatusSuccessDirective } from '@reuse/code/directives/if-status-success.directive';
import { ErrorCardComponent } from '@reuse/code/components/error-card/error-card.component';
import { IfStatusErrorDirective } from '@reuse/code/directives/if-status-error.directive';
import { PrescriptionsState } from '@reuse/code/states/api/prescriptions.state';
import { TemplatesState } from '@reuse/code/states/api/templates.state';
import { AccessMatrixState } from '@reuse/code/states/api/access-matrix.state';
import { PseudoService } from '@reuse/code/services/privacy/pseudo.service';
import { ProposalsState } from '@reuse/code/states/api/proposals.state';
import { FormsModule } from '@angular/forms';
import { PrescriptionModelsTableComponent } from '@reuse/code/components/prescription-models-table/prescription-models-table.component';
import { ErrorCard } from '@reuse/code/interfaces/error-card.interface';
import {
  AccessMatrix,
  ModelEntityDto,
  PageModelEntityDto,
  ReadRequestListResource,
  ReadRequestResource,
  Template,
} from '@reuse/code/openapi';
import { HttpErrorResponse } from '@angular/common/http';
import { ModelsState } from '@reuse/code/states/api/models.state';
import { ToggleHistoricPrescriptionsComponent } from '@reuse/code/components/toggle-historic-prescriptions/toggle-historic-prescriptions.component';
import { isModel, isPrescription, isProposal } from '@reuse/code/utils/utils';
import {
  PrescriptionFilterComponent,
  SearchFilter,
} from '@reuse/code/components/prescription-filter/prescription-filter.component';
import { FeatureFlagDirective } from '@reuse/code/directives/feature-flag.directive';
import { FeatureFlagService } from '@reuse/code/services/helpers/feature-flag.service';

interface ViewState {
  prescriptions?: ReadRequestListResource;
  proposals?: ReadRequestListResource;
  models?: PageModelEntityDto;
  templates?: Template[];
  accessMatrix: AccessMatrix[];
}

interface SearchCriteria extends SearchFilter {
  historical: boolean;
}

@Component({
  templateUrl: './list-prescriptions.component.html',
  styleUrls: ['./list-prescriptions.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom,
  imports: [
    IfStatusErrorDirective,
    ErrorCardComponent,
    IfStatusSuccessDirective,
    ActivePageComponent,
    MatSelectModule,
    MatOptionModule,
    PrescriptionsTableComponent,
    PaginatorComponent,
    IfStatusLoadingDirective,
    OverlaySpinnerComponent,
    TranslateModule,
    FormsModule,
    PrescriptionModelsTableComponent,
    ToggleHistoricPrescriptionsComponent,
    PrescriptionFilterComponent,
    FeatureFlagDirective,
  ],
})
export class ListPrescriptionsWebComponent implements OnChanges, OnDestroy {
  protected readonly searchCriteria$ = signal<SearchCriteria>({
    historical: false,
    status: undefined,
    prescriptionType: undefined,
  });
  readonly viewStateProposals$: Signal<DataState<ViewState>> = combineSignalDataState({
    proposals: this.proposalsState.state,
    templates: this.templatesState.state,
    accessMatrix: this.accessMatrixState.state,
  });

  readonly viewStatePrescriptions$: Signal<DataState<ViewState>> = combineSignalDataState({
    prescriptions: this.prescriptionsState.state,
    templates: this.templatesState.state,
    accessMatrix: this.accessMatrixState.state,
  });

  readonly viewStateModels$: Signal<DataState<ViewState>> = combineSignalDataState({
    models: this.modelsState.state,
    templates: this.templatesState.state,
    accessMatrix: this.accessMatrixState.state,
  });

  isPrescriptionValue = false;
  isProposalValue = false;
  isModelValue = false;

  @HostBinding('attr.lang')
  @Input()
  lang?: string;
  @Input() patientSsin?: string;
  @Input() requesterSsin?: string;
  @Input() performerSsin?: string;
  @Input() services!: { getAccessToken: (audience?: string) => Promise<string | null> };
  @Input() intent?: string;

  @Output() clickOpenPrescriptionDetails = new EventEmitter<ReadRequestResource>();
  @Output() clickOpenModelDetails = new EventEmitter<ModelEntityDto>();

  errorCard: ErrorCard = {
    show: false,
    message: '',
    errorResponse: undefined,
  };

  constructor(
    private translate: TranslateService,
    private pseudoService: PseudoService,
    private dateAdapter: DateAdapter<DateTime>,
    private authService: AuthService,
    private accessMatrixState: AccessMatrixState,
    private prescriptionsState: PrescriptionsState,
    private proposalsState: ProposalsState,
    private templatesState: TemplatesState,
    private modelsState: ModelsState,
    featureFlagService: FeatureFlagService
  ) {
    const currentLang = this.translate.currentLang;
    if (!currentLang) {
      this.translate.use('fr-BE');
      this.dateAdapter.setLocale('fr-BE');
    }

    featureFlagService.getFeatureFlags();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['services']) {
      this.authService.init(this.services.getAccessToken);
      this.accessMatrixState.loadAccessMatrix();
      this.templatesState.loadTemplates();
    }
    if (changes['lang']) {
      this.dateAdapter.setLocale(this.lang!);
      this.translate.use(this.lang!);
    }
    if (
      (changes['patientSsin'] || changes['requesterSsin'] || changes['performerSsin'] || changes['intent']) &&
      this.intent
    ) {
      this.loadData(1);
    }
  }

  loadData(page?: number, pageSize?: number) {
    if (!this.intent) {
      this.errorCard = {
        show: true,
        message: 'common.somethingWentWrong',
      };
      return;
    }

    if (isPrescription(this.intent)) {
      this.isPrescriptionValue = true;
      this.loadPrescriptions(page, pageSize);
    } else if (isProposal(this.intent)) {
      this.isProposalValue = true;
      this.loadProposals(page, pageSize);
    } else if (isModel(this.intent)) {
      this.isModelValue = true;
      this.loadModels(page, pageSize);
    }
  }

  loadPrescriptions(page?: number, pageSize?: number) {
    const defaultParams = {
      requester: this.requesterSsin,
      performer: this.performerSsin,
      historical: this.searchCriteria$().historical,
      status: this.searchCriteria$().status,
      template: this.searchCriteria$().prescriptionType,
    };
    if (this.patientSsin) {
      void this.getPatientIdentifier(this.patientSsin).then(identifier => {
        this.prescriptionsState.loadPrescriptions(
          {
            ...defaultParams,
            patient: identifier,
          },
          page,
          pageSize
        );
      });
    } else {
      this.prescriptionsState.loadPrescriptions(
        {
          ...defaultParams,
          patient: this.patientSsin,
        },
        page,
        pageSize
      );
    }
  }

  loadProposals(page?: number, pageSize?: number) {
    const defaultParams = {
      requester: this.requesterSsin,
      performer: this.performerSsin,
      historical: this.searchCriteria$().historical,
      status: this.searchCriteria$().status,
      template: this.searchCriteria$().prescriptionType,
    };

    if (this.patientSsin) {
      void this.getPatientIdentifier(this.patientSsin).then(identifier => {
        this.proposalsState.loadProposals(
          {
            ...defaultParams,
            patient: identifier,
          },
          page,
          pageSize
        );
      });
    } else {
      this.proposalsState.loadProposals(
        {
          ...defaultParams,
          patient: this.patientSsin,
        },
        page,
        pageSize
      );
    }
  }

  loadModels(page?: number, pageSize?: number) {
    const pg = page ? page - 1 : 0;
    this.modelsState.loadModels(pg, pageSize || 10);
  }

  retryFailedCalls(error: Record<keyof ViewState, unknown> | undefined) {
    if (!error) {
      this.errorCard = {
        show: true,
        message: 'common.somethingWentWrong',
      };
      return;
    }

    if (error.prescriptions || error.proposals || error.models) {
      this.loadData();
    }
    if (error.templates) {
      this.templatesState.loadTemplates();
    }
  }

  private getPatientIdentifier(identifier: string): Promise<string> {
    return this.pseudoService.pseudonymize(identifier);
  }

  handleHistoricPrescriptions(showHistoricPrescriptions: boolean) {
    this.searchCriteria$.set({
      ...this.searchCriteria$(),
      historical: showHistoricPrescriptions,
    });
    this.loadData(1);
  }

  onFilterUpdate(e: SearchFilter) {
    this.searchCriteria$.set({
      historical: this.searchCriteria$().historical,
      ...e,
    });
    this.loadData(1);
  }

  getHttpErrorFromState(state: { error?: Record<string, unknown> }): HttpErrorResponse | undefined {
    if (!state.error) return undefined;

    for (const key of Object.keys(state.error)) {
      const value = state.error[key];
      if (value instanceof HttpErrorResponse) {
        return value;
      }
    }

    return undefined;
  }

  ngOnDestroy() {
    this.searchCriteria$.set({
      historical: false,
      status: undefined,
      prescriptionType: undefined,
    });
  }
}
