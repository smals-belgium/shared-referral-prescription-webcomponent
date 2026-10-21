import {
  AutocompleteOption,
  BaseSideEffect,
  ElementGroupLike,
  evfSideEffectFeature,
} from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { ValidationErrors } from '@angular/forms';

export interface ToggleElementBasedOnValueSideEffect extends BaseSideEffect {
  target: string;
  unknownValue: string;
}

export function withToggleElementBasedOnValueEffect() {
  return evfSideEffectFeature({
    name: 'toggleElementBasedOnValue',
    sideEffectFn: toggleElementBasedOnValue,
  });
}

function toggleElementBasedOnValue(params: ToggleElementBasedOnValueSideEffect, elementGroup: ElementGroupLike) {
  const element = elementGroup.get(params.target);

  if (!element?.element) {
    return;
  }

  const options = element.value as string[] | AutocompleteOption[] | undefined;
  const errors: ValidationErrors = element.nativeControl.errors ?? [];
  const hasErrorInvalidCombination = element.nativeControl.hasError('invalidCombination');

  if (!options || options.length === 0) {
    if (hasErrorInvalidCombination) {
      delete errors['invalidCombination'];
      element.nativeControl.setErrors(errors);
    }
    return;
  }

  const isAutocompleteOptions = isAutocompleteOptionArray(options);
  const currentValues = isAutocompleteOptions ? options.map(option => option.value as string) : options;
  const hasUnknownNow = currentValues.includes(params.unknownValue);

  if (hasUnknownNow && currentValues.length > 1) {
    errors['invalidCombination'] = true;
    element.nativeControl.setErrors(errors);
  } else if (hasErrorInvalidCombination) {
    delete errors['invalidCombination'];
    element.nativeControl.setErrors(errors);
  }
}

function isAutocompleteOptionArray(options: string[] | AutocompleteOption[]): options is AutocompleteOption[] {
  return typeof options[0] !== 'string' && 'value' in options[0];
}
