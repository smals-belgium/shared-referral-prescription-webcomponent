import {
  mapAutocompleteOption,
  mapAutocompleteOptions,
} from './autocomplete.utils';
import { AutocompleteOption } from '@reuse/code/openapi';

describe('autocomplete.utils', () => {
  describe('mapAutocompleteOption', () => {

    it('should map single option with all languages', () => {
      const option: AutocompleteOption = {
        value: 'test-value',
        label: {
          nl: 'NL',
          fr: 'FR',
          de: 'DE',
          en: 'EN',
        },
      } as any;

      const result = mapAutocompleteOption(option);

      expect(result).toEqual({
        value: 'test-value',
        label: { nl: 'NL', fr: 'FR', de: 'DE', en: 'EN' },
      });
    });

    it('should set en to empty string when undefined', () => {
      const option = {
        value: 'v',
        label: { nl: 'NL', fr: 'FR', de: 'DE', en: undefined },
      } as any;

      const result = mapAutocompleteOption(option);

      expect(result.label.en).toBe('');
    });

    it('should set en to empty string when null', () => {
      const option = {
        value: 'v',
        label: { nl: 'NL', fr: 'FR', de: 'DE', en: null },
      } as any;

      const result = mapAutocompleteOption(option);

      expect(result.label.en).toBe('');
    });

  });

  describe('mapAutocompleteOptions', () => {

    it('should map array with multiple options', () => {
      const options = [
        { value: 'v1', label: { nl: 'NL1', fr: 'FR1', de: 'DE1', en: 'EN1' } } as any,
        { value: 'v2', label: { nl: 'NL2', fr: 'FR2', de: 'DE2', en: 'EN2' } } as any,
      ];

      const result = mapAutocompleteOptions(options);

      expect(result.map(o => o.value)).toEqual(['v1', 'v2']);
    });

    it('should return empty array when options is undefined', () => {
      expect(mapAutocompleteOptions(undefined)).toEqual([]);
    });

    it('should return empty array when options is empty', () => {
      expect(mapAutocompleteOptions([])).toEqual([]);
    });
  });
});
