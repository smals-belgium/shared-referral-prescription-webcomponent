import { ChangeDetectorRef, Component, signal, } from '@angular/core';
import {
  EvfBaseFormElementComponent,
  EvfElementBodyComponent,
  EvfElementHelpComponent,
  EvfElementLabelComponent,
  EvfFormElementLayoutComponent
} from '@smals/vas-evaluation-form-ui-material/elements/shared';
import { AutocompleteOption, EvfCommonErrorsPipe, EvfLabelPipe, } from '@smals/vas-evaluation-form-ui-core';
import { ControlAnnex82Request, SupportOption } from '@reuse/code/interfaces/pss.interface';
import { PssRadiologyResultComponent } from '@reuse/code/components/pss-radiology-result/pssRadiologyResult.component';
import { PssService } from '@reuse/code/services/pss.service';
import { ToastService } from '@reuse/code/services/toast.service';
import { MatFormField, MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatInput, MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ErrorCardComponent } from '@reuse/code/components/error-card/error-card.component';

@Component({
  selector: 'recommendations',
  imports: [
    EvfElementBodyComponent,
    EvfElementHelpComponent,
    EvfElementLabelComponent,
    EvfFormElementLayoutComponent,
    EvfLabelPipe,
    MatFormField,
    MatLabel,
    MatInput,
    ReactiveFormsModule,
    MatButton,
    PssRadiologyResultComponent,
    TranslateModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    EvfCommonErrorsPipe,
    MatIconModule,
    MatProgressSpinnerModule,
    ErrorCardComponent
  ],
  templateUrl: './recommendations.component.html',
  styleUrl: './recommendations.component.scss'
})
export class RecommendationsComponent extends EvfBaseFormElementComponent {
  readonly isLoading = signal(false);
  readonly hasValue = signal(false);
  readonly controlIndications = signal<SupportOption[] | undefined>(undefined);
  private static counter = 0;

  readonly id = 'evf-recommendations-' + RecommendationsComponent.counter++;

  constructor(
    private cdRef: ChangeDetectorRef,
    private pssService: PssService,
    private toastService: ToastService,
  ) {
    super(cdRef);
  }

  pssControl(): void {
    this.isLoading.set(true)
    const prescriptionForm = this.elementControl;
    const formValues = prescriptionForm.elementGroup?.getOutputValue() ?? {};

    const clinicalIndications = formValues['clinicalIndications'];
    const intendedProcedure = formValues['intendedProcedure'];

    if (!clinicalIndications) {
      this.toastService.show('prescription.create.control.error.required');
      prescriptionForm.elementGroup?.get('clinicalIndications')?.markAsTouched();
      this.isLoading.set(false)
      return;
    }

    const hasClinicalData = Array.isArray(clinicalIndications) && clinicalIndications.length > 0;

    if (hasClinicalData) {
      this.controlAnnex82(clinicalIndications, intendedProcedure);
    } else {
      this.isLoading.set(false)
      this.toastService.show('prescription.create.control.error.required');
      prescriptionForm.elementGroup?.get('clinicalIndications')?.markAsTouched();
    }
  }


  private controlAnnex82(indications: AutocompleteOption[], intendedProcedure?: AutocompleteOption) {
    const controlAnnex82Request = this.toControlAnnex82Request(indications, intendedProcedure)

    this.pssService.controlIndications(controlAnnex82Request).subscribe({
      next: result => {
        this.controlIndications.set(result.supportOptions);
        this.isLoading.set(false)
      },
      error: () => {
        this.toastService.showSomethingWentWrong();
        this.isLoading.set(false)
      }
    })
  }


  private toControlAnnex82Request(indications: AutocompleteOption[], intendedProcedure?: AutocompleteOption): ControlAnnex82Request {
    const exchangeId = this.pssService.getPssSessionId() ?? '';
    this.elementControl.elementGroup?.get('exchangeId').setValue(exchangeId)

    return {
      examId: intendedProcedure?.value,
      exchangeId,
      indications,
    }
  }

  selectSupportOption(value: SupportOption) {
    this.control.setValue(value);
    this.hasValue.set(false);
  }

  hasAdditionalRelevantInformation() {
    const prescriptionForm = this.elementControl;
    const formValues = prescriptionForm.elementGroup?.getOutputValue() ?? {};
    const relevantInfo = formValues['additional-relevant-information'];

    return !!relevantInfo && relevantInfo.length > 0
  }
}
