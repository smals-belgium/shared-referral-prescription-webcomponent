import { CanInterruptTreatmentPipe } from './can-interrupt-treatment.pipe';
import { AccessMatrixState } from '../states/api/access-matrix.state';
import { FhirR4TaskStatus, ReadRequestResource, Role } from '../openapi';

describe('CanInterruptTreatmentPipe', () => {
  let pipe: CanInterruptTreatmentPipe;
  let mockAccessMatrixState: jest.Mocked<AccessMatrixState>;

  beforeEach(() => {
    mockAccessMatrixState = {
      hasAtLeastOnePermission: jest.fn(),
    } as unknown as jest.Mocked<AccessMatrixState>;

    pipe = new CanInterruptTreatmentPipe(mockAccessMatrixState);
  });

  const prescription = { templateCode: 'TEMPLATE_1' } as ReadRequestResource;

  it('should return false when currentUser is undefined', () => {
    expect(pipe.transform(prescription, {} as any, undefined)).toBe(false);
  });

  it('should return false when user is not professional', () => {
    const task = { careGiverSsin: '10022500123' } as any;
    const user = { role: Role.Patient, ssin: '10022500123' } as any;

    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    expect(pipe.transform(prescription, task, user)).toBe(false);
  });

  it('should return false when caregiver SSIN does not match currentUser', () => {
    const task = { careGiverSsin: '10022500123' } as any;
    const user = { role: Role.Prescriber, ssin: '456', discipline: 'nurse' } as any;

    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    expect(pipe.transform(prescription, task, user)).toBe(false);
  });

  it('should return false when caregiver discipline does not match currentUser', () => {
    const task = {
      careGiverSsin: '10022500123',
      careGiver: { id: { profession: 'doctor' } }
    } as any;

    const user = { role: Role.Prescriber, ssin: '10022500123', discipline: 'nurse' } as any;

    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    expect(pipe.transform(prescription, task, user)).toBe(false);
  });

  it('should return false when permission interruptTreatment is denied', () => {
    const task = {
      careGiverSsin: '10022500123',
      careGiver: { id: { profession: 'nurse' } },
      status: FhirR4TaskStatus.Inprogress
    } as any;

    const user = {
      role: Role.Prescriber,
      ssin: '10022500123',
      discipline: 'nurse'
    } as any;

    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(false);

    const result = pipe.transform(prescription, task, user);

    expect(result).toBe(false);
    expect(mockAccessMatrixState.hasAtLeastOnePermission).toHaveBeenCalledWith(
      ['interruptTreatment'],
      'TEMPLATE_1'
    );
  });

  it('should return false when task status is not INPROGRESS', () => {
    const task = { careGiverSsin: '10022500123', status: FhirR4TaskStatus.Completed } as any;
    const user = { role: Role.Prescriber, ssin: '10022500123', discipline: 'nurse' } as any;

    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    expect(pipe.transform(prescription, task, user)).toBe(false);
  });

  it('should return true when all conditions are met', () => {
    const task = {
      careGiverSsin: '10022500123',
      careGiver: { id: { profession: 'nurse' } },
      status: FhirR4TaskStatus.Inprogress
    } as any;

    const user = { role: Role.Prescriber, ssin: '10022500123', discipline: 'nurse' } as any;

    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    expect(pipe.transform(prescription, task, user)).toBe(true);
    expect(mockAccessMatrixState.hasAtLeastOnePermission).toHaveBeenCalledWith(
      ['interruptTreatment'],
      'TEMPLATE_1'
    );
  });
});
