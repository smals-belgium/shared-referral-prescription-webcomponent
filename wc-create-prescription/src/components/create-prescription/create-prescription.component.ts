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
  SimpleChanges
} from '@angular/core';
import { FormTemplate } from '@smals/vas-evaluation-form-ui-core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '@reuse/code/services/auth.service';
import { catchError, filter, forkJoin, mergeMap, Observable, of, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { DateAdapter } from '@angular/material/core';
import { DateTime } from 'luxon';
import {
  CancelCreationDialog,
  CancelCreationDialogData,
  CancelCreationDialogResult
} from '@reuse/code/dialogs/cancel-creation/cancel-creation.dialog';
import { CreatePrescriptionRequest, DataState, LoadingStatus, ReadPrescription } from '@reuse/code/interfaces';
import {
  CreateMultiplePrescriptionsComponent,
  CreatePrescriptionForm
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
import { AsyncPipe, DOCUMENT, NgIf } from '@angular/common';
import { PseudoService } from '@reuse/code/services/pseudo.service';
import { AccessMatrixState } from '@reuse/code/states/access-matrix.state';
import { TemplatesState } from '@reuse/code/states/templates.state';
import { PatientState } from '@reuse/code/states/patient.state';
import { TemplateVersionsState } from '@reuse/code/states/template-versions.state';
import { WcConfigurationService } from '@reuse/code/services/wc-configuration.service';
import { ProposalService } from '@reuse/code/services/proposal.service';

@Component({
  templateUrl: './create-prescription.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NgIf,
    IfStatusSuccessDirective,
    CreateMultiplePrescriptionsComponent,
    OverlaySpinnerComponent,
    AsyncPipe,
    TranslateModule
  ]
})
export class CreatePrescriptionWebComponent implements OnChanges {

  private readonly appUrl = this.configService.getEnvironmentVariable('appUrl');
  private trackId = 0;

  readonly patientState$ = this.patientStateService.state;
  prescriptionForms = signal<CreatePrescriptionForm[]>([]);
  loading = signal(false);

  @HostBinding('attr.lang')
  @Input() lang = 'fr-BE';
  @Input() initialPrescriptionType?: string;
  @Input() initialPrescription?: ReadPrescription;
  @Input() patientSsin!: string;
  @Input() getToken!: () => Promise<string>;
  @Input() intent!: string;

  @Output() prescriptionsCreated = new EventEmitter<void>();
  @Output() clickCancel = new EventEmitter<void>();

  constructor(
    private authService: AuthService,
    private dialog: MatDialog,
    private translate: TranslateService,
    private dateAdapter: DateAdapter<DateTime>,
    private toastService: ToastService,
    private accessMatrixStateService: AccessMatrixState,
    private templatesStateService: TemplatesState,
    private templateVersionsStateService: TemplateVersionsState,
    private patientStateService: PatientState,
    private pseudoService: PseudoService,
    private prescriptionService: PrescriptionService,
    private proposalService: ProposalService,
    private configService: WcConfigurationService,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private _document: Document
  ) {
    this.dateAdapter.setLocale('fr-BE');
    this.translate.setDefaultLang('fr-BE');
    this.translate.use('fr-BE')
    this.loadWebComponents();
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
    if (changes['patientSsin']) {
      this.patientStateService.loadPatient(this.patientSsin);
    }
    if (changes['initialPrescriptionType']?.firstChange && this.initialPrescriptionType) {
      this.addPrescriptionForm(this.initialPrescriptionType, this.initialPrescription);
    }
  }

  addPrescription(): void {
    this.dialog.open<ChooseTemplateDialog, any, NewPrescriptionDialogResult>(ChooseTemplateDialog, {
      maxWidth: '100vw',
      width: '500px',
      autoFocus: false
    })
      .beforeClosed()
      .pipe(filter((result) => result?.templateCode != null))
      .subscribe((result) => this.addPrescriptionForm(result!.templateCode));
  }

  private addPrescriptionForm(templateCode: string, initialPrescription?: ReadPrescription): void {
    this.templateVersionsStateService.loadTemplateVersion(templateCode);
    this.prescriptionForms.update((prescriptionForms) => [
      ...prescriptionForms,
      {
        trackId: this.trackId++,
        templateCode: templateCode,
        formTemplateState$: this.getPrescriptionTemplateStream(templateCode),
        initialPrescription
      }
    ]);
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
      if (this.prescriptionForms.length === 1) {
        this.publishOnePrescription();
      } else {
        this.publishMultiplePrescriptions();
      }
    }
  }

  private getPatientIdentifier(): Promise<string> {
    return this.pseudoService.pseudonymize(this.patientSsin);
  }

  private publishOnePrescription(): void {
    const prescriptionForm = this.prescriptionForms()[0];
    this.getPatientIdentifier().then(identifier => {
      const createPrescriptionRequest = this.toCreatePrescriptionRequest(
        prescriptionForm.templateCode,
        prescriptionForm.elementGroup!.getOutputValue(),
        identifier
      )

      if(this.intent == 'order') {
        this.prescriptionService.create(createPrescriptionRequest).subscribe({
          next: () => {
            this.toastService.show('prescription.create.success');
            this.prescriptionsCreated.emit();
          },
          error: (err) => {
            console.error(err);
            this.toastService.showSomethingWentWrong();
            this.loading.set(false);
          }
        })
      }
      else{
        this.proposalService.create(createPrescriptionRequest).subscribe({
          next: () => {
            this.toastService.show('proposal.create.success');
            this.prescriptionsCreated.emit();
          },
          error: (err) => {
            console.error(err);
            this.toastService.showSomethingWentWrong();
            this.loading.set(false);
          }
        })
      }
    })
  }

  private publishMultiplePrescriptions(): void {
    this.loading.set(true);
    this.getPatientIdentifier().then(identifier => {
      forkJoin(this.mapToCreatePrescriptionStreams(identifier)).subscribe((results) => this.handleCreateBulkResult(results))
    })
  }

  private mapToCreatePrescriptionStreams(identifier: string): Observable<{
    trackId: number;
    status: LoadingStatus;
    error?: any;
  }>[] {
    return this.prescriptionForms()
      .filter((f) => f.status !== LoadingStatus.SUCCESS)
      .map((f) => {
        const createPrescriptionRequest = this.toCreatePrescriptionRequest(f.templateCode, f.elementGroup!.getOutputValue(), identifier);
        if(this.intent == 'order') {
          return this.prescriptionService.create(createPrescriptionRequest).pipe(
            map(() => ({trackId: f.trackId, status: LoadingStatus.SUCCESS, error: undefined})),
            catchError((error) => {
              console.error(error);
              return of({trackId: f.trackId, status: LoadingStatus.ERROR, error})
            })
          );
        }
        else{
          return this.proposalService.create(createPrescriptionRequest).pipe(
            map(() => ({trackId: f.trackId, status: LoadingStatus.SUCCESS, error: undefined})),
            catchError((error) => {
              console.error(error);
              return of({trackId: f.trackId, status: LoadingStatus.ERROR, error})
            })
          );
        }

      });
  }

  private toCreatePrescriptionRequest(templateCode: string, responses: Record<string, any>, subject: string): CreatePrescriptionRequest {
    return {
      templateCode,
      responses,
      subject
    }
  }

  private handleCreateBulkResult(results: { trackId: number; status: LoadingStatus; error?: any; }[]): void {
    const successCount = results.filter((r) => r.status === LoadingStatus.SUCCESS).length;
    const failedCount = results.filter((r) => r.status === LoadingStatus.ERROR).length;
    if (failedCount === 0) {
      if(this.intent == 'order') {
        this.toastService.show('prescription.create.allSuccess', {interpolation: {count: successCount}});
      }
      else{
        this.toastService.show('proposal.create.allSuccess', {interpolation: {count: successCount}});
      }
      this.prescriptionsCreated.emit();
    } else if (successCount === 0) {
      if(this.intent == 'order') {
        this.toastService.show('prescription.create.allFailed', {interpolation: {count: failedCount}});
      }
      else{
        this.toastService.show('proposal.create.allFailed', {interpolation: {count: failedCount}});
      }
      this.prescriptionForms.update((prescriptionForms) => prescriptionForms.map((t) => ({
        ...t,
        status: results.find((r) => r.trackId === t.trackId)?.status || t.status
      })));
      results.forEach((t, i) => console.error(i, t.error));
      this.loading.set(false);
    } else {
      if(this.intent == 'order') {
        this.toastService.show('prescription.create.someSuccessSomeFailed', {
          interpolation: {successCount, failedCount}
        });
      }
      else{
        this.toastService.show('proposal.create.someSuccessSomeFailed', {
          interpolation: {successCount, failedCount}
        });
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
    if (this.prescriptionForms.length > 1) {
      this.dialog.open<CancelCreationDialog, CancelCreationDialogData, CancelCreationDialogResult>(CancelCreationDialog, {
        data: {prescriptionForms: this.prescriptionForms()}
      }).beforeClosed().subscribe(result => {
        if (!result) {
          return;
        } else if (result.formsToDelete.length === this.prescriptionForms.length) {
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

  private loadWebComponents(): void {
    if (customElements.get('nihdi-referral-prescription-form') != undefined) {
      return;
    }

    const htmlCollection = document.getElementsByTagName('script');
    const script = Array.from(htmlCollection).find(e => e.src.includes('wc-create-prescription.js'))

    if(!script) return;
    const url = script.src.replace('wc-create-prescription.js','');
    const scripts = [
      'assets/evf-form/evf-form.js'
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
