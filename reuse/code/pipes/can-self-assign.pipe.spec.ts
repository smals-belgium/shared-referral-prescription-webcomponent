import { CanSelfAssignPipe } from './can-self-assign.pipe';
import { PerformerTaskResource, ReadRequestResource, RequestStatus } from '@reuse/code/openapi';

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

  it('should return true when status allowed, permission granted, and no task provided', () => {
    mockAccess.hasAtLeastOnePermission.mockReturnValue(true);

    const prescription = {
      ...basePrescription,
      status: RequestStatus.Open,
    };

    expect(pipe.transform(prescription, undefined)).toBe(true);
    expect(mockAccess.hasAtLeastOnePermission)
      .toHaveBeenCalledWith(['executeTreatment'], 'templateCode');
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

  it('should return false when a task is provided', () => {
    mockAccess.hasAtLeastOnePermission.mockReturnValue(true);

    const prescription = {
      ...basePrescription,
      status: RequestStatus.Pending,
    };

    const task = { id: 'taskId' } as PerformerTaskResource;

    expect(pipe.transform(prescription, task)).toBe(false);
  });

  it('should return false when status is undefined', () => {
    mockAccess.hasAtLeastOnePermission.mockReturnValue(true);

    const prescription = {
      ...basePrescription,
      status: undefined,
    };

    expect(pipe.transform(prescription)).toBe(false);
  });
});
