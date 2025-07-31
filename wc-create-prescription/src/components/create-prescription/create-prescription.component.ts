import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostBinding,
  Inject,
  Input,
  OnChanges,
  Output,
  Renderer2,
  Signal,
  signal,
  SimpleChanges,
  ViewEncapsulation
} from '@angular/core';
import { FormElement, FormTemplate } from '@smals/vas-evaluation-form-ui-core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '@reuse/code/services/auth.service';
import { BehaviorSubject, catchError, concatMap, filter, forkJoin, from, Observable, of, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { DateAdapter } from '@angular/material/core';
import { DateTime } from 'luxon';
import {
  CancelCreationDialog,
  CancelCreationDialogData,
  CancelCreationDialogResult
} from '@reuse/code/dialogs/cancel-creation/cancel-creation.dialog';
import {
  CreatePrescriptionInitialValues,
  CreatePrescriptionRequest,
  DataState,
  LoadingStatus,
  Person,
  ReadPrescription
} from '@reuse/code/interfaces';
import {
  CreateMultiplePrescriptionsComponent
} from '@reuse/code/components/create-multiple-prescriptions/create-multiple-prescriptions.component';
import { ToastService } from '@reuse/code/services/toast.service';
import { PrescriptionService } from '@reuse/code/services/prescription.service';
import {
  ChooseTemplateDialog,
  NewPrescriptionDialogResult
} from '@reuse/code/dialogs/choose-template/choose-template.dialog';
import { ConfirmDialog, ConfirmDialogData } from '@reuse/code/dialogs/confirm/confirm.dialog';
import { OverlaySpinnerComponent } from '@reuse/code/components/overlay-spinner/overlay-spinner.component';
import { IfStatusSuccessDirective } from '@reuse/code/directives/if-status-success.directive';
import { AsyncPipe, DOCUMENT } from '@angular/common';
import { PseudoService } from '@reuse/code/services/pseudo.service';
import { AccessMatrixState } from '@reuse/code/states/access-matrix.state';
import { TemplatesState } from '@reuse/code/states/templates.state';
import { PatientState } from '@reuse/code/states/patient.state';
import { TemplateVersionsState } from '@reuse/code/states/template-versions.state';
import { WcConfigurationService } from '@reuse/code/services/wc-configuration.service';
import { ProposalService } from '@reuse/code/services/proposal.service';
import { PssService } from "@reuse/code/services/pss.service";
import { EncryptionService } from '@reuse/code/services/encryption.service';
import { v4 as uuidv4 } from 'uuid';
import {
  CreatePrescriptionModelComponent
} from '@reuse/code/components/create-prescription-model/create-prescription-model.component';
import { PrescriptionModel } from '@reuse/code/interfaces/prescription-modal.inteface';
import { PrescriptionModelService } from '@reuse/code/services/prescription-model.service';
import { CreatePrescriptionForm } from '@reuse/code/interfaces/create-prescription-form.interface';
import { ErrorCard } from '@reuse/code/interfaces/error-card.interface';
import { ErrorCardComponent } from '@reuse/code/components/error-card/error-card.component';
import { HttpErrorResponse } from '@angular/common/http';
import { isPrescription, isModel } from '@reuse/code/utils/utils';
import { isOccurrenceTiming } from '@reuse/code/utils/occurrence-timing.utils';


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
    ErrorCardComponent
  ]
})
export class CreatePrescriptionWebComponent implements OnChanges {
  isEnabled$: Observable<boolean>;
  errorResponseBadGateway = new HttpErrorResponse({
    status: 502,
    statusText: 'Bad Gateway'
  });

  private trackId = 0;
  isModelValue: boolean = false;

  readonly patientState$: Signal<DataState<Person>> = this.patientStateService.state;
  public status$ = new BehaviorSubject<boolean>(false);
  prescriptionForms = signal<CreatePrescriptionForm[]>([]);
  loading = signal(false);
  cryptoKey: CryptoKey | undefined;
  pseudonymizedKey: string | undefined;
  generatedUUID = '';

  errorCard: ErrorCard = {
    show: false,
    message: '',
    errorResponse: undefined
  };

  @HostBinding('attr.lang')
  @Input() lang = 'fr-BE';
  @Input() initialValues?: CreatePrescriptionInitialValues;
  @Input() patientSsin?: string;
  @Input() services!: {
    getAccessToken: (audience?: string) => Promise<string | null>
  };
  @Input() intent!: string;
  @Input() extend?: boolean = false;

  @Output() prescriptionsCreated = new EventEmitter<void>();
  @Output() clickCancel = new EventEmitter<void>();
  @Output() modelCreated = new EventEmitter<void>();

  constructor(
    private authService: AuthService,
    private dialog: MatDialog,
    private translate: TranslateService,
    private dateAdapter: DateAdapter<DateTime>,
    private toastService: ToastService,
    private accessMatrixStateService: AccessMatrixState,
    private templatesStateService: TemplatesState,
    private templateVersionsStateService: TemplateVersionsState,
    private prescriptionModelService: PrescriptionModelService,
    private patientStateService: PatientState,
    private pseudoService: PseudoService,
    private prescriptionService: PrescriptionService,
    private proposalService: ProposalService,
    private renderer: Renderer2,
    private encryptionService: EncryptionService,
    private pssService: PssService,
    private configService: WcConfigurationService,
    @Inject(DOCUMENT) private _document: Document
  ) {
    this.isEnabled$ = of(this.configService.getEnvironmentVariable('enablePseudo')).pipe(
      map((value: boolean) => {
        if (value) {
          this.initializeWebComponent();
        }
        return value;
      })
    );
  }


  private initializeWebComponent() {
    this.translate.setDefaultLang('fr-BE');

    const currentLang = this.translate.currentLang;
    if (!currentLang) {
      this.translate.use('fr-BE');
      this.dateAdapter.setLocale('fr-BE');
    }

    this.loadWebComponents();
  }

  private initializeEncryptionKey(): Observable<void> {
    return from(
      (async () => {
        try {
          this.cryptoKey = await this.encryptionService.generateKey();
          this.pseudonymizedKey = await this.pseudonymizeEncryptionKey();
        } catch (error) {
          console.error('Failed to initialize encryption key:', error);
          this.cryptoKey = undefined;
          this.pseudonymizedKey = undefined;
        }
      })()
    );
  }

  private async pseudonymizeEncryptionKey(): Promise<string | undefined> {
    if (!this.cryptoKey) return undefined;

    try {
      const exportedKey = await this.encryptionService.exportKey(this.cryptoKey);
      const byteArray = new Uint8Array(exportedKey);
      const byteArrToVal = this.pseudoService.byteArrayToValue(byteArray);
      if(byteArray && byteArrToVal !== null){
        return this.pseudoService.pseudonymizeValue(byteArrToVal);
      } else {
        return undefined
      }
    } catch (error) {
      console.error('Failed to pseudonymize encryption key:', error);
      return undefined;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['services']) {
      this.handleTokenChange();
    }

    if (changes['lang']) {
      this.handleLanguageChange();
    }

    if (changes['patientSsin'] && this.patientSsin) {
      this.patientStateService.loadPatient(this.patientSsin);
    }

    if (changes['initialValues'] && this.initialValues) {
      this.loading.set(true);
      this.isModelValue = isModel(this.initialValues.intent);
      if(this.initialValues.initialPrescription?.templateCode === 'ANNEX_82' || this.initialValues.initialPrescriptionType === 'ANNEX_82'){
        this.loadPssStatus(this.initialValues)
      }
      else{
        this.handlePrescriptionChanges(this.initialValues);
      }
    }
  }

  private handleTokenChange(): void {
    this.authService.init(this.services.getAccessToken);
    this.accessMatrixStateService.loadAccessMatrix();
    this.templatesStateService.loadTemplates();
  }

  private handleLanguageChange(): void {
    this.dateAdapter.setLocale(this.lang);
    this.translate.use(this.lang);
  }

  private loadPssStatus(initialValues: CreatePrescriptionInitialValues) {
    this.pssService.getPssStatus()
      .subscribe({
        next: (status) => {
          this.status$.next(status);
          this.handlePrescriptionChanges(initialValues);
        },
        error: () => {
          this.pssService.setStatus(false);
          this.handlePrescriptionChanges(initialValues);
        }
      })
  }

  private handlePrescriptionChanges(initialValues: CreatePrescriptionInitialValues): void {
    if (initialValues.initialModelId) {
      this.findModelById(initialValues.initialPrescriptionType!, initialValues.initialModelId);
    } else {
      this.addPrescriptionForm(initialValues.initialPrescriptionType!, initialValues.initialPrescription);
    }
  }

  findModelById(templateCode: string, modelId: string) {
    this.prescriptionModelService.findById(modelId)
      .subscribe({
        next: (prescriptionModel) => {
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
        }
      });
  }

  addPrescription(): void {
    this.dialog.open<ChooseTemplateDialog, any, NewPrescriptionDialogResult>(ChooseTemplateDialog, {
      maxWidth: '100vw',
      width: '500px',
      autoFocus: false
    })
      .beforeClosed()
      .pipe(filter((result) => result?.templateCode != null))
      .subscribe((result) => {
        if (result?.model && result?.templateCode) {
          this.findModelById(result.templateCode, result.model.id.toString());
        } else if (result?.templateCode) {
          this.addPrescriptionForm(result.templateCode);
        }
      });
  }

  private addPrescriptionForm(templateCode: string, initialPrescription?: ReadPrescription): void {
    this.templateVersionsStateService.loadTemplateVersion(templateCode);
    this.prescriptionForms.update((prescriptionForms) => [
      ...prescriptionForms,
      {
        generatedUUID: uuidv4(),
        trackId: this.trackId++,
        templateCode: templateCode,
        formTemplateState$: this.getPrescriptionTemplateStream(templateCode),
        initialPrescription: this.updateResponses(initialPrescription)
      }
    ]);

    this.loading.set(false);
  }

  private addPrescriptionFormByModel(templateCode: string, model: PrescriptionModel) {
    this.templateVersionsStateService.loadTemplateVersion(templateCode);
    this.prescriptionForms.update((prescriptionForms) => [
      ...prescriptionForms,
      {
        generatedUUID: uuidv4(),
        trackId: this.trackId++,
        templateCode: templateCode,
        formTemplateState$: this.getPrescriptionTemplateStream(templateCode),
        initialPrescription: undefined,
        modelResponses: model.modelData,
        modelName: model.label,
        modelId: model.id
      }
    ]);
  }

  updateResponses(initialPrescription?: ReadPrescription) {
    if (initialPrescription?.responses?.['occurrenceTiming'] && isOccurrenceTiming(initialPrescription?.responses['occurrenceTiming'])) {
      const occurrenceTiming = initialPrescription.responses['occurrenceTiming'];
      const {boundsDuration, duration, durationUnit, dayOfWeek} = occurrenceTiming.repeat ?? {};

      if (boundsDuration) {
        initialPrescription.responses['boundsDuration'] = boundsDuration.value;
        initialPrescription.responses['boundsDurationUnit'] = boundsDuration.code;
      }

      if (duration) {
        initialPrescription.responses['sessionDuration'] = duration;
        initialPrescription.responses['sessionDurationUnit'] = durationUnit;
      }

      if (dayOfWeek) {
        initialPrescription.responses['dayOfWeek'] = dayOfWeek;
      }
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

  deletePrescriptionForm({form, templateName}: { form: CreatePrescriptionForm; templateName: string }) {
    this.dialog.open(ConfirmDialog, {
      data: {
        titleLabel: 'prescription.create.deletePrescription.title',
        messageLabel: 'prescription.create.deletePrescription.message',
        cancelLabel: 'common.cancel',
        okLabel: 'common.delete',
        params: {
          templateName
        }
      }
    })
      .beforeClosed()
      .subscribe((accepted) => {
        if (accepted === true) {
          this.prescriptionForms.update((prescriptionForms) => prescriptionForms.filter(f => f !== form));
        }
      });
  }

  private getPrescriptionTemplateStream(templateCode: string): Signal<DataState<FormTemplate>> {
    return this.templateVersionsStateService.getState(templateCode);
  }

  publishPrescriptions(): void {
    if (!this.prescriptionForms().length) {
      return;
    }
    this.prescriptionForms().forEach((f) => f.elementGroup?.markAllAsTouched());
    this.prescriptionForms.update((prescriptionForms) => prescriptionForms.map((t) => ({...t, submitted: true})));
    if (this.prescriptionForms().every((f) => f.elementGroup!.valid)) {
      this.loading.set(true);
      if (this.prescriptionForms().length === 1) {
        this.publishOnePrescription();
      } else {
        this.publishMultiplePrescriptions();
      }
    }
  }

  private getPatientIdentifier(): Observable<string> {
    if (!this.patientSsin) {
      return of('');
    }
    return from(this.pseudoService.pseudonymize(this.patientSsin));
  }

  private publishOnePrescription(): void {
    const prescriptionForm = this.prescriptionForms()[0];
    this.initializeEncryptionKey().pipe(
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
    ).subscribe({
      next: () => {
        this.closeErrorCard();
        this.toastService.show(isPrescription(this.initialValues?.intent) ? 'prescription.create.success' : 'proposal.create.success');
        this.prescriptionsCreated.emit();
      },
      error: err => {
          this.errorCard = {
            show: true,
            message: err?.error?.detail || 'common.somethingWentWrong',
            errorResponse: err
          };
        this.loading.set(false);
      }
    });
  }

  private publishMultiplePrescriptions(): void {
    this.loading.set(true);
    this.initializeEncryptionKey().pipe(
      concatMap(() =>
        this.getPatientIdentifier().pipe(
          switchMap(identifier => {
            const streams = this.mapToCreatePrescriptionStreams(identifier);
            return forkJoin(streams); // Combine all prescription creation streams into one
          })
        )
      )
    ).subscribe({
      next: results => this.handleCreateBulkResult(results),
      error: error => {
        console.error('Error during bulk prescription creation:', error);
        this.loading.set(false); // Stop loading on error
      }
    });
  }

  private mapToCreatePrescriptionStreams(identifier: string): Observable<{
    trackId: number;
    status: LoadingStatus;
    error?: any;
  }>[] {
    return this.prescriptionForms()
      .filter(f => f.status !== LoadingStatus.SUCCESS)
      .map(f => {
        const createPrescriptionRequest$ = this.toCreatePrescriptionRequest(
          f.templateCode,
          f.elementGroup!.getOutputValue(),
          identifier
        );

        return createPrescriptionRequest$.pipe(
          switchMap(createPrescriptionRequest => {
            if (isPrescription(this.initialValues?.intent)) {
              return this.prescriptionService.create(createPrescriptionRequest, f.generatedUUID).pipe(
                map(() => ({
                  trackId: f.trackId,
                  status: LoadingStatus.SUCCESS,
                  error: undefined
                })),
                catchError(error => {
                  console.error('Error creating prescription (order):', error);
                  return of({
                    trackId: f.trackId,
                    status: LoadingStatus.ERROR,
                    error
                  });
                })
              );
            } else {
              return this.proposalService.create(createPrescriptionRequest, f.generatedUUID).pipe(
                map(() => ({
                  trackId: f.trackId,
                  status: LoadingStatus.SUCCESS,
                  error: undefined
                })),
                catchError(error => {
                  console.error('Error creating prescription (proposal):', error);
                  return of({
                    trackId: f.trackId,
                    status: LoadingStatus.ERROR,
                    error
                  });
                })
              );
            }
          })
        );
      });
  }

  protected encryptFreeTextInResponses(templateCode: string, responses: Record<string, unknown>): Observable<Record<string, unknown>> {
    const template = this.getPrescriptionTemplateStream(templateCode)()?.data;
    if (!template || !this.cryptoKey) {
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

  private processResponseEntry(key: string, value: unknown, template: FormTemplate, templateCode: string): Observable<Record<string, unknown>> {
    const formElement = this.findElementById(template.elements, key);

    if (!formElement) {
      return of({[key]: value});
    }

    if (formElement?.tags?.includes('freeText') && typeof value === 'string') {
      return this.encryptStringValue(key, value);
    }

    if (this.isObject(value) && Object.hasOwn(formElement, 'elements')) {
      return this.processNestedObject(key, value as Record<string, unknown>, templateCode);
    }

    return of({[key]: value});
  }

  private encryptStringValue(key: string, value: string): Observable<Record<string, unknown>> {
    return this.encryptionService.encryptText(this.cryptoKey!, value).pipe(
      map(encryptedValue => ({[key]: encryptedValue})),
      catchError(error => {
        console.error(`Error encrypting key "${key}":`, error);
        return of({[key]: value});
      })
    );
  }

  private processNestedObject(key: string, value: Record<string, unknown>, templateCode: string): Observable<Record<string, unknown>> {
    return this.encryptFreeTextInResponses(templateCode, value).pipe(
      map(encryptedNestedValue => ({[key]: encryptedNestedValue}))
    );
  }

  isObject(value: unknown): value is Record<string, any> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  protected findElementById(elements: FormElement[], key: string): FormElement | null {
    for (const element of elements) {
      if (element.id === key) {
        return element;
      }
      if (element.elements && Array.isArray(element.elements)) {
        const found = this.findElementById(element.elements, key);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  protected toCreatePrescriptionRequest(
    templateCode: string,
    responses: Record<string, any>,
    subject: string
  ): Observable<CreatePrescriptionRequest> {
    if(templateCode === 'ANNEX_82'){
      const pssSessionId = this.pssService.getPssSessionId()
      if (pssSessionId != null) {
        responses["exchangeId"] = pssSessionId;
      }
    }
    return this.encryptFreeTextInResponses(templateCode, responses).pipe(
      map(encryptedResponses => {
        if (!this.pseudonymizedKey) {
          console.warn('Pseudomized key is not set. The request will proceed without it.');
        }
        return {
          templateCode,
          responses: encryptedResponses,
          pseudonymizedKey: this.pseudonymizedKey || undefined,
          subject,
        };
      }),
      catchError(error => {
        console.error('Failed to create prescription request:', error);
        throw error;
      })
    );
  }

  protected handleCreateBulkResult(results: { trackId: number; status: LoadingStatus; error?: any; }[]): void {
    const successCount = results.filter((r) => r.status === LoadingStatus.SUCCESS).length;
    const failedCount = results.filter((r) => r.status === LoadingStatus.ERROR).length;
    if (failedCount === 0) {
      this.toastService.show(isPrescription(this.initialValues?.intent) ? 'prescription.create.allSuccess' : 'proposal.create.allSuccess', {interpolation: {count: successCount}});
      this.prescriptionsCreated.emit();
    } else if (successCount === 0) {
      if (isPrescription(this.initialValues?.intent)) {
        this.errorCard = {
          show: true,
          message: 'prescription.create.allFailed',
          translationOptions: {count: failedCount},
          errorResponse: undefined
        };
      } else {
        this.errorCard = {
          show: true,
          message: 'proposal.create.allFailed',
          translationOptions: {count: failedCount},
          errorResponse: undefined
        };
      }
      this.prescriptionForms.update((prescriptionForms) => prescriptionForms.map((t) => ({
        ...t,
        status: results.find((r) => r.trackId === t.trackId)?.status || t.status
      })));
      results.forEach((t, i) => console.error(i, t.error));
      this.loading.set(false);
    } else {
      if (isPrescription(this.initialValues?.intent)) {
        this.errorCard = {
          show: true,
          message: 'prescription.create.someSuccessSomeFailed',
          translationOptions: {successCount, failedCount},
          errorResponse: undefined
        };
      } else {
        this.errorCard = {
          show: true,
          message: 'proposal.create.someSuccessSomeFailed',
          translationOptions: {successCount, failedCount},
          errorResponse: undefined
        };
      }

      this.prescriptionForms.update((prescriptionForms) => prescriptionForms.map((t) => ({
        ...t,
        status: results.find((r) => r.trackId === t.trackId)?.status || t.status
      })));
      results.forEach((t, i) => t.status === LoadingStatus.ERROR && console.error(i, t.error));
      this.loading.set(false);
    }
  }

  cancelCreation(): void {
    if (this.prescriptionForms().length > 1) {
      this.dialog.open<CancelCreationDialog, CancelCreationDialogData, CancelCreationDialogResult>(CancelCreationDialog, {
        data: {prescriptionForms: this.prescriptionForms()}
      }).beforeClosed().subscribe(result => {
        if (!result) {
          return;
        } else if (result.formsToDelete.length === this.prescriptionForms().length) {
          this.clickCancel.emit();
        } else if (result.formsToDelete.length > 0) {
          this.prescriptionForms.update((prescriptionForms) => prescriptionForms.filter(f => !result.formsToDelete.includes(f.trackId)));
        }
      });
    } else {
      this.dialog.open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
        data: {
          messageLabel: 'prescription.create.cancelCreation',
          cancelLabel: 'common.close',
          okLabel: 'common.confirm'
        }
      }).beforeClosed()
        .pipe(filter(result => result === true))
        .subscribe(() => this.clickCancel.emit());
    }
  }

  modelSaved() {
    this.modelCreated.emit();
  }

  closeErrorCard(): void {
    this.errorCard = {
      show: false,
      message: '',
      errorResponse: undefined
    };
  }

  private loadWebComponents(): void {
    if (customElements.get('nihdi-referral-prescription-form') != undefined) {
      return;
    }

    const htmlCollection = document.getElementsByTagName('script');
    const script = Array.from(htmlCollection).find(e => e.src.includes('wc-create-prescription.js'));

    if (!script) return;
    const url = script.src.replace('wc-create-prescription.js', '');
    const scripts = [
      'assets/evf-form/evf-form.js'
    ];

    scripts.forEach((src) => {
      const script = this.renderer.createElement('script');
      script.type = `text/javascript`;
      script.src = url + src;
      script.type = 'module';
      this.renderer.appendChild(this._document.body, script);
    });
  }
}
