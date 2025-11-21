import { BaseSideEffect, ElementGroupLike, evfSideEffectFeature } from '@smals/vas-evaluation-form-ui-core';

export interface NbSessionsSideEffect extends BaseSideEffect {
  target: string;
  frequency: string;
  periodUnit: string;
  boundsDuration: string;
  boundsDurationUnit: string;
}

export function withNbSessionsSideEffect() {
  return evfSideEffectFeature({
    name: 'setNbSessions',
    sideEffectFn: nbSessionsSideEffect,
  });
}

function nbSessionsSideEffect(params: NbSessionsSideEffect, elementGroup: ElementGroupLike) {
  const getTypedValue = <T>(key: string): T | undefined => {
    return elementGroup.get(key)?.value as T | undefined;
  };

  const frequency = getTypedValue<number>(params.frequency) || 0;
  const periodUnit = getTypedValue<'d' | 'wk' | 'mo' | 'a'>(params.periodUnit);
  const boundsDuration = getTypedValue<number>(params.boundsDuration) || 0;
  const boundsDurationUnit = getTypedValue<'d' | 'wk' | 'mo' | 'a'>(params.boundsDurationUnit);

  if (!periodUnit || !boundsDurationUnit) {
    elementGroup.get(params.target)?.setValue(null);
    return;
  }

  const periodToDays: Record<'d' | 'wk' | 'mo' | 'a', number> = {
    d: 1,
    wk: 7,
    mo: 30,
    a: 365,
  };

  const freqPerDay = frequency / periodToDays[periodUnit];
  const durInDay = boundsDuration * periodToDays[boundsDurationUnit];
  const nb = Math.ceil(freqPerDay * durInDay);

  elementGroup.get(params.target)?.setValue(nb > 0 ? nb : null);
}
