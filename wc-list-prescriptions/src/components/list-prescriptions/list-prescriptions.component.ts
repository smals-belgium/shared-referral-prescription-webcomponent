import {
  Component, computed,
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
import { combineSignalDataState, toDataState } from '@reuse/code/utils/rxjs.utils';
import { AuthService } from '@reuse/code/services/auth.service';
import { DataState, EvfTemplate } from '@reuse/code/interfaces';
import { OverlaySpinnerComponent } from '@reuse/code/components/overlay-spinner/overlay-spinner.component';
import { IfStatusLoadingDirective } from '@reuse/code/directives/if-status-loading.directive';
import { PaginatorComponent } from '@reuse/code/components/paginator/paginator.component';
import { PrescriptionsTableComponent } from '@reuse/code/components/prescriptions-table/prescriptions-table.component';
import { MatSelectModule } from '@angular/material/select';
import { ActivePageComponent } from '@reuse/code/components/active-page/active-page.component';
import { IfStatusSuccessDirective } from '@reuse/code/directives/if-status-success.directive';
import { ErrorCardComponent } from '@reuse/code/components/error-card/error-card.component';
import { IfStatusErrorDirective } from '@reuse/code/directives/if-status-error.directive';
import { AsyncPipe, NgIf } from '@angular/common';
import { PrescriptionsState } from '@reuse/code/states/prescriptions.state';
import { TemplatesState } from '@reuse/code/states/templates.state';
import { AccessMatrixState } from '@reuse/code/states/access-matrix.state';
import { PrescriptionSummary, PrescriptionSummaryList } from '@reuse/code/interfaces/prescription-summary.interface';
import { PseudoService } from '@reuse/code/services/pseudo.service';
import { ProposalsState } from '@reuse/code/states/proposals.state';
import {FormsModule} from "@angular/forms";

interface ViewState {
  prescriptions: PrescriptionSummaryList;
  proposals: PrescriptionSummaryList;
  templates: EvfTemplate[];
}

@Component({
  templateUrl: './list-prescriptions.component.html',
  styleUrls: ['./list-prescriptions.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom,
  standalone: true,
  imports: [
    NgIf,
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
    AsyncPipe,
    TranslateModule,
    FormsModule
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

  @HostBinding('attr.lang')
  @Input() lang?: string;
  @Input() patientSsin?: string;
  @Input() requesterSsin?: string;
  @Input() performerSsin?: string;
  @Input() getToken!: () => Promise<string>;
  @Input() intent!: string;

  @Output() clickOpenPrescriptionDetails = new EventEmitter<PrescriptionSummary>();

  constructor(
    private translate: TranslateService,
    private pseudoService: PseudoService,
    private dateAdapter: DateAdapter<DateTime>,
    private authService: AuthService,
    private accessMatrixState: AccessMatrixState,
    private prescriptionsState: PrescriptionsState,
    private proposalsState: ProposalsState,
    private templatesState: TemplatesState
  ) {
    this.dateAdapter.setLocale('fr-BE');
    this.translate.setDefaultLang('fr-BE');
    this.translate.use('fr-BE')
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['getToken']) {
      this.authService.init(this.getToken);
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
    if(this.intent == 'order'){
      this.loadPrescriptions(page, pageSize)
    }
    else{
      this.loadProposals(page, pageSize)
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

  retryFailedCalls(error: { prescriptions?: any, templates?: any, proposals?: any }) {
    if (error.prescriptions || error.proposals) {
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
