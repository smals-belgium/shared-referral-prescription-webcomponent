import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA, EventEmitter,
  Input, OnChanges,
  OnDestroy, Output,
  SimpleChanges,
} from '@angular/core';
import { ElementGroup, FormElement, FormTemplate, removeNulls } from '@smals/vas-evaluation-form-ui-core';
import { TemplateNamePipe } from '../../pipes/template-name.pipe';
import { IfStatusSuccessDirective } from '../../directives/if-status-success.directive';
import { IfStatusErrorDirective } from '../../directives/if-status-error.directive';
import { OverlaySpinnerComponent } from '../overlay-spinner/overlay-spinner.component';
import { IfStatusLoadingDirective } from '../../directives/if-status-loading.directive';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { DataState, LoadingStatus, OccurrenceTiming } from '../../interfaces';
import { ErrorCardComponent } from '../error-card/error-card.component';
import { SuccessCardComponent } from '../success-card/success-card.component';
import { PrescriptionModelState } from '../../states/prescriptionModel.state';
import {
  CreatePrescriptionModelDialog
} from '../../dialogs/create-prescription-modal/create-prescription-model.dialog';
import { MatDialog } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { CreatePrescriptionForm } from '../../interfaces/create-prescription-form.interface';
import { PrescriptionModelService } from '../../services/prescription-model.service';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { UniqueModelNameValidator } from '../../directives/unique-model-name.directive';


@Component({
  selector: 'app-create-prescription-model',
  templateUrl: './create-prescription-model.component.html',
  styleUrls: ['./create-prescription-model.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
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
    IfStatusLoadingDirective
  ]
})
export class CreatePrescriptionModelComponent implements OnDestroy, OnChanges {

  modelState = this.prescriptionModelState.modalState;

  @Input() lang!: string;
  @Input() prescriptionForm!: CreatePrescriptionForm;
  @Output() modelSaved = new EventEmitter<void>();

  titleControl = new FormControl<string>('', {
    validators: Validators.required,
    asyncValidators: [this.nameValidator.validate.bind(this.nameValidator)],
    updateOn: 'change'
  });
  constructor(private prescriptionModelState: PrescriptionModelState, private dialog: MatDialog, private prescriptionModalService: PrescriptionModelService,
              private nameValidator: UniqueModelNameValidator) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['prescriptionForm'] && this.prescriptionForm?.modelId) {
      this.titleControl.setValue(this.prescriptionForm.modelName || '');
    }
  }

  mapResponsesToRepeatObject(responses: Record<string, any>) {
    const occurrenceTiming: OccurrenceTiming = responses['occurrenceTiming']
    if(!occurrenceTiming) return responses;

    const repeat = occurrenceTiming.repeat
    if(!repeat) return responses

    if(!repeat.count) return {...responses, ...repeat}

    let dayPeriod = {}
    if(repeat.when) {
      if(Array.isArray(repeat.when)) {
        dayPeriod = { dayPeriod: repeat.when[0] }
      } else {
        dayPeriod = { dayPeriod: repeat.when }
      }
    }

    const maxSessions = {nbSessions: repeat.count}
    return {...responses, ...maxSessions, ...dayPeriod, ...repeat}
  }

  setElementGroup(prescriptionForm: CreatePrescriptionForm, elementGroup: ElementGroup) {
    prescriptionForm.elementGroup = elementGroup;
    if (prescriptionForm.modelResponses) {
      const initialResponses = prescriptionForm.modelResponses
      let responses = removeNulls(initialResponses || {});
      responses = this.mapResponsesToRepeatObject(responses)
      elementGroup.setValue({
        ...elementGroup.getOutputValue(),
        ...responses
      });
    }
  }

  getResponses(prescriptionForm: CreatePrescriptionForm) {
    if (prescriptionForm.modelResponses) {
      let responses = removeNulls(prescriptionForm.modelResponses || {});
      responses = this.mapResponsesToRepeatObject(responses)
      return {...responses, ...prescriptionForm.elementGroup?.getOutputValue()}
    } else {
      return prescriptionForm.elementGroup?.getOutputValue();
    }
  }

  handleClick(prescriptionForm: CreatePrescriptionForm, template?: FormTemplate) {
    if(!template) {
      this.prescriptionModelState.setModalState(LoadingStatus.ERROR, undefined, new HttpErrorResponse({
        error: "No templateCode found."
      }))
    }
    const responses = this.getResponses(prescriptionForm);

    this.dialog.open<CreatePrescriptionModelDialog, any>(CreatePrescriptionModelDialog, {
      data: {
        template: template,
        templateCode: prescriptionForm.templateCode,
        responses: responses
      }
    }).afterClosed().subscribe((createdSuccessfully: boolean) => {
      if(createdSuccessfully){
        this.modelSaved.emit()
      }

    })
  }

  handleUpdate(prescriptionForm: CreatePrescriptionForm, template?: FormTemplate) {
    if(!template) {
      this.prescriptionModelState.setModalState(LoadingStatus.ERROR, undefined, new HttpErrorResponse({
        error: "No templateCode found."
      }))
    }

    if(!this.prescriptionForm.modelId) {
      this.prescriptionModelState.setModalState(LoadingStatus.ERROR, undefined, new HttpErrorResponse({
        error: "No model id found."
      }))
    }

    this.prescriptionModelState.setModalState(LoadingStatus.LOADING)
    const responses = this.getResponses(prescriptionForm);
    const name = this.titleControl.getRawValue() || '';

    this.prescriptionModalService.updateModel(
      this.prescriptionForm.modelId!,
      {
      name: name || '',
      responses: responses
    })
      .subscribe({
        next: () => {
          this.modelSaved.emit()
        },
        error: (e: any) => {
          this.prescriptionModelState.setModalState(LoadingStatus.ERROR, undefined, e);
        }
      });
  }

  private filterElements(elements: FormElement[]) {
    return elements
      .map(element => {
        if (element.elements) {
          element.elements = this.filterElements(element.elements);
        }
        return element;
      })
      .filter(element =>
        !(element.tags && element.tags.includes("freeText")) &&
        !(element.dataType && element.dataType.type === "date")
      );
  }

  getTemplateData(formTemplateState: DataState<FormTemplate>) {
    if(formTemplateState.data?.elements ){
      formTemplateState.data.elements = this.filterElements(formTemplateState.data?.elements);
    }

    return formTemplateState.data;
  }

  ngOnDestroy() {
    this.prescriptionModelState.setInitialState();
  }

  protected readonly LoadingStatus = LoadingStatus;
}
