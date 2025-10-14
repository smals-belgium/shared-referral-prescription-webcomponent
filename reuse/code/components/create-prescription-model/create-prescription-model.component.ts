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
} from '@angular/core';
import { ElementGroup, removeNulls } from '@smals/vas-evaluation-form-ui-core';
import { TemplateNamePipe } from '@reuse/code/pipes/template-name.pipe';
import { IfStatusSuccessDirective } from '@reuse/code/directives/if-status-success.directive';
import { IfStatusErrorDirective } from '@reuse/code/directives/if-status-error.directive';
import { IfStatusLoadingDirective } from '@reuse/code/directives/if-status-loading.directive';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { CreatePrescriptionForm, DataState, LoadingStatus } from '@reuse/code/interfaces';
import { ErrorCardComponent } from '@reuse/code/components/error-card/error-card.component';
import { SuccessCardComponent } from '@reuse/code/components/success-card/success-card.component';
import { PrescriptionModelState } from '@reuse/code/states/helpers/prescriptionModel.state';
import { CreatePrescriptionModelDialog } from '@reuse/code/dialogs/create-prescription-modal/create-prescription-model.dialog';
import { MatDialog } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { PrescriptionModelService } from '@reuse/code/services/api/prescriptionModel.service';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { UniqueModelNameValidator } from '@reuse/code/directives/unique-model-name.directive';
import { isOccurrenceTiming } from '@reuse/code/utils/occurrence-timing.utils';
import { OverlaySpinnerComponent } from '@reuse/code/components/overlay-spinner/overlay-spinner.component';
import { FormDataType, FormElement, TemplateVersion } from '@reuse/code/openapi';
import TypeEnum = FormDataType.TypeEnum;

@Component({
  selector: 'app-create-prescription-model',
  templateUrl: './create-prescription-model.component.html',
  styleUrls: ['./create-prescription-model.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    ReactiveFormsModule,
    MatIcon,
    ErrorCardComponent,
    SuccessCardComponent,
    OverlaySpinnerComponent,
    MatFormField,
    MatInput,
    MatButton,
    MatLabel,
    TranslateModule,
    TemplateNamePipe,
    IfStatusSuccessDirective,
    IfStatusErrorDirective,
    IfStatusLoadingDirective,
  ],
})
export class CreatePrescriptionModelComponent implements OnDestroy, OnChanges {
  modelState = this.prescriptionModelState.modalState;

  @Input() lang!: string;
  @Input() prescriptionForm!: CreatePrescriptionForm;
  @Output() modelSaved = new EventEmitter<void>();

  titleControl = new FormControl<string>('', {
    validators: [control => Validators.required(control)],
    asyncValidators: [this.nameValidator.validate.bind(this.nameValidator)],
    updateOn: 'change',
  });

  constructor(
    private prescriptionModelState: PrescriptionModelState,
    private dialog: MatDialog,
    private prescriptionModalService: PrescriptionModelService,
    private nameValidator: UniqueModelNameValidator
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['prescriptionForm'] && this.prescriptionForm?.modelId) {
      this.titleControl.setValue(this.prescriptionForm.modelName || '');
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
        LoadingStatus.ERROR,
        undefined,
        new HttpErrorResponse({
          error: 'No templateCode found.',
        })
      );
    }
    const responses = this.getResponses(prescriptionForm);

    this.dialog
      .open<CreatePrescriptionModelDialog, unknown>(CreatePrescriptionModelDialog, {
        data: {
          template: template,
          templateCode: prescriptionForm.templateCode,
          responses: responses,
        },
      })
      .afterClosed()
      .subscribe((createdSuccessfully: boolean) => {
        if (createdSuccessfully) {
          this.modelSaved.emit();
        }
      });
  }

  handleUpdate(prescriptionForm: CreatePrescriptionForm, template?: TemplateVersion) {
    if (!template) {
      this.prescriptionModelState.setModalState(
        LoadingStatus.ERROR,
        undefined,
        new HttpErrorResponse({
          error: 'No templateCode found.',
        })
      );
    }

    if (!this.prescriptionForm.modelId) {
      this.prescriptionModelState.setModalState(
        LoadingStatus.ERROR,
        undefined,
        new HttpErrorResponse({
          error: 'No model id found.',
        })
      );
    }

    this.prescriptionModelState.setModalState(LoadingStatus.LOADING);
    const responses = this.getResponses(prescriptionForm);
    const name = this.titleControl.getRawValue() || '';

    this.prescriptionModalService
      .updateModel(this.prescriptionForm.modelId!, {
        name: name || '',
        responses: responses,
      })
      .subscribe({
        next: () => {
          this.modelSaved.emit();
        },
        error: (e: HttpErrorResponse) => {
          this.prescriptionModelState.setModalState(LoadingStatus.ERROR, undefined, e);
        },
      });
  }

  private filterElements(elements: FormElement[]): FormElement[] {
    return elements.reduce((filteredElements, element) => {
      if (element.subFormElements) {
        element.subFormElements = this.filterElements(element.subFormElements);
      }

      if (element.validations) {
        element.validations = element.validations.filter(validation => validation.name !== 'required');
      }

      const shouldInclude =
        !element.tags?.includes('freeText') &&
        !(element.dataType?.type === TypeEnum.Date) &&
        !(element.subFormElements && element.subFormElements.length === 0);

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

  ngOnDestroy() {
    this.prescriptionModelState.setInitialState();
  }

  protected readonly LoadingStatus = LoadingStatus;
}
