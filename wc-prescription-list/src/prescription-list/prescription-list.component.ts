import {
  AfterViewInit,
  Component,
  EventEmitter,
  HostBinding,
  Input,
  OnChanges,
  OnDestroy, OnInit,
  Output,
  signal,
  Signal,
  SimpleChanges,
  ViewEncapsulation, WritableSignal,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DateAdapter, MatOptionModule } from '@angular/material/core';
import { DateTime } from 'luxon';
import { combineSignalDataState } from '@reuse/code/utils/rxjs.utils';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { AlertType, DataState, Intent, LoadingStatus } from '@reuse/code/interfaces';
import { PaginatorComponent } from '@reuse/code/components/paginator/paginator.component';
import { PrescriptionsTableComponent } from '../components/prescriptions/prescriptions-table/prescriptions-table.component';
import { MatSelectModule } from '@angular/material/select';
import { PrescriptionsState } from '@reuse/code/states/api/prescriptions.state';
import { TemplatesState } from '@reuse/code/states/api/templates.state';
import { AccessMatrixState } from '@reuse/code/states/api/access-matrix.state';
import { PseudoService } from '@reuse/code/services/privacy/pseudo.service';
import { ProposalsState } from '@reuse/code/states/api/proposals.state';
import { FormsModule } from '@angular/forms';
import { PrescriptionModelsTableComponent } from '../components/models/prescription-models-table/prescription-models-table.component';
import { ErrorCard } from '@reuse/code/interfaces/error-card.interface';
import {
  AccessMatrix,
  Discipline,
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
import { PrescriptionsCardComponent } from '../components/prescriptions/prescriptions-card/prescriptions-card.component';
import { ResponsiveWrapperComponent } from '@reuse/code/components/responsive-wrapper/responsive-wrapper.component';
import { ShadowDomOverlayContainer } from '@reuse/code/containers/shadow-dom-overlay/shadow-dom-overlay.container';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { ChooseTemplateDialog, SelectedTemplate } from '@reuse/code/dialogs/choose-template/choose-template.dialog';
import { MatDialog } from '@angular/material/dialog';
import { toSignal } from '@angular/core/rxjs-interop';
import { PrescriptionsModelsCardComponent } from '../components/models/prescriptions-models-card/prescriptions-models-card.component';
import { ConfirmDialog } from '@reuse/code/dialogs/confirm/confirm.dialog';
import { PrescriptionModelService } from '@reuse/code/services/api/prescriptionModel.service';
import {
  PrescriptionFilterComponent,
  SearchFilter,
} from '@reuse/code/components/prescription-filter/prescription-filter.component';
import { FeatureFlagDirective } from '@reuse/code/directives/feature-flag.directive';
import { FeatureFlagService } from '@reuse/code/services/helpers/feature-flag.service';
import { AlertComponent } from '@reuse/code/components/alert-component/alert.component';
import { handleMissingTranslationFile } from '@reuse/code/utils/translation.utils';
import { BehaviorSubject, catchError, EMPTY, Subscription, switchMap } from 'rxjs';
import { Lang } from '@reuse/code/interfaces/lang.enum';
import { tap } from 'rxjs/operators';

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
  templateUrl: './prescription-list.component.html',
  styleUrls: ['./prescription-list.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom,
  imports: [
    AlertComponent,
    MatSelectModule,
    MatOptionModule,
    PrescriptionsTableComponent,
    PaginatorComponent,
    TranslateModule,
    FormsModule,
    PrescriptionModelsTableComponent,
    ToggleHistoricPrescriptionsComponent,
    PrescriptionsCardComponent,
    ResponsiveWrapperComponent,
    MatButton,
    MatIcon,
    PrescriptionsModelsCardComponent,
    PrescriptionFilterComponent,
    FeatureFlagDirective
  ],
})
export class PrescriptionListWebComponent implements OnChanges,OnInit, OnDestroy, AfterViewInit {
  // Protected signals from service
  protected readonly searchCriteria$ = signal<SearchCriteria>({
    historical: false,
    status: undefined,
    prescriptionType: undefined,
  });
  protected readonly discipline$ = toSignal(this.authService.discipline());
  protected readonly LoadingStatus = LoadingStatus;
  protected readonly AlertType = AlertType;

  protected langAlertData: WritableSignal<{ title: string; body: string } | null> = signal(null);

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

  private _subscriptions: Subscription = new Subscription();

  isPrescriptionValue = false;
  isProposalValue = false;
  isModelValue = false;

  @HostBinding('attr.lang')
  @Input()
  lang = Lang.FR;
  @Input() patientSsin?: string;
  @Input() requesterSsin?: string;
  @Input() performerSsin?: string;
  @Input() services!: { getAccessToken: (audience?: string) => Promise<string | null> };
  @Input() intent?: Intent;

  @Output() clickOpenDetail = new EventEmitter<ReadRequestResource | ModelEntityDto>();
  @Output() clickCreateDetail = new EventEmitter<SelectedTemplate>();

  private readonly _languageChange = new BehaviorSubject<string>(this.translate.currentLang ?? Lang.FR);

  errorCard: ErrorCard = {
    show: false,
    message: '',
    errorResponse: undefined,
  };

  constructor(
    private readonly translate: TranslateService,
    private readonly pseudoService: PseudoService,
    private readonly dateAdapter: DateAdapter<DateTime>,
    private readonly authService: AuthService,
    private readonly accessMatrixState: AccessMatrixState,
    private readonly prescriptionsState: PrescriptionsState,
    private readonly proposalsState: ProposalsState,
    private readonly templatesState: TemplatesState,
    private readonly modelsState: ModelsState,
    private readonly prescriptionModelService: PrescriptionModelService,
    private readonly shadowDomOverlay: ShadowDomOverlayContainer,
    private readonly dialog: MatDialog,
    private readonly featureFlagService: FeatureFlagService
  ) {
    const currentLang = this.translate.currentLang;
    if (!currentLang) {
      this.translate.use('fr-BE');
      this.dateAdapter.setLocale('fr-BE');
    }
    featureFlagService.getFeatureFlags();
  }

  ngOnInit(): void {
    this._subscriptions.add(
      this._languageChange.pipe(
        tap((lang) =>{
          this.dateAdapter.setLocale(lang);
        }),
        switchMap((lang) => {
          return this.translate.use(lang).pipe(
            catchError(()=> {
              handleMissingTranslationFile(this.langAlertData, lang);
              return EMPTY;
            })
          );
        }),
      ).subscribe({
        next:() => {
          this.langAlertData.set(null);
        },
      })
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['services']) {
      this.authService.init(this.services.getAccessToken);
      this.accessMatrixState.loadAccessMatrix();
      this.templatesState.loadTemplates();
    }
    if (changes['lang']) {
      const currentLang: string = (changes['lang'].currentValue ?? '') as string;
      this._languageChange.next(currentLang);
    }
    if (
      (changes['patientSsin'] || changes['requesterSsin'] || changes['performerSsin'] || changes['intent']) &&
      this.intent
    ) {
      this.loadData({ pageIndex: 1 });
    }
  }

  ngAfterViewInit() {
    this.shadowDomOverlay.createContainer();
  }

  loadData(pageValues?: { pageIndex?: number; pageSize?: number }) {
    const { pageIndex, pageSize } = pageValues ?? {};

    if (!this.intent) {
      this.showErrorCard();
      return;
    }

    if (isPrescription(this.intent)) {
      this.resetOutdatedValues();
      this.isPrescriptionValue = true;
      this.loadPrescriptions(pageIndex, pageSize);
    } else if (isProposal(this.intent)) {
      this.resetOutdatedValues();
      this.isProposalValue = true;
      this.loadProposals(pageIndex, pageSize);
    } else if (isModel(this.intent)) {
      this.resetOutdatedValues();
      this.isModelValue = true;
      this.loadModels(pageIndex, pageSize);
    }
  }

  resetOutdatedValues() {
    this.isPrescriptionValue = false;
    this.isProposalValue = false;
    this.isModelValue = false;
  }

  loadPrescriptions(page?: number, pageSize?: number) {
    if (this.patientSsin) {
      void this.getPatientIdentifier(this.patientSsin).then(identifier => {
        this.prescriptionsState.loadPrescriptions(
          {
            requester: this.requesterSsin,
            performer: this.performerSsin,
            historical: this.searchCriteria$().historical,
            status: this.searchCriteria$().status,
            template: this.searchCriteria$().prescriptionType,
            patient: identifier,
          },
          page,
          pageSize
        );
      });
    } else {
      this.showErrorCard();
    }
  }

  loadProposals(page?: number, pageSize?: number) {
    if (this.patientSsin) {
      void this.getPatientIdentifier(this.patientSsin).then(identifier => {
        this.proposalsState.loadProposals(
          {
            requester: this.requesterSsin,
            performer: this.performerSsin,
            historical: this.searchCriteria$().historical,
            status: this.searchCriteria$().status,
            template: this.searchCriteria$().prescriptionType,
            patient: identifier,
          },
          page,
          pageSize
        );
      });
    } else {
      this.showErrorCard();
    }
  }

  loadModels(page?: number, pageSize?: number) {
    const pg = page ? page - 1 : 0;
    this.modelsState.loadModels(pg, pageSize || 10);
  }

  retryFailedCalls(error: Record<keyof ViewState, unknown> | undefined) {
    if (!error) {
      this.showErrorCard();
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
    this.loadData({ pageIndex: 1 });
  }

  onFilterUpdate(e: SearchFilter) {
    this.searchCriteria$.set({
      historical: this.searchCriteria$().historical,
      ...e,
    });

    this.loadData({ pageIndex: 1 });
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

  openNewPrescriptionDialog() {
    this.openCreateDialog(Intent.ORDER);
  }

  openNewProposalDialog() {
    this.openCreateDialog(Intent.PROPOSAL);
  }

  openNewModelDialog() {
    this.openCreateDialog(Intent.MODEL);
  }

  openCreateDialog(intent: Intent) {
    this.dialog
      .open<ChooseTemplateDialog, unknown, SelectedTemplate>(ChooseTemplateDialog, {
        maxWidth: '100vw',
        width: '500px',
        autoFocus: false,
        panelClass: 'mh-dialog-container',
        data: {
          intent: intent,
        },
      })
      .afterClosed()
      .subscribe((result?: SelectedTemplate) => {
        if (result) {
          this.clickCreateDetail.emit(result);
        }
      });
  }

  openDeleteModelDialog(model: ModelEntityDto) {
    this.dialog
      .open(ConfirmDialog, {
        panelClass: 'mh-dialog-container',
        data: {
          titleLabel: 'prescription.model.delete.title',
          messageLabel: 'prescription.model.delete.message',
          cancelLabel: 'common.cancel',
          okLabel: 'common.delete',
          params: {
            templateName: model.label,
          },
        },
      })
      .beforeClosed()
      .subscribe(accepted => {
        if (accepted === true && model.id) {
          this.prescriptionModelService.deleteModel(model.id).subscribe({
            next: () => {
              const page = this.viewStateModels$().data?.models?.number || 0;
              const pageSize = this.viewStateModels$().data?.models?.size || 10;
              this.loadModels(page, pageSize);
            },
          });
        }
      });
  }

  openAnnex81ProposalForm() {
    const newPrescriptionDialogResult: SelectedTemplate = {
      templateCode: 'ANNEX_81',
    };
    this.clickCreateDetail.emit(newPrescriptionDialogResult);
  }

  isNurse() {
    return this.discipline$() != null && this.discipline$() === Discipline.Nurse;
  }

  canCreatePrescription() {
    return this.accessMatrixState.hasAtLeastOnePermissionForAnyTemplate(['createPrescription']);
  }

  canCreateProposal() {
    return this.accessMatrixState.hasAtLeastOnePermissionForAnyTemplate(['createProposal']);
  }

  ngOnDestroy() {
    this.searchCriteria$.set({
      historical: false,
      status: undefined,
      prescriptionType: undefined,
    });

    this._subscriptions.unsubscribe()
  }

  showErrorCard() {
    this.errorCard = {
      show: true,
      message: 'common.somethingWentWrongWithoutRetry',
    };
  }
}
