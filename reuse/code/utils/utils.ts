const UuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i as RegExp;
const SsinRegex = /^[0-9]{11}$/i as RegExp;

export function isSsin(value: string): boolean {
  return SsinRegex.test(value.replace(/[\s-.]/g, ''));
}

export function isPrescriptionId(value: string): boolean {
  return UuidRegex.test(value);
}

export function containsAtLeastOneDigit(value: string): boolean {
  return /\d/.test(value);
}

export function keepOnlyDigits(value: string): string {
  return value.replace(/[^\d]+/g, '');
}

export function validateSsinChecksum(value: string): boolean {
  return validateCheckDigit(value, 97) || validateCheckDigit('2' + value, 97);
}

function validateCheckDigit(value: any, modValue: number): boolean {
  const numbersOnly = ('' + value).replace(/[^0-9]/g, '');
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
