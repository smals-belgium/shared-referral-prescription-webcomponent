import { Component, computed, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { AsyncPipe, NgIf } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AccessMatrix, DataState, EvfTemplate, LoadingStatus } from '../../interfaces';
import { OverlaySpinnerComponent } from '../../components/overlay-spinner/overlay-spinner.component';
import {
  SelectPrescriptionTypeComponent
} from '../../components/select-prescription-type/select-prescription-type.component';
import { IfStatusErrorDirective } from '../../directives/if-status-error.directive';
import { IfStatusLoadingDirective } from '../../directives/if-status-loading.directive';
import { IfStatusSuccessDirective } from '../../directives/if-status-success.directive';
import { combineSignalDataState } from '../../utils/rxjs.utils';
import { AccessMatrixState } from '../../states/access-matrix.state';
import { TemplatesState } from '../../states/templates.state';
import { PrescriptionModel, PrescriptionModelRequest } from '../../interfaces/prescription-modal.inteface';
import { distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { ModelsState } from '../../states/models.state';

export interface NewPrescriptionDialogResult {
  templateCode?: string;
  model: PrescriptionModel;
}

interface ViewState {
  accessMatrices: AccessMatrix[];
  templates?: EvfTemplate[];
  models: PrescriptionModelRequest
}

@Component({
  templateUrl: './choose-template.dialog.html',
  styleUrls: ['./choose-template.dialog.scss'],
  standalone: true,
  imports: [
    TranslateModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    OverlaySpinnerComponent,
    SelectPrescriptionTypeComponent,
    IfStatusLoadingDirective,
    IfStatusSuccessDirective,
    IfStatusErrorDirective,
    NgIf,
    AsyncPipe
  ]
})
export class ChooseTemplateDialog implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  private readonly sourceState$ = combineSignalDataState<ViewState>({
    accessMatrices: this.accessMatrixStateService.state,
    templates: this.templatesStateService.state,
    models: this.modelStateService.state
  });

  readonly viewState$ = computed<DataState<ViewState>>(() => {
    const sourceState = this.sourceState$();
    if (sourceState.status !== LoadingStatus.SUCCESS) {
      return sourceState;
    }
    return {
      ...sourceState,
      data: {
        accessMatrices: sourceState.data!.accessMatrices!,
        templates: this.filterTemplatesOnAccessMatrices(sourceState.data!.templates, sourceState.data!.accessMatrices),
        models: sourceState.data!.models
      }
    };
  });

  readonly formGroup = new FormGroup({
    category: new FormControl<string | null>(null),
    template: new FormControl<string | EvfTemplate | null>(null, Validators.required),
    model: new FormControl<PrescriptionModel | null>(null),
  });

  constructor(
    private accessMatrixStateService: AccessMatrixState,
    private templatesStateService: TemplatesState,
    private modelStateService: ModelsState,
    private dialogRef: MatDialogRef<ChooseTemplateDialog, NewPrescriptionDialogResult>
  ) {
  }

  ngOnInit(){
    this.modelStateService.loadModels(0, -1);
    this.onCreateGroupFormValueChange();
  }

  onCreateGroupFormValueChange(){
    this.formGroup.get('template')?.valueChanges
      .pipe(
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(value => {
        const modelControl = this.formGroup.get('model');
        if (value) {
          modelControl?.clearValidators();
        } else {
          modelControl?.setValidators(Validators.required);
        }
        modelControl?.updateValueAndValidity({ emitEvent: false }); // Prevents recursive event loop
      });

    this.formGroup.get('model')?.valueChanges
      .pipe(
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(value => {
      const templateControl = this.formGroup.get('template');
      if (value) {
        templateControl?.clearValidators();
      } else {
        templateControl?.setValidators(Validators.required);
      }
      templateControl?.updateValueAndValidity({ emitEvent: false }); // Prevents recursive event loop
    });
  }

  submit(): void {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.valid) {
      let values = this.formGroup.value as any as { template: EvfTemplate | undefined, model: PrescriptionModel };

      if(values.model && !values.template) {
        values = this.getTemplateByModel(values.model)
      }

      this.dialogRef.close({
        templateCode: values.template?.code,
        model: values.model
      });
    }
  }

  private filterTemplatesOnAccessMatrices(templates?: EvfTemplate[], matrices?: AccessMatrix[]): EvfTemplate[] {
    if (!templates || !matrices) {
      return [];
    }
    return templates.filter(t => matrices.find(m => t.code === m.templateName)?.createPrescription);
  }

  private getTemplateByModel(model: PrescriptionModel) {
    const template = this.viewState$().data?.templates ? this.viewState$().data!.templates!.find(template => template.id === model.templateId) : undefined
    return {model: model, template: template};
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
