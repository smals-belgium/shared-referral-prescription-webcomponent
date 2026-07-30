import {
  checkCareGiverSsinAndProfessionAgainstCurrentUserSsinAndDiscipline,
  isNihii,
  isPerformerTaskWithinOrganization,
  isProfesionalNotOrganizationBasedOnRole,
  normalizePromiseRejectReason,
} from './utils';
import { Discipline, PerformerTaskResource, Role } from '../openapi';
import {
  isSsin,
  isPrescriptionId,
  isPrescriptionShortCode,
  containsAtLeastOneDigit,
  keepOnlyDigits,
  validateSsinChecksum,
  toSearchString,
  isPrescription,
  isProposal,
  isModel,
  isEmptyValue,
} from './utils';
import { Intent, UserInfo } from '@reuse/code/interfaces';

describe('Utils', () => {
  it('should validate SSIN correctly', () => {
    expect(isSsin('12345678901')).toBe(true);
    expect(isSsin('123-456-789 01')).toBe(true);
    expect(isSsin('123')).toBe(false);
  });

  it('should validate prescription id correctly', () => {
    expect(isPrescriptionId('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    expect(isPrescriptionId('invalid-uuid')).toBe(false);
  });

  it('should validate prescription short code correctly', () => {
    expect(isPrescriptionShortCode('ABCD12')).toBe(true);
    expect(isPrescriptionShortCode('XYZ')).toBe(false);
  });

  it('should detect digits in a string', () => {
    expect(containsAtLeastOneDigit('abc1')).toBe(true);
    expect(containsAtLeastOneDigit('abc')).toBe(false);
  });

  it('should keep only digits', () => {
    expect(keepOnlyDigits('a1b2c3')).toBe('123');
  });

  it('should validate SSIN checksum', () => {
    expect(validateSsinChecksum('90122712173')).toBe(true);
    expect(validateSsinChecksum('12345678904')).toBe(false);
  });

  it('should return true for valid SSIN born in 2000 or later (requires 2-prefix)', () => {
    expect(validateSsinChecksum('01051500320')).toBe(true);
  });

  it('should detect intent types', () => {
    expect(isPrescription(Intent.ORDER)).toBe(true);
    expect(isProposal(Intent.PROPOSAL)).toBe(true);
    expect(isModel(Intent.MODEL)).toBe(true);
  });

  it('should detect empty values', () => {
    expect(isEmptyValue(null)).toBe(true);
    expect(isEmptyValue(undefined)).toBe(true);
    expect(isEmptyValue('')).toBe(true);
    expect(isEmptyValue('text')).toBe(false);
    expect(isEmptyValue([])).toBe(true);
    expect(isEmptyValue([1])).toBe(false);
    expect(isEmptyValue({})).toBe(true);
    expect(isEmptyValue({ a: 1 })).toBe(false);
  });

  describe('toSearchString', () => {
    it('returns empty string for falsy input', () => {
      expect(toSearchString('')).toBe('');
      expect(toSearchString(null as unknown as string)).toBe('');
      expect(toSearchString(undefined as unknown as string)).toBe('');
    });

    it('lowercases the input', () => {
      expect(toSearchString('HELLO')).toBe('hello');
    });

    it('strips combining diacritics', () => {
      expect(toSearchString('Éléphant')).toBe('elephant');
      expect(toSearchString('café')).toBe('cafe');
      expect(toSearchString('Ñoño')).toBe('nono');
    });
  });
});

describe('isNihii', () => {
  it('returns true for a valid 11-digit nihii', () => {
    expect(isNihii('12345678901')).toBe(true);
  });

  it('returns true for a nihii with separators that normalise to 11 digits', () => {
    expect(isNihii('123-456-789 01')).toBe(true);
    expect(isNihii('123.456.789.01')).toBe(true);
  });

  it('returns false when value is fewer than 11 digits', () => {
    expect(isNihii('123')).toBe(false);
  });

  it('returns false when value is more than 11 digits', () => {
    expect(isNihii('123456789012')).toBe(false);
  });

  it('returns false when value contains letters', () => {
    expect(isNihii('1234567890A')).toBe(false);
  });
});

describe('isPerformerTaskWithinOrganization', () => {
  it('returns true for a valid nihii:ssin combination', () => {
    expect(isPerformerTaskWithinOrganization('12345678901:98765432109')).toBe(true);
  });

  it('returns false when nihii part is missing (value starts with colon)', () => {
    expect(isPerformerTaskWithinOrganization(':98765432109')).toBe(false);
  });

  it('returns false when ssin part is missing (value ends with colon)', () => {
    expect(isPerformerTaskWithinOrganization('12345678901:')).toBe(false);
  });

  it('returns false when there is no colon separator at all', () => {
    expect(isPerformerTaskWithinOrganization('12345678901')).toBe(false);
  });

  it('returns false when nihii part is not a valid nihii', () => {
    expect(isPerformerTaskWithinOrganization('invalid:98765432109')).toBe(false);
  });

  it('returns false when ssin part is not a valid ssin', () => {
    expect(isPerformerTaskWithinOrganization('12345678901:invalid')).toBe(false);
  });

  it('returns false when both parts are invalid', () => {
    expect(isPerformerTaskWithinOrganization('bad:value')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isPerformerTaskWithinOrganization('')).toBe(false);
  });
});

describe('normalizePromiseRejectReason', () => {
  it('returns the string directly when reason is a string', () => {
    expect(normalizePromiseRejectReason('something went wrong')).toBe('something went wrong');
  });

  it('returns the error message when reason is an Error instance', () => {
    expect(normalizePromiseRejectReason(new Error('network failure'))).toBe('network failure');
  });

  it('returns a JSON string when reason is a plain object', () => {
    expect(normalizePromiseRejectReason({ code: 404, detail: 'not found' })).toBe('{"code":404,"detail":"not found"}');
  });

  it('returns a JSON string when reason is an array (object branch)', () => {
    expect(normalizePromiseRejectReason([1, 2, 3])).toBe('[1,2,3]');
  });

  it('returns String(reason) when reason is a number', () => {
    expect(normalizePromiseRejectReason(42)).toBe('42');
  });

  it('returns String(reason) when reason is null', () => {
    expect(normalizePromiseRejectReason(null)).toBe('null');
  });

  it('returns String(reason) when reason is undefined', () => {
    expect(normalizePromiseRejectReason(undefined)).toBe('undefined');
  });

  it('returns String(reason) when reason is a boolean', () => {
    expect(normalizePromiseRejectReason(false)).toBe('false');
  });
});

describe('Role and Caregiver Utils', () => {
  it('should detect if role is professional, but not an organization', () => {
    expect(isProfesionalNotOrganizationBasedOnRole(Role.Patient)).toBe(false);
    expect(isProfesionalNotOrganizationBasedOnRole(Role.Prescriber)).toBe(true);
    expect(isProfesionalNotOrganizationBasedOnRole(Role.Caregiver)).toBe(true);
    expect(isProfesionalNotOrganizationBasedOnRole(Role.Organization)).toBe(false);
    expect(isProfesionalNotOrganizationBasedOnRole(undefined)).toBe(false);
  });

  it('should validate caregiver SSIN and profession matching', () => {
    const task = {
      careGiverSsin: '12345678901',
      careGiver: { id: { profession: 'NURSE' } },
    } as PerformerTaskResource;

    const user = { ssin: '12345678901', discipline: Discipline.Nurse } as Partial<UserInfo>;

    expect(checkCareGiverSsinAndProfessionAgainstCurrentUserSsinAndDiscipline(task, user)).toBe(true);
  });

  it('should fail caregiver check if SSIN or profession does not match', () => {
    const task = {
      careGiverSsin: '12345678901',
      careGiver: { id: { profession: 'NURSE' } },
    } as PerformerTaskResource;

    const wrongUser = { ssin: '000', discipline: Discipline.Physician } as Partial<UserInfo>;
    expect(checkCareGiverSsinAndProfessionAgainstCurrentUserSsinAndDiscipline(task, wrongUser)).toBe(false);
  });
});
