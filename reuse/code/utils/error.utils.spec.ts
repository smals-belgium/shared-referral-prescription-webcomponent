import { ApiCode } from '@reuse/code/interfaces/error.interface';
import { resolveErrorKeys } from './error.utils';
import { RequestStatus, Role } from '../openapi';

const KEY_PREFIX = 'error.api';

describe('resolveErrorKeys', () => {
  it('returns only the default and unknown fallbacks for codes without a resolver', () => {
    expect(resolveErrorKeys('CAREGIVER_NOT_FOUND')).toEqual([
      `${KEY_PREFIX}.CAREGIVER_NOT_FOUND.default`,
      `${KEY_PREFIX}.unknown`,
    ]);
  });

  it('prepends the specific key when a resolver matches the context', () => {
    const keys = resolveErrorKeys(ApiCode.CANCELLATION_INVALID_STATUS, {
      serviceRequestStatus: RequestStatus.InProgress,
    });
    expect(keys).toEqual([
      `${KEY_PREFIX}.CANCELLATION_INVALID_STATUS.in-progress`,
      `${KEY_PREFIX}.CANCELLATION_INVALID_STATUS.default`,
      `${KEY_PREFIX}.unknown`,
    ]);
  });

  it('falls back to default + unknown when the resolver returns null for the given context', () => {
    const noContext = resolveErrorKeys(ApiCode.CANCELLATION_INVALID_STATUS);
    const unmatchedStatus = resolveErrorKeys(ApiCode.CANCELLATION_INVALID_STATUS, {
      serviceRequestStatus: 'draft' as RequestStatus,
    });

    const expected = [`${KEY_PREFIX}.CANCELLATION_INVALID_STATUS.default`, `${KEY_PREFIX}.unknown`];
    expect(noContext).toEqual(expected);
    expect(unmatchedStatus).toEqual(expected);
  });

  it.each([
    [
      ApiCode.CANCELLATION_INVALID_STATUS,
      { serviceRequestStatus: RequestStatus.Done },
      `${KEY_PREFIX}.CANCELLATION_INVALID_STATUS.completed`,
    ],
    [
      ApiCode.EXCLUSION_EXISTS_CAREGIVER_TO_ASSIGN,
      { role: Role.Patient },
      `${KEY_PREFIX}.EXCLUSION_EXISTS_CAREGIVER_TO_ASSIGN.patient`,
    ],
    [
      ApiCode.EXCLUSION_EXISTS_CAREGIVER_TO_ASSIGN,
      { role: Role.Prescriber },
      `${KEY_PREFIX}.CANCELLATION_NOT_POSSIBLE.healthcare-provider`,
    ],
    [
      ApiCode.HEALTHCARE_PROFESSIONAL_ALREADY_ASSIGNED,
      { role: Role.Caregiver },
      `${KEY_PREFIX}.HEALTHCARE_PROFESSIONAL_ALREADY_ASSIGNED.caregiver`,
    ],
  ])('resolves %s with context %j to the specific key', (code, ctx, expectedFirstKey) => {
    const keys = resolveErrorKeys(code, ctx);
    expect(keys[0]).toBe(expectedFirstKey);
  });
});
