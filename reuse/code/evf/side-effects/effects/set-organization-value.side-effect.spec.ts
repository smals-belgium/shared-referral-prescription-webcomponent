import { of, BehaviorSubject } from 'rxjs';
import {
  SetOrganizationValueSideEffect,
  withSetOrganizationValueSideEffect,
} from './set-organization-value.side-effect';
import { ElementGroupLike } from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { TestBed } from '@angular/core/testing';

jest.mock('@smals-belgium-shared/vas-evaluation-form-ui-core', () => ({
  evfSideEffectFeature: jest.fn(config => config),
}));

const defaultParams: SetOrganizationValueSideEffect = {
  name: 'setOrganizationValue',
  target: 'organizationField',
};

describe('setOrganizationValueSideEffect', () => {
  let mockControl: { setValue: jest.Mock };
  let elementGroup: jest.Mocked<ElementGroupLike>;
  let sideEffect: any;

  beforeEach(() => {
    mockControl = {
      setValue: jest.fn(),
    };

    elementGroup = {
      get: jest.fn().mockReturnValue(mockControl),
    } as unknown as jest.Mocked<ElementGroupLike>;

    sideEffect = withSetOrganizationValueSideEffect();
  });

  it('should set the target control value to true when metadata has isOrganization set to true', () => {
    elementGroup.metadata = { isOrganization: true };

    const params: SetOrganizationValueSideEffect = defaultParams;

    TestBed.runInInjectionContext(() => {
      sideEffect.sideEffectFn(params, elementGroup);
    });

    expect(elementGroup.get).toHaveBeenCalledWith('organizationField');
    expect(mockControl.setValue).toHaveBeenCalledWith(true);
  });

  it('should set the target control value to false when metadata has isOrganization set to false', () => {
    elementGroup.metadata = { isOrganization: false };

    const params: SetOrganizationValueSideEffect = defaultParams;

    TestBed.runInInjectionContext(() => {
      sideEffect.sideEffectFn(params, elementGroup);
    });

    expect(mockControl.setValue).toHaveBeenCalledWith(false);
  });

  it('should default to false when the metadata has no isOrganizationValue', () => {
    elementGroup.metadata = {};

    const params: SetOrganizationValueSideEffect = defaultParams;

    TestBed.runInInjectionContext(() => {
      sideEffect.sideEffectFn(params, elementGroup);
    });

    expect(mockControl.setValue).toHaveBeenCalledWith(false);
  });

  it('should do nothing if the target control does not exist on the element group', () => {
    // @ts-ignore
    elementGroup.get.mockReturnValue(null);

    const params: SetOrganizationValueSideEffect = defaultParams;

    expect(() => {
      TestBed.runInInjectionContext(() => {
        sideEffect.sideEffectFn(params, elementGroup);
      });
    }).not.toThrow();

    expect(mockControl.setValue).not.toHaveBeenCalled();
  });
});
