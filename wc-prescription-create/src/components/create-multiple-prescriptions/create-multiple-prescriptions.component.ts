import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  EventEmitter,
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
import { ErrorCard } from '@reuse/code/interfaces/error-card.interface';
import { PatientInfoBarComponent } from '../patient-info-bar/patient-info-bar.component';
import { EvfFormWebComponent } from '../evf-form/evf-form.component';
import { MatCheckbox } from '@angular/material/checkbox';

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
  ],
})
export class CreateMultiplePrescriptionsComponent implements OnChanges, OnDestroy {
  protected readonly LoadingStatus = LoadingStatus;
  protected readonly AlertType = AlertType;

  readonly trackByFn = (item: CreatePrescriptionForm) => item.trackId;
  modelStates = this.prescriptionModelState.modalStates;
  checkedPrescriptions = signal<Set<number>>(new Set());

  isPrescriptionValue = false;

  @Input() lang!: string;
  @Input() intent!: string;
  @Input() patient?: PersonResource;
  @Input() status: boolean = false;
  @Input() createPrescriptionForms: CreatePrescriptionForm[] = [];
  @Input() errorCard: ErrorCard = {
    show: false,
    message: '',
    errorResponse: undefined,
  };

  @Output() clickAddPrescription = new EventEmitter<void>();
  @Output() clickDeletePrescription = new EventEmitter<{ form: CreatePrescriptionForm; templateName: string }>();
  @Output() clickPublish = new EventEmitter<void>();
  @Output() clickCancel = new EventEmitter<void>();
  @Input() services!: {
    getAccessToken: (audience?: string) => Promise<string | null>;
  };

  @ViewChild(MatAccordion, { static: true }) accordion!: MatAccordion;
  @ViewChildren(MatExpansionPanel) panels!: QueryList<MatExpansionPanel>;
  constructor(private readonly prescriptionModelState: PrescriptionModelState) {}

  get numberOfPrescriptionsToCreate(): number {
    return this.createPrescriptionForms.filter(f => f.status !== LoadingStatus.SUCCESS).length;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['createPrescriptionForms'] && this.createPrescriptionForms?.length === 1) {
      queueMicrotask(() => this.panels?.first?.open());
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  ngOnDestroy() {
    this.prescriptionModelState.resetAll();
  }

  isPrescription(intent: string): boolean {
    return isPrescription(intent);
  }

  isProposal(intent: string): boolean {
    return isProposal(intent);
  }
}
