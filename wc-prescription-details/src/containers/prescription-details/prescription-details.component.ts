import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  effect,
  EventEmitter,
  HostBinding,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  signal,
  Signal,
  SimpleChanges,
  untracked,
  ViewEncapsulation,
  WritableSignal,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DateAdapter } from '@angular/material/core';
import { DateTime } from 'luxon';
import { AlertType, DataState, UserInfo } from '@reuse/code/interfaces';
import { combineSignalDataState } from '@reuse/code/utils/rxjs.utils';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { CancelPrescriptionDialog } from '@reuse/code/dialogs/cancel-prescription/cancel-prescription-dialog.component';
import { TemplateNamePipe } from '@reuse/code/pipes/template-name.pipe';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { IfStatusSuccessDirective } from '@reuse/code/directives/if-status-success.directive';
import { IfStatusErrorDirective } from '@reuse/code/directives/if-status-error.directive';
import { OverlaySpinnerComponent } from '@reuse/code/components/progress-indicators/overlay-spinner/overlay-spinner.component';
import { IfStatusLoadingDirective } from '@reuse/code/directives/if-status-loading.directive';
import { AlertComponent } from '@reuse/code/components/alert-component/alert.component';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { TemplatesState } from '@reuse/code/states/api/templates.state';
import { TemplateVersionsState } from '@reuse/code/states/api/template-versions.state';
import { AccessMatrixState } from '@reuse/code/states/api/access-matrix.state';
import { PatientState } from '@reuse/code/states/api/patient.state';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { CanExtendPrescriptionPipe } from '@reuse/code/pipes/can-extend-prescription.pipe';
import { IdentifyState } from '@reuse/code/states/privacy/identify.state';
import { ProposalState } from '@reuse/code/states/api/proposal.state';
import {
  isPrescriptionId,
  isPrescriptionShortCode,
  isProposal,
  isSsin,
  validateSsinChecksum,
} from '@reuse/code/utils/utils';
import { EncryptionService } from '@reuse/code/services/privacy/encryption.service';
import { PseudoService } from '@reuse/code/services/privacy/pseudo.service';
import {
  BehaviorSubject,
  catchError,
  concatMap,
  EMPTY,
  from,
  map,
  Observable,
  of,
  Subscription,
  switchMap,
  throwError,
} from 'rxjs';
import { EncryptionState } from '@reuse/code/states/privacy/encryption.state';
import { v4 as uuidv4 } from 'uuid';
import { CanDuplicatePrescriptionPipe } from '@reuse/code/pipes/can-duplicate-prescription.pipe';
import { DecryptedResponsesState } from '@reuse/code/interfaces/decrypted-responses-state.interface';
import { PssService } from '@reuse/code/services/api/pss.service';
import {
  PerformerTaskResource,
  PersonResource,
  ReadRequestResource,
  RequestStatus,
  Template,
  TemplateVersion,
} from '@reuse/code/openapi';
import { HttpErrorResponse } from '@angular/common/http';
import { MatChip } from '@angular/material/chips';
import { EvfLabelPipe, EvfTranslateService, FormTemplate, FormTranslations } from '@smals/vas-evaluation-form-ui-core';
import { PrescriptionsPdfService } from '@reuse/code/services/helpers/prescription-pdf.service';
import { PrescriptionDetailsMainComponent } from '../../components/prescription-details-main/prescription-details-main.component';
import { PrescriptionDetailsSecondaryComponent } from '../../components/prescription-details-secondary/prescription-details-secondary.component';
import {
  DetailsServices,
  PrescriptionDetailsSecondaryService,
} from '../../components/prescription-details-secondary/prescription-details-secondary.service';
import { PrescriptionDetailsBottomComponent } from '../../components/prescription-details-bottom/prescription-details-bottom.component';
import { DeviceService } from '@reuse/code/services/helpers/device.service';
import { MatMenuItem, MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatDivider } from '@angular/material/divider';
import { CanCancelPrescriptionOrProposalPipe } from '@reuse/code/pipes/can-cancel-prescription-or-proposal.pipe';
import { handleMissingTranslationFile } from '@reuse/code/utils/translation.utils';
import { Lang } from '@reuse/code/interfaces/lang.enum';
import { tap } from 'rxjs/operators';
import { mapDisplayStatusToColor } from '@reuse/code/utils/request-status-display-map.utils';

export interface ViewState {
  prescription: ReadRequestResource;
  decryptedResponses?: Record<string, unknown>;
  patient: PersonResource;
  performerTask?: PerformerTaskResource;
  template?: Template;
  templateVersion: TemplateVersion;
  currentUser: Partial<UserInfo>;
}

@Component({
  templateUrl: './prescription-details.component.html',
  styleUrls: ['./prescription-details.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    IfStatusLoadingDirective,
    OverlaySpinnerComponent,
    AlertComponent,
    IfStatusErrorDirective,
    IfStatusSuccessDirective,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    TemplateNamePipe,
    CanExtendPrescriptionPipe,
    CanDuplicatePrescriptionPipe,
    CanCancelPrescriptionOrProposalPipe,
    MatChip,
    EvfLabelPipe,
    PrescriptionDetailsMainComponent,
    PrescriptionDetailsSecondaryComponent,
    PrescriptionDetailsBottomComponent,
    MatMenuModule,
    MatMenuTrigger,
    MatMenuItem,
    MatDivider,
  ],
  providers: [EvfTranslateService],
  standalone: true,
})
export class PrescriptionDetailsWebComponent implements OnChanges, OnInit, OnDestroy {
  private readonly _translate = inject(TranslateService);
  private readonly _dateAdapter = inject(DateAdapter<DateTime>);
  private readonly _dialog = inject(MatDialog);
  private readonly _authService = inject(AuthService);
  private readonly _accessMatrixStateService = inject(AccessMatrixState);
  private readonly _prescriptionStateService = inject(PrescriptionState);
  private readonly _proposalSateService = inject(ProposalState);
  private readonly _patientStateService = inject(PatientState);
  private readonly _templatesStateService = inject(TemplatesState);
  private readonly _templateVersionsStateService = inject(TemplateVersionsState);
  private readonly _toastService = inject(ToastService);
  private readonly _identifyState = inject(IdentifyState);
  private readonly _encryptionService = inject(EncryptionService);
  private readonly _pseudoService = inject(PseudoService);
  private readonly _pssService = inject(PssService);
  private readonly _encryptionStateService = inject(EncryptionState);
  private readonly _prescriptionsPdfService = inject(PrescriptionsPdfService);
  private readonly _prescriptionSecondaryService = inject(PrescriptionDetailsSecondaryService);
  protected readonly evfTranslateService = inject(EvfTranslateService);
  protected readonly deviceService = inject(DeviceService);

  @HostBinding('attr.lang')
  @Input()
  lang = Lang.FR;
  @Input() initialPrescriptionType?: string;
  @Input() prescriptionId!: string;
  @Input() patientSsin?: string;
  @Input() intent!: string;
  @Input() services!: DetailsServices;

  @Output() clickDuplicate = new EventEmitter<ReadRequestResource>();
  @Output() clickExtend = new EventEmitter<ReadRequestResource>();
  @Output() clickPrint = new EventEmitter<Blob>();
  @Output() proposalApproved = this._prescriptionSecondaryService.proposalApproved;
  @Output() proposalRejected = this._prescriptionSecondaryService.proposalsRejected;

  private readonly templateCode$ = this._prescriptionSecondaryService.templateCode$;
  protected readonly isProfessional$ = this._prescriptionSecondaryService.isProfessional$;
  private readonly decryptedResponses$: WritableSignal<DecryptedResponsesState> =
    this._prescriptionSecondaryService.decryptedResponses$;

  readonly viewState$: Signal<DataState<ViewState>> = combineSignalDataState({
    cryptoKey: computed(() => this._prescriptionSecondaryService.getCryptoKey()),
    prescription: computed(() => this._prescriptionSecondaryService.getPrescription()),
    decryptedResponses: computed(() => this._prescriptionSecondaryService.getDecryptedResponses()),
    patient: computed(() => this._prescriptionSecondaryService.getPatient()),
    performerTask: computed(() => this._prescriptionSecondaryService.getPerformerTask()),
    template: computed(() => this._prescriptionSecondaryService.getTemplate()),
    templateVersion: computed(() => this._prescriptionSecondaryService.getTemplateVersion()),
    currentUser: computed(() => this._prescriptionSecondaryService.getCurrentUser()),
  });

  loading: WritableSignal<boolean> = this._prescriptionSecondaryService.loading;
  generatedUUID = this._prescriptionSecondaryService.generatedUUID;
  currentLang = this._prescriptionSecondaryService.currentLang;
  protected langAlertData: WritableSignal<{ title: string; body: string } | null> = signal(null);

  private readonly _subscriptions: Subscription = new Subscription();
  private readonly _languageChange = new BehaviorSubject<string>(this._translate.currentLang ?? Lang.FR);

  protected readonly AlertType = AlertType;

  isProposalValue = false;

  constructor() {
    this.currentLang.set(this._translate.currentLang);
    this._translate.setDefaultLang(Lang.FR);

    if (!this.currentLang()) {
      this._translate.use(Lang.FR);
      this._dateAdapter.setLocale(Lang.FR);
      this.currentLang.set(this._translate.currentLang);
    }

    // Register a new effect based on prescription state changes
    effect(() => {
      const prescription = isProposal(this.intent)
        ? this._proposalSateService.state()?.data
        : this._prescriptionStateService.state()?.data;

      untracked(() => {
        if (prescription) {
          if (prescription.patientIdentifier) {
            this._identifyState.loadSSIN(prescription.patientIdentifier);
          }

          if (prescription.pseudonymizedKey) {
            void this.getPrescriptionKey(prescription.pseudonymizedKey);
          }

          const instanceId = prescription.id || uuidv4();
          this._templateVersionsStateService.loadTemplateVersionForInstance(
            instanceId,
            'READ_' + prescription.templateCode
          );
        }
      });
    });

    // Register a new effect based on identify state changes
    effect(() => {
      const ssin = this._identifyState.state()?.data;

      untracked(() => {
        if (ssin) {
          const professional = this.isProfessional$();
          if (professional) {
            this._patientStateService.loadPatient(ssin.toString());
          }
        }
      });
    });

    // Register a new effect based on prescription, template and key state changes
    effect(() => {
      const prescription = isProposal(this.intent)
        ? this._proposalSateService.state()?.data
        : this._prescriptionStateService.state()?.data;
      const templateCode = this.templateCode$();
      const cryptoKey = this._encryptionStateService.state().data;
      const template = this._templateVersionsStateService.getState('READ_' + templateCode)()?.data;

      untracked(() => {
        //Futur improvment :  make more generic for proposal with free text (physio) - https://jira.smals.be/browse/UHMEP-2166
        const missingCryptoKey = !cryptoKey;
        const isAnnex81 = templateCode === 'ANNEX_81';
        const hasNoteResponse = Boolean(prescription?.responses?.['note']);

        if (!template || (missingCryptoKey && (!isAnnex81 || hasNoteResponse))) {
          return;
        }
        if (prescription?.responses) {
          this.decryptResponses(prescription.responses, template, cryptoKey).subscribe({
            next: decryptedResponses => {
              this.decryptedResponses$.set({ data: decryptedResponses, error: undefined });
            },
            error: () => {
              this.decryptedResponses$.set({ data: undefined, error: { decryptedResponses: 'Decryption failed' } });
            },
          });
        }
        if (template) {
          this.evfTranslateService.addTranslations(template.translations as FormTranslations);
        }
      });
    });

    // Register a new effect based templateCode
    effect(() => {
      const templateCode = this.templateCode$();
      if (templateCode) {
        this.loadPssStatus(templateCode);
      }
    });
  }

  get prescriptionHttpError(): HttpErrorResponse | undefined {
    const error = this.viewState$()?.error?.prescription;

    if (typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number') {
      return error as HttpErrorResponse;
    }

    return undefined;
  }

  ngOnInit() {
    this.generatedUUID.set(uuidv4());
    this.evfTranslateService.setDefaultLang('fr');

    this._subscriptions.add(
      this._languageChange
        .pipe(
          tap(lang => this._dateAdapter.setLocale(lang)),
          switchMap(lang => {
            return this._translate.use(lang).pipe(
              catchError(() => {
                handleMissingTranslationFile(this.langAlertData, lang);
                return EMPTY;
              })
            );
          })
        )
        .subscribe({
          next: () => {
            this.langAlertData.set(null);
            this._translate.use(this.lang);
            const formattedLang = this.formatToEvfLangCode(this.lang);
            this.evfTranslateService.setCurrentLang(formattedLang);
            this._prescriptionSecondaryService.currentLang.set(formattedLang);
          },
        })
    );
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['services']) {
      this._authService.init(this.services.getAccessToken, this.services.getIdToken);
      this._accessMatrixStateService.loadAccessMatrix();
      this._templatesStateService.loadTemplates();
      this._prescriptionSecondaryService.services = this.services;
    }
    if (changes['lang']) {
      const currentLang: string = (changes['lang'].currentValue ?? '') as string;
      this._languageChange.next(currentLang);
    }

    if (changes['prescriptionId'] || changes['patientSsin']) {
      this.loadPrescriptionOrProposal();
    }

    if (changes['intent']) {
      this._prescriptionSecondaryService.intent.set(this.intent);
    }
  }

  private loadPssStatus(templateCode: string) {
    if (templateCode === 'ANNEX_82') {
      this._pssService.getPssStatus().subscribe({
        next: status => {
          this._prescriptionSecondaryService.pssStatus.set(status);
        },
        error: () => {
          this._pssService.setStatus(false);
        },
      });
    }
  }

  loadProposal() {
    if (isPrescriptionId(this.prescriptionId)) {
      this._proposalSateService.loadProposal(this.prescriptionId);
    } else if (this.patientSsin && isSsin(this.patientSsin)) {
      this._toastService.show('proposals.errors.invalidUUID');
    }
  }

  loadPrescription(): void {
    if (isPrescriptionId(this.prescriptionId)) {
      this._prescriptionStateService.loadPrescription(this.prescriptionId);
    } else if (this.patientSsin && isSsin(this.patientSsin)) {
      if (!validateSsinChecksum(this.patientSsin)) {
        this._toastService.show('prescription.errors.invalidSsinChecksum');
        return;
      }

      if (!isPrescriptionShortCode(this.prescriptionId)) {
        this._toastService.show('prescription.errors.invalidShortCode');
        return;
      }

      void this.getPatientIdentifier(this.patientSsin).then(identifier => {
        this._prescriptionStateService.loadPrescriptionByShortCode(this.prescriptionId, identifier);
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

  openCancelPrescriptionDialog(prescription: ReadRequestResource, patient?: PersonResource): void {
    this._dialog.open(CancelPrescriptionDialog, {
      data: {
        prescription,
        patient,
      },
      panelClass: 'mh-dialog-container',
    });
  }

  print(): void {
    if (
      this.viewState$().data &&
      this.viewState$().data!.decryptedResponses &&
      this.viewState$().data!.template &&
      this.viewState$().data!.templateVersion &&
      this.currentLang
    ) {
      this.loading.set(true);
      this._prescriptionsPdfService
        .createCommonPdf(
          this.viewState$().data!.prescription,
          this.viewState$().data!.decryptedResponses!,
          this.viewState$().data!.patient,
          this.viewState$().data!.template!,
          this.viewState$().data!.templateVersion as FormTemplate,
          this.currentLang()
        )
        .getBlob((blob: Blob) => {
          this.clickPrint.emit(blob);
          this.loading.set(false);
        });
    }
  }

  private decryptResponses(
    responses: Record<string, unknown>,
    template: TemplateVersion,
    cryptoKey?: CryptoKey
  ): Observable<Record<string, unknown>> {
    const decryptedResponses: Record<string, unknown> = {};

    return new Observable(observer => {
      const entries = Object.entries(responses);

      from(entries)
        .pipe(
          concatMap(([key, value]) => {
            const formElement = template.elements?.find(e => e.id === key);

            if (formElement?.tags?.includes('freeText')) {
              if (!cryptoKey) {
                return throwError(() => new Error(`Pseudo key is missing for key "${key}"`));
              }
              return this._encryptionService.decryptText(value as string, cryptoKey).pipe(
                map(decrypted => {
                  decryptedResponses[key] = decrypted;
                  return decryptedResponses;
                }),
                catchError((error: HttpErrorResponse) => {
                  return throwError(() => new Error(`Decryption failed for key "${key}": ${error.message}`));
                })
              );
            } else {
              decryptedResponses[key] = value;
              return of(decryptedResponses);
            }
          })
        )
        .subscribe({
          next: updatedResponses => {
            if (Object.keys(updatedResponses).length === entries.length) {
              observer.next(updatedResponses);
              observer.complete();
            }
          },
          error: err => {
            observer.error(err);
          },
        });
    });
  }

  async getPrescriptionKey(pseudonymizedKey: string): Promise<void> {
    try {
      const pseudoInTransit = this._pseudoService.toPseudonymInTransit(pseudonymizedKey);
      if (pseudoInTransit) {
        const uint8Array = await this._pseudoService.identifyPseudonymInTransit(pseudoInTransit);
        this._encryptionStateService.loadCryptoKey(uint8Array);
      }
    } catch (error) {
      const errorMsg = new Error('Error loading prescription key', { cause: error });
      this._encryptionStateService.setCryptoKeyError(errorMsg);
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
      typeof error === 'object' &&
      Object.keys(error).length === 1 &&
      Object.prototype.hasOwnProperty.call(error, 'decryptedResponses')
    );
  }

  private getPatientIdentifier(identifier: string): Promise<string> {
    return this._pseudoService.pseudonymize(identifier);
  }

  getStatusColor(status: RequestStatus) {
    return mapDisplayStatusToColor(status);
  }

  get templateHasAlert() {
    const element = this.viewState$()?.data?.templateVersion?.elements;
    if (!element) return false;
    return element.some(test => {
      return test.viewType === 'alert';
    });
  }

  get getTemplateAlert() {
    return this.viewState$()?.data?.templateVersion?.elements?.find(element => element.viewType === 'alert');
  }

  private formatToEvfLangCode(localeCode: string): 'nl' | 'fr' {
    return (localeCode?.substring(0, 2) as 'nl' | 'fr') ?? 'fr';
  }

  ngOnDestroy() {
    this._encryptionStateService.resetCryptoKey();
    if (isProposal(this.intent)) {
      this._proposalSateService.resetProposal();
    } else {
      this._prescriptionStateService.resetPrescription();
    }
  }
}
