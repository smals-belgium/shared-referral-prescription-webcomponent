import { AutocompleteOption as EVFAutocompleteOption } from '@smals/vas-evaluation-form-ui-core';
import { AutocompleteOption } from '@reuse/code/openapi';

export function mapAutocompleteOption(option: AutocompleteOption): EVFAutocompleteOption {
  return {
    value: option.value,
    label: {
      nl: option.label.nl,
      fr: option.label.fr,
      de: option.label.de,
      en: option.label.en ?? '', // default empty string if missing
    },
  };
}

/**
 * Maps an array of open api AutocompleteOptions to the EVF format.
 */
export function mapAutocompleteOptions(options?: AutocompleteOption[]): EVFAutocompleteOption[] {
  if (!options) return [];
  return options.map(mapAutocompleteOption);
}
