import { Role } from '@reuse/code/openapi';
import { CanPrintPrescriptionPipe } from '@reuse/code/pipes/can-print-prescription.pipe';

describe('CanPrintPrescriptionPipe', () => {
  let pipe: CanPrintPrescriptionPipe;

  beforeEach(() => {
    pipe = new CanPrintPrescriptionPipe();
  });

  it('should return false when currentUser is undefined', () => {
    expect(pipe.transform()).toBe(false);
  });

  it('should return false when currentUser is an organization', () => {
    const user = { role: Role.Organization, ssin: '10022500123' } as any;
    expect(pipe.transform(user)).toBe(false);
  });

  it('should return true when currentUser is not an organization', () => {
    const user = { role: Role.Patient, ssin: '10022500123' } as any;
    expect(pipe.transform(user)).toBe(true);
  });
});
