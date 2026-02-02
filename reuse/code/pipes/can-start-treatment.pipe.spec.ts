import { CanStartTreatmentPipe } from './can-start-treatment.pipe';
import { AccessMatrixState } from '@reuse/code/states/api/access-matrix.state';
import { FhirR4TaskStatus, RequestStatus } from '@reuse/code/openapi';

describe('CanStartTreatmentPipe', () => {
  let pipe: CanStartTreatmentPipe;
  let mockAccess: jest.Mocked<AccessMatrixState>;

  const basePrescription = {
    intent: 'order',
    status: RequestStatus.Open,
    templateCode: 'templateCode'
  };

  beforeEach(() => {
    mockAccess = {
      hasAtLeastOnePermission: jest.fn()
    } as unknown as jest.Mocked<AccessMatrixState>;

    pipe = new CanStartTreatmentPipe(mockAccess);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return false when the prescription status is not allowed', () => {
    const prescription = { ...basePrescription, status: RequestStatus.Done };

    const result = pipe.transform(prescription as any);

    expect(result).toBe(false);
  });

  it('should return false when the user lacks the required permission', () => {
    mockAccess.hasAtLeastOnePermission.mockReturnValue(false);

    const result = pipe.transform(basePrescription as any);

    expect(result).toBe(false);
    expect(mockAccess.hasAtLeastOnePermission).toHaveBeenCalledWith(
      ['executeTreatment'],
      'templateCode'
    );
  });

  it('should return false when a task exists but is not READY', () => {
    mockAccess.hasAtLeastOnePermission.mockReturnValue(true);

    const task = { status: FhirR4TaskStatus.Inprogress };

    const result = pipe.transform(basePrescription as any, task as any);

    expect(result).toBe(false);
  });

  it('should return true when valid and no task exists', () => {
    mockAccess.hasAtLeastOnePermission.mockReturnValue(true);

    const result = pipe.transform(basePrescription as any);

    expect(result).toBe(true);
  });

  it('should return true when valid and task is READY', () => {
    mockAccess.hasAtLeastOnePermission.mockReturnValue(true);

    const task = { status: FhirR4TaskStatus.Ready };

    const result = pipe.transform(basePrescription as any, task as any);

    expect(result).toBe(true);
  });

  it('should return false when the prescription is a proposal', () => {
    const proposalPrescription = {
      ...basePrescription,
      intent: 'proposal'
    };

    const result = pipe.transform(proposalPrescription as any);

    expect(result).toBe(false);
  });
});
