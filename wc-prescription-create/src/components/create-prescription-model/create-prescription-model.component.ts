import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { ElementGroup, removeNulls } from '@smals/vas-evaluation-form-ui-core';
import { TemplateNamePipe } from '@reuse/code/pipes/template-name.pipe';
import { OverlaySpinnerComponent } from '@reuse/code/components/progress-indicators/overlay-spinner/overlay-spinner.component';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { AlertType, DataState, LoadingStatus } from '@reuse/code/interfaces';
import { AlertComponent } from '@reuse/code/components/alert-component/alert.component';
import { PrescriptionModelState } from '@reuse/code/states/helpers/prescriptionModel.state';
import { HttpErrorResponse } from '@angular/common/http';
import { CreatePrescriptionForm } from '@reuse/code/interfaces/create-prescription-form.interface';
import { PrescriptionModelService } from '@reuse/code/services/api/prescriptionModel.service';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import {
  nameValidatorWithOriginal,
  UniqueModelNameValidator,
} from '@reuse/code/directives/unique-model-name.directive';
import { isOccurrenceTiming } from '@reuse/code/utils/occurrence-timing.utils';
import { FormDataType, FormElement, TemplateVersion } from '@reuse/code/openapi';
import TypeEnum = FormDataType.TypeEnum;
import { EvfFormWebComponent } from '../evf-form/evf-form.component';

@Component({
  selector: 'app-create-prescription-model',
  templateUrl: './create-prescription-model.component.html',
  styleUrls: ['./create-prescription-model.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    ReactiveFormsModule,
    MatIcon,
    AlertComponent,
    OverlaySpinnerComponent,
    MatFormField,
    MatInput,
    MatButton,
    MatLabel,
    TranslateModule,
    TemplateNamePipe,
    MatError,
    EvfFormWebComponent,
  ],
})
export class CreatePrescriptionModelComponent implements OnDestroy, OnChanges {
  protected readonly LoadingStatus = LoadingStatus;
  protected readonly AlertType = AlertType;

  @Input() lang!: string;
  @Input() prescriptionForm!: CreatePrescriptionForm;
  @Output() modelSaved = new EventEmitter<void>();

  originalName = signal<string>('');

  titleControl = new FormControl<string>('', {
    validators: [control => Validators.required(control)],
    asyncValidators: [nameValidatorWithOriginal(this.nameValidator, () => this.originalName())],
    updateOn: 'change',
  });

  constructor(
    private readonly prescriptionModelState: PrescriptionModelState,
    private readonly prescriptionModalService: PrescriptionModelService,
    private readonly nameValidator: UniqueModelNameValidator
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['prescriptionForm'] && this.prescriptionForm?.modelId) {
      this.titleControl.setValue(this.prescriptionForm.modelName || '');
      this.originalName.set(this.prescriptionForm?.modelName || '');
      this.titleControl.markAsTouched();
    }
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
      if (Array.isArray(repeat.when)) {
        dayPeriod = { dayPeriod: repeat.when[0] };
      } else {
        dayPeriod = { dayPeriod: repeat.when };
      }
    }

    const maxSessions = { nbSessions: repeat.count };
    return { ...responses, ...maxSessions, ...dayPeriod, ...repeat };
  }

  setElementGroup(prescriptionForm: CreatePrescriptionForm, elementGroup: ElementGroup) {
    prescriptionForm.elementGroup = elementGroup;
    if (prescriptionForm.modelResponses) {
      const initialResponses = prescriptionForm.modelResponses;
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
    if (prescriptionForm.modelResponses) {
      let responses: Record<string, unknown> = removeNulls(prescriptionForm.modelResponses || {}) as Record<
        string,
        unknown
      >;
      responses = this.mapResponsesToRepeatObject(responses);
      return { ...responses, ...prescriptionForm.elementGroup?.getOutputValue() } as Record<string, unknown>;
    } else {
      return prescriptionForm.elementGroup?.getOutputValue() as Record<string, unknown>;
    }
  }

  handleClick(prescriptionForm: CreatePrescriptionForm, template?: TemplateVersion) {
    if (!template) {
      this.prescriptionModelState.setModalState(
        prescriptionForm.trackId,
        LoadingStatus.ERROR,
        undefined,
        new HttpErrorResponse({
          error: 'No templateCode found.',
        })
      );
    }

    this.createPrescriptionModel(prescriptionForm);
  }

  createPrescriptionModel(prescriptionForm: CreatePrescriptionForm): void {
    this.titleControl.markAllAsTouched();

    if (this.titleControl.valid) {
      const responses = this.getResponses(prescriptionForm);
      const name = this.titleControl.getRawValue() || '';

      this.prescriptionModelState.setModalState(prescriptionForm.trackId, LoadingStatus.LOADING);

      this.prescriptionModalService
        .createModel({
          name: name,
          templateCode: prescriptionForm.templateCode,
          responses: responses,
        })
        .subscribe({
          next: () => {
            this.prescriptionModelState.setModalState(
              prescriptionForm.trackId,
              LoadingStatus.SUCCESS,
              name || undefined
            );
            this.modelSaved.emit();
          },
          error: (e: HttpErrorResponse) => {
            this.prescriptionModelState.setModalState(prescriptionForm.trackId, LoadingStatus.ERROR, undefined, e);
            this.modelSaved.emit(undefined);
          },
        });
    }
  }

  handleUpdate(prescriptionForm: CreatePrescriptionForm, template?: TemplateVersion) {
    if (!template) {
      this.prescriptionModelState.setModalState(
        prescriptionForm.trackId,
        LoadingStatus.ERROR,
        undefined,
        new HttpErrorResponse({
          error: 'No templateCode found.',
        })
      );
      return;
    }

    if (!this.prescriptionForm.modelId) {
      this.prescriptionModelState.setModalState(
        prescriptionForm.trackId,
        LoadingStatus.ERROR,
        undefined,
        new HttpErrorResponse({
          error: 'No model id found.',
        })
      );
      return;
    }

    this.titleControl.markAllAsTouched();

    if (this.titleControl.valid) {
      this.prescriptionModelState.setModalState(prescriptionForm.trackId, LoadingStatus.LOADING);
      const responses = this.getResponses(prescriptionForm);
      const name = this.titleControl.getRawValue() || '';

      this.prescriptionModalService
        .updateModel(this.prescriptionForm.modelId, {
          name: name || '',
          responses: responses,
        })
        .subscribe({
          next: () => {
            this.modelSaved.emit();
          },
          error: (e: HttpErrorResponse) => {
            this.prescriptionModelState.setModalState(prescriptionForm.trackId, LoadingStatus.ERROR, undefined, e);
          },
        });
    } else {
      this.prescriptionModelState.setModalState(prescriptionForm.trackId, LoadingStatus.UPDATING);
    }
  }

  private filterElements(elements: FormElement[]): FormElement[] {
    return elements
      .filter(value => !value.tags?.map(tag => tag.toLowerCase()).includes('notinmodels'))
      .reduce((filteredElements, element) => {
        if (element.elements) {
          element.elements = this.filterElements(element.elements);
        }

        if (element.validations) {
          element.validations = element.validations.filter(validation => validation.name !== 'required');
        }

        const shouldInclude =
          !(element.dataType?.type === TypeEnum.Date) && !(element.elements && element.elements.length === 0);

        if (shouldInclude) {
          filteredElements.push(element);
        }

        return filteredElements;
      }, [] as FormElement[]);
  }

  getTemplateData(formTemplateState: DataState<TemplateVersion>) {
    if (formTemplateState.data?.elements) {
      formTemplateState.data.elements = this.filterElements(formTemplateState.data?.elements);
    }

    return formTemplateState.data;
  }

  getModelState(trackById: number) {
    return this.prescriptionModelState.getModalState(trackById);
  }

  ngOnDestroy() {
    this.prescriptionModelState.resetAll();
  }
}
