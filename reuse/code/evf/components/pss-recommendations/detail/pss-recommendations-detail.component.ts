import { Component, computed, OnChanges, signal, SimpleChanges } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { PssRecommendationCardComponent } from '@reuse/code/components/pss-recommendation-card/pss-recommendation-card.component';
import { PSS_DEFAULT_INDICATIONS } from '@reuse/code/constants/pss.constants';
import { SupportOption } from '@reuse/code/openapi/model/models';
import {
  EvfBaseFormDetailComponent,
  EvfDetailLabelComponent,
  EvfFormDetailLayoutComponent,
} from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/shared';
import { AutocompleteOption } from '@smals-belgium-shared/vas-evaluation-form-ui-core';

@Component({
  selector: 'pss-recommendations-detail',
  imports: [EvfFormDetailLayoutComponent, EvfDetailLabelComponent, PssRecommendationCardComponent, TranslatePipe],
  templateUrl: './pss-recommendations-detail.component.html',
  styleUrl: './pss-recommendations-detail.component.scss',
})
export class PssRecommendationsDetailComponent extends EvfBaseFormDetailComponent implements OnChanges {
  private static counter = 0;
  // unique per instance so several recommendation lists on the same page don't merge into one native radio group
  protected readonly radioGroupName = `pss-recommendation-group-${PssRecommendationsDetailComponent.counter++}`;

  // the initially prescribed recommendation shown in the top preview card, unaffected by list selection
  private readonly initialRecommendation = signal<AutocompleteOption | string | undefined>(undefined);
  private readonly selectedRecommendationId = signal<string>('');

  readonly recommendations = signal<SupportOption[]>(PSS_DEFAULT_INDICATIONS);
  readonly selectedRecommendation = computed(() => {
    let recommendation: SupportOption | undefined;
    const initialOption = this.initialRecommendation();
    if (!initialOption) return undefined;

    const initialOptionId = typeof initialOption === 'string' ? initialOption : initialOption.value;

    recommendation = this.recommendations().find(recommendation => recommendation.id === initialOptionId);

    // If not found and initialOption is an AutocompleteOption with label, create a new recommendation
    if (!recommendation && typeof initialOption === 'object' && initialOption.label) {
      recommendation = {
        id: initialOption.value,

        instruction: {
          translations: [
            {
              language: 'nl',
              value: initialOption.label.nl,
            },
            {
              language: 'fr',
              value: initialOption.label.fr,
            },
            {
              language: 'de',
              value: initialOption.label.de,
            },
            {
              language: 'en',
              value: initialOption.label.en,
            },
          ],
          system: '',
          code: initialOption.value,
        },
      };
    }

    return recommendation;
  });

  override ngOnChanges(changes: SimpleChanges): void {
    super.ngOnChanges(changes);
    if (changes['elementControl']) {
      const selected = this.elementControl.value.filter((e: SupportOption | string) => e !== 'unknown');

      this.recommendations.update(recommendations => [...selected, ...recommendations]);
      const recommendationId = this.elementControl.elementGroup?.get('selectedRecommendation').value;
      this.initialRecommendation.set(recommendationId);
    }
  }

  protected isSelected(recommendation: SupportOption): boolean {
    return recommendation.id === this.selectedRecommendationId();
  }

  // TODO: persist selection to the form control once wiring is available
  protected onRecommendationSelected(recommendation: SupportOption): void {
    this.selectedRecommendationId.set(recommendation.id!);
  }
}
