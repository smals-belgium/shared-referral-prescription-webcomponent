import { AutocompleteOption, evfExpressionPipeFeature } from '@smals-belgium-shared/vas-evaluation-form-ui-core';

export function valueFromAutocompletePipe(options: AutocompleteOption[]) {
  if (!options || !Array.isArray(options) || options.length === 0) {
    return options;
  }

  return options.map(v => v.value as string);
}

export function withValueFromAutocompletePipe() {
  return evfExpressionPipeFeature({
    name: 'getValueFromAutocomplete',
    pipe: valueFromAutocompletePipe,
  });
}
