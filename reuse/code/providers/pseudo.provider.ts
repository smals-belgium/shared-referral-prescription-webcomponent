import {PseudonymisationHelper} from "@smals-belgium-shared/pseudo-helper/dist";
import {PseudoClient} from "../client/pseudo.client";
import {PseudoHelperFactory} from "../factories/pseudo.factory";

export function providePseudonymisation() {
  return {
    provide: PseudonymisationHelper,
    userFactory: PseudoHelperFactory,
    deps: [PseudoClient]
  }
}
