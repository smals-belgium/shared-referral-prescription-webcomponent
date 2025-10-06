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
  WritableSignal,
} from "@angular/core";
import { FormTemplate } from "@smals/vas-evaluation-form-ui-core";
import { MatDialog } from "@angular/material/dialog";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { DateAdapter } from "@angular/material/core";
import { DateTime } from "luxon";
import { DOCUMENT, NgFor, NgIf, NgStyle } from "@angular/common";
import {
  DataState,
  EvfTemplate,
  IdToken,
  LoadingStatus,
  PerformerTask,
  Person,
  ReadPrescription,
  Role,
  Status,
  UserInfo,
} from "@reuse/code/interfaces";
import { combineSignalDataState } from "@reuse/code/utils/rxjs.utils";
import { AuthService } from "@reuse/code/services/auth.service";
import { AssignPrescriptionDialog } from "@reuse/code/dialogs/assign-prescription/assign-prescription.dialog";
import { CancelMedicalDocumentDialog } from "@reuse/code/dialogs/cancel-prescription/cancel-prescription-dialog.component";
import { StartExecutionPrescriptionDialog } from "@reuse/code/dialogs/start-execution-prescription/start-execution-prescription.dialog";
import { RestartExecutionPrescriptionDialog } from "@reuse/code/dialogs/restart-execution-prescription/restart-execution-prescription.dialog";
import { FinishExecutionPrescriptionDialog } from "@reuse/code/dialogs/finish-execution-prescription/finish-execution-prescription.dialog";
import { CancelExecutionPrescriptionDialog } from "@reuse/code/dialogs/cancel-execution-prescription/cancel-execution-prescription.dialog";
import { CanCancelPrescriptionOrProposalPipe } from "@reuse/code/pipes/can-cancel-prescription-or-proposal.pipe";
import { CanAssignCaregiverPipe } from "@reuse/code/pipes/can-assign-caregiver.pipe";
import { CanRejectAssignationPipe } from "@reuse/code/pipes/can-reject-assignation.pipe";
import { CanTransferAssignationPipe } from "@reuse/code/pipes/can-transfer-assignation.pipe";
import { CanStartTreatmentPipe } from "@reuse/code/pipes/can-start-treatment.pipe";
import { CanRestartTreatmentPipe } from "@reuse/code/pipes/can-restart-treatment.pipe";
import { CanCancelTreatmentPipe } from "@reuse/code/pipes/can-cancel-treatment.pipe";
import { CanFinishTreatmentPipe } from "@reuse/code/pipes/can-finish-treatment.pipe";
import { CanSelfAssignPipe } from "@reuse/code/pipes/can-self-assign.pipe";
import { CanInterruptTreatmentPipe } from "@reuse/code/pipes/can-interrupt-treatment.pipe";
import { TemplateNamePipe } from "@reuse/code/pipes/template-name.pipe";
import { FormatNihdiPipe } from "@reuse/code/pipes/format-nihdi.pipe";
import { FormatSsinPipe } from "@reuse/code/pipes/format-ssin.pipe";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { IfStatusSuccessDirective } from "@reuse/code/directives/if-status-success.directive";
import { IfStatusErrorDirective } from "@reuse/code/directives/if-status-error.directive";
import { OverlaySpinnerComponent } from "@reuse/code/components/overlay-spinner/overlay-spinner.component";
import { IfStatusLoadingDirective } from "@reuse/code/directives/if-status-loading.directive";
import { ErrorCardComponent } from "@reuse/code/components/error-card/error-card.component";
import { DatePipe } from "@reuse/code/pipes/date.pipe";
import { PrescriptionState } from "@reuse/code/states/prescription.state";
import { TemplatesState } from "@reuse/code/states/templates.state";
import { TemplateVersionsState } from "@reuse/code/states/template-versions.state";
import { AccessMatrixState } from "@reuse/code/states/access-matrix.state";
import { toSignal } from "@angular/core/rxjs-interop";
import { PatientState } from "@reuse/code/states/patient.state";
import { TransferAssignationDialog } from "@reuse/code/dialogs/transfer-assignation/transfer-assignation.dialog";
import { ToastService } from "@reuse/code/services/toast.service";
import { RejectAssignationDialog } from "@reuse/code/dialogs/reject-assignation/reject-assignation.dialog";
import { InterruptExecutionPrescriptionDialog } from "@reuse/code/dialogs/interrupt-execution-prescription/interrupt-execution-prescription.dialog";
import { CanApproveProposalPipe } from "@reuse/code/pipes/can-approve-proposal.pipe";
import { CanRejectProposalPipe } from "@reuse/code/pipes/can-reject-proposal.pipe";
import { RejectProposalDialog } from "@reuse/code/dialogs/reject-proposal/reject-proposal.dialog";
import { CanExtendPrescriptionPipe } from "@reuse/code/pipes/can-extend-prescription.pipe";
import { IdentifyState } from "@reuse/code/states/identify.state";
import { ProposalState } from "@reuse/code/states/proposal.state";
import {
  isPrescription,
  isPrescriptionId,
  isPrescriptionShortCode,
  isProposal,
  isSsin,
  validateSsinChecksum,
} from "@reuse/code/utils/utils";
import { EncryptionService } from "@reuse/code/services/encryption.service";
import { PseudoService } from "@reuse/code/services/pseudo.service";
import {
  BehaviorSubject,
  catchError,
  concatMap,
  from,
  map,
  Observable,
  of,
  throwError,
} from "rxjs";
import { EncryptionState } from "@reuse/code/states/encryption.state";
import { v4 as uuidv4 } from "uuid";
import { ApproveProposalDialog } from "@reuse/code/dialogs/approve-proposal/approve-proposal.dialog";
import { CanDuplicatePrescriptionPipe } from "@reuse/code/pipes/can-duplicate-prescription.pipe";
import { DecryptedResponsesState } from "@reuse/code/interfaces/decrypted-responses-state.interface";
import { FormatMultilingualObjectPipe } from "@reuse/code/pipes/format-multilingual-object.pipe";
import { PssService } from "@reuse/code/services/pss.service";
import { MatTooltip } from "@angular/material/tooltip";
import { ProfessionalDisplayComponent } from "@reuse/code/components/professional-display/professional-display.component";

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
  standalone: true,
  templateUrl: "./prescription-details.component.html",
  styleUrls: ["./prescription-details.component.scss"],
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
    CanDuplicatePrescriptionPipe,
    FormatMultilingualObjectPipe,
    MatTooltip,
    ProfessionalDisplayComponent,
  ],
})
export class PrescriptionDetailsWebComponent
  implements OnChanges, OnInit, OnDestroy
{
  protected readonly isProposal = isProposal;

  loading = false;
  printer = false;
  generatedUUID = "";
  responses: Record<string, any> | undefined;
  currentLang?: string;
  isProposalValue = false;

  public status$ = new BehaviorSubject<boolean>(false);

  @HostBinding("attr.lang")
  @Input()
  lang = "fr-BE";
  @Input() initialPrescriptionType?: string;
  @Input() prescriptionId!: string;
  @Input() patientSsin?: string;
  @Input() intent!: string;
  @Input() services!: {
    getAccessToken: (audience?: string) => Promise<string | null>;
    getIdToken: () => IdToken;
  };
  @Output() clickDuplicate = new EventEmitter<ReadPrescription>();
  @Output() clickExtend = new EventEmitter<ReadPrescription>();
  @Output() proposalApproved = new EventEmitter<{ prescriptionId: string }>();
  @Output() proposalRejected = new EventEmitter<boolean>();
  private readonly templateCode$ = computed(() => {
    if (isProposal(this.intent)) {
      return this.proposalSateService.state().data?.templateCode;
    }
    return this.prescriptionStateService.state().data?.templateCode;
  });
  private readonly tokenClaims$ = toSignal(this.authService.getClaims());
  protected readonly isProfessional$ = toSignal(
    this.authService.isProfessional(),
  );
  protected readonly discipline$ = toSignal(this.authService.discipline());
  private readonly decryptedResponses$: WritableSignal<DecryptedResponsesState> =
    signal({
      data: null,
      error: null,
    });
  readonly viewState$: Signal<DataState<ViewState>> = combineSignalDataState({
    cryptoKey: computed(() => this.encryptionStateService.state()),
    prescription: computed(() => {
      const prescriptionState = isProposal(this.intent)
        ? this.proposalSateService.state()
        : this.prescriptionStateService.state();
      const templateCode = this.templateCode$();
      const cryptoKey = this.encryptionStateService.state().data;
      const template = this.templateVersionsStateService.getState(
        "READ_" + templateCode,
      )()?.data;
      const cryptoKeyIsNeeded =
        !cryptoKey && prescriptionState.data?.pseudonymizedKey;
      this.loadPssStatus(templateCode!);

      if (cryptoKeyIsNeeded || !template) {
        return { data: prescriptionState.data, status: LoadingStatus.LOADING };
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
      const prescriptionState = isProposal(this.intent)
        ? this.proposalSateService.state()
        : this.prescriptionStateService.state();
      //Futur improvment :  make more generic for proposal with free text (physio) - https://jira.smals.be/browse/UHMEP-2166
      const needsPseudonymizedKey =
        (prescriptionState.data?.responses &&
          prescriptionState.data.templateCode != "ANNEX_81") ||
        prescriptionState.data?.responses["note"];

      if (
        prescriptionState.status === LoadingStatus.SUCCESS &&
        !prescriptionState.data?.pseudonymizedKey &&
        needsPseudonymizedKey
      ) {
        return {
          ...responses,
          error: "Pseudonymized key missing",
          status: LoadingStatus.ERROR,
        };
      }

      if (responses?.error) {
        return { ...responses, status: LoadingStatus.ERROR };
      }

      return responses
        ? { status: LoadingStatus.SUCCESS, data: responses.data }
        : { status: LoadingStatus.LOADING };
    }),
    patient: computed(() => {
      const patientState = this.patientStateService.state();
      const identifyState = this.identifyState.state();
      const ssin = identifyState.data;
      const professional = this.isProfessional$();
      const userProfile = this.tokenClaims$()?.["userProfile"];

      if (professional) {
        const person = {
          ...patientState.data,
          ssin: ssin,
        };
        return { ...patientState, data: person };
      }

      const person = {
        ...userProfile,
        ssin: ssin,
      };
      return { ...identifyState, data: person };
    }),
    performerTask: computed(() => {
      const state = isProposal(this.intent)
        ? this.proposalSateService.state()
        : this.prescriptionStateService.state();
      const ssin = this.tokenClaims$()?.["userProfile"]["ssin"];
      if (!ssin || state.status !== LoadingStatus.SUCCESS) {
        return state;
      }

      const directPerformerTask = state.data!.performerTasks?.find(
        (t) => t.careGiverSsin === ssin,
      );
      if (directPerformerTask) {
        return { ...state, data: directPerformerTask };
      }

      const organizationTask = state.data!.organizationTasks?.find((ot) =>
        ot.performerTasks?.some((pt) => pt.careGiverSsin === ssin),
      );
      const nestedPerformerTask = organizationTask?.performerTasks.find(
        (t) => t.careGiverSsin === ssin,
      );

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
        ? this.templateVersionsStateService.getState("READ_" + templateCode)()
        : { status: LoadingStatus.LOADING };
    }),
    currentUser: computed(() => {
      const token = this.tokenClaims$()?.["userProfile"];
      const professional = this.isProfessional$();
      const discipline = this.discipline$();

      return token
        ? {
            status: LoadingStatus.SUCCESS,
            data: {
              ...token,
              role: professional ? Role.professional : Role.patient,
              discipline: discipline,
            },
          }
        : { status: LoadingStatus.LOADING };
    }),
  });

  constructor(
    private readonly translate: TranslateService,
    private readonly dateAdapter: DateAdapter<DateTime>,
    private readonly dialog: MatDialog,
    private readonly authService: AuthService,
    private readonly renderer: Renderer2,
    private readonly accessMatrixStateService: AccessMatrixState,
    private readonly prescriptionStateService: PrescriptionState,
    private readonly proposalSateService: ProposalState,
    private readonly patientStateService: PatientState,
    private readonly templatesStateService: TemplatesState,
    private readonly templateVersionsStateService: TemplateVersionsState,
    private readonly toastService: ToastService,
    private readonly identifyState: IdentifyState,
    private readonly encryptionService: EncryptionService,
    private readonly pseudoService: PseudoService,
    private readonly pssService: PssService,
    private readonly encryptionStateService: EncryptionState,
    @Inject(DOCUMENT) private readonly _document: Document,
  ) {
    this.currentLang = this.translate.currentLang;
    this.translate.setDefaultLang("fr-BE");

    if (!this.currentLang) {
      this.translate.use("fr-BE");
      this.dateAdapter.setLocale("fr-BE");
    }

    this.loadWebComponents();

    // Register a new effect based on prescription state changes
    effect(() => {
      const prescription = isProposal(this.intent)
        ? this.proposalSateService.state()?.data
        : this.prescriptionStateService.state()?.data;

      untracked(() => {
        if (prescription) {
          if (prescription.patientIdentifier) {
            this.identifyState.loadSSIN(prescription.patientIdentifier);
          }

          if (prescription.pseudonymizedKey) {
            this.getPrescriptionKey(prescription.pseudonymizedKey);
          }

          this.templateVersionsStateService.loadTemplateVersion(
            "READ_" + prescription.templateCode,
          );
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
      const prescription = isProposal(this.intent)
        ? this.proposalSateService.state()?.data
        : this.prescriptionStateService.state()?.data;
      const templateCode = this.templateCode$();
      const cryptoKey = this.encryptionStateService.state().data;
      const template = this.templateVersionsStateService.getState(
        "READ_" + templateCode,
      )()?.data;

      untracked(() => {
        if (
          !template ||
          (!cryptoKey && templateCode !== "ANNEX_81") ||
          (prescription?.responses["note"] &&
            !cryptoKey &&
            templateCode === "ANNEX_81")
        ) {
          return;
        }
        if (prescription?.responses) {
          this.decryptResponses(
            prescription.responses,
            template,
            cryptoKey,
          ).subscribe({
            next: (decryptedResponses) => {
              this.decryptedResponses$.set({
                data: decryptedResponses,
                error: null,
              });
            },
            error: () => {
              this.decryptedResponses$.set({
                data: null,
                error: "Decryption failed",
              });
            },
          });
        }
      });
    });
  }

  ngOnInit() {
    this.generatedUUID = uuidv4();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes["services"]) {
      this.authService.init(
        this.services.getAccessToken,
        this.services.getIdToken,
      );
      this.accessMatrixStateService.loadAccessMatrix();
      this.templatesStateService.loadTemplates();
    }
    if (changes["lang"]) {
      this.dateAdapter.setLocale(this.lang);
      this.translate.use(this.lang);
    }
    if (changes["prescriptionId"] || changes["patientSsin"]) {
      this.loadPrescriptionOrProposal();
    }
  }

  private loadPssStatus(templateCode: string) {
    if (templateCode === "ANNEX_82") {
      this.pssService.getPssStatus().subscribe({
        next: (status) => {
          this.status$.next(status);
        },
        error: () => {
          this.pssService.setStatus(false);
        },
      });
    }
  }

  loadProposal() {
    if (isPrescriptionId(this.prescriptionId)) {
      this.proposalSateService.loadProposal(this.prescriptionId);
    } else if (this.patientSsin && isSsin(this.patientSsin)) {
      this.toastService.show("proposals.errors.invalidUUID");
    }
  }

  loadPrescription(): void {
    if (isPrescriptionId(this.prescriptionId)) {
      this.prescriptionStateService.loadPrescription(this.prescriptionId);
    } else if (this.patientSsin && isSsin(this.patientSsin)) {
      if (!validateSsinChecksum(this.patientSsin)) {
        this.toastService.show("prescription.errors.invalidSsinChecksum");
        return;
      }

      if (!isPrescriptionShortCode(this.prescriptionId)) {
        this.toastService.show("prescription.errors.invalidShortCode");
        return;
      }

      this.getPatientIdentifier(this.patientSsin).then((identifier) => {
        this.prescriptionStateService.loadPrescriptionByShortCode(
          this.prescriptionId,
          identifier,
        );
      });
    }
  }

  loadPrescriptionOrProposal(): void {
    this.isProposalValue = isProposal(this.intent);
    if (this.isProposalValue) {
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
        assignedCareGivers: prescription.performerTasks?.map(
          (c) => c.careGiverSsin,
        ),
        assignedOrganizations: prescription.organizationTasks?.map(
          (o) => o.organizationNihdi,
        ),
        category: prescription.category,
        intent: prescription.intent,
      },
      width: "100vw",
      maxWidth: "750px",
      maxHeight: "100vh",
    });
  }

  openTransferAssignationDialog(
    prescription: ReadPrescription,
    task: PerformerTask,
  ): void {
    this.dialog.open(TransferAssignationDialog, {
      data: {
        prescriptionId: prescription.id,
        referralTaskId: prescription.referralTask.id,
        performerTaskId: task.id,
        assignedCareGivers: prescription.performerTasks?.map(
          (c) => c.careGiverSsin,
        ),
        category: prescription.category,
        intent: prescription.intent,
      },
      width: "100vw",
      maxWidth: "750px",
      maxHeight: "100vh",
    });
  }

  openCancelPrescriptionDialog(
    prescription: ReadPrescription,
    patient: Person,
  ): void {
    this.dialog.open(CancelMedicalDocumentDialog, {
      data: {
        prescription,
        patient,
      },
      width: "100vw",
      maxWidth: "500px",
    });
  }

  openStartExecutionDialog(
    prescription: ReadPrescription,
    task?: PerformerTask,
  ): void {
    this.dialog.open(StartExecutionPrescriptionDialog, {
      data: {
        prescription: prescription,
        performerTask: task,
        startExecutionDate: task?.executionPeriod?.start,
      },
      minWidth: "320px",
    });
  }

  openRestartExecutionDialog(
    prescription: ReadPrescription,
    task: PerformerTask,
    patient: Person,
  ): void {
    this.dialog.open(RestartExecutionPrescriptionDialog, {
      data: {
        prescription: prescription,
        performerTask: task,
        patient: patient,
      },
      minWidth: "320px",
    });
  }

  openFinishExecutionDialog(
    prescription: ReadPrescription,
    task: PerformerTask,
  ): void {
    this.dialog.open(FinishExecutionPrescriptionDialog, {
      data: {
        prescription: prescription,
        performerTask: task,
        startExecutionDate: task.executionPeriod?.start,
      },
      minWidth: "320px",
    });
  }

  openCancelExecutionDialog(
    prescription: ReadPrescription,
    task: PerformerTask,
    patient: Person,
  ): void {
    this.dialog.open(CancelExecutionPrescriptionDialog, {
      data: {
        prescription: prescription,
        performerTask: task,
        patient: patient,
      },
      width: "100vw",
      maxWidth: "500px",
    });
  }

  openInterruptExecutionDialog(
    prescription: ReadPrescription,
    task: PerformerTask,
    patient: Person,
  ): void {
    this.dialog.open(InterruptExecutionPrescriptionDialog, {
      data: {
        prescription: prescription,
        performerTask: task,
        patient: patient,
      },
      width: "100vw",
      maxWidth: "500px",
    });
  }

  openRejectAssignationDialog(
    prescription: ReadPrescription,
    task: PerformerTask,
    patient: Person,
  ): void {
    this.dialog.open(RejectAssignationDialog, {
      data: {
        prescription: prescription,
        performerTask: task,
        patient: patient,
      },
      width: "100vw",
      maxWidth: "500px",
    });
  }

  onSelfAssign(prescription: ReadPrescription, currentUser: UserInfo): void {
    this.loading = true;
    const ssin = currentUser.ssin;
    const discipline = currentUser.discipline;
    if (isPrescription(prescription.intent?.toString())) {
      this.selfAssign(
        () =>
          this.prescriptionStateService.assignPrescriptionToMe(
            prescription.id,
            prescription.referralTask.id,
            { ssin, discipline },
            this.generatedUUID,
          ),
        "prescription",
      );
    } else {
      this.selfAssign(
        () =>
          this.proposalSateService.assignProposalToMe(
            prescription.id,
            prescription.referralTask.id,
            { ssin, discipline },
            this.generatedUUID,
          ),
        "proposal",
      );
    }
  }

  private selfAssign(
    serviceCall: () => Observable<void>,
    successPrefix: string,
  ) {
    serviceCall().subscribe({
      next: () => {
        this.loading = false;
        this.toastService.show(successPrefix + ".assignPerformer.meSuccess");
      },
      error: () => {
        this.loading = false;
        this.toastService.showSomethingWentWrong();
      },
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
    if (
      status === Status.BLACKLISTED ||
      status === Status.CANCELLED ||
      status === Status.EXPIRED
    ) {
      return "red";
    } else if (status === Status.PENDING) {
      return "orange";
    } else if (status === Status.IN_PROGRESS) {
      return "#40c4ff";
    } else if (status === Status.DONE) {
      return "limegreen";
    } else {
      return "lightgrey";
    }
  }

  openApproveProposalDialog(proposal: ReadPrescription): void {
    this.dialog
      .open(ApproveProposalDialog, {
        data: {
          proposal: proposal,
        },
        width: "100vw",
        maxWidth: "500px",
      })
      .beforeClosed()
      .subscribe((data) => {
        if (data?.prescriptionId) {
          this.proposalApproved.next({ prescriptionId: data.prescriptionId });
        }
      });
  }

  openRejectProposalDialog(proposal: ReadPrescription): void {
    this.dialog.open(RejectProposalDialog, {
      data: {
        proposal: proposal,
      },
      width: "100vw",
      maxWidth: "500px",
    });
  }

  private getPrescriptionTemplateStream(
    templateCode: string | undefined,
    templatesState: DataState<EvfTemplate[]>,
  ): DataState<EvfTemplate> {
    if (!templateCode || templatesState.status !== LoadingStatus.SUCCESS) {
      return { ...templatesState, data: undefined };
    }

    return {
      ...templatesState,
      data: templatesState.data!.find((t) => t.code === templateCode),
    };
  }

  private decryptResponses(
    responses: Record<string, any>,
    template: FormTemplate,
    cryptoKey?: CryptoKey,
  ): Observable<Record<string, any>> {
    const decryptedResponses: Record<string, any> = {};

    return new Observable((observer) => {
      const entries = Object.entries(responses);

      from(entries)
        .pipe(
          concatMap(([key, value]) => {
            const formElement = template.elements.find((e) => e.id === key);

            if (formElement?.tags?.includes("freeText")) {
              if (!cryptoKey) {
                return throwError(
                  () => new Error(`Pseudo key is missing for key "${key}"`),
                );
              }
              return this.encryptionService.decryptText(value, cryptoKey).pipe(
                map((decrypted) => {
                  decryptedResponses[key] = decrypted;
                  return decryptedResponses;
                }),
                catchError((error) => {
                  return throwError(
                    () =>
                      new Error(
                        `Decryption failed for key "${key}": ${error.message}`,
                      ),
                  );
                }),
              );
            } else {
              decryptedResponses[key] = value;
              return of(decryptedResponses);
            }
          }),
        )
        .subscribe({
          next: (updatedResponses) => {
            if (Object.keys(updatedResponses).length === entries.length) {
              observer.next(updatedResponses);
              observer.complete();
            }
          },
          error: (err) => {
            observer.error(err);
          },
        });
    });
  }

  async getPrescriptionKey(pseudonymizedKey: string): Promise<void> {
    try {
      const pseudoInTransit =
        this.pseudoService.toPseudonymInTransit(pseudonymizedKey);
      if (pseudoInTransit) {
        const uint8Array =
          await this.pseudoService.identifyPseudonymInTransit(pseudoInTransit);
        this.encryptionStateService.loadCryptoKey(uint8Array);
      }
    } catch (error) {
      const errorMsg = new Error("Error loading prescription key", {
        cause: error,
      });
      this.encryptionStateService.setCryptoKeyError(errorMsg);
    }
  }

  handleDuplicateClick() {
    const prescription = this.viewState$().data?.prescription;
    const responses = this.viewState$().data?.decryptedResponses;
    if (prescription && responses) {
      const duplicatedData = { ...prescription, responses: responses };
      this.clickDuplicate.emit(duplicatedData);
    }
  }

  handleExtendClick() {
    const prescription = this.viewState$().data?.prescription;
    const responses = this.viewState$().data?.decryptedResponses;
    if (prescription && responses) {
      const duplicatedData = { ...prescription, responses: responses };
      this.clickExtend.emit(duplicatedData);
    }
  }

  showRetryButton() {
    const error = this.viewState$().error;

    // Check if error is an object and only has the key "decryptedResponses" and then return false
    return !(
      error &&
      typeof error === "object" &&
      Object.keys(error).length === 1 &&
      error.hasOwnProperty("decryptedResponses")
    );
  }

  private loadPrintWebComponent(): void {
    if (customElements.get("nihdi-referral-prescription-pdf") != undefined) {
      return;
    }

    const htmlCollection = document.getElementsByTagName("script");
    const script = Array.from(htmlCollection).find((e) =>
      e.src.includes("wc-prescription-details.js"),
    );

    if (!script) return;
    const url = script.src.replace("wc-prescription-details.js", "");

    const scripts = ["assets/pdfmake/pdfmake.js"];
    scripts.forEach((src) => {
      const script = this.renderer.createElement("script") as HTMLScriptElement;
      script.type = `text/javascript`;
      script.src = url + src;
      script.type = "module";
      this.renderer.appendChild(this._document.body, script);
    });
  }

  private loadWebComponents(): void {
    if (
      customElements.get("nihdi-referral-prescription-form-details") !=
      undefined
    ) {
      return;
    }
    const htmlCollection = document.getElementsByTagName("script");
    const script = Array.from(htmlCollection).find((e) =>
      e.src.includes("wc-prescription-details.js"),
    );

    if (!script) return;
    const url = script.src.replace("wc-prescription-details.js", "");

    const scripts = ["assets/evf-form-details/evf-form-details.js"];
    scripts.forEach((src) => {
      const script = this.renderer.createElement("script") as HTMLScriptElement;
      script.type = `text/javascript`;
      script.src = url + src;
      script.type = "module";
      this.renderer.appendChild(this._document.body, script);
    });
  }

  private getPatientIdentifier(identifier: string): Promise<string> {
    return this.pseudoService.pseudonymize(identifier);
  }

  ngOnDestroy() {
    this.printer = false;
    this.encryptionStateService.resetCryptoKey();
    if (isProposal(this.intent)) {
      this.proposalSateService.resetProposal();
    } else {
      this.prescriptionStateService.resetPrescription();
    }
  }
}
