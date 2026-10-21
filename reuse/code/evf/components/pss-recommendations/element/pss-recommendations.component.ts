import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AlertComponent } from '@reuse/code/components/alert-component/alert.component';
import { PssRadiologyResultComponent } from '@reuse/code/components/pss-radiology-result/pss-radiology-result.component';
import { EMPTY_OBJECT } from '@reuse/code/constants/common.constants';
import {
  PSS_DEFAULT_INDICATIONS,
  PSS_ONE_SCORE,
  PSS_SUCCESS_SCORE,
  PSS_ZERO_SCORE,
} from '@reuse/code/constants/pss.constants';
import { AlertType } from '@reuse/code/interfaces';
import {
  CodedValueItem,
  IndicationRadiology,
  SupportOption,
  SupportRequestRadiology,
  TranslatedFieldItem,
} from '@reuse/code/openapi';
import { PssService } from '@reuse/code/services/api/pss.service';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import {
  findTranslationValue,
  getTranslationFromSupportOptionMetadata,
} from '@reuse/code/utils/pss-translations-from-support-option-metadata.utils';
import { isEmptyValue } from '@reuse/code/utils/utils';
import {
  AutocompleteOption,
  BaseElementControl,
  ElementGroup,
  EvfFormElementGroupComponent,
  EvfTranslateService,
} from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import {
  EvfBaseFormElementComponent,
  EvfElementBodyComponent,
  EvfElementHelpComponent,
  EvfElementLabelComponent,
  EvfFormElementLayoutComponent,
} from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/shared';

@Component({
  selector: 'pss-recommendations',
  imports: [
    EvfElementBodyComponent,
    EvfElementHelpComponent,
    EvfElementLabelComponent,
    EvfFormElementLayoutComponent,
    ReactiveFormsModule,
    PssRadiologyResultComponent,
    TranslateModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AlertComponent,
    EvfFormElementGroupComponent,
  ],
  templateUrl: './pss-recommendations.component.html',
  styleUrl: 'pss-recommendations.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PssRecommendationsComponent extends EvfBaseFormElementComponent implements OnInit {
  protected readonly PSS_SUCCESS_SCORE = PSS_SUCCESS_SCORE;
  protected readonly PSS_ZERO_SCORE = PSS_ZERO_SCORE;
  protected readonly PSS_ONE_SCORE = PSS_ONE_SCORE;

  private readonly destroyRef = inject(DestroyRef);
  private readonly pssService = inject(PssService);
  private readonly toastService = inject(ToastService);
  private readonly evfTranslate = inject(EvfTranslateService);
  private readonly translate = inject(TranslateService);

  protected readonly AlertType = AlertType;
  readonly isLoading = signal(false);
  readonly controlIndications = signal<SupportOption[] | undefined>(undefined);
  readonly defaultOption = signal<AutocompleteOption[] | undefined>(undefined);
  readonly evidenceUrl = signal<CodedValueItem | undefined>(undefined);

  private readonly controlValueSignal = signal<SupportOption | undefined>(undefined);
  readonly hasExam = computed(() => {
    const controlValue = this.controlValueSignal();
    return (
      (controlValue?.score !== undefined && controlValue.score < PSS_SUCCESS_SCORE) ||
      (this.defaultOption() && this.controlIndications() && this.scoreLowerThanSeven()) ||
      (!controlValue && !this.defaultOption() && this.controlIndications())
    );
  });

  readonly showAlert = computed(() => this.hasExam() || this.hasAdditionalRelevantInformation());

  readonly alertTitle = computed(() =>
    this.hasExam() ? 'prescription.create.control.alert.chosenExam' : 'prescription.create.control.alert.relevantInfo'
  );

  protected currentLang = toSignal(this.evfTranslate.currentLang$, {
    initialValue: this.evfTranslate.currentLang,
  });

  private static counter = 0;
  readonly id = `evf-pss-recommendations-${PssRecommendationsComponent.counter++}`;
  private readonly REQUIRED_FIELDS = ['exchangeId', 'pssIndicationProposal'] as const;
  subElementControls = signal<BaseElementControl[]>([]);
  hasProposedImaging = signal<boolean>(true);

  ngOnInit() {
    this.controlValueSignal.set(this.control.value as SupportOption | undefined);
    this.control.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value: SupportOption | undefined) => this.controlValueSignal.set(value));

    this.pssControl();
    this.checkIfFormHasProposedImaging();
  }

  private checkIfFormHasProposedImaging() {
    const formGroup = this.elementControl.elementGroup;
    if (
      formGroup?.get('proposedImaging')?.value &&
      (formGroup?.get('proposedImaging')?.value as AutocompleteOption[]).length > 0
    ) {
      this.hasProposedImaging.set(true);
    } else {
      this.hasProposedImaging.set(false);
    }
  }

  private pssControl(): void {
    this.isLoading.set(true);

    const formGroup = this.elementControl.elementGroup;
    if (!formGroup || !this.isFormValid(formGroup)) {
      this.toastService.show('prescription.create.control.error.required');
      this.isLoading.set(false);
      return;
    }

    const formValues = (formGroup.getOutputValue() as Record<string, unknown>) ?? {};
    const request = this.buildSupportRequest(formValues);

    this.fetchPssRecommendations(request);
  }

  private isFormValid(formGroup: ElementGroup): boolean {
    return this.validateRequiredFields(formGroup, this.REQUIRED_FIELDS).length === 0;
  }

  private toTranslatedFields(label: AutocompleteOption['label']): TranslatedFieldItem[] {
    return [
      { value: label.nl, language: 'NL' },
      { value: label.fr, language: 'FR' },
      { value: label.en, language: 'EN' },
      { value: label.de, language: 'DE' },
    ];
  }

  private toIndications(pssIndications: AutocompleteOption[]): IndicationRadiology[] {
    return pssIndications.map(option => ({
      id: option.value as string,
      translations: this.toTranslatedFields(option.label),
    }));
  }

  private buildSupportRequest(formValues: Record<string, unknown>): SupportRequestRadiology {
    const options = formValues['proposedImaging'] as AutocompleteOption[];
    const pssIndications = formValues['pssIndicationProposal'] as AutocompleteOption[];

    let indications: IndicationRadiology[] = [];
    indications = this.toIndications(pssIndications);
    if (options && options.length > 0) {
      this.defaultOption.set(options);
    }

    return {
      exchangeId: formValues['exchangeId'] as string,
      indications: indications,
      emergency: formValues['urgency'] ? (formValues['urgency'] as boolean) : false,
    };
  }

  private fetchPssRecommendations(request: SupportRequestRadiology): void {
    this.pssService.getPssRecommendations(request).subscribe({
      next: result => {
        const supportOptions = result.supportOptions || [];
        this.controlIndications.set([...supportOptions, ...PSS_DEFAULT_INDICATIONS]);
        this.evidenceUrl.set(result.evidenceUrl);
        this.setSubElements();
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.showSomethingWentWrong();
        this.controlIndications.set(PSS_DEFAULT_INDICATIONS);
        this.evidenceUrl.set(undefined);
        this.isLoading.set(false);
      },
    });
  }

  private validateRequiredFields(formGroup: ElementGroup, requiredFields: readonly string[]): string[] {
    const invalidFields: string[] = [];

    requiredFields.forEach(fieldName => {
      const control = formGroup.get(fieldName);

      if (isEmptyValue(control?.value)) {
        control?.markAsTouched();
        invalidFields.push(fieldName);
      }
    });
    return invalidFields;
  }

  selectSupportOption(value: SupportOption) {
    this.control.setValue([value]);

    const group = this.elementControl.elementGroup;
    const reasonCode = group?.get('reasonOfDeviationCode');
    const reasonText = group?.get('reasonOfDeviationText');

    reasonCode?.setValue(undefined);
    reasonText?.setValue(undefined);

    const isOtherReason = value.score === 0 && value.id === 'OtherReason';
    const isNoExamination = value.score === -1 && value.id === 'noExamination';

    if (isOtherReason || isNoExamination) {
      reasonCode?.setValue('OtherReason');
    }
    if (isNoExamination) {
      reasonText?.setValue(this.getTranslationFromSupportOption(value));
    }

    group?.get('score').setValue(value.score);
  }

  getTranslationFromSupportOption(supportOption: SupportOption) {
    return getTranslationFromSupportOptionMetadata(supportOption, this.currentLang(), this.evfTranslate);
  }

  getTranslation(codedValueItem: CodedValueItem) {
    if (!codedValueItem.translations) return this.translate.instant('pss.link');
    return findTranslationValue(codedValueItem.translations, this.currentLang());
  }

  hasAdditionalRelevantInformation() {
    const prescriptionForm = this.elementControl;
    const formValues = (prescriptionForm.elementGroup?.getOutputValue() as Record<string, unknown>) || EMPTY_OBJECT;
    const relevantInfo = formValues['additional-relevant-information'] as string[];
    const previousExams = this.getPreviuosExams();
    return (!!relevantInfo && relevantInfo.length > 0) || (!!previousExams && previousExams.length > 0);
  }

  getRelevantInfo() {
    const prescriptionForm = this.elementControl;
    const formValues = (prescriptionForm.elementGroup?.getOutputValue() as Record<string, unknown>) || EMPTY_OBJECT;
    const relevantInfo = formValues['additional-relevant-information'] as string[];

    return relevantInfo;
  }

  getImplants() {
    const prescriptionForm = this.elementControl;
    const formValues = (prescriptionForm.elementGroup?.getOutputValue() as Record<string, unknown>) || EMPTY_OBJECT;
    const relevantInfoImplant = formValues['tmp-addInfo-impl'] as Record<string, unknown>;
    let implants: AutocompleteOption[] = [];
    if (relevantInfoImplant != undefined) {
      implants = relevantInfoImplant['implants'] as AutocompleteOption[];
    }

    return implants;
  }

  getPreviuosExams() {
    const prescriptionForm = this.elementControl;
    const formValues = (prescriptionForm.elementGroup?.getOutputValue() as Record<string, unknown>) || EMPTY_OBJECT;
    const previousExams = formValues['previous-relevant-examinations'] as AutocompleteOption[];

    return previousExams;
  }

  findSupportOptionById(prescribedExam: AutocompleteOption): SupportOption | undefined {
    const options = this.controlIndications();
    if (!options) return undefined;
    return options.find(option => option.id === prescribedExam.value);
  }

  scoreLowerThanSeven() {
    const defaultOption = this.defaultOption();
    if (!defaultOption) return false;

    return defaultOption.some(option => {
      const supportOption = this.findSupportOptionById(option);
      return supportOption?.score && supportOption?.score < PSS_SUCCESS_SCORE;
    });
  }

  private setSubElements() {
    this.subElementControls.set([]);
    if (this.elementControl.childElementControls) {
      this.subElementControls.set(this.elementControl.childElementControls);
    }
  }
}
