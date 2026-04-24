import { Component, effect, input, output, OnInit, SimpleChanges, OnChanges } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoadingStatus } from '@reuse/code/interfaces';
import { MatError, MatFormField } from '@angular/material/form-field';
import { OverlaySpinnerComponent } from '@reuse/code/components/progress-indicators/overlay-spinner/overlay-spinner.component';
import { TranslateModule } from '@ngx-translate/core';
import { PrescriptionModelService } from '@reuse/code/services/api/prescriptionModel.service';
import { PrescriptionModelState } from '@reuse/code/states/helpers/prescriptionModel.state';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { UniqueModelNameValidator } from '@reuse/code/directives/unique-model-name.directive';
import { TemplateNamePipe } from '@reuse/code/pipes/template-name.pipe';
import { HttpErrorResponse } from '@angular/common/http';
import { FormDataType, ReadRequestIdResource, TemplateVersion } from '@reuse/code/openapi';
import TypeEnum = FormDataType.TypeEnum;

@Component({
  selector: 'create-prescription-model',
  imports: [ReactiveFormsModule, MatFormField, TranslateModule, OverlaySpinnerComponent, MatInput, MatButton, MatError],
  providers: [TemplateNamePipe],
  templateUrl: './create-prescription-model.component.html',
  styleUrl: './create-prescription-model.component.scss',
})
export class CreatePrescriptionModelComponent implements OnInit, OnChanges {
  protected readonly LoadingStatus = LoadingStatus;
  formGroup!: FormGroup<{ name: FormControl<string | null> }>;

  prescriptionTrackById = input.required<number>();
  template = input.required<TemplateVersion>();
  templateCode = input.required<string>();
  responses = input.required<Record<string, unknown>>();
  disabled = input<boolean>(false);

  modelSaved = output<string | undefined>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly nameValidator: UniqueModelNameValidator,
    private readonly prescriptionModelState: PrescriptionModelState,
    private readonly prescriptionModalService: PrescriptionModelService,
    private readonly templateNamePipe: TemplateNamePipe
  ) {
    effect(() => {
      const defaultName = this.templateNamePipe.transform(this.templateCode());
      if (defaultName) {
        this.formGroup.get('name')?.setValue(defaultName);
      }
    });
  }

  ngOnInit() {
    this.formGroup = this.fb.group({
      name: new FormControl<string>(
        { value: '', disabled: this.disabled() },
        {
          validators: control => Validators.required(control),
          asyncValidators: [this.nameValidator.validate.bind(this.nameValidator)],
          updateOn: 'change',
        }
      ),
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.formGroup) return;

    if (changes['disabled']) {
      const control = this.formGroup.get('name');
      if (this.disabled()) {
        control?.disable();
      } else {
        control?.enable();
      }
    }
  }

  getModelState() {
    return this.prescriptionModelState.getModalState(this.prescriptionTrackById());
  }

  createPrescriptionModel(): void {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.valid) {
      const name = this.formGroup.get('name')?.value;
      const modelValues = this.formValuesToModel(this.responses(), this.template());

      this.prescriptionModelState.setModalState(this.prescriptionTrackById(), LoadingStatus.LOADING);
      this.prescriptionModalService
        .createModel({
          name: name || '',
          templateCode: this.templateCode(),
          responses: modelValues,
        })
        .subscribe({
          next: (value: ReadRequestIdResource) => {
            this.prescriptionModelState.setModalState(
              this.prescriptionTrackById(),
              LoadingStatus.SUCCESS,
              name || undefined
            );
            this.modelSaved.emit(value.id);
          },
          error: (e: HttpErrorResponse) => {
            this.prescriptionModelState.setModalState(this.prescriptionTrackById(), LoadingStatus.ERROR, undefined, e);
            this.modelSaved.emit(undefined);
          },
        });
    }
  }

  private formValuesToModel(responses: Record<string, unknown>, template: TemplateVersion) {
    return Object.entries(responses).reduce<Record<string, unknown>>((filteredValues, [key, value]) => {
      const formElement =
        template.elements?.find(e => e.id === key) ||
        template.elements?.find(e => e.elements?.some(n => n.id === key))?.elements?.find(e => e.id === key);

      if (!(formElement?.tags?.includes('freeText') || formElement?.dataType?.type === TypeEnum.Date)) {
        filteredValues[key] = value;
      }

      return filteredValues;
    }, {});
  }
}
