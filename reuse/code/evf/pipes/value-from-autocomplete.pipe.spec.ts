import { evfExpressionPipeFeature } from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { withValueFromAutocompletePipe, valueFromAutocompletePipe } from './value-from-autocomplete.pipe';

jest.mock('@smals-belgium-shared/vas-evaluation-form-ui-core', () => ({
  evfExpressionPipeFeature: jest.fn(config => config),
}));

describe('valueFromAutocompletePipe', () => {
  it('should return undefined when options are undefined', () => {
    expect(valueFromAutocompletePipe(undefined as any)).toBeUndefined();
  });

  it('should return null when options are null', () => {
    expect(valueFromAutocompletePipe(null as any)).toBeNull();
  });

  it('should return the same empty array when options are empty', () => {
    const options: any[] = [];

    const result = valueFromAutocompletePipe(options as any);

    expect(result).toBe(options);
    expect(result).toEqual([]);
  });

  it('should map AutocompleteOption[] to values', () => {
    const options = [
      {
        value: 'option-1',
        label: { en: 'Option 1', fr: 'Option 1', nl: 'Option 1', de: 'Option 1' },
      },
      {
        value: 'option-2',
        label: { en: 'Option 2', fr: 'Option 2', nl: 'Option 2', de: 'Option 2' },
      },
    ] as any;

    const result = valueFromAutocompletePipe(options);

    expect(result).toEqual(['option-1', 'option-2']);
  });

  it('should cast non-string values to string type contract output', () => {
    const options = [
      {
        value: 123,
        label: { en: 'Option 1', fr: 'Option 1', nl: 'Option 1', de: 'Option 1' },
      },
    ] as any;

    const result = valueFromAutocompletePipe(options);

    expect(result).toEqual([123]);
  });
});

describe('withValueFromAutocompletePipe', () => {
  it('should register the getValueFromAutocomplete expression pipe', () => {
    const feature = withValueFromAutocompletePipe();

    expect(evfExpressionPipeFeature).toHaveBeenCalledWith({
      name: 'getValueFromAutocomplete',
      pipe: valueFromAutocompletePipe,
    });
    expect(feature).toEqual({
      name: 'getValueFromAutocomplete',
      pipe: valueFromAutocompletePipe,
    });
  });
});
