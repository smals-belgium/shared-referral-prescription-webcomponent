import { Component, computed, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { DataState, LoadingStatus } from '@reuse/code/interfaces';
import { OverlaySpinnerComponent } from '@reuse/code/components/overlay-spinner/overlay-spinner.component';
import { SelectPrescriptionTypeComponent } from '@reuse/code/components/select-prescription-type/select-prescription-type.component';
import { IfStatusLoadingDirective } from '@reuse/code/directives/if-status-loading.directive';
import { IfStatusSuccessDirective } from '@reuse/code/directives/if-status-success.directive';
import { combineSignalDataState } from '@reuse/code/utils/rxjs.utils';
import { AccessMatrixState } from '@reuse/code/states/api/access-matrix.state';
import { TemplatesState } from '@reuse/code/states/api/templates.state';
import { distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { ModelsState } from '@reuse/code/states/api/models.state';
import { AccessMatrix, ModelEntityDto, PageModelEntityDto, Template } from '@reuse/code/openapi';

export interface NewPrescriptionDialogResult {
  templateCode?: string;
  model: ModelEntityDto;
}

interface ViewState {
  accessMatrices: AccessMatrix[];
  templates?: Template[];
  models: PageModelEntityDto;
  [key: string]: AccessMatrix[] | Template[] | PageModelEntityDto | undefined;
}

@Component({
  templateUrl: './choose-template.dialog.html',
  styleUrls: ['./choose-template.dialog.scss'],
  imports: [
    TranslateModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    OverlaySpinnerComponent,
    SelectPrescriptionTypeComponent,
    IfStatusLoadingDirective,
    IfStatusSuccessDirective,
  ],
})
export class ChooseTemplateDialog implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  private readonly sourceState$ = combineSignalDataState<ViewState>({
    accessMatrices: this.accessMatrixStateService.state,
    templates: this.templatesStateService.state,
    models: this.modelStateService.state,
  });

  readonly viewState$ = computed<DataState<ViewState>>(() => {
    const sourceState = this.sourceState$();
    if (sourceState.status !== LoadingStatus.SUCCESS) {
      return sourceState;
    }
    return {
      ...sourceState,
      data: {
        accessMatrices: sourceState.data!.accessMatrices,
        templates: this.filterTemplatesOnAccessMatrices(sourceState.data!.templates, sourceState.data!.accessMatrices),
        models: sourceState.data!.models,
      },
    };
  });

  readonly formGroup = new FormGroup({
    category: new FormControl<string | null>(null),
    template: new FormControl<string | Template | null>(null, control => Validators.required(control)),
    model: new FormControl<ModelEntityDto | null>(null),
  });

  constructor(
    private accessMatrixStateService: AccessMatrixState,
    private templatesStateService: TemplatesState,
    private modelStateService: ModelsState,
    private dialogRef: MatDialogRef<ChooseTemplateDialog, NewPrescriptionDialogResult>
  ) {}

  ngOnInit() {
    this.modelStateService.loadModels(0, -1);
    this.onCreateGroupFormValueChange();
  }

  onCreateGroupFormValueChange() {
    this.formGroup
      .get('template')
      ?.valueChanges.pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(value => {
        const modelControl = this.formGroup.get('model');
        if (value) {
          modelControl?.clearValidators();
        } else {
          modelControl?.setValidators(control => Validators.required(control));
        }
        modelControl?.updateValueAndValidity({ emitEvent: false }); // Prevents recursive event loop
      });

    this.formGroup
      .get('model')
      ?.valueChanges.pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(value => {
        const templateControl = this.formGroup.get('template');
        if (value) {
          templateControl?.clearValidators();
        } else {
          templateControl?.setValidators(control => Validators.required(control));
        }
        templateControl?.updateValueAndValidity({ emitEvent: false }); // Prevents recursive event loop
      });
  }

  submit(): void {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.valid) {
      let values = this.formGroup.value as unknown as { template: Template | undefined; model: ModelEntityDto };

      if (values.model && !values.template) {
        values = this.getTemplateByModel(values.model);
      }

      this.dialogRef.close({
        templateCode: values.template?.code,
        model: values.model,
      });
    }
  }

  private filterTemplatesOnAccessMatrices(templates?: Template[], matrices?: AccessMatrix[]): Template[] {
    if (!templates || !matrices) {
      return [];
    }
    return templates.filter(t => matrices.find(m => t.code === m.templateName)?.createPrescription);
  }

  private getTemplateByModel(model: ModelEntityDto) {
    const template = this.viewState$().data?.templates
      ? this.viewState$().data!.templates!.find(template => template.id === model.templateId)
      : undefined;
    return { model: model, template: template };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
