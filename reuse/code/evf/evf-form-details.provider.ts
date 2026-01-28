import {
  evfElementConfigFeature,
  provideEvfCore,
  withParseDateExpressionPipe,
  withTransformDateExpressionPipe,
} from '@smals/vas-evaluation-form-ui-core';
import { CheckboxDetailComponent } from '@smals/vas-evaluation-form-ui-material/elements/checkbox';
import { DateDetailComponent } from '@smals/vas-evaluation-form-ui-material/elements/date';
import { OccurrenceTimingDetailComponent } from '@reuse/code/evf/components/occurrence-timing/detail/occurrence-timing-detail.component';
import { RecommendationsDetailComponent } from '@reuse/code/evf/components/pss-recommendations/detail/recommendations-detail.component';
import {
  EvfNumberDetailComponent,
  EvfResponseDetailComponent,
  EvfResponseListDetailComponent,
  EvfValueDetailComponent,
} from '@smals/vas-evaluation-form-ui-material/elements/shared';
import { RowDetailComponent } from '@smals/vas-evaluation-form-ui-material/elements/row';
import { RepeatableInlineDetailComponent } from '@smals/vas-evaluation-form-ui-material/elements/repeatable-inline';
import { RepeatableDetailComponent } from '@smals/vas-evaluation-form-ui-material/elements/repeatable';
import { SlideToggleDetailComponent } from '@smals/vas-evaluation-form-ui-material/elements/slide-toggle';
import { AutocompleteDetailComponent } from '@smals/vas-evaluation-form-ui-material/elements/autocomplete';
import { SectionDetailComponent } from '@smals/vas-evaluation-form-ui-material/elements/section';

import { withInfoElement } from '@smals/vas-evaluation-form-ui-material/elements/info';
import { OccurrencesComponent } from '@reuse/code/evf/components/occurrences/detail/occurrences.component';
import { BoundsDurationComponent } from '@reuse/code/evf/components/bounds-duration/detail/bounds-duration.component';
import { ProposalCheckboxListComponent } from '@reuse/code/evf/components/proposal-checkbox-list/detail/proposal-checkbox-list.component';

export function provideEvfFormDetails() {
  return [
    provideEvfCore(
      evfElementConfigFeature(
        // Only include detail views for smaller bundle size
        {
          name: 'checkbox',
          detail: CheckboxDetailComponent,
        },
        {
          name: 'checkboxList',
          detail: EvfResponseListDetailComponent,
        },
        {
          name: 'proposalCheckboxList',
          detail: ProposalCheckboxListComponent,
        },
        {
          name: 'textarea',
          detail: EvfValueDetailComponent,
        },
        {
          name: 'date',
          detail: DateDetailComponent,
        },
        {
          name: 'dateTime',
          detail: DateDetailComponent,
        },
        {
          name: 'inputText',
          detail: EvfValueDetailComponent,
        },
        {
          name: 'number',
          detail: EvfNumberDetailComponent,
        },
        {
          name: 'radio',
          detail: EvfResponseDetailComponent,
        },
        {
          name: 'select',
          detail: EvfResponseDetailComponent,
        },
        {
          name: 'occurrenceTiming',
          detail: OccurrenceTimingDetailComponent,
        },
        {
          name: 'occurrences',
          detail: OccurrencesComponent,
        },
        {
          name: 'boundsDuration',
          detail: BoundsDurationComponent,
        },
        {
          name: 'row',
          detail: RowDetailComponent,
        },
        {
          name: 'autocomplete',
          detail: AutocompleteDetailComponent,
        },
        {
          name: 'recommendations',
          detail: RecommendationsDetailComponent,
        },
        {
          name: 'repeatableInline',
          detail: RepeatableInlineDetailComponent,
        },
        {
          name: 'repeatable',
          detail: RepeatableDetailComponent,
        },
        {
          name: 'slideToggle',
          detail: SlideToggleDetailComponent,
        },
        {
          name: 'section',
          detail: SectionDetailComponent,
        }
      ),
      withParseDateExpressionPipe(),
      withTransformDateExpressionPipe(),
      withInfoElement()
    ),
  ];
}
