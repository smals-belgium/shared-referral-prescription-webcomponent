import { Component, effect, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { LoadingStatus } from '@reuse/code/interfaces';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { OverlaySpinnerComponent } from '@reuse/code/components/overlay-spinner/overlay-spinner.component';
import { TranslateModule } from '@ngx-translate/core';
import { PrescriptionModelService } from '@reuse/code/services/api/prescriptionModel.service';
import { PrescriptionModelState } from '@reuse/code/states/helpers/prescriptionModel.state';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { FormTemplate } from '@smals/vas-evaluation-form-ui-core';
import { UniqueModelNameValidator } from '@reuse/code/directives/unique-model-name.directive';
import { TemplateNamePipe } from '@reuse/code/pipes/template-name.pipe';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'create-prescription-model',
  imports: [
    ReactiveFormsModule,
    MatDialogTitle,
    MatDialogContent,
    MatFormField,
    MatDialogClose,
    TranslateModule,
    OverlaySpinnerComponent,
    MatDialogActions,
    MatInput,
    MatButton,
    MatLabel,
    MatError,
  ],
  providers: [TemplateNamePipe],
  templateUrl: './create-prescription-model.dialog.html',
  styleUrl: './create-prescription-model.dialog.scss',
})
export class CreatePrescriptionModelDialog implements OnInit {
  formGroup!: FormGroup<{ name: FormControl<string | null> }>;
  modalState = this.prescriptionModelState.modalState().state;

  constructor(
    private fb: FormBuilder,
    private nameValidator: UniqueModelNameValidator,
    private prescriptionModelState: PrescriptionModelState,
    private prescriptionModalService: PrescriptionModelService,
    private dialogRef: MatDialogRef<CreatePrescriptionModelDialog>,
    private templateNamePipe: TemplateNamePipe,
    @Inject(MAT_DIALOG_DATA)
    private data: {
      template: FormTemplate;
      templateCode: string;
      responses: Record<string, unknown>;
    }
  ) {
    effect(() => {
      const defaultName = this.templateNamePipe.transform(this.data.templateCode);
      if (defaultName) {
        this.formGroup.get('name')?.setValue(defaultName);
      }
    });
  }

  ngOnInit() {
    this.formGroup = this.fb.group({
      name: new FormControl<string>('', {
        validators: control => Validators.required(control),
        asyncValidators: [this.nameValidator.validate.bind(this.nameValidator)],
        updateOn: 'change',
      }),
    });
  }

  createPrescriptionModel(): void {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.valid) {
      const name = this.formGroup.get('name')?.value;
      const modelValues = this.formValuesToModel(this.data.responses, this.data.template);

      this.prescriptionModelState.setModalState(LoadingStatus.LOADING);
      this.prescriptionModalService
        .createModel({
          name: name || '',
          templateCode: this.data.templateCode,
          responses: modelValues,
        })
        .subscribe({
          next: () => {
            this.prescriptionModelState.setModalState(LoadingStatus.SUCCESS, name || undefined);
            this.dialogRef.close(true);
          },
          error: (e: HttpErrorResponse) => {
            this.prescriptionModelState.setModalState(LoadingStatus.ERROR, undefined, e);
          },
        });
    }
  }

  private formValuesToModel(responses: Record<string, unknown>, template: FormTemplate) {
    return Object.entries(responses).reduce<Record<string, unknown>>((filteredValues, [key, value]) => {
      const formElement =
        template.elements.find(e => e.id === key) ||
        template.elements.find(e => e.elements?.some(n => n.id === key))?.elements?.find(e => e.id === key);

      if (!(formElement?.tags?.includes('freeText') || formElement?.dataType?.type === 'date')) {
        filteredValues[key] = value;
      }

      return filteredValues;
    }, {});
  }

  protected readonly LoadingStatus = LoadingStatus;
}
