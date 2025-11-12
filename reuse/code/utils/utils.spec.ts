import {
  checkCareGiverSsinAndProfessionAgainstCurrentUserSsinAndDiscipline,
  getStatusClassFromMap, isProfesionalBasedOnRole
} from './utils';
import { Discipline, PerformerTaskResource, RequestStatus, Role } from '../openapi';
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
  isEmptyValue
} from './utils';
import { Intent, UserInfo } from '@reuse/code/interfaces';

describe('getStatusClassFromMap', () => {
  it('should return mh-red for error states', () => {
    expect(getStatusClassFromMap(RequestStatus.Blacklisted)).toBe('mh-red');
    expect(getStatusClassFromMap(RequestStatus.Cancelled)).toBe('mh-red');
    expect(getStatusClassFromMap(RequestStatus.Expired)).toBe('mh-red');
  });

  it('should return mh-orange for pending status', () => {
    expect(getStatusClassFromMap(RequestStatus.Pending)).toBe('mh-orange');
  });

  it('should return mh-blue for in progress status', () => {
    expect(getStatusClassFromMap(RequestStatus.InProgress)).toBe('mh-blue');
  });

  it('should return mh-green for done status', () => {
    expect(getStatusClassFromMap(RequestStatus.Done)).toBe('mh-green');
  });

  it('should return mh-black for undefined, unknown, null, draft and open status', () => {
    expect(getStatusClassFromMap(undefined)).toBe('mh-black');

    const unknownStatus = 'UNKNOWN_STATUS' as RequestStatus;
    expect(getStatusClassFromMap(unknownStatus)).toBe('mh-black');

    expect(getStatusClassFromMap(null as any)).toBe('mh-black');

    expect(getStatusClassFromMap(RequestStatus.Draft)).toBe('mh-black');
    expect(getStatusClassFromMap(RequestStatus.Open)).toBe('mh-black');
  });

  it('should return correct class for all defined StatusEnum values', () => {
    const expectedMappings = {
      [RequestStatus.Blacklisted]: 'mh-red',
      [RequestStatus.Cancelled]: 'mh-red',
      [RequestStatus.Expired]: 'mh-red',
      [RequestStatus.Pending]: 'mh-orange',
      [RequestStatus.InProgress]: 'mh-blue',
      [RequestStatus.Done]: 'mh-green',
      [RequestStatus.Draft]: 'mh-black',
      [RequestStatus.Open]: 'mh-black',
    };

    Object.entries(expectedMappings).forEach(([status, expectedClass]) => {
      expect(getStatusClassFromMap(status as RequestStatus)).toBe(expectedClass);
    });
  });
});

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

  it('should normalize strings for search', () => {
    expect(toSearchString('Éléphant')).toBe('elephant');
    expect(toSearchString('')).toBe('');
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
});

describe('Role and Caregiver Utils', () => {
  it('should detect if role is professional', () => {
    expect(isProfesionalBasedOnRole(Role.Patient)).toBe(false);
    expect(isProfesionalBasedOnRole(Role.Prescriber)).toBe(true);
    expect(isProfesionalBasedOnRole(undefined)).toBe(false);
  });

  it('should validate caregiver SSIN and profession matching', () => {
    const task = {
      careGiverSsin: '12345678901',
      careGiver: { id: { profession: 'NURSE' } }
    } as PerformerTaskResource;

    const user = { ssin: '12345678901', discipline: 'NURSE' } as Partial<UserInfo>;

    expect(checkCareGiverSsinAndProfessionAgainstCurrentUserSsinAndDiscipline(task, user)).toBe(true);
  });

  it('should fail caregiver check if SSIN or profession does not match', () => {
    const task = {
      careGiverSsin: '12345678901',
      careGiver: { id: { profession: 'NURSE' } }
    } as PerformerTaskResource;

    const wrongUser = { ssin: '000', discipline: Discipline.Physician } as Partial<UserInfo>;
    expect(checkCareGiverSsinAndProfessionAgainstCurrentUserSsinAndDiscipline(task, wrongUser)).toBe(false);
  });
});
