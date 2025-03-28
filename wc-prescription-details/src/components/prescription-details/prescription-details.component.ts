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
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  signal,
  Signal,
  SimpleChanges,
  untracked,
  ViewEncapsulation,
  WritableSignal
} from '@angular/core';
import { FormTemplate } from '@smals/vas-evaluation-form-ui-core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DateAdapter } from '@angular/material/core';
import { DateTime } from 'luxon';
import { DOCUMENT, NgFor, NgIf, NgStyle } from '@angular/common';
import {
  DataState,
  EvfTemplate,
  LoadingStatus,
  PerformerTask,
  Person,
  ReadPrescription,
  Role,
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
import { EncryptionService } from '@reuse/code/services/encryption.service';
import { PseudoService } from '@reuse/code/services/pseudo.service';
import { catchError, concatMap, from, map, Observable, of, throwError } from 'rxjs';
import { EncryptionState } from '@reuse/code/states/encryption.state';
import { v4 as uuidv4 } from 'uuid';
import { ApproveProposalDialog } from '@reuse/code/dialogs/approve-proposal/approve-proposal.dialog';
import { CanDuplicatePrescriptionPipe } from '@reuse/code/pipes/can-duplicate-prescription.pipe';
import { DecryptedResponsesState } from '@reuse/code/interfaces/decrypted-responses-state.interface';

interface ViewState {
  prescription: ReadPrescription;
  decryptedResponses: Record<string, any>;
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
        CanRejectAssignationPipe,
        CanTransferAssignationPipe,
        CanSelfAssignPipe,
        CanInterruptTreatmentPipe,
        CanRestartTreatmentPipe,
        CanApproveProposalPipe,
        CanRejectProposalPipe,
        CanExtendPrescriptionPipe,
        CanDuplicatePrescriptionPipe
    ]
})

export class PrescriptionDetailsWebComponent implements OnChanges, OnInit, OnDestroy {
  loading = false;
  printer = false;
  generatedUUID = '';
  responses: Record<string, any> | undefined;
  @HostBinding('attr.lang')
  @Input() lang = 'fr-BE';
  @Input() initialPrescriptionType?: string;
  @Input() prescriptionId!: string;
  @Input() patientSsin?: string;
  @Input() intent!: string;
  @Input() getToken!: (targetClientId?: string) => Token;
  @Output() clickDuplicate = new EventEmitter<ReadPrescription>();
  @Output() clickExtend = new EventEmitter<ReadPrescription>();
  @Output() proposalApproved = new EventEmitter<{ prescriptionId: string }>();
  @Output() proposalRejected = new EventEmitter<boolean>();
  private readonly templateCode$ = computed(() => {
    if (this.intent?.toLowerCase() === 'proposal') {
      return this.proposalSateService.state().data?.templateCode
    }
    return this.prescriptionStateService.state().data?.templateCode
  });
  private readonly tokenClaims$ = toSignal(this.authService.getClaims());
  private readonly isProfessional$ = toSignal(this.authService.isProfessional());
  private readonly decryptedResponses$: WritableSignal<DecryptedResponsesState> = signal({
    data: null,
    error: null,
  });
  readonly viewState$: Signal<DataState<ViewState>> = combineSignalDataState({
    cryptoKey: computed(() => this.encryptionStateService.state()),
    prescription: computed(() => {
      const prescriptionState = this.intent?.toLowerCase() === 'proposal' ? this.proposalSateService.state() : this.prescriptionStateService.state();
      const templateCode = this.templateCode$();
      const cryptoKey = this.encryptionStateService.state().data;
      const template = this.templateVersionsStateService.getState('READ_' + templateCode)()?.data;

      if (!cryptoKey || !template) {
        return {data: prescriptionState.data, status: LoadingStatus.LOADING};
      }

      if (prescriptionState.status !== LoadingStatus.SUCCESS) {
        return prescriptionState;
      }

      const prescription = prescriptionState.data;

      if (template && cryptoKey && prescription?.responses) {
        return {
          ...prescriptionState,
          status: LoadingStatus.SUCCESS,
        };
      }

      return prescriptionState;
    }),
    decryptedResponses: computed(() => {
      const responses = this.decryptedResponses$();
      const prescriptionState = this.intent?.toLowerCase() === 'proposal' ? this.proposalSateService.state() : this.prescriptionStateService.state();

      if (prescriptionState.status === LoadingStatus.SUCCESS && !prescriptionState.data?.pseudomizedKey) {
        return {...responses, error: 'Pseudomized key missing', status: LoadingStatus.ERROR};
      }

      if (responses?.error) {
        return {...responses, status: LoadingStatus.ERROR};
      }

      return responses
        ? {status: LoadingStatus.SUCCESS, data: responses.data}
        : {status: LoadingStatus.LOADING};
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
        ot.performerTasks?.some(pt => pt.careGiverSsin === ssin)
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
      const professional = this.isProfessional$();

      return token
        ? {status: LoadingStatus.SUCCESS, data: {...token, role: professional ? Role.professional : Role.patient}}
        : {status: LoadingStatus.LOADING};
    })
  });

  constructor(
    private translate: TranslateService,
    private dateAdapter: DateAdapter<DateTime>,
    private dialog: MatDialog,
    private authService: AuthService,
    private configService: WcConfigurationService,
    private renderer: Renderer2,
    private accessMatrixStateService: AccessMatrixState,
    private prescriptionStateService: PrescriptionState,
    private proposalSateService: ProposalState,
    private patientStateService: PatientState,
    private templatesStateService: TemplatesState,
    private templateVersionsStateService: TemplateVersionsState,
    private toastService: ToastService,
    private identifyState: IdentifyState,
    private encryptionService: EncryptionService,
    private pseudoService: PseudoService,
    private encryptionStateService: EncryptionState,
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

          if (prescription.pseudomizedKey) {
            this.getPrescriptionKey(prescription.pseudomizedKey)
          }

          this.templateVersionsStateService.loadTemplateVersion('READ_' + prescription.templateCode);
        }


      });
    });

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

    // Register a new effect based on prescription, template and key state changes
    effect(() => {
      const prescription = this.intent?.toLowerCase() === 'proposal' ? this.proposalSateService.state()?.data : this.prescriptionStateService.state()?.data;
      const templateCode = this.templateCode$();
      const cryptoKey = this.encryptionStateService.state().data;
      const template = this.templateVersionsStateService.getState('READ_' + templateCode)()?.data;

      untracked(() => {
        if (template && cryptoKey && prescription?.responses) {
          this.decryptResponses(cryptoKey, prescription.responses, template).subscribe({
            next: (decryptedResponses) => {
              this.decryptedResponses$.set({data: decryptedResponses, error: null});
            },
            error: () => {
              this.decryptedResponses$.set({data: null, error: 'Decryption failed'});
            },
          });
        }
      });
    });
  }

  ngOnInit() {
    this.generatedUUID = uuidv4();
  }

  getAccessToken = () => {
    const e = this.getToken();
    return e.accessToken;
  }

  getIdToken = () => {
    const e = this.getToken();
    return e.idToken;
  }

  getAuthExchangeToken = (targetClientId?: string) => {
    const e = this.getToken(targetClientId);
    return e.getAuthExchangeToken;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['getToken']) {
      this.authService.init(this.getAccessToken, this.getAuthExchangeToken, this.getIdToken);
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
    } else if (this.patientSsin && isSsin(this.patientSsin)) {
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
    if (this.intent?.toLowerCase() === 'proposal') {
      this.loadProposal();
    } else {
      this.loadPrescription();
    }
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

  openApproveProposalDialog(proposal: ReadPrescription): void {
    this.dialog.open(ApproveProposalDialog, {
      data: {
        proposal: proposal
      },
      width: '100vw',
      maxWidth: '500px'
    })
      .beforeClosed()
      .subscribe((data) => {
        if (data?.prescriptionId) {
          this.proposalApproved.next({prescriptionId: data.prescriptionId})
        }
      })
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

  private getPrescriptionTemplateStream(templateCode: string | undefined, templatesState: DataState<EvfTemplate[]>): DataState<EvfTemplate> {
    if (!templateCode || templatesState.status !== LoadingStatus.SUCCESS) {
      return {...templatesState, data: undefined};
    }

    return {
      ...templatesState,
      data: templatesState.data!.find((t) => t.code === templateCode)
    };
  }

  private decryptResponses(
    cryptoKey: CryptoKey,
    responses: Record<string, any>,
    template: FormTemplate
  ): Observable<Record<string, any>> {
    const decryptedResponses: Record<string, any> = {};

    return new Observable(observer => {
      const entries = Object.entries(responses);

      from(entries).pipe(
        concatMap(([key, value]) => {
          const formElement = template.elements.find(e => e.id === key);

          if (formElement?.tags?.includes('freeText')) {
            return this.encryptionService.decryptText(value, cryptoKey).pipe(
              map(decrypted => {
                decryptedResponses[key] = decrypted;
                return decryptedResponses;
              }),
              catchError((error) => {
                return throwError(() => new Error(`Decryption failed for key "${key}": ${error.message}`));
              })
            );
          } else {
            decryptedResponses[key] = value;
            return of(decryptedResponses);
          }
        })
      ).subscribe({
        next: (updatedResponses) => {
          if (Object.keys(updatedResponses).length === entries.length) {
            observer.next(updatedResponses);
            observer.complete();
          }
        },
        error: (err) => {
          observer.error(err);
        }
      });
    });
  }

  async getPrescriptionKey(pseudomizedKey: string): Promise<void> {
    try {
      const pseudoInTransit = this.pseudoService.toPseudonymInTransit(pseudomizedKey);
      const uint8Array = await this.pseudoService.identifyPseudonymInTransit(pseudoInTransit)

      this.encryptionStateService.loadCryptoKey(uint8Array);
    } catch (error) {
      const errorMsg = new Error('Error loading prescription key', {cause: error});
      this.encryptionStateService.setCryptoKeyError(errorMsg)
    }
  }

  handleDuplicateClick() {
    const prescription = this.viewState$().data?.prescription;
    const responses = this.viewState$().data?.decryptedResponses;
    if(prescription && responses) {
      const duplicatedData = {...prescription, responses: responses}
      this.clickDuplicate.emit(duplicatedData)
    }
  }

  handleExtendClick() {
    const prescription = this.viewState$().data?.prescription;
    const responses = this.viewState$().data?.decryptedResponses;
    if(prescription && responses) {
      const duplicatedData = {...prescription, responses: responses}
      this.clickExtend.emit(duplicatedData)
    }
  }

  showRetryButton() {
    const error = this.viewState$().error;

    // Check if error is an object and only has the key "decryptedResponses" and then return false
    return !(error && typeof error === 'object' && Object.keys(error).length === 1 && error.hasOwnProperty('decryptedResponses'));
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

  ngOnDestroy() {
    this.encryptionStateService.resetCryptoKey()
    if(this.intent?.toLowerCase() === 'proposal') {
      this.proposalSateService.resetProposal();
    } else {
      this.prescriptionStateService.resetPrescription();
    }
  }
}
