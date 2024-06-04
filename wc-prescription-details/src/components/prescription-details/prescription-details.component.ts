import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  effect,
  EventEmitter,
  HostBinding,
  Inject,
  Input,
  OnChanges,
  Output,
  Renderer2,
  Signal,
  SimpleChanges,
  ViewEncapsulation
} from '@angular/core';
import { FormTemplate } from '@smals/vas-evaluation-form-ui-core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DateAdapter } from '@angular/material/core';
import { DateTime } from 'luxon';
import { AsyncPipe, DOCUMENT, NgFor, NgIf, NgStyle } from '@angular/common';
import {
  CreatePrescriptionRequest,
  DataState,
  EvfTemplate,
  LoadingStatus,
  PerformerTask,
  Person,
  ReadPrescription, Status, UserInfo,
} from '@reuse/code/interfaces';
import { combineSignalDataState } from '@reuse/code/utils/rxjs.utils';
import { AuthService } from '@reuse/code/services/auth.service';
import { WcConfigurationService } from '@reuse/code/services/wc-configuration.service';
import { AssignPrescriptionDialog } from '@reuse/code/dialogs/assign-prescription/assign-prescription.dialog';
import { CancelPrescriptionDialog } from '@reuse/code/dialogs/cancel-prescription/cancel-prescription.dialog';
import { StartExecutionPrescriptionDialog } from '@reuse/code/dialogs/start-execution-prescription/start-execution-prescription.dialog';
import { RestartExecutionPrescriptionDialog } from '@reuse/code/dialogs/restart-execution-prescription/restart-execution-prescription.dialog';
import { FinishExecutionPrescriptionDialog } from '@reuse/code/dialogs/finish-execution-prescription/finish-execution-prescription.dialog';
import { CancelExecutionPrescriptionDialog } from '@reuse/code/dialogs/cancel-execution-prescription/cancel-execution-prescription.dialog';
import { CanCreatePrescriptionPipe } from '@reuse/code/pipes/can-create-prescription.pipe';
import { CanCancelPrescriptionPipe } from '@reuse/code/pipes/can-cancel-prescription.pipe';
import { CanAssignCaregiverPipe } from '@reuse/code/pipes/can-assign-caregiver.pipe';
import { CanRejectAssignationPipe } from '@reuse/code/pipes/can-reject-assignation.pipe';
import { CanTransferAssignationPipe } from '@reuse/code/pipes/can-transfer-assignation.pipe';
import { CanStartTreatmentPipe } from '@reuse/code/pipes/can-start-treatment.pipe';
import { CanRestartTreatmentPipe } from '@reuse/code/pipes/can-restart-treatment.pipe';
import { CanCancelTreatmentPipe } from '@reuse/code/pipes/can-cancel-treatment.pipe';
import { CanFinishTreatmentPipe } from '@reuse/code/pipes/can-finish-treatment.pipe';
import { CanSelfAssignPipe } from '@reuse/code/pipes/can-self-assign.pipe';
import { CanInterruptTreatmentPipe } from '@reuse/code/pipes/can-interrupt-treatment.pipe';
import { TemplateNamePipe } from '@reuse/code/pipes/template-name.pipe';
import { FormatNihdiPipe } from '@reuse/code/pipes/format-nihdi.pipe';
import { FormatSsinPipe } from '@reuse/code/pipes/format-ssin.pipe';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { IfStatusSuccessDirective } from '@reuse/code/directives/if-status-success.directive';
import { IfStatusErrorDirective } from '@reuse/code/directives/if-status-error.directive';
import { OverlaySpinnerComponent } from '@reuse/code/components/overlay-spinner/overlay-spinner.component';
import { IfStatusLoadingDirective } from '@reuse/code/directives/if-status-loading.directive';
import { ErrorCardComponent } from '@reuse/code/components/error-card/error-card.component';
import { DatePipe } from '@reuse/code/pipes/date.pipe';
import { PrescriptionState } from '@reuse/code/states/prescription.state';
import { TemplatesState } from '@reuse/code/states/templates.state';
import { TemplateVersionsState } from '@reuse/code/states/template-versions.state';
import { AccessMatrixState } from '@reuse/code/states/access-matrix.state';
import { toSignal } from '@angular/core/rxjs-interop';
import { PatientState } from '@reuse/code/states/patient.state';
import { TransferAssignationDialog } from '@reuse/code/dialogs/transfer-assignation/transfer-assignation.dialog';
import { ToastService } from '@reuse/code/services/toast.service';
import { RejectAssignationDialog } from '@reuse/code/dialogs/reject-assignation/reject-assignation.dialog';
import {
  InterruptExecutionPrescriptionDialog
} from '@reuse/code/dialogs/interrupt-execution-prescription/interrupt-execution-prescription.dialog';
import {CanApproveProposalPipe} from "@reuse/code/pipes/can-approve-proposal.pipe";
import {CanRejectProposalPipe} from "@reuse/code/pipes/can-reject-proposal.pipe";
import {RejectProposalDialog} from "@reuse/code/dialogs/reject-proposal/reject-proposal.dialog";

interface ViewState {
  prescription: ReadPrescription;
  patient: Person;
  performerTask?: PerformerTask;
  template: EvfTemplate;
  templateVersion: FormTemplate;
  currentUser: UserInfo;
}

@Component({
  templateUrl: './prescription-details.component.html',
  styleUrls: ['./prescription-details.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  standalone: true,
  imports: [
    NgIf,
    NgStyle,
    IfStatusLoadingDirective,
    OverlaySpinnerComponent,
    ErrorCardComponent,
    IfStatusErrorDirective,
    IfStatusSuccessDirective,
    MatButtonModule,
    MatIconModule,
    NgFor,
    AsyncPipe,
    DatePipe,
    TranslateModule,
    FormatSsinPipe,
    FormatNihdiPipe,
    TemplateNamePipe,
    CanFinishTreatmentPipe,
    CanCancelTreatmentPipe,
    CanStartTreatmentPipe,
    CanAssignCaregiverPipe,
    CanCancelPrescriptionPipe,
    CanCreatePrescriptionPipe,
    CanRejectAssignationPipe,
    CanTransferAssignationPipe,
    CanSelfAssignPipe,
    CanInterruptTreatmentPipe,
    CanRestartTreatmentPipe,
    CanApproveProposalPipe,
    CanRejectProposalPipe
  ]
})

export class PrescriptionDetailsWebComponent implements OnChanges {

  private readonly appUrl = this.configService.getEnvironmentVariable('appUrl');
  private readonly templateCode$ = computed(() => this.prescriptionStateService.state().data?.templateCode);
  private readonly tokenClaims$ = toSignal(this.authService.getClaims());

  readonly viewState$: Signal<DataState<ViewState>> = combineSignalDataState({
    prescription: this.prescriptionStateService.state,
    patient: this.patientStateService.state,
    performerTask: computed(() => {
      const state = this.prescriptionStateService.state();
      const ssin = this.tokenClaims$()?.['ssin'];
      if (!ssin || state.status !== LoadingStatus.SUCCESS) {
        return state;
      }

      const directPerformerTask = state.data!.performerTasks?.find(t => t.careGiverSsin === ssin);
      if (directPerformerTask) {
        return { ...state, data: directPerformerTask };
      }

      const organizationTask = state.data!.organizationTasks?.find(ot =>
        ot.performerTasks.some(pt => pt.careGiverSsin === ssin)
      );
      const nestedPerformerTask = organizationTask?.performerTasks.find(t => t.careGiverSsin === ssin);

      return nestedPerformerTask
        ? { ...state, data: nestedPerformerTask }
        : state;
    }),
    template: computed(() => {
      const templateCode = this.templateCode$();
      const templatesState = this.templatesStateService.state();
      return this.getPrescriptionTemplateStream(templateCode, templatesState);
    }),
    templateVersion: computed(() => {
      const templateCode = this.templateCode$();
      return templateCode
        ? this.templateVersionsStateService.getState('READ_' + templateCode)()
        : {status: LoadingStatus.LOADING};
    }),
    currentUser: computed(() => {
      const token = this.tokenClaims$()
      return token
        ? {status: LoadingStatus.SUCCESS, data: token}
        : {status: LoadingStatus.LOADING};
    })
  });

  loading = false;
  printer = false;

  @HostBinding('attr.lang')
  @Input() lang = 'fr-BE';
  @Input() initialPrescriptionType?: string;
  @Input() prescriptionId!: string;
  @Input() intent!: string;
  @Input() getToken!: () => Promise<string>;

  @Output() clickDuplicate = new EventEmitter<ReadPrescription>();

  constructor(
    private translate: TranslateService,
    private dateAdapter: DateAdapter<DateTime>,
    private dialog: MatDialog,
    private authService: AuthService,
    private configService: WcConfigurationService,
    private renderer: Renderer2,
    private accessMatrixStateService: AccessMatrixState,
    private prescriptionStateService: PrescriptionState,
    private patientStateService: PatientState,
    private templatesStateService: TemplatesState,
    private templateVersionsStateService: TemplateVersionsState,
    private toastService: ToastService,
    @Inject(DOCUMENT) private _document: Document
  ) {
    this.dateAdapter.setLocale('fr-BE');
    this.translate.setDefaultLang('fr-BE');
    this.translate.use('fr-BE')

    this.loadWebComponents();
    effect(() => {
      const prescription = this.prescriptionStateService.state()?.data;
      if (prescription) {
        this.patientStateService.loadPatient(prescription.patientIdentifier);
        this.templateVersionsStateService.loadTemplateVersion('READ_' + prescription.templateCode);
      }
    }, {allowSignalWrites: true});
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['getToken']) {
      this.authService.init(this.getToken);
      this.accessMatrixStateService.loadAccessMatrix();
      this.templatesStateService.loadTemplates();
    }
    if (changes['lang']) {
      this.dateAdapter.setLocale(this.lang);
      this.translate.use(this.lang!);
    }
    if (changes['prescriptionId']) {
      this.loadPrescription();
    }
  }

  loadPrescription(): void {
    this.prescriptionStateService.loadPrescription(this.prescriptionId);
  }

  private getPrescriptionTemplateStream(templateCode: string | undefined, templatesState: DataState<EvfTemplate[]>): DataState<EvfTemplate> {
    if (!templateCode || templatesState.status !== LoadingStatus.SUCCESS) {
      return {...templatesState, data: undefined};
    }
    return {
      ...templatesState,
      data: templatesState.data!.find((t) => t.code === templateCode)
    };
  }

  openAssignDialog(prescription: ReadPrescription): void {
    this.dialog.open(AssignPrescriptionDialog, {
      data: {
        prescriptionId: prescription.id,
        referralTaskId: prescription.referralTask.id,
        assignedCareGivers: prescription.performerTasks?.map(c => c.careGiverSsin),
        assignedOrganizations: prescription.organizationTasks?.map(o => o.organizationNihdi)
      },
      width: '100vw',
      maxWidth: '750px',
      maxHeight: '100vh'
    });
  }

  openTransferAssignationDialog(prescription: ReadPrescription, task: PerformerTask): void {
    this.dialog.open(TransferAssignationDialog, {
      data: {
        prescriptionId: prescription.id,
        referralTaskId: prescription.referralTask.id,
        performerTaskId: task.id,
        assignedCareGivers: prescription.performerTasks?.map(c => c.careGiverSsin)
      },
      width: '100vw',
      maxWidth: '750px'
    });
  }

  openCancelPrescriptionDialog(prescription: ReadPrescription, patient: Person): void {
    this.dialog.open(CancelPrescriptionDialog, {
      data: {
        prescription,
        patient
      },
      width: '100vw',
      maxWidth: '500px'
    });
  }

  openStartExecutionDialog(prescription: ReadPrescription, task?: PerformerTask): void {
    this.dialog.open(StartExecutionPrescriptionDialog, {
      data: {
        prescription: prescription,
        performerTask: task,
        startExecutionDate: task?.executionPeriod?.start
      },
      minWidth: '320px'
    });
  }

  openRestartExecutionDialog(prescription: ReadPrescription, task: PerformerTask, patient: Person): void {
    this.dialog.open(RestartExecutionPrescriptionDialog, {
      data: {
        prescription: prescription,
        performerTask: task,
        patient: patient
      },
      minWidth: '320px'
    });
  }

  openFinishExecutionDialog(prescription: ReadPrescription, task: PerformerTask): void {
    this.dialog.open(FinishExecutionPrescriptionDialog, {
      data: {
        prescription: prescription,
        performerTask: task,
        startExecutionDate: task.executionPeriod?.start
      },
      minWidth: '320px'
    });
  }

  openCancelExecutionDialog(prescription: ReadPrescription, task: PerformerTask, patient: Person): void {
    this.dialog.open(CancelExecutionPrescriptionDialog, {
      data: {
        prescription: prescription,
        performerTask: task,
        patient: patient
      },
      width: '100vw',
      maxWidth: '500px'
    });
  }

  openInterruptExecutionDialog(prescription: ReadPrescription, task: PerformerTask, patient: Person): void {
    this.dialog.open(InterruptExecutionPrescriptionDialog, {
      data: {
        prescription: prescription,
        performerTask: task,
        patient: patient
      },
      width: '100vw',
      maxWidth: '500px'
    });
  }

  openRejectAssignationDialog(prescription: ReadPrescription, task: PerformerTask, patient: Person): void {
    this.dialog.open(RejectAssignationDialog, {
      data: {
        prescription: prescription,
        performerTask: task,
        patient: patient
      },
      width: '100vw',
      maxWidth: '500px'
    });

  }

  selfAssign(prescription: ReadPrescription): void {
    this.loading = true;
    const ssin = this.tokenClaims$()?.['ssin'];
    this.prescriptionStateService.assignPrescriptionToMe(prescription.id, prescription.referralTask.id, {ssin})
      .subscribe({
        next: () => {
          this.loading = false;
          this.toastService.show('prescription.assignPerformer.meSuccess');
        },
        error: () => {
          this.loading = false;
          this.toastService.showSomethingWentWrong();
        }
      });
  }

  print(): void {
    if (this.printer) {
      return;
    }
    this.printer = true;
    this.loadPrintWebComponent();
  }

  getStatusBorderColor(status: Status): string {
    if (status === 'BLACKLISTED' || status === 'CANCELLED'|| status === 'EXPIRED') {
      return 'red';
    } else if (status === 'PENDING') {
      return 'orange';
    } else if (status === 'IN_PROGRESS') {
      return '#40c4ff';
    } else if (status === 'DONE') {
      return 'limegreen';
    } else {
      return 'lightgrey';
    }
  }

  mapResponses(prescriptionResponses: Record<string, any>) {
    prescriptionResponses = {
      ...prescriptionResponses['responses'],
      ...prescriptionResponses['responses'].occurrenceTiming.repeat,
      period: prescriptionResponses['responses'].occurrenceTiming.repeat.period,
      validityStartDate: prescriptionResponses['period'].start,
      validityEndDate: prescriptionResponses['period'].end
    }

    return prescriptionResponses
  }

  mapProposalToCreatePrescriptionRequest(proposal: ReadPrescription): CreatePrescriptionRequest {
    const {id, patientIdentifier, templateCode , ...rest} = proposal
    const responses = this.mapResponses({...rest})
    return {
      subject: patientIdentifier,
      templateCode: templateCode,
      responses: responses,
    }
  }

  approveProposal(proposal: ReadPrescription) {
    this.loading = true;
    const prescriptionRequest = this.mapProposalToCreatePrescriptionRequest(proposal)
    this.prescriptionStateService.createPrescriptionFromProposal(proposal.id, prescriptionRequest)
      .subscribe({
        next: () => {
          this.loading = false;
          this.toastService.show('proposal.approve.success');
        },
        error: () => {
          this.loading = false;
          this.toastService.showSomethingWentWrong();
        }
      });
  }

  openRejectProposalDialog(proposal: ReadPrescription): void {
    this.dialog.open(RejectProposalDialog, {
      data: {
        proposal: proposal
      },
      width: '100vw',
      maxWidth: '500px'
    });

  }

  private loadPrintWebComponent(): void {
    if (customElements.get('nihdi-referral-prescription-pdf') != undefined) {
      return;
    }

    const htmlCollection = document.getElementsByTagName('script');
    const script = Array.from(htmlCollection).find(e => e.src.includes('wc-prescription-details.js'))

    if(!script) return;
    const url = script.src.replace('wc-prescription-details.js','');

    const scripts = [
      'assets/pdfmake/pdfmake.js'
    ]
    scripts.forEach((src) => {
      const script = this.renderer.createElement('script');
      script.type = `text/javascript`;
      script.src = url + src;
      script.type = 'module';
      this.renderer.appendChild(this._document.body, script);
    });
  }

  private loadWebComponents(): void {
    if (customElements.get('nihdi-referral-prescription-form-details') != undefined) {
      return;
    }
    const htmlCollection = document.getElementsByTagName('script');
    const script = Array.from(htmlCollection).find(e => e.src.includes('wc-prescription-details.js'))

    if(!script) return;
    const url = script.src.replace('wc-prescription-details.js','');

    const scripts = [
      'assets/evf-form-details/evf-form-details.js'
    ]
    scripts.forEach((src) => {
      const script = this.renderer.createElement('script');
      script.type = `text/javascript`;
      script.src = url + src;
      script.type = 'module';
      this.renderer.appendChild(this._document.body, script);
    });
  }
}
