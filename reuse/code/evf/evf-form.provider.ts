import {
  evfElementConfigFeature,
  EvfExternalSourceService,
  provideEvfCore,
  withDefaultDateExpressionPipe,
  withFormatDateExpressionPipe,
  withJavaScriptSideEffect,
  withParseDateExpressionPipe,
  withTransformDateExpressionPipe
} from '@smals/vas-evaluation-form-ui-core';
import { withCheckboxElement } from '@smals/vas-evaluation-form-ui-material/elements/checkbox';
import { withInputTextElement } from '@smals/vas-evaluation-form-ui-material/elements/input-text';
import { withSectionElement } from '@smals/vas-evaluation-form-ui-material/elements/section';
import { withNumberElement } from '@smals/vas-evaluation-form-ui-material/elements/number';
import { withDateElement, withDateTimeElement } from '@smals/vas-evaluation-form-ui-material/elements/date';
import { withInfoElement } from '@smals/vas-evaluation-form-ui-material/elements/info';
import { withRadioElement } from '@smals/vas-evaluation-form-ui-material/elements/radio';
import { withTextareaElement } from '@smals/vas-evaluation-form-ui-material/elements/textarea';
import { withRepeatableElement } from '@smals/vas-evaluation-form-ui-material/elements/repeatable';
import { withSelectElement } from '@smals/vas-evaluation-form-ui-material/elements/select';
import { withRowElement } from '@smals/vas-evaluation-form-ui-material/elements/row';
import { withCheckboxListElement } from '@smals/vas-evaluation-form-ui-material/elements/checkbox-list';
import { EVF_MATERIAL_OPTIONS } from '@smals/vas-evaluation-form-ui-material';
import { MedicationComponent } from './medication/element/medication.component';
import { withAutocompleteElement } from "@smals/vas-evaluation-form-ui-material/elements/autocomplete";
import { ExternalSourceService } from "../services/externalSourceService.service";
import {
  AutocompleteMultiselectComponent
} from '@reuse/code/evf/autocomplete-multiselect/element/autocomplete-multiselect.component';
import { RecommendationsComponent } from '@reuse/code/evf/pss-recommendations/element/recommendations.component';

export function provideEvfForm() {
  return [
    provideEvfCore(
      withCheckboxElement(),
      withCheckboxListElement(),
      withTextareaElement(),
      withDateElement(),
      withDateTimeElement(),
      withInputTextElement(),
      withNumberElement(),
      withRadioElement(),
      withSectionElement(),
      withRowElement(),
      withSelectElement(),
      withInfoElement(),
      withRepeatableElement(),
      evfElementConfigFeature({
        name: 'medication',
        element: MedicationComponent
        },
        {
          name: 'autocompleteMultiselect',
          element: AutocompleteMultiselectComponent
        },
        {
          name: 'recommendations',
          element: RecommendationsComponent
        }),
      withAutocompleteElement(),
      // expression pipes
      withParseDateExpressionPipe(),
      withTransformDateExpressionPipe(),
      withFormatDateExpressionPipe(),
      withDefaultDateExpressionPipe(),
      // side effects
      withJavaScriptSideEffect()
    ),
    {
      provide: EVF_MATERIAL_OPTIONS,
      useValue: {
        appearance: 'fill'
      }
    },
    {provide: EvfExternalSourceService, useClass: ExternalSourceService}
  ];
}
