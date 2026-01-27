import { withNbSessionsSideEffect, NbSessionsSideEffect } from './nb-sessions.side-effect';
import { ElementGroupLike } from '@smals-belgium-shared/vas-evaluation-form-ui-core';

jest.mock('@smals-belgium-shared/vas-evaluation-form-ui-core', () => ({
  evfSideEffectFeature: jest.fn(config => config),
}));

describe('nbSessionsSideEffect', () => {
  let mockElementGroup: ElementGroupLike;
  let mockSetValue: jest.Mock;
  let mockElements: Map<string, { value: any; setValue: jest.Mock }>;
  let sideEffect: any;

  beforeEach(() => {
    mockSetValue = jest.fn();
    mockElements = new Map();

    mockElementGroup = {
      get: jest.fn((key: string) => mockElements.get(key)),
    } as any;

    sideEffect = withNbSessionsSideEffect();
  });

  const setupMockElement = (key: string, value: any) => {
    mockElements.set(key, { value, setValue: mockSetValue });
  };

  it('should calculate sessions correctly for daily frequency over a week', () => {
    const params: NbSessionsSideEffect = {
      name: 'setNbSessions',
      target: 'nbSessions',
      frequency: 'freq',
      periodUnit: 'periodUnit',
      boundsDuration: 'duration',
      boundsDurationUnit: 'durationUnit',
    };

    setupMockElement('freq', 2);
    setupMockElement('periodUnit', 'd');
    setupMockElement('duration', 1);
    setupMockElement('durationUnit', 'wk');
    setupMockElement('nbSessions', null);

    sideEffect.sideEffectFn(params, mockElementGroup);

    // 2/day * 7 days = 14
    expect(mockSetValue).toHaveBeenCalledWith(14);
  });

  it('should calculate sessions with rounding up for weekly frequency over a month', () => {
    const params: NbSessionsSideEffect = {
      name: 'setNbSessions',
      target: 'nbSessions',
      frequency: 'freq',
      periodUnit: 'periodUnit',
      boundsDuration: 'duration',
      boundsDurationUnit: 'durationUnit',
    };

    setupMockElement('freq', 3);
    setupMockElement('periodUnit', 'wk');
    setupMockElement('duration', 1);
    setupMockElement('durationUnit', 'mo');
    setupMockElement('nbSessions', null);

    sideEffect.sideEffectFn(params, mockElementGroup);

    // 3/7 per day * 30 days = 12.857 → Math.ceil = 13
    expect(mockSetValue).toHaveBeenCalledWith(13);
  });

  it('should set null when periodUnit is missing', () => {
    const params: NbSessionsSideEffect = {
      name: 'setNbSessions',
      target: 'nbSessions',
      frequency: 'freq',
      periodUnit: 'periodUnit',
      boundsDuration: 'duration',
      boundsDurationUnit: 'durationUnit',
    };

    setupMockElement('freq', 5);
    setupMockElement('periodUnit', undefined);
    setupMockElement('duration', 1);
    setupMockElement('durationUnit', 'wk');
    setupMockElement('nbSessions', null);

    sideEffect.sideEffectFn(params, mockElementGroup);

    expect(mockSetValue).toHaveBeenCalledWith(null);
  });

  it('should set null when boundsDurationUnit is missing', () => {
    const params: NbSessionsSideEffect = {
      name: 'setNbSessions',
      target: 'nbSessions',
      frequency: 'freq',
      periodUnit: 'periodUnit',
      boundsDuration: 'duration',
      boundsDurationUnit: 'durationUnit',
    };

    setupMockElement('freq', 5);
    setupMockElement('periodUnit', 'd');
    setupMockElement('duration', 1);
    setupMockElement('durationUnit', undefined);
    setupMockElement('nbSessions', null);

    sideEffect.sideEffectFn(params, mockElementGroup);

    expect(mockSetValue).toHaveBeenCalledWith(null);
  });

  it('should handle zero or missing frequency/duration values', () => {
    const params: NbSessionsSideEffect = {
      name: 'setNbSessions',
      target: 'nbSessions',
      frequency: 'freq',
      periodUnit: 'periodUnit',
      boundsDuration: 'duration',
      boundsDurationUnit: 'durationUnit',
    };

    setupMockElement('freq', 0);
    setupMockElement('periodUnit', 'd');
    setupMockElement('duration', 0);
    setupMockElement('durationUnit', 'wk');
    setupMockElement('nbSessions', null);

    sideEffect.sideEffectFn(params, mockElementGroup);

    // 0/1 * 0 = 0 → should set null when result is 0
    expect(mockSetValue).toHaveBeenCalledWith(null);
  });
});
