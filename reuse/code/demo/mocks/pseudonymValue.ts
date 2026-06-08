import { Value } from '@smals-belgium-shared/pseudo-helper';
import { pseudonymInTransitMock } from '@reuse/code/demo/mocks/pseudonymInTransit';

export const pseudonymValue = {
  pseudonymize() {
    return Promise.resolve(pseudonymInTransitMock);
  },
} as unknown as Value;
