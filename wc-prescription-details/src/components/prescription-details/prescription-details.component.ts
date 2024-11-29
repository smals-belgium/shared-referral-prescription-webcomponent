import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  effect,
  EventEmitter,
  HostBinding,
  Inject,
  Input,
  OnChanges, OnInit,
  Output,
  Renderer2,
  Signal,
  SimpleChanges,
  untracked,
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
  ReadPrescription,
  Status,
  Token,
  UserInfo,
} from '@reuse/code/interfaces';
import { combineSignalDataState } from '@reuse/code/utils/rxjs.utils';
import { AuthService } from '@reuse/code/services/auth.service';
import { WcConfigurationService } from '@reuse/code/services/wc-configuration.service';
import { AssignPrescriptionDialog } from '@reuse/code/dialogs/assign-prescription/assign-prescription.dialog';
import { CancelPrescriptionDialog } from '@reuse/code/dialogs/cancel-prescription/cancel-prescription.dialog';
import {
  StartExecutionPrescriptionDialog
} from '@reuse/code/dialogs/start-execution-prescription/start-execution-prescription.dialog';
import {
  RestartExecutionPrescriptionDialog
} from '@reuse/code/dialogs/restart-execution-prescription/restart-execution-prescription.dialog';
import {
  FinishExecutionPrescriptionDialog
} from '@reuse/code/dialogs/finish-execution-prescription/finish-execution-prescription.dialog';
import {
  CancelExecutionPrescriptionDialog
} from '@reuse/code/dialogs/cancel-execution-prescription/cancel-execution-prescription.dialog';
import { CanCreatePrescriptionPipe } from '@reuse/code/pipes/can-create-prescription.pipe';
import { CanCancelPrescriptionOrProposalPipe } from '@reuse/code/pipes/can-cancel-prescription-or-proposal.pipe';
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
import { CanApproveProposalPipe } from "@reuse/code/pipes/can-approve-proposal.pipe";
import { CanRejectProposalPipe } from "@reuse/code/pipes/can-reject-proposal.pipe";
import { RejectProposalDialog } from "@reuse/code/dialogs/reject-proposal/reject-proposal.dialog";
import { CanExtendPrescriptionPipe } from "@reuse/code/pipes/can-extend-prescription.pipe";
import { IdentifyState } from "@reuse/code/states/identify.state";
import { ProposalState } from '@reuse/code/states/proposal.state';
import { isPrescriptionId, isPrescriptionShortCode, isSsin, validateSsinChecksum } from '@reuse/code/utils/utils';
import { PseudoService } from '@reuse/code/services/pseudo.service';
import { v4 as uuidv4 } from 'uuid';

interface ViewState {
  prescription: ReadPrescription;
  proposal: ReadPrescription;
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
    CanCancelPrescriptionOrProposalPipe,
    CanCreatePrescriptionPipe,
    CanRejectAssignationPipe,
    CanTransferAssignationPipe,
    CanSelfAssignPipe,
    CanInterruptTreatmentPipe,
    CanRestartTreatmentPipe,
    CanApproveProposalPipe,
    CanRejectProposalPipe,
    CanExtendPrescriptionPipe
  ]
})

export class PrescriptionDetailsWebComponent implements OnChanges, OnInit {
  private readonly templateCode$ = computed(() => {
    if(this.intent?.toLowerCase() === 'proposal') {
      return this.proposalSateService.state().data?.templateCode
    }
    return this.prescriptionStateService.state().data?.templateCode
  });
  private readonly tokenClaims$ = toSignal(this.authService.getClaims());
  private readonly isProfessional$ = toSignal(this.authService.isProfessional());


  readonly viewState$: Signal<DataState<ViewState>> = combineSignalDataState({
    prescription: computed(() => {
      if(this.intent?.toLowerCase() === 'proposal') {
        return this.proposalSateService.state()
      }
      return this.prescriptionStateService.state()
    }),
    patient: computed(() => {
      const patientState = this.patientStateService.state();
      const identifyState = this.identifyState.state();
      const ssin = identifyState.data;
      const professional = this.isProfessional$();
      const userProfile = this.tokenClaims$()?.['userProfile'];

      if (professional) {
        const person = {
          ...patientState.data,
          ssin: ssin
        };
        return {...patientState, data: person};
      }

      const person = {
        ...userProfile,
        ssin: ssin
      };
      return {...identifyState, data: person};
    }),
    performerTask: computed(() => {
      const state = this.intent?.toLowerCase() === 'proposal' ? this.proposalSateService.state() : this.prescriptionStateService.state();
      const ssin = this.tokenClaims$()?.['userProfile']['ssin'];
      if (!ssin || state.status !== LoadingStatus.SUCCESS) {
        return state;
      }

      const directPerformerTask = state.data!.performerTasks?.find(t => t.careGiverSsin === ssin);
      if (directPerformerTask) {
        return {...state, data: directPerformerTask};
      }

      const organizationTask = state.data!.organizationTasks?.find(ot =>
        ot.performerTasks.some(pt => pt.careGiverSsin === ssin)
      );
      const nestedPerformerTask = organizationTask?.performerTasks.find(t => t.careGiverSsin === ssin);

      return nestedPerformerTask
        ? {...state, data: nestedPerformerTask}
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
      const token = this.tokenClaims$()?.['userProfile'];
      return token
        ? {status: LoadingStatus.SUCCESS, data: token}
        : {status: LoadingStatus.LOADING};
    })
  });

  loading = false;
  printer = false;
  generatedUUID = '';

  @HostBinding('attr.lang')
  @Input() lang = 'fr-BE';
  @Input() initialPrescriptionType?: string;
  @Input() prescriptionId!: string;
  @Input() patientSsin?: string;
  @Input() intent!: string;
  @Input() getToken!: () => Promise<Token>;

  @Output() clickDuplicate = new EventEmitter<ReadPrescription>();
  @Output() clickExtend = new EventEmitter<ReadPrescription>();
  @Output() proposalApproved = new EventEmitter<{ prescriptionId: string }>();
  @Output() proposalRejected = new EventEmitter<boolean>();

  constructor(
    private translate: TranslateService,
    private dateAdapter: DateAdapter<DateTime>,
    private dialog: MatDialog,
    private authService: AuthService,
    private configService: WcConfigurationService,
    private pseudoService: PseudoService,
    private renderer: Renderer2,
    private accessMatrixStateService: AccessMatrixState,
    private prescriptionStateService: PrescriptionState,
    private proposalSateService: ProposalState,
    private patientStateService: PatientState,
    private templatesStateService: TemplatesState,
    private templateVersionsStateService: TemplateVersionsState,
    private toastService: ToastService,
    private identifyState: IdentifyState,
    @Inject(DOCUMENT) private _document: Document
  ) {
    this.dateAdapter.setLocale('fr-BE');
    this.translate.setDefaultLang('fr-BE');
    this.translate.use('fr-BE');

    this.loadWebComponents();

    // Register a new effect based on prescription state changes
    effect(() => {
      const prescription = this.intent?.toLowerCase() === 'proposal' ? this.proposalSateService.state()?.data : this.prescriptionStateService.state()?.data;

      untracked(() => {
        if (prescription) {
          if (prescription.patientIdentifier) {
            this.identifyState.loadSSIN(prescription.patientIdentifier);
          }
          this.templateVersionsStateService.loadTemplateVersion('READ_' + prescription.templateCode);
        }


      });
    }, {allowSignalWrites: true});

    // Register a new effect based on identify state changes
    effect(() => {
      const ssin = this.identifyState.state()?.data;

      untracked(() => {
        if (ssin) {
          const professional = this.isProfessional$();
          if (professional) {
            this.patientStateService.loadPatient(ssin.toString());
          }
        }
      });
    });
  }

  ngOnInit() {
    this.generatedUUID = uuidv4();
  }

  getAccessToken = async () => {
    const e = await this.getToken();
    return e.accessToken;
  };

  getIdToken = async () => {
    const e = await this.getToken();
    return e.idToken;
  };

  ngOnChanges(changes: SimpleChanges) {
    if (changes['getToken']) {
      this.authService.init(this.getAccessToken, this.getIdToken);
      this.accessMatrixStateService.loadAccessMatrix();
      this.templatesStateService.loadTemplates();
    }
    if (changes['lang']) {
      this.dateAdapter.setLocale(this.lang);
      this.translate.use(this.lang);
    }
    if (changes['prescriptionId'] || changes['patientSsin']) {
      this.loadPrescriptionOrProposal()
    }
  }

  loadProposal() {
    if (isPrescriptionId(this.prescriptionId)) {
      this.proposalSateService.loadProposal(this.prescriptionId);
    } else if(this.patientSsin && isSsin(this.patientSsin)) {
      this.toastService.show('proposals.errors.invalidUUID');
    }
  }

  loadPrescription(): void {
    if (isPrescriptionId(this.prescriptionId)) {
      this.prescriptionStateService.loadPrescription(this.prescriptionId);
    } else if (this.patientSsin && isSsin(this.patientSsin)) {
      if (!validateSsinChecksum(this.patientSsin)) {
        this.toastService.show('prescription.errors.invalidSsinChecksum');
        return;
      }

      if (!isPrescriptionShortCode(this.prescriptionId)) {
        this.toastService.show('prescription.errors.invalidShortCode');
        return;
      }

      this.getPatientIdentifier(this.patientSsin).then((identifier) => {
        this.prescriptionStateService.loadPrescriptionByShortCode(this.prescriptionId, identifier);
      });
    }
  }

  loadPrescriptionOrProposal(): void {
    if(this.intent?.toLowerCase() === 'proposal') {
      this.loadProposal();
    } else {
      this.loadPrescription();
    }
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
      maxWidth: '750px',
      maxHeight: '100vh'
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
    const ssin = this.tokenClaims$()?.['userProfile']['ssin'];
    this.prescriptionStateService.assignPrescriptionToMe(prescription.id, prescription.referralTask.id, {ssin}, this.generatedUUID)
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
    if (status === 'BLACKLISTED' || status === 'CANCELLED' || status === 'EXPIRED') {
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

  approveProposal(proposal: ReadPrescription) {
    this.loading = true;
    this.prescriptionStateService.approveProposal(proposal.id, this.generatedUUID)
      .subscribe({
        next: (value) => {
          this.toastService.show('proposal.approve.success');
          if(value.prescriptionId) {
            this.proposalApproved.next({prescriptionId: value.prescriptionId})
          }
          this.loading = false;
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
    const script = Array.from(htmlCollection).find(e => e.src.includes('wc-prescription-details.js'));

    if (!script) return;
    const url = script.src.replace('wc-prescription-details.js', '');

    const scripts = [
      'assets/pdfmake/pdfmake.js'
    ];
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
    const script = Array.from(htmlCollection).find(e => e.src.includes('wc-prescription-details.js'));

    if (!script) return;
    const url = script.src.replace('wc-prescription-details.js', '');

    const scripts = [
      'assets/evf-form-details/evf-form-details.js'
    ];
    scripts.forEach((src) => {
      const script = this.renderer.createElement('script');
      script.type = `text/javascript`;
      script.src = url + src;
      script.type = 'module';
      this.renderer.appendChild(this._document.body, script);
    });
  }

  private getPatientIdentifier(identifier: string): Promise<string> {
    return this.pseudoService.pseudonymize(identifier);
  }
}
