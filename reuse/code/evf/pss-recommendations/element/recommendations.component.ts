import { ChangeDetectorRef, Component, signal } from '@angular/core';
import {
  EvfBaseFormElementComponent,
  EvfElementBodyComponent,
  EvfElementHelpComponent,
  EvfElementLabelComponent,
  EvfFormElementLayoutComponent,
} from '@smals/vas-evaluation-form-ui-material/elements/shared';
import {
  AutocompleteOption,
  EvfCommonErrorsPipe,
  EvfLabelPipe,
  EvfTranslateService,
} from '@smals/vas-evaluation-form-ui-core';
import { PssRadiologyResultComponent } from '@reuse/code/components/pss-radiology-result/pss-radiology-result.component';
import { PssService } from '@reuse/code/services/api/pss.service';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { MatFormField, MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatInput, MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AlertComponent } from '@reuse/code/components/alert-component/alert.component';
import { generateWarningMessage } from '@reuse/code/utils/pss-relevant-info-message.utils';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlRequest, SupportOption } from '@reuse/code/openapi';
import { AlertType } from '@reuse/code/interfaces';
import { EMPTY_OBJECT } from '@reuse/code/constants/common.constants';

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
    AlertComponent,
  ],
  templateUrl: './recommendations.component.html',
})
export class RecommendationsComponent extends EvfBaseFormElementComponent {
  protected readonly AlertType = AlertType;
  readonly isLoading = signal(false);
  readonly hasValue = signal(false);
  readonly controlIndications = signal<SupportOption[] | undefined>(undefined);
  private static counter = 0;
  private language?: 'nl' | 'fr';

  readonly id = 'evf-recommendations-' + RecommendationsComponent.counter++;

  constructor(
    private readonly cdRef: ChangeDetectorRef,
    private readonly pssService: PssService,
    private readonly toastService: ToastService,
    private readonly evfTranslate: EvfTranslateService
  ) {
    super(cdRef);
    this.language = this.evfTranslate.currentLang as 'nl' | 'fr';
    this.evfTranslate.currentLang$.pipe(takeUntilDestroyed()).subscribe(() => {
      this.language = this.evfTranslate.currentLang as 'nl' | 'fr';
      this.cdRef.markForCheck();
    });
  }

  pssControl(): void {
    this.isLoading.set(true);
    const prescriptionForm = this.elementControl;
    const formValues = prescriptionForm.elementGroup?.getOutputValue() || EMPTY_OBJECT;

    const clinicalIndications = formValues['clinicalIndications'];
    const intendedProcedure = formValues['intendedProcedure'];
    const age = formValues['age'];
    const gender = formValues['gender'];

    if (!clinicalIndications) {
      this.toastService.show('prescription.create.control.error.required');
      prescriptionForm.elementGroup?.get('clinicalIndications')?.markAsTouched();
      this.isLoading.set(false);
      return;
    }

    const hasClinicalData = Array.isArray(clinicalIndications) && clinicalIndications.length > 0;

    if (hasClinicalData) {
      this.controlAnnex82(age, gender, clinicalIndications, intendedProcedure);
    } else {
      this.isLoading.set(false);
      this.toastService.show('prescription.create.control.error.required');
      prescriptionForm.elementGroup?.get('clinicalIndications')?.markAsTouched();
    }
  }

  private controlAnnex82(
    age: number,
    gender: string,
    indications: AutocompleteOption[],
    intendedProcedure?: AutocompleteOption
  ) {
    const controlAnnex82Request = this.toControlAnnex82Request(age, gender, indications, intendedProcedure);

    this.pssService.getPssRecommendations(controlAnnex82Request).subscribe({
      next: result => {
        if (result.exchangeId) {
          this.pssService.setPssSessionId(result.exchangeId);
        }
        this.controlIndications.set(result.supportOptions);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.showSomethingWentWrong();
        this.isLoading.set(false);
      },
    });
  }

  private toControlAnnex82Request(
    age: number,
    gender: string,
    indications: AutocompleteOption[],
    intendedProcedure?: AutocompleteOption
  ): ControlRequest {
    return <ControlRequest>{
      age: age,
      gender: gender,
      intention: intendedProcedure,
      indications: indications,
    };
  }

  selectSupportOption(value: SupportOption) {
    this.control.setValue(value);
    this.hasValue.set(false);
  }

  hasAdditionalRelevantInformation() {
    const prescriptionForm = this.elementControl;
    const formValues = prescriptionForm.elementGroup?.getOutputValue() || EMPTY_OBJECT;
    const relevantInfo = formValues['additional-relevant-information'];
    return !!relevantInfo && relevantInfo.length > 0 && !relevantInfo.includes('tmp-addInfo-none');
  }

  getWarningMessage() {
    const prescriptionForm = this.elementControl;
    const formValues = prescriptionForm.elementGroup?.getOutputValue() || EMPTY_OBJECT;
    const relevantInfo: string[] = formValues['additional-relevant-information'];
    const relevantInfoImplant = formValues['tmp-addInfo-impl'];
    let implants: string[] = [];
    if (relevantInfoImplant != undefined) {
      implants = relevantInfoImplant['implants'];
    }
    return generateWarningMessage(relevantInfo, implants, this.language!);
  }
}
