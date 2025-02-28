import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastService } from '../../services/toast.service';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import { CreatePrescriptionRequest, LoadingStatus } from '../../interfaces';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { OverlaySpinnerComponent } from '../../components/overlay-spinner/overlay-spinner.component';
import { TranslateModule } from '@ngx-translate/core';
import { PrescriptionModelService } from '../../services/prescription-model.service';
import { PrescriptionModelState } from '../../states/prescriptionModel.state';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { FormTemplate } from '@smals/vas-evaluation-form-ui-core';
import { DatePipe } from '@angular/common';
import { UniqueModelNameValidator } from '../../directives/unique-model-name.directive';

@Component({
  selector: 'create-prescription-model',
  standalone: true,
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
    MatError
  ],
  providers: [DatePipe],
  templateUrl: './create-prescription-model.dialog.html',
  styleUrl: './create-prescription-model.dialog.scss'
})
export class CreatePrescriptionModelDialog implements OnInit {

  formGroup!: FormGroup<{ name: FormControl<string | null>; }>;
  modalState = this.prescriptionModelState.modalState().state;

  constructor(
    private fb: FormBuilder,
    private nameValidator: UniqueModelNameValidator,
    private prescriptionModelState: PrescriptionModelState,
    private prescriptionModalService: PrescriptionModelService,
    private dialogRef: MatDialogRef<CreatePrescriptionModelDialog>,
    private datePipe: DatePipe,
    @Inject(MAT_DIALOG_DATA) private data: {
      template: FormTemplate,
      templateCode: string,
      responses: Record<string, any>
    }) {}

  ngOnInit() {
    const date = new Date();
    const formattedDate = this.datePipe.transform(date,"dd-MM-yyyy");

    const nameControl = new FormControl<string>(formattedDate || '', {
      validators: Validators.required,
      asyncValidators: [this.nameValidator.validate.bind(this.nameValidator)],
      updateOn: 'change',
    });

    this.formGroup = this.fb.group({
      name: nameControl
    })


  }

  createPrescriptionModel(): void {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.valid) {
      const name = this.formGroup.get('name')?.value;
      const modelValues = this.formValuesToModel(this.data.responses, this.data.template);

      this.prescriptionModelState.setModalState(LoadingStatus.LOADING)
      this.prescriptionModalService.createModel({
        name: name || '',
        templateCode: this.data.templateCode,
        responses: modelValues
      })
        .subscribe({
          next: (value) => {
            this.prescriptionModelState.setModalState(LoadingStatus.SUCCESS, name || undefined)
            this.dialogRef.close(true);
          },
          error: (e: any) => {
            this.prescriptionModelState.setModalState(LoadingStatus.ERROR, undefined, e);
          }
        });
    }
  }

  private formValuesToModel(responses: Record<string, any>, template: FormTemplate) {
    return Object.entries(responses).reduce<Record<string, any>>((filteredValues, [key, value]) => {
      let formElement = template.elements.find(e => e.id === key) ||
        template.elements.find(e => e.elements?.some(n => n.id === key))?.elements?.find(e => e.id === key);

      if (!(formElement?.tags?.includes('freeText') || formElement?.dataType?.type === "date")) {
        filteredValues[key] = value;
      }

      return filteredValues;
    }, {});
  }

  protected readonly LoadingStatus = LoadingStatus;
}
