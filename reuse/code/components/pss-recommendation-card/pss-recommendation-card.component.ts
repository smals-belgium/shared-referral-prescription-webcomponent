import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatRadioModule } from '@angular/material/radio';
import { TranslateModule } from '@ngx-translate/core';
import { PssRadiationRateComponent } from '@reuse/code/components/pss-radiation-rate/pss-radiation-rate.component';
import { PssScoreBarComponent } from '@reuse/code/components/pss-score-bar/pss-score-bar.component';
import { PSS_ZERO_SCORE } from '@reuse/code/constants/pss.constants';
import { SupportOption } from '@reuse/code/openapi';
import { getTranslationFromSupportOptionMetadata } from '@reuse/code/utils/pss-translations-from-support-option-metadata.utils';
import { EvfTranslateService } from '@smals-belgium-shared/vas-evaluation-form-ui-core';

@Component({
  selector: 'app-pss-recommendation-card',
  templateUrl: './pss-recommendation-card.component.html',
  styleUrl: './pss-recommendation-card.component.scss',
  imports: [MatRadioModule, TranslateModule, PssScoreBarComponent, PssRadiationRateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PssRecommendationCardComponent {
  private readonly evfTranslate = inject(EvfTranslateService);
  private readonly currentLang = toSignal(this.evfTranslate.currentLang$, {
    initialValue: this.evfTranslate.currentLang,
  });

  readonly recommendation = input.required<SupportOption>();
  /** Whether the card renders a radio button and reacts to click/selection. */
  readonly selectable = input(false);
  readonly disabled = input(false);
  /** Native radio group name, needed when several cards are rendered side by side. */
  readonly name = input('pss-recommendation-card');
  readonly checked = input(false);

  readonly selectionChange = output<SupportOption>();

  protected hasScore = computed(() => {
    const score = this.recommendation().score || 0;
    return (score && score > PSS_ZERO_SCORE) || false;
  });

  protected readonly examName = computed(() =>
    getTranslationFromSupportOptionMetadata(this.recommendation(), this.currentLang(), this.evfTranslate)
  );

  protected readonly radiationLevel = computed(() => this.recommendation().supportOptionMetadata?.['radiationLevel']);

  protected onCardClick(): void {
    if (!this.selectable() || this.disabled()) return;
    this.selectionChange.emit(this.recommendation());
  }
}
