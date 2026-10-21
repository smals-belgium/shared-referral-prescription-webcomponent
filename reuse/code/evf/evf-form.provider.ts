import { AutoCheckboxListComponent } from '@reuse/code/evf/components/auto-checkbox-list/element/auto-checkbox-list.component';
import { AutoRadioComponent } from '@reuse/code/evf/components/auto-radio/element/auto-radio.component';
import { AutocompleteMultiselectComponent } from '@reuse/code/evf/components/autocomplete-multiselect/element/autocomplete-multiselect.component';
import { CustomCheckboxListComponent } from '@reuse/code/evf/components/custom-checkbox-list/element/custom-checkbox-list.component';
import { CustomStepperComponent } from '@reuse/code/evf/components/custom-stepper/element/custom-stepper.component';
import { InfoSummaryComponent } from '@reuse/code/evf/components/info-summary/element/info-summary.component';
import { PssIndicationProposalComponent } from '@reuse/code/evf/components/pss-indication-proposal/element/pss-indication-proposal.component';
import { PssRecommendationsComponent } from '@reuse/code/evf/components/pss-recommendations/element/pss-recommendations.component';
import { schema } from '@reuse/code/evf/components/pss-recommendations/element/pss-recommendations.schema';
import { ToggleResponsiveWrapperComponent } from '@reuse/code/evf/components/toggle-responsive-wrapper/element/toggle-responsive-wrapper.component';
import { withValueFromAutocompletePipe } from '@reuse/code/evf/pipes/value-from-autocomplete.pipe';
import { withNbSessionsSideEffect } from '@reuse/code/evf/side-effects/effects/nb-sessions.side-effect';
import { withToggleElementBasedOnValueEffect } from '@reuse/code/evf/side-effects/effects/toggle-element-based-on-value-side.effect';
import { ExternalSourceService } from '@reuse/code/services/api/externalSourceService.service';
import {
  evfElementConfigFeature,
  EvfExternalSourceService,
  provideEvfCore,
  withDefaultDateExpressionPipe,
  withFormatDateExpressionPipe,
  withParseDateExpressionPipe,
  withTransformDateExpressionPipe,
} from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { EVF_MATERIAL_OPTIONS } from '@smals-belgium-shared/vas-evaluation-form-ui-material';
import { withAutocompleteElement } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/autocomplete';
import { withCheckboxElement } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/checkbox';
import { withCheckboxListElement } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/checkbox-list';
import {
  withDateElement,
  withDateTimeElement,
} from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/date';
import { withFlexBoxElement } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/flex-box';
import { withInfoElement } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/info';
import { withInputTextElement } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/input-text';
import { withNumberElement } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/number';
import { withRadioElement } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/radio';
import { withRepeatableElement } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/repeatable';
import { withRepeatableInlineElement } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/repeatable-inline';
import { withRowElement } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/row';
import { withSectionElement } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/section';
import {
  withMultiSelectElement,
  withSelectElement,
} from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/select';
import { withSlideToggleElement } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/slide-toggle';
import { withStepperElement } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/stepper';
import { withSetOrganizationValueSideEffect } from '@reuse/code/evf/side-effects/effects/set-organization-value.side-effect';
import { withTextareaElement } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/textarea';
import { AssignProfessionalButtonComponent } from '@reuse/code/evf/components/assign-professional-dialog-button/element/assign-professional-button.component';
import { ExpansionPanelTextareaComponent } from '@reuse/code/evf/components/expansion-panel-textarea/element/expansion-panel-textarea.component';

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
      withStepperElement(),
      evfElementConfigFeature(
        {
          name: 'autocompleteMultiselect',
          element: AutocompleteMultiselectComponent,
        },
        {
          name: 'autoRadio',
          element: AutoRadioComponent,
        },
        {
          name: 'autoCheckboxList',
          element: AutoCheckboxListComponent,
        },
        {
          name: 'pssRecommendations',
          element: PssRecommendationsComponent,
          schema: schema,
        },
        {
          name: 'toggleButton',
          element: ToggleResponsiveWrapperComponent,
        },
        {
          name: 'expansionPanelTextarea',
          element: ExpansionPanelTextareaComponent,
        },
        {
          name: 'customStepper',
          element: CustomStepperComponent,
        },
        {
          name: 'pssIndicationProposal',
          element: PssIndicationProposalComponent,
        },
        {
          name: 'infoSummary',
          element: InfoSummaryComponent,
        },
        {
          name: 'customCheckboxList',
          element: CustomCheckboxListComponent,
        },
        {
          name: 'assignProfessionalButton',
          element: AssignProfessionalButtonComponent,
        }
      ),
      withAutocompleteElement(),
      withFlexBoxElement(),
      // expression pipes
      withParseDateExpressionPipe(),
      withTransformDateExpressionPipe(),
      withFormatDateExpressionPipe(),
      withDefaultDateExpressionPipe(),
      withValueFromAutocompletePipe(),
      // side effects
      withNbSessionsSideEffect(),
      withToggleElementBasedOnValueEffect(),
      withSetOrganizationValueSideEffect()
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
