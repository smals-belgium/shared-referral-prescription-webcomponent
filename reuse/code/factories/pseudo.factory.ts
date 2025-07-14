import { PseudonymisationHelper } from '@smals-belgium-shared/pseudo-helper';
import { PseudoClient } from "../client/pseudo.client";

export function PseudoHelperFactory(
  client: PseudoClient
) {
  return new PseudonymisationHelper(client);
}
