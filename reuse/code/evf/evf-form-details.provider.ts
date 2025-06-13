import {
  evfElementConfigFeature,
  provideEvfCore,
  withParseDateExpressionPipe,
  withTransformDateExpressionPipe
} from '@smals/vas-evaluation-form-ui-core';
import { CheckboxDetailComponent } from '@smals/vas-evaluation-form-ui-material/elements/checkbox';
import { DateDetailComponent } from '@smals/vas-evaluation-form-ui-material/elements/date';
import { OccurrenceTimingDetailComponent } from './occurrence-timing/detail/occurrence-timing-detail.component';
import {
  EvfNumberDetailComponent,
  EvfResponseDetailComponent,
  EvfResponseListDetailComponent,
  EvfValueDetailComponent
} from '@smals/vas-evaluation-form-ui-material/elements/shared';
import { RowDetailComponent } from '@smals/vas-evaluation-form-ui-material/elements/row';
import { AutocompleteDetailComponent } from "@smals/vas-evaluation-form-ui-material/elements/autocomplete";

export function provideEvfFormDetails() {
  return [
    provideEvfCore(
      evfElementConfigFeature( // Only include detail views for smaller bundle size
        {
          name: 'checkbox',
          detail: CheckboxDetailComponent
        },
        {
          name: 'checkboxList',
          detail: EvfResponseListDetailComponent
        },
        {
          name: 'textarea',
          detail: EvfValueDetailComponent
        },
        {
          name: 'date',
          detail: DateDetailComponent
        },
        {
          name: 'dateTime',
          detail: DateDetailComponent
        },
        {
          name: 'inputText',
          detail: EvfValueDetailComponent
        },
        {
          name: 'number',
          detail: EvfNumberDetailComponent
        },
        {
          name: 'radio',
          detail: EvfResponseDetailComponent
        },
        {
          name: 'select',
          detail: EvfResponseDetailComponent
        },
        {
          name: 'occurrenceTiming',
          detail: OccurrenceTimingDetailComponent
        },
        {
          name: 'row',
          detail: RowDetailComponent
        },
        {
          name: 'autocomplete',
          detail: AutocompleteDetailComponent,
        },
      ),
      withParseDateExpressionPipe(),
      withTransformDateExpressionPipe()
    )
  ];
}
