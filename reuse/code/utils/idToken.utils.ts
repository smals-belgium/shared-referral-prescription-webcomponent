import { IdToken } from '@reuse/code/interfaces';
import { Discipline, OIDC, PrescriberResource } from '@reuse/code/openapi';

export function mapIdTokenToPrescriber(
  idToken: IdToken | null | undefined,
  discipline: Discipline | undefined,
  oidc: OIDC | null | undefined
): PrescriberResource | undefined {
  if (!idToken) {
    return undefined;
  }

  let prescriber = {
    ssin: idToken.userProfile?.ssin,
    discipline: discipline,
  } as PrescriberResource;

  if (oidc) {
    const organization = idToken.userProfile?.organizations?.[0];
    const oidcValue = organization?.[oidc];

    prescriber = {
      ...prescriber,
      organizationNihii11: oidcValue?.nihii,
    };
  }

  return prescriber;
}
