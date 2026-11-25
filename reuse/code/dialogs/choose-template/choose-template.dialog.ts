import { Component, computed, effect, inject, OnDestroy, OnInit, Signal, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { DataState, Intent, LoadingStatus } from '@reuse/code/interfaces';
import { OverlaySpinnerComponent } from '@reuse/code/components/progress-indicators/overlay-spinner/overlay-spinner.component';
import { SelectPrescriptionTypeComponent } from '@reuse/code/components/select-prescription-type/select-prescription-type.component';
import { combineSignalDataState } from '@reuse/code/utils/rxjs.utils';
import { AccessMatrixState } from '@reuse/code/states/api/access-matrix.state';
import { TemplatesState } from '@reuse/code/states/api/templates.state';
import { catchError, distinctUntilChanged, map, of, Subject, take, takeUntil } from 'rxjs';
import { ModelsState } from '@reuse/code/states/api/models.state';
import { AccessMatrix, ModelEntityDto, PageModelEntityDto, Template } from '@reuse/code/openapi';
import { DialogLayoutComponent } from '@reuse/code/dialogs/dialog-layout/dialog-layout.component';
import { AuthService } from '@reuse/code/services/auth/auth.service';

export interface SelectedTemplate {
  templateCode?: string;
  model?: ModelEntityDto;
}

interface ViewState {
  accessMatrices: AccessMatrix[];
  templates?: Template[];
  models?: PageModelEntityDto;
  [key: string]: AccessMatrix[] | Template[] | PageModelEntityDto | undefined;
}

@Component({
  templateUrl: './choose-template.dialog.html',
  imports: [
    TranslateModule,
    ReactiveFormsModule,
    OverlaySpinnerComponent,
    SelectPrescriptionTypeComponent,
    DialogLayoutComponent,
  ],
})
export class ChooseTemplateDialog implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  private readonly data = inject<{ intent: Intent }>(MAT_DIALOG_DATA);
  private readonly authService = inject(AuthService);
  private readonly accessMatrixStateService = inject(AccessMatrixState);
  private readonly templatesStateService = inject(TemplatesState);
  private readonly modelStateService = inject(ModelsState);
  private readonly dialogRef = inject(MatDialogRef<ChooseTemplateDialog, SelectedTemplate>);

  // null while the organization check is pending; models are only offered for ORDER intents
  readonly showModelField: Signal<boolean | null> =
    this.data.intent === Intent.ORDER
      ? toSignal(
          this.authService.isOrganization().pipe(
            take(1),
            map(isOrganization => !isOrganization),
            catchError(() => of(true))
          ),
          { initialValue: null }
        )
      : signal(false);

  private readonly loadModelsEffect = effect(() => {
    if (this.showModelField()) {
      untracked(() => this.modelStateService.loadModels(0, -1));
    }
  });

  private readonly modelsState$ = computed<DataState<PageModelEntityDto>>(() => {
    switch (this.showModelField()) {
      case null:
        return { status: LoadingStatus.LOADING };
      case false:
        // Models are not used: mirror the templates status so it doesn't affect the combined status
        return { status: this.templatesStateService.state().status };
      default:
        return this.modelStateService.state();
    }
  });

  private readonly sourceState$ = combineSignalDataState<ViewState>({
    accessMatrices: this.accessMatrixStateService.state,
    templates: this.templatesStateService.state,
    models: this.modelsState$,
  });

  readonly viewState$ = computed<DataState<ViewState>>(() => {
    const sourceState = this.sourceState$();

    if (this.data.intent === Intent.PROPOSAL && sourceState.status === LoadingStatus.INITIAL) {
      return {
        ...sourceState,
        status: LoadingStatus.SUCCESS,
        data: {
          accessMatrices: sourceState.data!.accessMatrices,
          templates: this.filterTemplatesOnAccessMatrices(
            sourceState.data!.templates,
            sourceState.data!.accessMatrices
          ),
          models: sourceState.data!.models,
        },
      };
    }

    if (sourceState.status !== LoadingStatus.SUCCESS) {
      return sourceState;
    }

    const viewStateData =
      this.data.intent === Intent.ORDER
        ? {
            accessMatrices: sourceState.data!.accessMatrices,
            templates: this.filterTemplatesOnAccessMatrices(
              sourceState.data!.templates,
              sourceState.data!.accessMatrices
            ),
            models: sourceState.data!.models,
          }
        : {
            accessMatrices: sourceState.data!.accessMatrices,
            templates: this.filterTemplatesOnAccessMatrices(
              sourceState.data!.templates,
              sourceState.data!.accessMatrices
            ),
          };

    return {
      ...sourceState,
      data: viewStateData,
    };
  });

  readonly formGroup = new FormGroup({
    category: new FormControl<string | null>(null),
    template: new FormControl<string | Template | null>(null, control => Validators.required(control)),
    model: new FormControl<ModelEntityDto | null>(null),
  });

  ngOnInit() {
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
    if (this.data.intent !== Intent.PROPOSAL) {
      return templates.filter(t => matrices.find(m => t.code === m.templateName)?.createPrescription);
    } else {
      return templates.filter(t => matrices.find(m => t.code === m.templateName)?.createProposal);
    }
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

  protected readonly LoadingStatus = LoadingStatus;
}
