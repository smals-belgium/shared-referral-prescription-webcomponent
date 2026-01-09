import { PseudonymisationHelper } from '@smals-belgium-shared/pseudo-helper';
import { PseudoClient } from '@reuse/code/client/pseudo.client';
import { PseudoHelperFactory } from '@reuse/code/factories/pseudo.factory';

export function providePseudonymisation() {
  return {
    provide: PseudonymisationHelper,
    userFactory: PseudoHelperFactory,
    deps: [PseudoClient],
  };
}
