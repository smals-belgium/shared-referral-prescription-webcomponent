import { CanStartTreatmentPipe } from './can-start-treatment.pipe';
import { AccessMatrixState } from '@reuse/code/states/api/access-matrix.state';
import {
  Discipline,
  FhirR4TaskStatus,
  ReadRequestResource,
  RequestStatus,
  RequestTaskResource,
  Role,
} from '@reuse/code/openapi';
import { Intent, UserInfo } from '@reuse/code/interfaces';

describe('CanStartTreatmentPipe', () => {
  let pipe: CanStartTreatmentPipe;
  let mockAccess: jest.Mocked<AccessMatrixState>;

  const currentUser: Partial<UserInfo> = {
    role: Role.Caregiver,
  };

  const basePrescription: ReadRequestResource = {
    intent: Intent.ORDER,
    status: RequestStatus.Open,
    templateCode: 'templateCode',
  };

  beforeEach(() => {
    mockAccess = {
      hasAtLeastOnePermission: jest.fn(),
    } as unknown as jest.Mocked<AccessMatrixState>;

    pipe = new CanStartTreatmentPipe(mockAccess);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return false when the prescription status is not allowed', () => {
    const prescription = { ...basePrescription, status: RequestStatus.Done };

    const result = pipe.transform(prescription);

    expect(result).toBe(false);
  });

  it('should return false when the user lacks the required permission', () => {
    mockAccess.hasAtLeastOnePermission.mockReturnValue(false);

    const result = pipe.transform(basePrescription, undefined, currentUser);

    expect(result).toBe(false);
    expect(mockAccess.hasAtLeastOnePermission).toHaveBeenCalledWith(['executeTreatment'], 'templateCode');
  });

  it('should return false when the user is an organization', () => {
    const user = { role: Role.Organization, ssin: '10022500123' };
    mockAccess.hasAtLeastOnePermission.mockReturnValue(false);

    const result = pipe.transform(basePrescription, undefined, user);

    expect(result).toBe(false);
  });

  it('should return true when the user is a caregiver within an organization', () => {
    const user: Partial<UserInfo> = { role: Role.Organization, ssin: '10022500123', discipline: Discipline.Nurse };
    mockAccess.hasAtLeastOnePermission.mockReturnValue(true);

    const task: RequestTaskResource = { status: FhirR4TaskStatus.Ready, taskType: 'PerformerTaskResource' };

    const result = pipe.transform(basePrescription, task, user);

    expect(result).toBe(true);
  });

  it('should return false when a task exists but is not READY', () => {
    mockAccess.hasAtLeastOnePermission.mockReturnValue(true);

    const task: RequestTaskResource = { status: FhirR4TaskStatus.Inprogress };

    const result = pipe.transform(basePrescription, task, currentUser);

    expect(result).toBe(false);
  });

  it('should return true when valid and no task exists', () => {
    mockAccess.hasAtLeastOnePermission.mockReturnValue(true);

    const result = pipe.transform(basePrescription, undefined, currentUser);

    expect(result).toBe(true);
  });

  it('should return true when valid and task is READY', () => {
    mockAccess.hasAtLeastOnePermission.mockReturnValue(true);

    const task: RequestTaskResource = { status: FhirR4TaskStatus.Ready, taskType: 'PerformerTaskResource' };

    const result = pipe.transform(basePrescription, task, currentUser);

    expect(result).toBe(true);
  });

  it('should return false when valid status, but task is OrganizationTask', () => {
    mockAccess.hasAtLeastOnePermission.mockReturnValue(true);

    const task: RequestTaskResource = { status: FhirR4TaskStatus.Ready, taskType: 'OrganizationTaskResource' };

    const result = pipe.transform(basePrescription, task, currentUser);

    expect(result).toBe(false);
  });

  it('should return false when the prescription is a proposal', () => {
    const proposalPrescription = {
      ...basePrescription,
      intent: Intent.PROPOSAL,
    };

    const result = pipe.transform(proposalPrescription, undefined, currentUser);

    expect(result).toBe(false);
  });
});
