import { Intent } from '@reuse/code/interfaces';
import { RequestStatus, Role } from '@reuse/code/openapi';

const UuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SsinRegex = /^\d{11}$/i;
const ShortCodeRegex = /^[a-zA-Z0-9]{4}[a-fA-F0-9]{2}$/;

export function isSsin(value: string): boolean {
  return SsinRegex.test(value.replace(/[\s-.]/g, ''));
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
  return validateCheckDigit(value, 97) ?? validateCheckDigit('2' + value, 97);
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
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    : '';
}

export function isPrescription(intent: String | undefined): boolean {
  return intent?.toLowerCase() === Intent.ORDER;
}

export function isProposal(intent: String | undefined): boolean {
  return intent?.toLowerCase() === Intent.PROPOSAL;
}

export function isModel(intent: String | undefined): boolean {
  return intent?.toLowerCase() === Intent.MODEL;
}

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

const STATUS_CLASS_MAP: Record<RequestStatus, string> = {
  DRAFT: 'mh-black',
  BLACKLISTED: 'mh-red',
  PENDING: 'mh-orange',
  OPEN: 'mh-black',
  CANCELLED: 'mh-red',
  EXPIRED: 'mh-red',
  IN_PROGRESS: 'mh-blue',
  APPROVED: 'mh-black',
  REJECTED: 'mh-black',
  DONE: 'mh-green',
};

export function getStatusClassFromMap(status?: RequestStatus): string {
  return status ? STATUS_CLASS_MAP[status] || 'mh-black' : 'mh-black';
}

export function isProfesionalBasedOnRole(role?: Role): boolean {
  if (!role) return false;
  return role !== Role.Patient;
}
