import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostBinding,
  Inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  Signal,
  signal,
  SimpleChanges,
  ViewEncapsulation,
  WritableSignal,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import {
  BehaviorSubject,
  catchError,
  concatMap,
  EMPTY,
  filter,
  firstValueFrom,
  forkJoin,
  from,
  Observable,
  of,
  Subscription,
  switchMap,
} from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { DateAdapter } from '@angular/material/core';
import { DateTime } from 'luxon';
import {
  CancelCreationDialog,
  CancelCreationDialogData,
  CancelCreationDialogResult,
} from '@reuse/code/dialogs/cancel-creation/cancel-creation.dialog';
import {
  AlertType,
  CreatePrescriptionForm,
  CreatePrescriptionInitialValues,
  DataState,
  LoadingStatus,
} from '@reuse/code/interfaces';
import { CreateMultiplePrescriptionsComponent } from '../components/create-multiple-prescriptions/create-multiple-prescriptions.component';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { PrescriptionService } from '@reuse/code/services/api/prescription.service';
import { ConfirmDialog, ConfirmDialogData } from '@reuse/code/dialogs/confirm/confirm.dialog';
import { OverlaySpinnerComponent } from '@reuse/code/components/progress-indicators/overlay-spinner/overlay-spinner.component';
import { IfStatusSuccessDirective } from '@reuse/code/directives/if-status-success.directive';
import { AsyncPipe, DOCUMENT } from '@angular/common';
import { PseudoService } from '@reuse/code/services/privacy/pseudo.service';
import { AccessMatrixState } from '@reuse/code/states/api/access-matrix.state';
import { TemplatesState } from '@reuse/code/states/api/templates.state';
import { PatientState } from '@reuse/code/states/api/patient.state';
import { TemplateVersionsState } from '@reuse/code/states/api/template-versions.state';
import { WcConfigurationService } from '@reuse/code/services/config/wc-configuration.service';
import { ProposalService } from '@reuse/code/services/api/proposal.service';
import { PssService } from '@reuse/code/services/api/pss.service';
import { EncryptionService } from '@reuse/code/services/privacy/encryption.service';
import { v4 as uuidv4 } from 'uuid';
import { CreatePrescriptionModelComponent } from '../components/create-prescription-model/create-prescription-model.component';
import { PrescriptionModelService } from '@reuse/code/services/api/prescriptionModel.service';
import { ErrorCard } from '@reuse/code/interfaces/error-card.interface';
import { AlertComponent } from '@reuse/code/components/alert-component/alert.component';
import { HttpErrorResponse } from '@angular/common/http';
import { setOccurrenceTimingResponses } from '@reuse/code/utils/occurrence-timing.utils';
import {
  CreateRequestResource,
  Discipline,
  FormElement,
  ModelEntityDto,
  PersonResource,
  ReadRequestResource,
  TemplateVersion,
} from '@reuse/code/openapi';
import { ChooseTemplateDialog, SelectedTemplate } from '@reuse/code/dialogs/choose-template/choose-template.dialog';
import { isModel, isPrescription } from '@reuse/code/utils/utils';
import { EncryptionKeyInitializerService } from '@reuse/code/states/privacy/encryption-key-initializer.service';
import { ShadowDomOverlayContainer } from '@reuse/code/containers/shadow-dom-overlay/shadow-dom-overlay.container';
import { toSignal } from '@angular/core/rxjs-interop';
import { handleMissingTranslationFile } from '@reuse/code/utils/translation.utils';
import { Lang } from '@reuse/code/interfaces/lang.enum';

@Component({
  templateUrl: './create-prescription.component.html',
  styleUrls: ['./create-prescription.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  imports: [
    IfStatusSuccessDirective,
    CreateMultiplePrescriptionsComponent,
    OverlaySpinnerComponent,
    AsyncPipe,
    TranslateModule,
    CreatePrescriptionModelComponent,
    AlertComponent,
  ],
})
export class CreatePrescriptionWebComponent implements OnChanges, OnInit, AfterViewInit {
  protected readonly AlertType = AlertType;
  protected readonly discipline$ = toSignal(this.authService.discipline());

  private trackId = 0;
  public readonly errorResponseBadGateway = new HttpErrorResponse({
    status: 502,
    statusText: 'Bad Gateway',
  });
  public isModelValue: boolean = false;
  public errorCard: ErrorCard = {
    show: false,
    message: '',
    errorResponse: undefined,
  };

  // OBSERVABLES & SIGNALS & SUBJECTS
  public readonly isEnabled$: Observable<boolean>;
  public readonly status$ = new BehaviorSubject<boolean>(false);
  private readonly _languageChange = new BehaviorSubject<string>(this.translate.currentLang ?? Lang.FR);
  public readonly patientState$: Signal<DataState<PersonResource>> = this.patientStateService.state;
  public readonly prescriptionForms = signal<CreatePrescriptionForm[]>([]);
  public readonly loading = signal(false);
  public readonly loadingLang = signal(false);
  public readonly displaySelectDialog$ = signal(false);
  public readonly langAlertData: WritableSignal<{ title: string; body: string } | null> = signal(null);
  private readonly _subscriptions: Subscription = new Subscription();

  // INPUTS
  @HostBinding('attr.lang')
  @Input()
  lang = Lang.FR;
  @Input() initialValues?: CreatePrescriptionInitialValues;
  @Input() patientSsin?: string;
  @Input() services!: {
    getAccessToken: (audience?: string) => Promise<string | null>;
  };
  @Input() extend?: boolean = false;

  // OUTPUTS
  @Output() prescriptionsCreated = new EventEmitter<string[]>();
  @Output() clickCancel = new EventEmitter<void>();
  @Output() modelCreated = new EventEmitter<void>();

  constructor(
    private readonly authService: AuthService,
    private readonly dialog: MatDialog,
    private readonly translate: TranslateService,
    private readonly dateAdapter: DateAdapter<DateTime>,
    private readonly toastService: ToastService,
    private readonly accessMatrixStateService: AccessMatrixState,
    private readonly templatesStateService: TemplatesState,
    private readonly templateVersionsStateService: TemplateVersionsState,
    private readonly prescriptionModelService: PrescriptionModelService,
    private readonly patientStateService: PatientState,
    private readonly pseudoService: PseudoService,
    private readonly prescriptionService: PrescriptionService,
    private readonly proposalService: ProposalService,
    private readonly encryptionService: EncryptionService,
    private readonly pssService: PssService,
    private readonly configService: WcConfigurationService,
    private readonly encryptionKeyInitializer: EncryptionKeyInitializerService,
    private readonly shadowDomOverlay: ShadowDomOverlayContainer,
    @Inject(DOCUMENT) private readonly _document: Document
  ) {
    const currentLang = this.translate.currentLang;
    if (!currentLang) {
      this.translate.use(Lang.FR);
      this.dateAdapter.setLocale(Lang.FR);
    }

    this.isEnabled$ = of(this.configService.getEnvironmentVariable('enablePseudo') as boolean).pipe(
      map((value: boolean) => {
        return value;
      })
    );
  }

  ngOnInit(): void {
    this._subscriptions.add(
      this._languageChange
        .pipe(
          tap(lang => {
            this.dateAdapter.setLocale(lang);
          }),
          switchMap(lang => {
            return this.translate.use(lang).pipe(
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
          },
        })
    );
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['services']) {
      this.handleTokenChange();
    }

    if (changes['lang']) {
      const currentLang: string = (changes['lang'].currentValue ?? '') as string;
      this._languageChange.next(currentLang);
    }

    if (changes['patientSsin'] && this.patientSsin) {
      this.patientStateService.loadPatient(this.patientSsin);
    }

    if (changes['initialValues'] && this.initialValues) {
      this.isModelValue = isModel(this.initialValues.intent);
      const initialPrescriptionType =
        this.initialValues.initialPrescriptionType || this.initialValues.initialPrescription?.templateCode;

      if (!initialPrescriptionType) {
        // No initialPrescriptionType → just display the template selection modal
        this.loading.set(false);
        this.displaySelectDialog$.set(true);
        void this.openSelectDialog();
        return;
      }

      // InitialPrescriptionType exists → continue with the flow
      this.loading.set(true);
      if (
        this.initialValues.initialPrescription?.templateCode === 'ANNEX_82' ||
        this.initialValues.initialPrescriptionType === 'ANNEX_82'
      ) {
        this.loadPssStatus(this.initialValues);
      } else {
        this.handlePrescriptionChanges(this.initialValues);
      }
    }
  }

  async openSelectDialog() {
    if (await this.isNurse()) {
      this.displaySelectDialog$.set(false);
      this.addPrescriptionForm('ANNEX_81');
    } else {
      this.addPrescription();
    }
  }

  ngAfterViewInit() {
    this.shadowDomOverlay.createContainer();
  }

  private handleTokenChange(): void {
    this.authService.init(this.services.getAccessToken);
    this.accessMatrixStateService.loadAccessMatrix();
    this.templatesStateService.loadTemplates();
  }

  private loadPssStatus(initialValues: CreatePrescriptionInitialValues) {
    this.pssService.getPssStatus().subscribe({
      next: status => {
        this.status$.next(status);
        this.handlePrescriptionChanges(initialValues);
      },
      error: () => {
        this.pssService.setStatus(false);
        this.handlePrescriptionChanges(initialValues);
      },
    });
  }

  private handlePrescriptionChanges(initialValues: CreatePrescriptionInitialValues): void {
    if (initialValues.initialModelId) {
      this.findModelById(initialValues.initialPrescriptionType!, initialValues.initialModelId);
    } else {
      this.addPrescriptionForm(initialValues.initialPrescriptionType!, initialValues.initialPrescription);
    }
  }

  findModelById(templateCode: string, modelId: number) {
    this.prescriptionModelService.findById(modelId).subscribe({
      next: prescriptionModel => {
        if (prescriptionModel !== null) {
          this.addPrescriptionFormByModel(templateCode, prescriptionModel);
          this.loading.set(false);
        } else {
          this.toastService.showSomethingWentWrong();
          this.loading.set(false);
        }
      },
      error: () => {
        this.toastService.showSomethingWentWrong();
        this.loading.set(false);
      },
    });
  }

  addPrescription(): void {
    this.dialog
      .open<ChooseTemplateDialog, unknown, SelectedTemplate>(ChooseTemplateDialog, {
        maxWidth: '100vw',
        width: '500px',
        autoFocus: false,
        panelClass: 'mh-dialog-container',
        data: {
          intent: this.initialValues?.intent,
        },
      })
      .beforeClosed()
      .pipe(filter(result => result?.templateCode != null))
      .subscribe(result => {
        this.displaySelectDialog$.set(false);
        if (result?.model?.id && result?.templateCode) {
          this.findModelById(result.templateCode, result.model.id);
        } else if (result?.templateCode) {
          this.addPrescriptionForm(result.templateCode);
        }
      });
  }

  private addPrescriptionForm(templateCode: string, initialPrescription?: ReadRequestResource): void {
    const instanceId = uuidv4();

    this.templateVersionsStateService.loadTemplateVersionForInstance(instanceId, templateCode);

    this.prescriptionForms.update(prescriptionForms => [
      ...prescriptionForms,
      {
        generatedUUID: instanceId,
        trackId: this.trackId++,
        templateCode: templateCode,
        formTemplateState$: this.templateVersionsStateService.getStateForInstance(instanceId, templateCode),
        initialPrescription: this.updateResponses(initialPrescription),
      },
    ]);

    this.loading.set(false);
  }

  private addPrescriptionFormByModel(templateCode: string, model: ModelEntityDto) {
    const instanceId = uuidv4();
    this.templateVersionsStateService.loadTemplateVersionForInstance(templateCode, instanceId);
    this.prescriptionForms.update(prescriptionForms => [
      ...prescriptionForms,
      {
        generatedUUID: instanceId,
        trackId: this.trackId++,
        templateCode: templateCode,
        formTemplateState$: this.templateVersionsStateService.getStateForInstance(instanceId, templateCode),
        initialPrescription: undefined,
        modelResponses: model.modelData as unknown as Record<string, unknown>,
        modelName: model.label,
        modelId: model.id,
      },
    ]);
  }

  updateResponses(initialPrescription?: ReadRequestResource) {
    if (initialPrescription?.responses) {
      setOccurrenceTimingResponses(initialPrescription);
    }

    if (!this.initialValues?.extend || !initialPrescription?.responses) {
      return initialPrescription;
    }

    if (initialPrescription.responses?.['prescriptionOriginId'] || !initialPrescription?.id) {
      return initialPrescription;
    }

    initialPrescription.responses['prescriptionOriginId'] = initialPrescription.id;
    return initialPrescription;
  }

  deletePrescriptionForm({ form, templateName }: { form: CreatePrescriptionForm; templateName: string }) {
    this.dialog
      .open(ConfirmDialog, {
        data: {
          titleLabel: 'prescription.create.deletePrescription.title',
          messageLabel: 'prescription.create.deletePrescription.message',
          cancelLabel: 'common.cancel',
          okLabel: 'common.delete',
          params: {
            templateName,
          },
        },
        panelClass: 'mh-dialog-container',
      })
      .beforeClosed()
      .subscribe(accepted => {
        if (accepted === true) {
          this.prescriptionForms.update(prescriptionForms => prescriptionForms.filter(f => f !== form));
          this.templateVersionsStateService.cleanupInstance(form.generatedUUID, form.templateCode);
        }
      });
  }

  private getPrescriptionTemplateStream(templateCode: string) {
    return this.templateVersionsStateService.getState(templateCode);
  }

  publishPrescriptions(): void {
    if (!this.prescriptionForms().length) {
      return;
    }
    this.prescriptionForms().forEach(f => f.elementGroup?.markAllAsTouched());
    this.prescriptionForms.update(prescriptionForms => prescriptionForms.map(t => ({ ...t, submitted: true })));
    if (this.prescriptionForms().every(f => f.elementGroup!.valid)) {
      this.loading.set(true);
      if (this.prescriptionForms().length === 1) {
        this.publishOnePrescriptionOrProposal();
      } else {
        this.publishMultiplePrescriptionsOrProposals();
      }
    }
  }

  private getPatientIdentifier(): Observable<string> {
    if (!this.patientSsin) {
      return of('');
    }
    return from(this.pseudoService.pseudonymize(this.patientSsin));
  }

  private publishOnePrescriptionOrProposal(): void {
    const prescriptionForm = this.prescriptionForms()[0];
    this.encryptionKeyInitializer
      .initialize()
      .pipe(
        concatMap(() =>
          this.getPatientIdentifier().pipe(
            switchMap(identifier =>
              this.toCreatePrescriptionRequest(
                prescriptionForm.templateCode,
                prescriptionForm.elementGroup!.getOutputValue(),
                identifier
              )
            ),
            switchMap(createPrescriptionRequest => {
              if (isPrescription(this.initialValues?.intent)) {
                return this.prescriptionService.create(createPrescriptionRequest, prescriptionForm.generatedUUID);
              } else {
                return this.proposalService.create(createPrescriptionRequest, prescriptionForm.generatedUUID);
              }
            })
          )
        )
      )
      .subscribe({
        next: readRequestIdResource => {
          this.closeErrorCard();
          this.toastService.show(
            isPrescription(this.initialValues?.intent) ? 'prescription.create.success' : 'proposal.create.success'
          );
          const ids = readRequestIdResource.id ? [readRequestIdResource.id] : [];
          this.prescriptionsCreated.emit(ids);
        },
        error: (err: HttpErrorResponse) => {
          const errorBody = err.error as { detail?: string };

          this.errorCard = {
            show: true,
            message: errorBody.detail || 'common.somethingWentWrong',
            errorResponse: err,
          };
          this.generateNewUuid();
          this.loading.set(false);
        },
      });
  }

  private publishMultiplePrescriptionsOrProposals(): void {
    this.loading.set(true);
    this.encryptionKeyInitializer
      .initialize()
      .pipe(
        concatMap(() =>
          this.getPatientIdentifier().pipe(
            switchMap(identifier => {
              const streams = this.mapToCreatePrescriptionStreams(identifier);
              return forkJoin(streams); // Combine all prescription creation streams into one
            })
          )
        )
      )
      .subscribe({
        next: results => this.handleCreateBulkResult(results),
        error: error => {
          console.error('Error during bulk prescription creation:', error);
          this.loading.set(false);
        },
      });
  }

  private mapToCreatePrescriptionStreams(identifier: string): Observable<{
    trackId: number;
    status: LoadingStatus;
    responseId?: string;
    error?: unknown;
  }>[] {
    return this.prescriptionForms()
      .filter(f => f.status !== LoadingStatus.SUCCESS)
      .map(f => {
        const createPrescriptionRequest$ = this.toCreatePrescriptionRequest(
          f.templateCode,
          f.elementGroup!.getOutputValue() as Record<string, unknown>,
          identifier
        );

        return createPrescriptionRequest$.pipe(
          switchMap(createPrescriptionRequest => {
            if (isPrescription(this.initialValues?.intent)) {
              return this.prescriptionService.create(createPrescriptionRequest, f.generatedUUID).pipe(
                map(readRequestIdResource => ({
                  trackId: f.trackId,
                  status: LoadingStatus.SUCCESS,
                  responseId: readRequestIdResource.id,
                  error: undefined,
                })),
                catchError((error: unknown) => {
                  console.error('Error creating prescription (order):', error);
                  this.generateNewUuid();
                  return of({
                    trackId: f.trackId,
                    status: LoadingStatus.ERROR,
                    responseId: undefined,
                    error,
                  });
                })
              );
            } else {
              return this.proposalService.create(createPrescriptionRequest, f.generatedUUID).pipe(
                map(readRequestIdResource => ({
                  trackId: f.trackId,
                  status: LoadingStatus.SUCCESS,
                  responseId: readRequestIdResource.id,
                  error: undefined,
                })),
                catchError((error: unknown) => {
                  console.error('Error creating prescription (proposal):', error);
                  this.generateNewUuid();
                  return of({
                    trackId: f.trackId,
                    status: LoadingStatus.ERROR,
                    responseId: undefined,
                    error,
                  });
                })
              );
            }
          })
        );
      });
  }

  protected encryptFreeTextInResponses(
    templateCode: string,
    responses: Record<string, unknown>
  ): Observable<Record<string, unknown>> {
    const template = this.getPrescriptionTemplateStream(templateCode)()?.data;
    if (!template || !this.encryptionKeyInitializer.getCryptoKey()!) {
      return of(responses);
    }

    const encryptionTasks = Object.entries(responses).map(([key, value]) =>
      this.processResponseEntry(key, value, template, templateCode)
    );

    return forkJoin(encryptionTasks).pipe(
      map(results => {
        return results.reduce((acc, curr) => Object.assign(acc, curr), {});
      })
    );
  }

  private processResponseEntry(
    key: string,
    value: unknown,
    template: TemplateVersion,
    templateCode: string
  ): Observable<Record<string, unknown>> {
    const formElement = this.findElementById(template.elements, key);

    if (!formElement) {
      return of({ [key]: value });
    }

    if (formElement?.tags?.includes('freeText') && typeof value === 'string') {
      return this.encryptStringValue(key, value);
    }

    if (this.isObject(value) && Object.hasOwn(formElement, 'subFormElements')) {
      return this.processNestedObject(key, value, templateCode);
    }

    return of({ [key]: value });
  }

  private encryptStringValue(key: string, value: string): Observable<Record<string, unknown>> {
    return this.encryptionService.encryptText(this.encryptionKeyInitializer.getCryptoKey()!, value).pipe(
      map(encryptedValue => ({ [key]: encryptedValue })),
      catchError(error => {
        console.error(`Error encrypting key "${key}":`, error);
        return of({ [key]: value });
      })
    );
  }

  private processNestedObject(
    key: string,
    value: Record<string, unknown>,
    templateCode: string
  ): Observable<Record<string, unknown>> {
    return this.encryptFreeTextInResponses(templateCode, value).pipe(
      map(encryptedNestedValue => ({ [key]: encryptedNestedValue }))
    );
  }

  isObject(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  protected findElementById(elements: FormElement[] | undefined, key: string): FormElement | null {
    if (!elements) return null;

    for (const element of elements) {
      if (element.id === key) {
        return element;
      }
      if (element.subFormElements && Array.isArray(element.subFormElements)) {
        const found = this.findElementById(element.subFormElements, key);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  protected toCreatePrescriptionRequest(
    templateCode: string,
    responses: Record<string, unknown>,
    subject: string
  ): Observable<CreateRequestResource> {
    if (templateCode === 'ANNEX_82') {
      const pssSessionId = this.pssService.getPssSessionId();
      if (pssSessionId != null) {
        responses['exchangeId'] = pssSessionId;
      }
    }
    return this.encryptFreeTextInResponses(templateCode, responses).pipe(
      map(encryptedResponses => {
        if (!this.encryptionKeyInitializer.getPseudonymizedKey()) {
          console.warn('PseudonymizedKey key is not set. The request will proceed without it.');
        }

        return {
          templateCode,
          responses: encryptedResponses,
          pseudonymizedKey: this.encryptionKeyInitializer.getPseudonymizedKey(),
          subject,
        };
      }),
      catchError(error => {
        console.error('Failed to create prescription request:', error);
        throw error;
      })
    );
  }

  protected handleCreateBulkResult(
    results: { trackId: number; status: LoadingStatus; responseId?: string; error?: unknown }[]
  ): void {
    const successCount = results.filter(r => r.status === LoadingStatus.SUCCESS).length;
    const failedCount = results.filter(r => r.status === LoadingStatus.ERROR).length;
    if (failedCount === 0) {
      this.toastService.show(
        isPrescription(this.initialValues?.intent) ? 'prescription.create.allSuccess' : 'proposal.create.allSuccess',
        { interpolation: { count: successCount } }
      );
      const ids = results.map(r => r.responseId).filter((id): id is string => !!id);
      this.prescriptionsCreated.emit(ids);
    } else if (successCount === 0) {
      if (isPrescription(this.initialValues?.intent)) {
        this.errorCard = {
          show: true,
          message: 'prescription.create.allFailed',
          translationOptions: { count: failedCount },
          errorResponse: undefined,
        };
      } else {
        this.errorCard = {
          show: true,
          message: 'proposal.create.allFailed',
          translationOptions: { count: failedCount },
          errorResponse: undefined,
        };
      }
      this.prescriptionForms.update(prescriptionForms =>
        prescriptionForms.map(t => ({
          ...t,
          status: results.find(r => r.trackId === t.trackId)?.status || t.status,
        }))
      );
      results.forEach((t, i) => console.error(i, t.error));
      this.loading.set(false);
    } else {
      if (isPrescription(this.initialValues?.intent)) {
        this.errorCard = {
          show: true,
          message: 'prescription.create.someSuccessSomeFailed',
          translationOptions: { successCount, failedCount },
          errorResponse: undefined,
        };
      } else {
        this.errorCard = {
          show: true,
          message: 'proposal.create.someSuccessSomeFailed',
          translationOptions: { successCount, failedCount },
          errorResponse: undefined,
        };
      }

      this.prescriptionForms.update(prescriptionForms =>
        prescriptionForms.map(t => ({
          ...t,
          status: results.find(r => r.trackId === t.trackId)?.status || t.status,
        }))
      );
      results.forEach((t, i) => t.status === LoadingStatus.ERROR && console.error(i, t.error));
      this.loading.set(false);
    }
  }

  cancelCreation(): void {
    if (this.prescriptionForms().length > 1) {
      this.dialog
        .open<CancelCreationDialog, CancelCreationDialogData, CancelCreationDialogResult>(CancelCreationDialog, {
          data: { prescriptionForms: this.prescriptionForms() },
          panelClass: 'mh-dialog-container',
        })
        .beforeClosed()
        .subscribe(result => {
          if (!result) {
            return;
          } else if (result.formsToDelete.length === this.prescriptionForms().length) {
            this.templateVersionsStateService.cleanupAllInstances();
            this.clickCancel.emit();
          } else if (result.formsToDelete.length > 0) {
            this.prescriptionForms.update(forms => forms.filter(f => !result.formsToDelete.includes(f.trackId)));

            const formsToDelete = this.prescriptionForms().filter(f => result.formsToDelete.includes(f.trackId));

            formsToDelete.forEach(f =>
              this.templateVersionsStateService.cleanupInstance(f.generatedUUID, f.templateCode)
            );
          }
        });
    } else {
      this.dialog
        .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
          data: {
            messageLabel: 'prescription.create.cancelCreation',
            cancelLabel: 'common.close',
            okLabel: 'common.confirm',
          },
          panelClass: 'mh-dialog-container',
        })
        .beforeClosed()
        .pipe(filter(result => result === true))
        .subscribe(() => {
          this.templateVersionsStateService.cleanupAllInstances();
          this.clickCancel.emit();
        });
    }
  }

  modelSaved() {
    this.modelCreated.emit();
  }

  closeErrorCard(): void {
    this.errorCard = {
      show: false,
      message: '',
      errorResponse: undefined,
    };
  }

  private generateNewUuid() {
    this.prescriptionForms.update(formList => {
      return formList.map(form => {
        return {
          ...form,
          generatedUUID: uuidv4(),
        };
      });
    });
  }

  private async isNurse() {
    await firstValueFrom(this.authService.discipline());
    return this.discipline$() != null && this.discipline$() === Discipline.Nurse;
  }
}
