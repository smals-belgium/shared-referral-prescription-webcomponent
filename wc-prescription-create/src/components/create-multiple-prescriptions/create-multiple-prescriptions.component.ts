import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  QueryList,
  signal,
  SimpleChanges,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { ElementGroup, isObject, removeNulls } from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { MatAccordion, MatExpansionModule, MatExpansionPanel } from '@angular/material/expansion';
import { TemplateNamePipe } from '@reuse/code/pipes/template-name.pipe';
import { OverlaySpinnerComponent } from '@reuse/code/components/progress-indicators/overlay-spinner/overlay-spinner.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { AlertType, CreatePrescriptionForm, LoadingStatus } from '@reuse/code/interfaces';
import { AlertComponent } from '@reuse/code/components/alert-component/alert.component';
import { PrescriptionModelState } from '@reuse/code/states/helpers/prescriptionModel.state';
import { CreatePrescriptionModelComponent } from '@reuse/code/components/create-prescription-modal/create-prescription-model.component';
import { isOccurrenceTiming } from '@reuse/code/utils/occurrence-timing.utils';
import { isPrescription, isProposal } from '@reuse/code/utils/utils';
import { PersonResource } from '@reuse/code/openapi';
import { PatientInfoBarComponent } from '../patient-info-bar/patient-info-bar.component';
import { EvfFormWebComponent } from '../evf-form/evf-form.component';
import { MatCheckbox } from '@angular/material/checkbox';
import { TranslateByElementPipe } from '@reuse/code/pipes/translate-by-element.pipe';
import { MarkdownModule } from 'ngx-markdown';
import { GetErrorMessagesFromFormPipe } from '@reuse/code/pipes/get-error-messages-from-form.pipe';
import { AlertService } from '@reuse/code/services/helpers/alert.service';
import { ALERT_TARGET } from '@reuse/code/constants/error';

@Component({
  selector: 'app-create-multiple-prescriptions',
  templateUrl: './create-multiple-prescriptions.component.html',
  styleUrls: ['./create-multiple-prescriptions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    TranslateModule,
    MatExpansionModule,
    MatIconModule,
    MatButtonModule,
    OverlaySpinnerComponent,
    TemplateNamePipe,
    AlertComponent,
    EvfFormWebComponent,
    PatientInfoBarComponent,
    MatCheckbox,
    CreatePrescriptionModelComponent,
    TranslateByElementPipe,
    MarkdownModule,
    GetErrorMessagesFromFormPipe,
  ],
  providers: [GetErrorMessagesFromFormPipe],
})
export class CreateMultiplePrescriptionsComponent implements OnChanges, OnDestroy {
  private readonly getErrorMessagesPipe = inject(GetErrorMessagesFromFormPipe);
  private readonly alertService = inject(AlertService);
  private readonly alertTarget = inject(ALERT_TARGET);

  protected readonly pageError = this.alertService.setTarget(this.alertTarget);

  protected readonly LoadingStatus = LoadingStatus;
  protected readonly AlertType = AlertType;

  modelStates = this.prescriptionModelState.modalStates;
  checkedPrescriptions = signal<Set<number>>(new Set());
  expandedTrackId?: number;

  isPrescriptionValue = false;

  @Input() lang!: string;
  @Input() intent!: string;
  @Input() patient?: PersonResource;
  @Input() status: boolean = false;
  @Input() createPrescriptionForms: CreatePrescriptionForm[] = [];

  @Output() clickAddPrescription = new EventEmitter<void>();
  @Output() clickDeletePrescription = new EventEmitter<{ form: CreatePrescriptionForm; templateName: string }>();
  @Output() clickPublish = new EventEmitter<void>();
  @Output() clickCancel = new EventEmitter<void>();
  @Input() services!: {
    getAccessToken: (audience?: string) => Promise<string | null>;
  };

  @ViewChild(MatAccordion, { static: true }) accordion!: MatAccordion;
  @ViewChildren(MatExpansionPanel) panels!: QueryList<MatExpansionPanel>;
  constructor(
    private readonly prescriptionModelState: PrescriptionModelState,
    private readonly host: ElementRef<HTMLElement>
  ) {}

  get numberOfPrescriptionsToCreate(): number {
    return this.createPrescriptionForms.filter(f => f.status !== LoadingStatus.SUCCESS).length;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['createPrescriptionForms']) {
      const previousForms = changes['createPrescriptionForms'].previousValue as CreatePrescriptionForm[] | undefined;
      const newFormWasAdded = (previousForms?.length ?? 0) < this.createPrescriptionForms.length;

      if (this.createPrescriptionForms?.length === 1) {
        this.expandedTrackId = this.createPrescriptionForms[0].trackId;
        queueMicrotask(() => this.panels?.first?.open());
        this.scrollToTop();
      } else if (newFormWasAdded) {
        this.expandedTrackId = this.createPrescriptionForms.at(-1)?.trackId;
        if (this.expandedTrackId !== undefined) {
          this.openPanelByTrackId(this.expandedTrackId);
        }
      } else {
        this.expandedTrackId = this.getExpandedTrackId();
        this.scrollToTop();
      }
    }
    this.isPrescriptionValue = isPrescription(this.intent);
  }

  mapResponsesToRepeatObject(responses: Record<string, unknown>) {
    if (!responses) return responses;

    const responseOccurrenceTiming: unknown = responses['occurrenceTiming'];
    const occurrenceTiming = isOccurrenceTiming(responseOccurrenceTiming) ? responseOccurrenceTiming : undefined;

    if (!occurrenceTiming) return responses;

    const repeat = occurrenceTiming.repeat;

    if (!repeat) return responses;

    if (!repeat.count) return { ...responses, ...repeat };

    let dayPeriod = {};
    if (repeat.when) {
      dayPeriod = { dayPeriod: repeat.when };
    }

    const maxSessions = { nbSessions: repeat.count };

    if (isObject(repeat.boundsDuration)) {
      delete repeat.boundsDuration;
    }

    return { ...responses, ...maxSessions, ...dayPeriod, ...repeat };
  }

  setElementGroup(prescriptionForm: CreatePrescriptionForm, elementGroup: ElementGroup) {
    if (!prescriptionForm.elementGroup) {
      prescriptionForm.elementGroup = elementGroup;
    } else {
      const currentValues = prescriptionForm.elementGroup.getOutputValue() as Record<string, unknown>;
      elementGroup.setValue(currentValues);
    }
    if (prescriptionForm.initialPrescription || prescriptionForm.modelResponses) {
      const initialResponses = prescriptionForm.initialPrescription?.responses || prescriptionForm.modelResponses;
      let responses: Record<string, unknown> = removeNulls(initialResponses || {}) as Record<string, unknown>;
      responses = this.mapResponsesToRepeatObject(responses);

      const currentValues = elementGroup.getOutputValue() as Record<string, unknown>;

      elementGroup.setValue({
        ...currentValues,
        ...responses,
      });
    }
  }

  getResponses(prescriptionForm: CreatePrescriptionForm) {
    if (prescriptionForm.initialPrescription) {
      let responses: Record<string, unknown> = removeNulls(
        prescriptionForm.initialPrescription?.responses || {}
      ) as Record<string, unknown>;
      responses = this.mapResponsesToRepeatObject(responses);

      const currentValues = prescriptionForm.elementGroup?.getOutputValue() as Record<string, unknown>;

      return { ...currentValues, ...responses };
    } else {
      return prescriptionForm.elementGroup?.getOutputValue() as Record<string, unknown>;
    }
  }

  handleModelSaved(modelId?: string) {
    if (modelId) {
      globalThis.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getModelState(trackById: number) {
    return this.prescriptionModelState.getModalState(trackById);
  }

  toggleCheckbox(prescriptionTrackById: number, checked: boolean) {
    this.checkedPrescriptions.update(set => {
      const updated = new Set(set);
      if (checked) {
        updated.add(prescriptionTrackById);
      } else {
        updated.delete(prescriptionTrackById);
      }
      return updated;
    });
  }

  isChecked(prescriptionTrackById: number): boolean {
    return this.checkedPrescriptions().has(prescriptionTrackById);
  }

  isPrescription(intent: string): boolean {
    return isPrescription(intent);
  }

  isProposal(intent: string): boolean {
    return isProposal(intent);
  }

  isPanelExpanded(trackId: number, last: boolean): boolean {
    return this.expandedTrackId !== undefined ? this.expandedTrackId === trackId : last;
  }

  private getLastPrescriptionWithErrors() {
    for (let index = this.createPrescriptionForms.length - 1; index >= 0; index--) {
      const form = this.createPrescriptionForms[index];
      if (form.errors && Object.keys(form.errors).length) {
        return form;
      }
    }
    return undefined;
  }

  private getExpandedTrackId(): number | undefined {
    const lastPrescriptionWithErrors = this.getLastPrescriptionWithErrors();
    if (lastPrescriptionWithErrors) {
      return lastPrescriptionWithErrors.trackId;
    }
    return this.createPrescriptionForms.at(-1)?.trackId;
  }

  private openPanelByTrackId(trackId: number) {
    const panelIndex = this.createPrescriptionForms.findIndex(form => form.trackId === trackId);
    if (panelIndex < 0) return;

    queueMicrotask(() => this.panels?.get(panelIndex)?.open());
  }

  private getPanelByTrackId(trackId: number): MatExpansionPanel | undefined {
    const panelIndex = this.createPrescriptionForms.findIndex(form => form.trackId === trackId);
    if (panelIndex < 0) return undefined;

    return this.panels?.get(panelIndex);
  }

  scrollToTop() {
    const lastFormWithErrors = this.getLastPrescriptionWithErrors();
    if (lastFormWithErrors && lastFormWithErrors.errors) {
      this.openPanelByTrackId(lastFormWithErrors.trackId);
      const messages = this.getErrorMessagesPipe.transform(
        lastFormWithErrors.errors,
        lastFormWithErrors.formTemplateState$().data
      );
      if (messages.length === 1) {
        const id = messages[0].id;
        if (id) this.scrollTo(id, lastFormWithErrors.trackId);
      } else {
        this.scrollTo(undefined, lastFormWithErrors.trackId);
      }
    }
  }

  scrollTo(elementId?: string, trackId?: number) {
    const shadow = this.host.nativeElement;
    const scrollToTarget = () => {
      const wrapper = trackId ? shadow?.querySelector(`#mat-expension-panel-${trackId}`) : shadow;
      const target = elementId ? wrapper?.querySelector(`[data-evf-element-id="${elementId}"]`) : wrapper;

      if (!target) return;

      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    if (trackId !== undefined) {
      const panel = this.getPanelByTrackId(trackId);
      if (panel && !panel.expanded) {
        const subscription = panel.afterExpand.subscribe(() => {
          subscription.unsubscribe();
          scrollToTarget();
        });
        panel.open();
        return;
      }
    }

    scrollToTarget();
  }

  protected dismissError() {
    this.alertService.clear(this.alertTarget);
  }

  ngOnDestroy() {
    this.prescriptionModelState.resetAll();
    this.clearAlertService();
  }

  clearAlertService() {
    this.alertService.resetActive();
    this.alertService.remove(this.alertTarget);
  }
}
