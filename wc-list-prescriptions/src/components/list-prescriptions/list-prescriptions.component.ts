import {
  Component,
  EventEmitter,
  HostBinding,
  Input,
  OnChanges,
  Output,
  Signal,
  SimpleChanges,
  ViewEncapsulation
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DateAdapter, MatOptionModule } from '@angular/material/core';
import { DateTime } from 'luxon';
import { combineSignalDataState } from '@reuse/code/utils/rxjs.utils';
import { AuthService } from '@reuse/code/services/auth.service';
import { DataState, EvfTemplate, Token } from '@reuse/code/interfaces';
import { OverlaySpinnerComponent } from '@reuse/code/components/overlay-spinner/overlay-spinner.component';
import { IfStatusLoadingDirective } from '@reuse/code/directives/if-status-loading.directive';
import { PaginatorComponent } from '@reuse/code/components/paginator/paginator.component';
import { PrescriptionsTableComponent } from '@reuse/code/components/prescriptions-table/prescriptions-table.component';
import { MatSelectModule } from '@angular/material/select';
import { ActivePageComponent } from '@reuse/code/components/active-page/active-page.component';
import { IfStatusSuccessDirective } from '@reuse/code/directives/if-status-success.directive';
import { ErrorCardComponent } from '@reuse/code/components/error-card/error-card.component';
import { IfStatusErrorDirective } from '@reuse/code/directives/if-status-error.directive';
import { PrescriptionsState } from '@reuse/code/states/prescriptions.state';
import { TemplatesState } from '@reuse/code/states/templates.state';
import { AccessMatrixState } from '@reuse/code/states/access-matrix.state';
import { PrescriptionSummary, PrescriptionSummaryList } from '@reuse/code/interfaces/prescription-summary.interface';
import { PseudoService } from '@reuse/code/services/pseudo.service';
import { ProposalsState } from '@reuse/code/states/proposals.state';
import { FormsModule } from "@angular/forms";
import {
  PrescriptionModelsTableComponent
} from '@reuse/code/components/prescription-models-table/prescription-models-table.component';
import { PrescriptionModel, PrescriptionModelRequest } from '@reuse/code/interfaces/prescription-modal.inteface';
import { ModelsState } from '@reuse/code/states/models.state';

interface ViewState {
  prescriptions: PrescriptionSummaryList;
  proposals: PrescriptionSummaryList;
  models: PrescriptionModelRequest;
  templates: EvfTemplate[];
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
        PrescriptionModelsTableComponent
    ]
})
export class ListPrescriptionsWebComponent implements OnChanges {

  readonly viewStateProposals$: Signal<DataState<ViewState>> = combineSignalDataState({
    proposals: this.proposalsState.state,
    templates: this.templatesState.state
  });

  readonly viewStatePrescriptions$: Signal<DataState<ViewState>> = combineSignalDataState({
    prescriptions: this.prescriptionsState.state,
    templates: this.templatesState.state
  });

  readonly viewStateModels$: Signal<DataState<ViewState>> = combineSignalDataState({
    models: this.modelsState.state,
    templates: this.templatesState.state
  });

  @HostBinding('attr.lang')
  @Input() lang?: string;
  @Input() patientSsin?: string;
  @Input() requesterSsin?: string;
  @Input() performerSsin?: string;
  @Input() getToken!: (targetClientId?: string) => Token;
  @Input() intent!: string;

  @Output() clickOpenPrescriptionDetails = new EventEmitter<PrescriptionSummary>();
  @Output() clickOpenModelDetails = new EventEmitter<PrescriptionModel>();

  constructor(
    private translate: TranslateService,
    private pseudoService: PseudoService,
    private dateAdapter: DateAdapter<DateTime>,
    private authService: AuthService,
    private accessMatrixState: AccessMatrixState,
    private prescriptionsState: PrescriptionsState,
    private proposalsState: ProposalsState,
    private templatesState: TemplatesState,
    private modelsState: ModelsState
  ) {
    this.dateAdapter.setLocale('fr-BE');
    this.translate.setDefaultLang('fr-BE');
    this.translate.use('fr-BE')
  }

  getAccessToken = () => {
    const e = this.getToken();
    return e.accessToken;
  }

  getAuthExchangeToken = (targetClientId?: string) => {
    const e = this.getToken(targetClientId);
    return e.getAuthExchangeToken;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['getToken']) {
      this.authService.init(this.getAccessToken, this.getAuthExchangeToken);
      this.accessMatrixState.loadAccessMatrix();
      this.templatesState.loadTemplates();
    }
    if (changes['lang']) {
      this.dateAdapter.setLocale(this.lang!);
      this.translate.use(this.lang!);
    }
    if (changes['patientSsin'] || changes['requesterSsin'] || changes['performerSsin']) {
      this.loadData(1);
    }
  }

  loadData(page?: number, pageSize?: number){
    if(this.intent.toLowerCase() === 'order'){
      this.loadPrescriptions(page, pageSize)
    }
    else if(this.intent.toLowerCase() === 'proposal'){
      this.loadProposals(page, pageSize)
    }
    else if(this.intent.toLowerCase() === 'model'){
      this.loadModels(page, pageSize)
    }
  }

  loadPrescriptions(page?: number, pageSize?: number) {
    if (this.patientSsin) {
      this.getPatientIdentifier(this.patientSsin!).then((identifier) => {
        this.prescriptionsState.loadPrescriptions({
          patient: identifier,
          requester: this.requesterSsin,
          performer: this.performerSsin
        }, page, pageSize);
      });
    } else {
      this.prescriptionsState.loadPrescriptions({
        patient: this.patientSsin,
        requester: this.requesterSsin,
        performer: this.performerSsin
      }, page, pageSize);
    }
  }

  loadProposals(page?: number, pageSize?: number) {
    if (this.patientSsin) {
      this.getPatientIdentifier(this.patientSsin!).then((identifier) => {
        this.proposalsState.loadProposals({
          patient: identifier,
          requester: this.requesterSsin,
          performer: this.performerSsin
        }, page, pageSize);
      })
    } else {
      this.proposalsState.loadProposals({
        patient: this.patientSsin,
        requester: this.requesterSsin,
        performer: this.performerSsin
      }, page, pageSize);
    }
  }

  loadModels(page?: number, pageSize?: number) {
    const pg = page ? page -1 : 0;
    this.modelsState.loadModels(pg, pageSize || 10);
  }

  retryFailedCalls(error: { prescriptions?: any, templates?: any, proposals?: any, models?: any }) {
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
}
