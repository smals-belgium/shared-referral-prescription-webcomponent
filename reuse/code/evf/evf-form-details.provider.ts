import { OccurrenceTimingDetailComponent } from '@reuse/code/evf/components/occurrence-timing/detail/occurrence-timing-detail.component';
import { PssRecommendationsDetailComponent } from '@reuse/code/evf/components/pss-recommendations/detail/pss-recommendations-detail.component';
import {
  evfElementConfigFeature,
  provideEvfCore,
  withParseDateExpressionPipe,
  withTransformDateExpressionPipe,
} from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { AutocompleteDetailComponent } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/autocomplete';
import { CheckboxDetailComponent } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/checkbox';
import { DateDetailComponent } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/date';
import { RepeatableDetailComponent } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/repeatable';
import { RepeatableInlineDetailComponent } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/repeatable-inline';
import { RowDetailComponent } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/row';
import { SectionDetailComponent } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/section';
import {
  EvfNumberDetailComponent,
  EvfResponseDetailComponent,
  EvfResponseListDetailComponent,
  EvfValueDetailComponent,
} from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/shared';
import { SlideToggleDetailComponent } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/slide-toggle';

import { AutoCheckboxListDetailComponent } from '@reuse/code/evf/components/auto-checkbox-list/detail/auto-checkbox-list-detail.component';
import { AutoRadioDetailComponent } from '@reuse/code/evf/components/auto-radio/detail/auto-radio-detail.component';
import { AutocompleteMultiselectDetailComponent } from '@reuse/code/evf/components/autocomplete-multiselect/detail/autocomplete-multiselect-detail.component';
import { BoundsDurationComponent } from '@reuse/code/evf/components/bounds-duration/detail/bounds-duration.component';
import { CustomCheckboxListDetailComponent } from '@reuse/code/evf/components/custom-checkbox-list/detail/custom-checkbox-list-detail.component';
import { OccurrencesComponent } from '@reuse/code/evf/components/occurrences/detail/occurrences.component';
import { ProposalCheckboxListComponent } from '@reuse/code/evf/components/proposal-checkbox-list/detail/proposal-checkbox-list.component';
import { PssIndicationProposalDetailComponent } from '@reuse/code/evf/components/pss-indication-proposal/detail/pss-indication-proposal-detail.component';
import { withInfoElement } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/info';

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
          name: 'pssRecommendations',
          detail: PssRecommendationsDetailComponent,
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
        },
        {
          name: 'autocompleteMultiselect',
          detail: AutocompleteMultiselectDetailComponent,
        },
        {
          name: 'pssIndicationProposal',
          detail: PssIndicationProposalDetailComponent,
        },
        {
          name: 'autoRadio',
          detail: AutoRadioDetailComponent,
        },
        {
          name: 'autoCheckboxList',
          detail: AutoCheckboxListDetailComponent,
        },
        {
          name: 'customCheckboxList',
          detail: CustomCheckboxListDetailComponent,
        }
      ),
      withParseDateExpressionPipe(),
      withTransformDateExpressionPipe(),
      withInfoElement()
    ),
  ];
}
