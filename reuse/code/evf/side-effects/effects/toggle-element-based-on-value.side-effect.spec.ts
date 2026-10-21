import {
  withToggleElementBasedOnValueEffect,
  ToggleElementBasedOnValueSideEffect,
} from './toggle-element-based-on-value-side.effect';
import {
  AutocompleteOption,
  BaseElementControl,
  ElementGroupLike,
} from '@smals-belgium-shared/vas-evaluation-form-ui-core';

jest.mock('@smals-belgium-shared/vas-evaluation-form-ui-core', () => ({
  evfSideEffectFeature: jest.fn(config => config),
}));

describe('toggleElementBasedOnValueSideEffect', () => {
  let mockElementGroup: ElementGroupLike;
  let mockElement: any;
  let sideEffect: any;
  let mockHasError: jest.Mock;
  let mockSetErrors: jest.Mock;

  const params: ToggleElementBasedOnValueSideEffect = {
    name: 'toggleElementBasedOnValue',
    target: 'previous-relevant-information',
    unknownValue: 'unknown',
  };

  beforeEach(() => {
    mockHasError = jest.fn().mockReturnValue(false);
    mockSetErrors = jest.fn();

    mockElement = {
      value: undefined,
      element: { id: 'previous-relevant-information' },
      nativeControl: {
        errors: {},
        hasError: mockHasError,
        setErrors: mockSetErrors,
      },
    };

    mockElementGroup = {
      get: jest.fn(() => mockElement),
    } as any;

    sideEffect = withToggleElementBasedOnValueEffect();
  });

  it('should register side effect with expected name', () => {
    expect(sideEffect.name).toBe('toggleElementBasedOnValue');
    expect(typeof sideEffect.sideEffectFn).toBe('function');
  });

  it('should clear invalidCombination when value is empty and error exists', () => {
    mockHasError.mockReturnValue(true);
    mockElement.nativeControl.errors = { invalidCombination: true, anotherError: true };
    mockElement.value = [];

    sideEffect.sideEffectFn(params, mockElementGroup);

    expect(mockSetErrors).toHaveBeenCalledWith({ anotherError: true });
  });

  it('should set invalidCombination when unknown and another value are selected (string values)', () => {
    mockElement.nativeControl.errors = {};
    mockElement.value = ['option1', 'unknown'];

    sideEffect.sideEffectFn(params, mockElementGroup);

    expect(mockSetErrors).toHaveBeenCalledWith({ invalidCombination: true });
  });

  it('should clear invalidCombination when selected values are valid', () => {
    mockHasError.mockReturnValue(true);
    mockElement.nativeControl.errors = { invalidCombination: true };
    mockElement.value = ['option1', 'option2'];

    sideEffect.sideEffectFn(params, mockElementGroup);

    expect(mockSetErrors).toHaveBeenCalledWith({});
  });

  it('should handle AutocompleteOption[] values', () => {
    const options: AutocompleteOption[] = [
      { label: { en: 'Option 1' }, value: 'option1' } as unknown as AutocompleteOption,
      { label: { en: 'Unknown' }, value: 'unknown' } as unknown as AutocompleteOption,
    ];
    mockElement.nativeControl.errors = {};
    mockElement.value = options;

    sideEffect.sideEffectFn(params, mockElementGroup);

    expect(mockSetErrors).toHaveBeenCalledWith({ invalidCombination: true });
  });

  it('should not set errors when value is empty and invalidCombination is absent', () => {
    mockHasError.mockReturnValue(false);
    mockElement.nativeControl.errors = { anotherError: true };
    mockElement.value = [];

    sideEffect.sideEffectFn(params, mockElementGroup);

    expect(mockSetErrors).not.toHaveBeenCalled();
  });

  it('should do nothing when element is not found', () => {
    mockElementGroup.get = jest.fn(() => null as unknown as BaseElementControl);

    sideEffect.sideEffectFn(params, mockElementGroup);

    expect(mockElementGroup.get).toHaveBeenCalledWith('previous-relevant-information');
  });

  it('should do nothing when element.element is missing', () => {
    mockElement.element = null;

    sideEffect.sideEffectFn(params, mockElementGroup);

    expect(mockSetErrors).not.toHaveBeenCalled();
  });

  it('should do nothing when only unknown value is selected', () => {
    mockElement.nativeControl.errors = {};
    mockElement.value = ['unknown'];

    sideEffect.sideEffectFn(params, mockElementGroup);

    expect(mockSetErrors).not.toHaveBeenCalled();
  });
});
