import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { ElementGroup, FormTemplate, isObject, removeNulls } from '@smals/vas-evaluation-form-ui-core';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';
import { FormatSsinPipe } from '../../pipes/format-ssin.pipe';
import { TemplateNamePipe } from '../../pipes/template-name.pipe';
import { IfStatusSuccessDirective } from '../../directives/if-status-success.directive';
import { IfStatusErrorDirective } from '../../directives/if-status-error.directive';
import { OverlaySpinnerComponent } from '../overlay-spinner/overlay-spinner.component';
import { IfStatusLoadingDirective } from '../../directives/if-status-loading.directive';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { LoadingStatus, Person } from '../../interfaces';
import { ErrorCardComponent } from '../error-card/error-card.component';
import { SuccessCardComponent } from '../success-card/success-card.component';
import { PrescriptionModelState } from '../../states/prescriptionModel.state';
import {
  CreatePrescriptionModelDialog
} from '../../dialogs/create-prescription-modal/create-prescription-model.dialog';
import { MatDialog } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { CreatePrescriptionForm } from '../../interfaces/create-prescription-form.interface';
import { ErrorCard } from '../../interfaces/error-card.interface';
import { isOccurrenceTiming } from '@reuse/code/utils/occurrence-timing.utils';
import { isModel, isPrescription, isProposal } from '@reuse/code/utils/utils';

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
    IfStatusLoadingDirective,
    OverlaySpinnerComponent,
    IfStatusErrorDirective,
    IfStatusSuccessDirective,
    TemplateNamePipe,
    FormatSsinPipe,
    ErrorCardComponent,
    SuccessCardComponent
  ]
})
export class CreateMultiplePrescriptionsComponent implements OnChanges, OnDestroy {

  readonly trackByFn = (index: number, item: CreatePrescriptionForm) => item?.trackId || index
  modelState = this.prescriptionModelState.modalState;

  isPrescriptionValue = false;

  @Input() lang!: string;
  @Input() intent!: string;
  @Input() patient?: Person;
  @Input() status: boolean = false;
  @Input() createPrescriptionForms: CreatePrescriptionForm[] = [];
  @Input() errorCard: ErrorCard = {
    show: false,
    message: '',
    errorResponse: undefined
  };

  @Output() clickAddPrescription = new EventEmitter<void>();
  @Output() clickDeletePrescription = new EventEmitter<{ form: CreatePrescriptionForm; templateName: string }>();
  @Output() clickPublish = new EventEmitter<void>();
  @Output() clickCancel = new EventEmitter<void>();
  @Input() services!: {
    getAccessToken: (audience?: string) => Promise<string | null>
  }

  @ViewChild(MatAccordion, {static: true}) accordion!: MatAccordion;

  constructor(private prescriptionModelState: PrescriptionModelState, private dialog: MatDialog) {
  }

  get numberOfPrescriptionsToCreate(): number {
    return this.createPrescriptionForms.filter((f) => f.status !== LoadingStatus.SUCCESS).length;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['createPrescriptionForms'] && this.createPrescriptionForms?.length === 1) {
      setTimeout(() => this.accordion.openAll(), 1);
    }
    this.isPrescriptionValue = isPrescription(this.intent);
  }

  mapResponsesToRepeatObject(responses: Record<string, unknown>) {
    if (!responses) return responses;

    const responseOccurrenceTiming: unknown = responses['occurrenceTiming'];
    const occurrenceTiming = isOccurrenceTiming(responseOccurrenceTiming) ? responseOccurrenceTiming : undefined;

    if(!occurrenceTiming) return responses;

    const repeat = occurrenceTiming.repeat;

    if (!repeat) return responses;

    if (!repeat.count) return {...responses, ...repeat};

    let dayPeriod = {};
    if(repeat.when) {
      if(Array.isArray(repeat.when)) {
        dayPeriod = {dayPeriod: repeat.when[0]};
      } else {
        dayPeriod = {dayPeriod: repeat.when};
      }
    }

    const maxSessions = {nbSessions: repeat.count};

    if (isObject(repeat.boundsDuration)) {
      delete repeat.boundsDuration;
    }

    return {...responses, ...maxSessions, ...dayPeriod, ...repeat};
  }

  setElementGroup(prescriptionForm: CreatePrescriptionForm, elementGroup: ElementGroup) {
    if (!prescriptionForm.elementGroup) {
      prescriptionForm.elementGroup = elementGroup;
    } else {
      const currentValues = prescriptionForm.elementGroup.getOutputValue() as Record<string, unknown>;
      elementGroup.setValue(currentValues);
    }

    if (prescriptionForm.initialPrescription || prescriptionForm.modelResponses) {
      const initialResponses = prescriptionForm.initialPrescription?.responses || prescriptionForm.modelResponses
      let responses: Record<string, unknown> = removeNulls(initialResponses || {}) as Record<string, unknown>;
      responses = this.mapResponsesToRepeatObject(responses)

      const currentValues = elementGroup.getOutputValue() as Record<string, unknown>;

      elementGroup.setValue({
        ...currentValues,
        ...responses
      });
    }
  }

  getResponses(prescriptionForm: CreatePrescriptionForm) {
    if (prescriptionForm.initialPrescription) {
      let responses: Record<string, unknown> = removeNulls(prescriptionForm.initialPrescription?.responses || {}) as Record<string, unknown>;
      responses = this.mapResponsesToRepeatObject(responses)

      const currentValues = prescriptionForm.elementGroup?.getOutputValue() as Record<string, unknown>;

      return {...currentValues, ...responses}
    } else {
      return prescriptionForm.elementGroup?.getOutputValue() as Record<string, unknown>;
    }
  }

  handleClick(prescriptionForm: CreatePrescriptionForm, template?: FormTemplate) {
    if(!template) {
      this.prescriptionModelState.setModalState(LoadingStatus.ERROR, undefined, new HttpErrorResponse({
        error: "No templateCode found."
      }))
    }
    const responses = this.getResponses(prescriptionForm);

    this.dialog.open<CreatePrescriptionModelDialog, unknown>(CreatePrescriptionModelDialog, {
      data: {
        template: template,
        templateCode: prescriptionForm.templateCode,
        responses: responses
      }
    }).afterClosed().subscribe((createdSuccessfully: boolean) => {
      if(createdSuccessfully){
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

    })
  }

  ngOnDestroy() {
    this.prescriptionModelState.setInitialState();
  }

  isPrescription(intent : string): boolean {
    return isPrescription(intent);
  }

  isProposal(intent : string): boolean {
    return isProposal(intent);
  }

  protected readonly LoadingStatus = LoadingStatus;
}
