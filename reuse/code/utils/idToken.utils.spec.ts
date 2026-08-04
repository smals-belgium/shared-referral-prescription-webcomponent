import { IdToken } from '@reuse/code/interfaces';
import { Discipline, OIDC, PrescriberResource } from '@reuse/code/openapi';
import { getConnectedOrganizationNihii, mapIdTokenToPrescriber } from './idToken.utils';

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------

const BASE_SSIN = '12345678901';
const NIHII = '12345678901';

/** Minimal IdToken with no organizations */
const idTokenNoOrgs: IdToken = {
  userProfile: {
    lastName: 'Doe',
    firstName: 'John',
    ssin: BASE_SSIN,
  },
};

/** IdToken that includes a hospital organization */
const idTokenWithHospital: IdToken = {
  userProfile: {
    lastName: 'Doe',
    firstName: 'John',
    ssin: BASE_SSIN,
    organizations: [
      {
        hospital: { nihii: NIHII, name: 'General Hospital' },
      },
    ],
  },
};

/** IdToken that includes a pharmacy organization */
const idTokenWithPharmacy: IdToken = {
  userProfile: {
    lastName: 'Doe',
    firstName: 'John',
    ssin: BASE_SSIN,
    organizations: [
      {
        otdpharmacy: { nihii: NIHII },
      },
    ],
  },
};

/** IdToken with an empty organizations array */
const idTokenWithEmptyOrgs: IdToken = {
  userProfile: {
    lastName: 'Doe',
    firstName: 'John',
    ssin: BASE_SSIN,
    organizations: [],
  },
};

/** IdToken where the first org does NOT contain the requested OIDC key */
const idTokenOrgMissingKey: IdToken = {
  userProfile: {
    lastName: 'Doe',
    firstName: 'John',
    ssin: BASE_SSIN,
    organizations: [
      {
        hospital: { nihii: NIHII },
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// mapIdTokenToPrescriber
// ---------------------------------------------------------------------------

describe('mapIdTokenToPrescriber', () => {
  // ── Guard clauses ──────────────────────────────────────────────────────────

  it('returns undefined when idToken is null', () => {
    const result = mapIdTokenToPrescriber(null, Discipline.Physician, OIDC.Hospital);
    expect(result).toBeUndefined();
  });

  it('returns undefined when idToken is undefined', () => {
    const result = mapIdTokenToPrescriber(undefined, Discipline.Physician, OIDC.Hospital);
    expect(result).toBeUndefined();
  });

  // ── No OIDC branch ────────────────────────────────────────────────────────

  it('maps ssin and discipline when oidc is null', () => {
    const result = mapIdTokenToPrescriber(idTokenNoOrgs, Discipline.Physician, null);

    expect(result).toBeDefined();
    expect(result).toEqual<PrescriberResource>({
      ssin: BASE_SSIN,
      discipline: Discipline.Physician,
    });
  });

  it('maps ssin and discipline when oidc is undefined', () => {
    const result = mapIdTokenToPrescriber(idTokenNoOrgs, Discipline.Pharmacist, undefined);

    expect(result).toBeDefined();
    expect(result?.ssin).toBe(BASE_SSIN);
    expect(result?.discipline).toBe(Discipline.Pharmacist);
    expect(result?.organizationNihii11).toBeUndefined();
  });

  it('does not set organizationNihii11 when oidc is null even if organizations exist', () => {
    const result = mapIdTokenToPrescriber(idTokenWithHospital, Discipline.Physician, null);

    expect(result?.organizationNihii11).toBeUndefined();
  });

  // ── With OIDC – happy paths ────────────────────────────────────────────────

  it('sets organizationNihii11 from matching OIDC key (hospital)', () => {
    const result = mapIdTokenToPrescriber(idTokenWithHospital, Discipline.Physician, OIDC.Hospital);

    expect(result).toEqual<PrescriberResource>({
      ssin: BASE_SSIN,
      discipline: Discipline.Physician,
      organizationNihii11: NIHII,
    });
  });

  it('sets organizationNihii11 from matching OIDC key (otdpharmacy)', () => {
    const result = mapIdTokenToPrescriber(idTokenWithPharmacy, Discipline.Pharmacist, OIDC.Otdpharmacy);

    expect(result?.organizationNihii11).toBe(NIHII);
    expect(result?.discipline).toBe(Discipline.Pharmacist);
  });

  // ── With OIDC – edge cases ─────────────────────────────────────────────────

  it('sets organizationNihii11 to undefined when organizations array is empty', () => {
    const result = mapIdTokenToPrescriber(idTokenWithEmptyOrgs, Discipline.Nurse, OIDC.Hospital);

    expect(result?.organizationNihii11).toBeUndefined();
  });

  it('sets organizationNihii11 to undefined when organization is missing requested OIDC key', () => {
    // idToken has hospital, but we query for otdpharmacy
    const result = mapIdTokenToPrescriber(idTokenOrgMissingKey, Discipline.Physician, OIDC.Otdpharmacy);

    expect(result?.organizationNihii11).toBeUndefined();
  });

  it('sets organizationNihii11 to undefined when userProfile has no organizations property', () => {
    const token: IdToken = {
      userProfile: { lastName: 'X', firstName: 'Y', ssin: BASE_SSIN },
    };
    const result = mapIdTokenToPrescriber(token, Discipline.Dentist, OIDC.Hospital);

    expect(result?.organizationNihii11).toBeUndefined();
  });

  // ── Discipline variations ─────────────────────────────────────────────────

  it.each([
    Discipline.Physician,
    Discipline.Pharmacist,
    Discipline.Dentist,
    Discipline.Nurse,
    Discipline.Midwife,
    Discipline.Physiotherapist,
    Discipline.Patient,
  ])('preserves discipline value "%s"', discipline => {
    const result = mapIdTokenToPrescriber(idTokenNoOrgs, discipline, null);
    expect(result?.discipline).toBe(discipline);
  });

  it('maps discipline as undefined when discipline argument is undefined', () => {
    const result = mapIdTokenToPrescriber(idTokenNoOrgs, undefined, null);
    expect(result?.discipline).toBeUndefined();
  });

  // ── SSIN edge cases ───────────────────────────────────────────────────────

  it('maps ssin as undefined when userProfile.ssin is missing', () => {
    const token: IdToken = {
      userProfile: { lastName: 'X', firstName: 'Y', ssin: '' },
    };
    const result = mapIdTokenToPrescriber(token, Discipline.Physician, null);
    // ssin is an empty string – still a defined property on the result
    expect(result?.ssin).toBe('');
  });
});

// ---------------------------------------------------------------------------
// getConnectedOrganizationNihii
// ---------------------------------------------------------------------------

describe('getConnectedOrganizationNihii', () => {
  // ── Guard clauses ──────────────────────────────────────────────────────────

  it('returns undefined when idToken is null', () => {
    expect(getConnectedOrganizationNihii(null, OIDC.Hospital)).toBeUndefined();
  });

  it('returns undefined when idToken is undefined', () => {
    expect(getConnectedOrganizationNihii(undefined, OIDC.Hospital)).toBeUndefined();
  });

  it('returns undefined when oidc is null', () => {
    expect(getConnectedOrganizationNihii(idTokenWithHospital, null)).toBeUndefined();
  });

  it('returns undefined when oidc is undefined', () => {
    expect(getConnectedOrganizationNihii(idTokenWithHospital, undefined)).toBeUndefined();
  });

  it('returns undefined when both idToken and oidc are null', () => {
    expect(getConnectedOrganizationNihii(null, null)).toBeUndefined();
  });

  // ── Happy paths ────────────────────────────────────────────────────────────

  it('returns nihii for a hospital organization', () => {
    const result = getConnectedOrganizationNihii(idTokenWithHospital, OIDC.Hospital);
    expect(result).toBe(NIHII);
  });

  it('returns nihii for an otdpharmacy organization', () => {
    const result = getConnectedOrganizationNihii(idTokenWithPharmacy, OIDC.Otdpharmacy);
    expect(result).toBe(NIHII);
  });

  it('returns nihii from the first organization when multiple exist', () => {
    const token: IdToken = {
      userProfile: {
        lastName: 'Doe',
        firstName: 'Jane',
        ssin: BASE_SSIN,
        organizations: [{ hospital: { nihii: 'FIRST_NIHII' } }, { hospital: { nihii: 'SECOND_NIHII' } }],
      },
    };
    const result = getConnectedOrganizationNihii(token, OIDC.Hospital);
    expect(result).toBe('FIRST_NIHII');
  });

  // ── Edge cases ─────────────────────────────────────────────────────────────

  it('returns undefined when organizations array is empty', () => {
    const result = getConnectedOrganizationNihii(idTokenWithEmptyOrgs, OIDC.Hospital);
    expect(result).toBeUndefined();
  });

  it('returns undefined when userProfile has no organizations property', () => {
    const token: IdToken = {
      userProfile: { lastName: 'X', firstName: 'Y', ssin: BASE_SSIN },
    };
    const result = getConnectedOrganizationNihii(token, OIDC.Hospital);
    expect(result).toBeUndefined();
  });

  it('returns undefined when organization is present but OIDC key does not match', () => {
    // idToken has hospital but we query for otdpharmacy
    const result = getConnectedOrganizationNihii(idTokenOrgMissingKey, OIDC.Otdpharmacy);
    expect(result).toBeUndefined();
  });

  it('returns undefined when matching organization entry has no nihii property', () => {
    const token: IdToken = {
      userProfile: {
        lastName: 'Doe',
        firstName: 'Jane',
        ssin: BASE_SSIN,
        organizations: [
          // hospital entry exists but nihii is deliberately omitted via cast
          { hospital: {} as { nihii: string } },
        ],
      },
    };
    const result = getConnectedOrganizationNihii(token, OIDC.Hospital);
    expect(result).toBeUndefined();
  });

  // ── All OIDC values ────────────────────────────────────────────────────────

  it.each([
    [OIDC.Otdpharmacy, 'otdpharmacy'],
    [OIDC.Officedoctors, 'officedoctors'],
    [OIDC.Groupofdoctors, 'groupofdoctors'],
    [OIDC.Guardpost, 'guardpost'],
    [OIDC.Medicalhouse, 'medicalhouse'],
    [OIDC.Hospital, 'hospital'],
    [OIDC.Reeducation, 'reeducation'],
    [OIDC.Groupofnurses, 'groupofnurses'],
    [OIDC.Homecareservices, 'homecareservices'],
  ] as [(typeof OIDC)[keyof typeof OIDC], string][])('resolves nihii for OIDC value "%s"', (oidcValue, orgKey) => {
    const token: IdToken = {
      userProfile: {
        lastName: 'Doe',
        firstName: 'Jane',
        ssin: BASE_SSIN,
        organizations: [{ [orgKey]: { nihii: `nihii-${orgKey}` } }],
      },
    };
    const result = getConnectedOrganizationNihii(token, oidcValue);
    expect(result).toBe(`nihii-${orgKey}`);
  });
});
