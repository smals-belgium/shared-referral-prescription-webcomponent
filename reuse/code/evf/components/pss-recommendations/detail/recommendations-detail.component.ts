import { ChangeDetectorRef, Component, OnChanges, signal, SimpleChanges } from '@angular/core';
import {
  EvfBaseFormDetailComponent,
  EvfDetailLabelComponent,
  EvfFormDetailLayoutComponent,
} from '@smals/vas-evaluation-form-ui-material/elements/shared';
import { PssRadiologyResultComponent } from '@reuse/code/components/pss-radiology-result/pss-radiology-result.component';
import { PssService } from '@reuse/code/services/api/pss.service';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AlertComponent } from '@reuse/code/components/alert-component/alert.component';
import { ReactiveFormsModule } from '@angular/forms';
import { EvfTranslateService } from '@smals/vas-evaluation-form-ui-core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { generateWarningMessage } from '@reuse/code/utils/pss-relevant-info-message.utils';
import { SupportOption } from '@reuse/code/openapi';
import { AlertType } from '@reuse/code/interfaces';
import { EMPTY_OBJECT } from '@reuse/code/constants/common.constants';

@Component({
  selector: 'recommendations-detail',
  imports: [
    EvfFormDetailLayoutComponent,
    EvfDetailLabelComponent,
    PssRadiologyResultComponent,
    TranslateModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AlertComponent,
    ReactiveFormsModule,
    MatIconModule,
  ],
  templateUrl: './recommendations-detail.component.html',
  styleUrl: './recommendations-detail.component.scss',
})
/**
 * Component responsible for the management of the EVF custom element "recommendations"
 *
 * This component extends EvfBaseFormDetailComponent to leverage built-in
 * form detail behavior and change detection handling.
 *
 * @remarks
 * - Retrieves recommendations from the PSS service using the prescription's
 *   exchange ID (`pssExchangeId`). If no exchange ID is present, the PSS service
 *   was not used to create the prescription, and no recommendations are shown.
 * - Only professional users can view recommendations; patients do not have access.
 * - The `getPrescribedExam()` method returns the prescribed exam's identifier,
 *   used by `pss-radiology-result.component.ts` to highlight the exam in the
 *   recommendations list if present.
 * - The `getWarningMessage()` method generates an alert string for any relevant
 *   information that the PSS service ignores when computing recommendations.
 *
 * @public
 */
export class RecommendationsDetailComponent extends EvfBaseFormDetailComponent implements OnChanges {
  protected readonly AlertType = AlertType;
  readonly isLoading = signal(false);
  readonly controlRecommendations = signal<SupportOption[] | undefined>(undefined);
  readonly isPssActive = signal(false);
  readonly isProfessional = signal(false);

  private pssExchangeId: string = '';
  private userIsProfessional: boolean = false;
  private pssStatus: boolean = false;
  private language?: 'nl' | 'fr';

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

  override ngOnChanges(changes: SimpleChanges) {
    super.ngOnChanges(changes);
    if (changes['metadata']) {
      if (this.metadata != undefined) {
        this.pssStatus = this.metadata['pssActive'] != undefined ? this.metadata['pssActive'] : false;
        this.isPssActive.set(this.pssStatus);
        this.userIsProfessional =
          this.metadata['isProfessional'] != undefined ? this.metadata['isProfessional'] : false;
        this.isProfessional.set(this.userIsProfessional);

        if (this.userIsProfessional && this.pssStatus) {
          this.pssExchangeId = this.elementControl.getOutputValue();
          this.getPssRecommendationsByPssId();
        }
      }
    }
  }

  getPssRecommendationsByPssId(): void {
    if (this.pssExchangeId) {
      this.isLoading.set(true);
      this.controlAnnex82();
    } else {
      this.toastService.show('prescription.create.control.error.required');
    }
  }

  private controlAnnex82() {
    this.pssService.getPssRecommendationsByExchangeId(this.pssExchangeId).subscribe({
      next: result => {
        this.controlRecommendations.set(result.supportOptions);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.showSomethingWentWrong();
        this.isLoading.set(false);
      },
    });
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
    const implants: string[] = formValues['implants'];
    return generateWarningMessage(relevantInfo, implants, this.language!);
  }

  getPrescribedExam() {
    const prescriptionForm = this.elementControl;
    const formValues = prescriptionForm.elementGroup?.getOutputValue() || EMPTY_OBJECT;
    return formValues['intendedProcedure'];
  }
}
