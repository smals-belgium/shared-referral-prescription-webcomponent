import {
  withElementIdBasedOnValueEffect,
  ElementIdBasedOnValueSideEffect,
} from './element-id-based-on-value.side-effect';
import { BaseElementControl, ElementGroupLike } from '@smals/vas-evaluation-form-ui-core';

jest.mock('@smals/vas-evaluation-form-ui-core', () => ({
  evfSideEffectFeature: jest.fn(config => config),
}));

describe('elementIdBasedOnValueSideEffect', () => {
  let mockElementGroup: ElementGroupLike;
  let mockElement: any;
  let sideEffect: any;

  beforeEach(() => {
    mockElement = {
      value: undefined,
      element: { id: '' },
    };

    mockElementGroup = {
      get: jest.fn(() => mockElement),
    } as any;

    sideEffect = withElementIdBasedOnValueEffect();
  });

  it('should set id with no suffix when value is empty', () => {
    const params: ElementIdBasedOnValueSideEffect = {
      name: 'setElementIdBasedOnValue',
      target: 'previous-relevant-information',
      unknownValue: 'unknown',
    };

    mockElement.value = [];

    sideEffect.sideEffectFn(params, mockElementGroup);

    expect(mockElement.element.id).toBe('previous-relevant-information');
  });

  it('should set id with "-checked" suffix when value has items but no unknown response', () => {
    const params: ElementIdBasedOnValueSideEffect = {
      name: 'setElementIdBasedOnValue',
      target: 'previous-relevant-information',
      unknownValue: 'unknown',
    };

    mockElement.value = ['option1', 'option2'];

    sideEffect.sideEffectFn(params, mockElementGroup);

    expect(mockElement.element.id).toBe('previous-relevant-information-checked');
  });

  it('should set id with "-unknown" suffix when value includes unknown response', () => {
    const params: ElementIdBasedOnValueSideEffect = {
      name: 'setElementIdBasedOnValue',
      target: 'previous-relevant-information',
      unknownValue: 'unknown',
    };

    mockElement.value = ['option1', 'unknown'];

    sideEffect.sideEffectFn(params, mockElementGroup);

    expect(mockElement.element.id).toBe('previous-relevant-information-unknown');
  });

  it('should not modify id when element is not found', () => {
    const params: ElementIdBasedOnValueSideEffect = {
      name: 'setElementIdBasedOnValue',
      target: 'previous-relevant-information',
      unknownValue: 'unknown',
    };

    mockElementGroup.get = jest.fn(() => null as unknown as BaseElementControl);

    sideEffect.sideEffectFn(params, mockElementGroup);

    expect(mockElementGroup.get).toHaveBeenCalledWith('previous-relevant-information');
  });

  it('should not modify id when element.element is missing', () => {
    const params: ElementIdBasedOnValueSideEffect = {
      name: 'setElementIdBasedOnValue',
      target: 'previous-relevant-information',
      unknownValue: 'unknown',
    };

    mockElement.element = null;

    sideEffect.sideEffectFn(params, mockElementGroup);

    expect(mockElement.element).toBeNull();
  });
});
