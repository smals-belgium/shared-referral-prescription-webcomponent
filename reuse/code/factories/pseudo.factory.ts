import { PseudonymisationHelper } from '@smals-belgium-shared/pseudo-helper/dist';
import { PseudoClient} from "../client/pseudo.client";

export function PseudoHelperFactory(
  client: PseudoClient
) {
  return new PseudonymisationHelper(client);
}
