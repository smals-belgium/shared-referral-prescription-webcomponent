import { Intent, UserInfo } from '@reuse/code/interfaces';
import { PerformerTaskResource, Role } from '@reuse/code/openapi';

const UuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SsinRegex = /^\d{11}$/i;
const ShortCodeRegex = /^[a-zA-Z0-9]{4}[a-fA-F0-9]{2}$/;
const NihiiRegex = /^\d{11}$/i;

export function isSsin(value: string): boolean {
  return SsinRegex.test(value.replace(/[\s-.]/g, ''));
}

export function isNihii(value: string): boolean {
  return NihiiRegex.test(value.replace(/[\s-.]/g, ''));
}

export function isPerformerTaskWithinOrganization(value: string): boolean {
  const valueSplit = value.split(':');
  const nihii = valueSplit[0];
  const ssin = valueSplit[1];
  if (!nihii || !ssin) {
    return false;
  }
  const isValueSsin = isSsin(ssin);
  const isValueNihii = isNihii(nihii);
  return isValueNihii && isValueSsin;
}

export function isPrescriptionId(value: string): boolean {
  return UuidRegex.test(value);
}

export function isPrescriptionShortCode(value: string): boolean {
  return ShortCodeRegex.test(value);
}

export function containsAtLeastOneDigit(value: string): boolean {
  return /\d/.test(value);
}

export function keepOnlyDigits(value: string): string {
  return value.replace(/\D+/g, '');
}

export function validateSsinChecksum(value: string): boolean {
  return validateCheckDigit(value, 97) || validateCheckDigit('2' + value, 97);
}

function validateCheckDigit(value: any, modValue: number): boolean {
  const numbersOnly = ('' + value).replace(/ \D/g, '');
  const moduloLength = modValue.toString().length;
  const digits = numbersOnly.substring(0, numbersOnly.length - moduloLength);
  const checkDigit = Number(numbersOnly.substring(numbersOnly.length - moduloLength));
  const actualCheckDigit = modValue - bigNumberModulo(digits, modValue);
  return actualCheckDigit === checkDigit;
}

function bigNumberModulo(checkNumber: string, modulo: number): number {
  return Array.from(checkNumber)
    .map(c => parseInt(c))
    .reduce((remainder, value) => (remainder * 10 + value) % modulo, 0);
}

export function toSearchString(str: string): string {
  return str
    ? str
        .toString()
        .normalize('NFC')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    : '';
}

export function isPrescription(intent: string | undefined): boolean {
  return intent?.toLowerCase() === Intent.ORDER;
}

export function isProposal(intent: string | undefined): boolean {
  return intent?.toLowerCase() === Intent.PROPOSAL;
}

export function isModel(intent: string | undefined): boolean {
  return intent?.toLowerCase() === Intent.MODEL;
}

export const getTranslationKeyPrefixForPrescriptionOrProposal = (intent: string | undefined) =>
  isPrescription(intent) ? 'prescription' : 'proposal';

export function isEmptyValue(value: any): boolean {
  if (value == null) {
    return true;
  }

  if (typeof value === 'string') {
    return value.trim() === '';
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }

  return false;
}

export function isProfesionalNotOrganizationBasedOnRole(role?: Role): boolean {
  if (!role) return false;
  return role !== Role.Patient && role !== Role.Organization;
}

export function isNotOrganizationBasedOnRole(currentUser?: Partial<UserInfo>): boolean {
  if (!currentUser?.role) return false;
  if (currentUser.role === Role.Organization && (!currentUser.discipline || !currentUser.ssin)) return false;
  return true;
}

export const checkCareGiverSsinAndProfessionAgainstCurrentUserSsinAndDiscipline = (
  task: PerformerTaskResource,
  currentUser: Partial<UserInfo>
) => {
  return task.careGiverSsin == currentUser.ssin && task.careGiver?.id?.profession == currentUser.discipline;
};

export function normalizePromiseRejectReason(reason: unknown): string {
  // Normalize and display unknown reason types
  if (typeof reason === 'string') {
    return reason;
  } else if (reason instanceof Error) {
    return reason.message;
  } else if (reason && typeof reason === 'object') {
    return JSON.stringify(reason);
  } else {
    return String(reason);
  }
}
