import {
  BaseSideEffect,
  ElementGroupLike,
  evfSideEffectFeature,
} from '@smals-belgium-shared/vas-evaluation-form-ui-core';

export interface SetOrganizationValueSideEffect extends BaseSideEffect {
  target: string;
}

export function withSetOrganizationValueSideEffect() {
  return evfSideEffectFeature({
    name: 'setOrganizationValue',
    sideEffectFn: (params: SetOrganizationValueSideEffect, elementGroup: ElementGroupLike) =>
      setOrganizationValueSideEffect(params, elementGroup),
  });
}

function setOrganizationValueSideEffect(params: SetOrganizationValueSideEffect, elementGroup: ElementGroupLike) {
  const isOrganization = elementGroup.metadata?.['isOrganization'];

  elementGroup.get(params.target)?.setValue(isOrganization ?? false);
}
