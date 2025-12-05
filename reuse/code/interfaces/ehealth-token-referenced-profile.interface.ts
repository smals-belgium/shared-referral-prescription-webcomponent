import type { Citizen } from './ehealth-token-citizen.interface';
import type { ServiceName } from './ehealth-token-service-name.interface';

/**
 * The user can act on behalf of other profiles (mandators or children)
 */
export type ReferencedProfile = Citizen & {
  /** Full formatted name of the profile */
  name: string;

  /** The services that the user is mandated for: e.g. he may only be able to manage prescriptions */
  serviceNames: ServiceName[];
};
