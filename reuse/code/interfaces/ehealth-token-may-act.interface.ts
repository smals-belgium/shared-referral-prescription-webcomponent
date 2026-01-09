import type { ReferencedProfile } from './ehealth-token-referenced-profile.interface';

/**
 * Additional information on the profiles on whose behalf the user "may act" (is that what it means?).
 * The most important property here is the `sub`, which is the `subjectId`, or identifier we need to use
 * when executing a profile switch.
 */
export type MayAct = {
  /** Subject identifier */
  sub: string;

  /**
   * A property for no reason.
   *
   * It can contain:
   * - one mandator
   * - or one child
   */
  userProfile: { mandators: [MayActReferencedProfile] } | { children: [MayActReferencedProfile] };
};

/** In the token, referenced profiles only have an SSIN and serviceNames, nothing else. */
export type MayActReferencedProfile = Pick<ReferencedProfile, 'ssin' | 'serviceNames'>;
