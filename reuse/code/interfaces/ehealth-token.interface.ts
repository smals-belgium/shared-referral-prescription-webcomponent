import type { UserLanguage } from '@smals-belgium/myhealth-wc-integration';

import type { Citizen } from './ehealth-token-citizen.interface';
import type { MayAct } from './ehealth-token-may-act.interface';

/**
 * Decoded `AccessToken`
 * Contains links to other profiles through their `ssin`s, but no additional profile information
 */
export type EHealthToken = {
  /** Social security identification number */
  ssin: string;

  /** Subject identifier of this profile */
  sub: string;

  /** Full formatted name of the user */
  name: string;

  /** Same as userProfile#firstName */
  given_name: string;

  /** Same as userPRofile#lastName */
  family_name: string;

  /** Probably not to be used */
  preferred_username: string;

  /** User's language as ISO-2 (so not really a locale in fact) */
  locale: UserLanguage;

  /**
   * For the main user, this contains basic information.
   * It changes after profile switching though.
   * @see ExchangedToken
   */
  userProfile: Citizen;

  /** Links to mandates and children of this profile */
  may_act?: MayAct[];

  /** ??? ID */
  sid: string;

  /** ??? ID */
  jti: string;

  /** Expiration timestamp */
  exp: number;

  /** ??? timestamp */
  iat: number;

  /** Authentication time timestamp */
  auth_time: number;

  /** Information source URL ? */
  iss: string;

  /** Originating client ID ? */
  azp: string;

  /** Client ID chain ? */
  aud: string[];

  /** Authentication type */
  typ: 'Bearer';

  /** Domains that are allowed to query this eHealth service */
  'allowed-origins': string[];

  /** Space separated string of OAuth scopes */
  scope: string;

  /** OAuth resource access */
  resource_access: Record<string, { roles: string[] }>;
};
