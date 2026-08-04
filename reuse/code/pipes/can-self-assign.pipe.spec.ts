import { CanSelfAssignPipe } from './can-self-assign.pipe';
import { Discipline, ReadRequestResource, RequestStatus, Role } from '@reuse/code/openapi';
import { UserInfo } from '@reuse/code/interfaces';

describe('CanSelfAssignPipe', () => {
  let pipe: CanSelfAssignPipe;
  let mockAccess: { hasAtLeastOnePermission: jest.Mock };

  beforeEach(() => {
    mockAccess = { hasAtLeastOnePermission: jest.fn() };
    pipe = new CanSelfAssignPipe(mockAccess as any);
  });

  const basePrescription = {
    templateCode: 'templateCode',
  } as ReadRequestResource;

  it('should return true when status allowed and permission granted', () => {
    mockAccess.hasAtLeastOnePermission.mockReturnValue(true);

    const prescription = {
      ...basePrescription,
      status: RequestStatus.Open,
    };

    expect(pipe.transform(prescription)).toBe(true);
    expect(mockAccess.hasAtLeastOnePermission).toHaveBeenCalledWith(['assignPrescription'], 'templateCode');
  });

  it('should return false when permission is missing', () => {
    mockAccess.hasAtLeastOnePermission.mockReturnValue(false);

    const prescription = {
      ...basePrescription,
      status: RequestStatus.InProgress,
    };

    expect(pipe.transform(prescription)).toBe(false);
  });

  it('sould return false when status is not allowed', () => {
    mockAccess.hasAtLeastOnePermission.mockReturnValue(true);

    const prescription = {
      ...basePrescription,
      status: RequestStatus.Done,
    };

    expect(pipe.transform(prescription)).toBe(false);
  });

  it('should return false when status is undefined', () => {
    mockAccess.hasAtLeastOnePermission.mockReturnValue(true);

    const prescription = {
      ...basePrescription,
      status: undefined,
    };

    expect(pipe.transform(prescription)).toBe(false);
  });

  it('should return false when status is proposal and user is caregiver', () => {
    mockAccess.hasAtLeastOnePermission.mockReturnValue(true);

    const prescription = {
      ...basePrescription,
      intent: 'proposal',
      status: RequestStatus.Open,
    };

    const currentUser: UserInfo = {
      discipline: Discipline.Nurse,
      firstName: '',
      lastName: '',
      professional: true,
      ssin: '789',
      role: Role.Caregiver,
    };

    expect(pipe.transform(prescription, currentUser)).toBe(false);
  });

  it('should return false when status is proposal and user is patient', () => {
    mockAccess.hasAtLeastOnePermission.mockReturnValue(true);

    const prescription = {
      ...basePrescription,
      intent: 'proposal',
      status: RequestStatus.Open,
    };

    const currentUser: Partial<UserInfo> = {
      discipline: Discipline.Patient,
      firstName: '',
      lastName: '',
      ssin: '789',
      role: Role.Patient,
    };

    expect(pipe.transform(prescription, currentUser)).toBe(false);
  });

  it('should return true when status is proposal and user is prescriber', () => {
    mockAccess.hasAtLeastOnePermission.mockReturnValue(true);

    const prescription = {
      ...basePrescription,
      intent: 'proposal',
      status: RequestStatus.Open,
    };

    const currentUser: UserInfo = {
      discipline: Discipline.Physician,
      firstName: '',
      lastName: '',
      professional: true,
      ssin: '789',
      role: Role.Prescriber,
    };

    expect(pipe.transform(prescription, currentUser)).toBe(true);
  });
});
