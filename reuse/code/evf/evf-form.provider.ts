import {
  evfElementConfigFeature,
  EvfExternalSourceService,
  provideEvfCore,
  withDefaultDateExpressionPipe,
  withFormatDateExpressionPipe,
  withParseDateExpressionPipe,
  withTransformDateExpressionPipe,
} from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { withCheckboxElement } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/checkbox';
import { withInputTextElement } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/input-text';
import { withSectionElement } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/section';
import { withNumberElement } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/number';
import {
  withDateElement,
  withDateTimeElement,
} from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/date';
import { withInfoElement } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/info';
import { withRadioElement } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/radio';
import { withTextareaElement } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/textarea';
import { withRepeatableElement } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/repeatable';
import {
  withMultiSelectElement,
  withSelectElement,
} from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/select';
import { withRowElement } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/row';
import { withCheckboxListElement } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/checkbox-list';
import { EVF_MATERIAL_OPTIONS } from '@smals-belgium-shared/vas-evaluation-form-ui-material';
import { withAutocompleteElement } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/autocomplete';
import { ExternalSourceService } from '@reuse/code/services/api/externalSourceService.service';
import { AutocompleteMultiselectComponent } from '@reuse/code/evf/components/autocomplete-multiselect/element/autocomplete-multiselect.component';
import { RecommendationsComponent } from '@reuse/code/evf/components/pss-recommendations/element/recommendations.component';
import { withRepeatableInlineElement } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/repeatable-inline';
import { withSlideToggleElement } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/slide-toggle';
import { ToggleResponsiveWrapperComponent } from '@reuse/code/evf/components/toggle-responsive-wrapper/element/toggle-responsive-wrapper.component';
import { withNbSessionsSideEffect } from '@reuse/code/evf/side-effects/effects/nb-sessions.side-effect';
import { withElementIdBasedOnValueEffect } from '@reuse/code/evf/side-effects/effects/element-id-based-on-value.side-effect';

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
      withRepeatableInlineElement(),
      withMultiSelectElement(),
      withSlideToggleElement(),
      withInfoElement(),
      withRepeatableElement(),
      evfElementConfigFeature(
        {
          name: 'autocompleteMultiselect',
          element: AutocompleteMultiselectComponent,
        },
        {
          name: 'recommendations',
          element: RecommendationsComponent,
        },
        {
          name: 'toggleButton',
          element: ToggleResponsiveWrapperComponent,
        }
      ),
      withAutocompleteElement(),
      // expression pipes
      withParseDateExpressionPipe(),
      withTransformDateExpressionPipe(),
      withFormatDateExpressionPipe(),
      withDefaultDateExpressionPipe(),
      // side effects
      withNbSessionsSideEffect(),
      withElementIdBasedOnValueEffect()
    ),
    {
      provide: EVF_MATERIAL_OPTIONS,
      useValue: {
        appearance: 'outline',
      },
    },
    { provide: EvfExternalSourceService, useClass: ExternalSourceService },
  ];
}
