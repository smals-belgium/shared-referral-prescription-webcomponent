import { Component, computed } from '@angular/core';
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

export interface NewPrescriptionDialogResult {
  templateCode: string;
}

interface ViewState {
  accessMatrices: AccessMatrix[];
  templates: EvfTemplate[];
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
export class ChooseTemplateDialog {

  private readonly sourceState$ = combineSignalDataState<ViewState>({
    accessMatrices: this.accessMatrixStateService.state,
    templates: this.templatesStateService.state
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
        templates: this.filterTemplatesOnAccessMatrices(sourceState.data!.templates, sourceState.data!.accessMatrices)
      }
    };
  });

  readonly formGroup = new FormGroup({
    category: new FormControl<string | null>(null),
    template: new FormControl<string | EvfTemplate | null>(null, Validators.required),
  });

  constructor(
    private accessMatrixStateService: AccessMatrixState,
    private templatesStateService: TemplatesState,
    private dialogRef: MatDialogRef<ChooseTemplateDialog, NewPrescriptionDialogResult>
  ) {
  }

  submit(): void {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.valid) {
      const values = this.formGroup.value as any as { template: EvfTemplate };
      this.dialogRef.close({
        templateCode: values.template.code
      });
    }
  }

  private filterTemplatesOnAccessMatrices(templates?: EvfTemplate[], matrices?: AccessMatrix[]): EvfTemplate[] {
    if (!templates || !matrices) {
      return [];
    }
    return templates.filter(t => matrices.find(m => t.code === m.templateName)?.createPrescription);
  }
}
