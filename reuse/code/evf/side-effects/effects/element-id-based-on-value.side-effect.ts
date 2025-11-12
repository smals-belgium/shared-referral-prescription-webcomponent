import { BaseSideEffect, ElementGroupLike, evfSideEffectFeature } from '@smals/vas-evaluation-form-ui-core';

export interface ElementIdBasedOnValueSideEffect extends BaseSideEffect {
  target: string;
  unknownValue: string;
}

export function withElementIdBasedOnValueEffect() {
  return evfSideEffectFeature({
    name: 'setElementIdBasedOnValue',
    sideEffectFn: updateElementIdBasedOnValue,
  });
}

function updateElementIdBasedOnValue(params: ElementIdBasedOnValueSideEffect, elementGroup: ElementGroupLike) {
  const element = elementGroup.get(params.target);

  if (!element || !element.element) {
    return;
  }

  const value = element.value as string[] | undefined;
  const hasValues = value && value.length > 0;
  const hasUnknownFlag = value?.includes(params.unknownValue);

  const idSuffix = hasValues ? (hasUnknownFlag ? '-unknown' : '-checked') : '';
  element.element.id = `${params.target}${idSuffix}`;
}
