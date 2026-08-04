import {
  Discipline,
  FhirR4TaskStatus,
  OrganizationTaskResource,
  PerformerTaskResource,
  ReadRequestResource,
  RequestStatus,
  Role,
} from '@reuse/code/openapi';
import { Intent, UserInfo } from '@reuse/code/interfaces';
import { CanRejectAssignationPipe } from '@reuse/code/pipes/can-reject-assignation.pipe';
import { AccessMatrixState } from '@reuse/code/states/api/access-matrix.state';

describe('CanRejectAssignationPipe', () => {
  let pipe: CanRejectAssignationPipe;
  let mockAccessMatrixState: jest.Mocked<AccessMatrixState>;

  const patient = {
    ssin: '91020300123',
    role: Role.Patient,
    discipline: Discipline.Patient,
  } as UserInfo;

  const caregiverUser = {
    ssin: '91020300789',
    role: Role.Prescriber,
    discipline: Discipline.Nurse,
  } as UserInfo;

  const organizationUser = {
    nihii11: '12345678901',
    organizations: [
      {
        otdpharmacy: {
          nihii: '21045678210',
          name: 'Test Hospital',
        },
      },
    ],
  } as UserInfo;

  const caregiverUserAssignedToOrganization = {
    ssin: '91020300789',
    role: Role.Organization,
    discipline: Discipline.Nurse,
  } as UserInfo;

  beforeEach(() => {
    mockAccessMatrixState = {
      hasAtLeastOnePermission: jest.fn(),
    } as any;

    pipe = new CanRejectAssignationPipe(mockAccessMatrixState);
  });

  it('should return false when currentUser is missing', () => {
    const result = pipe.transform({} as any, {} as any, patient.ssin, undefined);
    expect(result).toBe(false);
  });

  it('should return false when prescription status is not allowed', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const prescription = { status: RequestStatus.Blacklisted } as ReadRequestResource;

    const task = {
      taskType: 'PerformerTaskResource',
      status: FhirR4TaskStatus.Ready,
      careGiverSsin: caregiverUser.ssin,
      careGiver: {
        healthcarePerson: { ssin: caregiverUser.ssin },
        id: { profession: caregiverUser.discipline },
      },
    } as PerformerTaskResource;

    expect(pipe.transform(prescription, task, patient.ssin, caregiverUser)).toBe(false);
  });

  it('should return false when task status is not READY', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const prescription = { status: RequestStatus.Open } as ReadRequestResource;

    const task = {
      taskType: 'PerformerTaskResource',
      status: FhirR4TaskStatus.Completed,
      careGiverSsin: caregiverUser.ssin,
      careGiver: {
        healthcarePerson: { ssin: caregiverUser.ssin },
        id: { profession: caregiverUser.discipline },
      },
    } as PerformerTaskResource;

    expect(pipe.transform(prescription, task, patient.ssin, caregiverUser)).toBe(false);
  });

  it('should call permission check for proposal intent', () => {
    const prescription = {
      intent: Intent.PROPOSAL,
      status: RequestStatus.Open,
      templateCode: 'temp1',
    } as ReadRequestResource;

    const task = {
      taskType: 'PerformerTaskResource',
      status: FhirR4TaskStatus.Ready,
      careGiverSsin: caregiverUser.ssin,
      careGiver: {
        healthcarePerson: { ssin: caregiverUser.ssin },
        id: { profession: caregiverUser.discipline },
      },
    } as PerformerTaskResource;

    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const result = pipe.transform(prescription, task, patient.ssin, caregiverUser);

    expect(mockAccessMatrixState.hasAtLeastOnePermission).toHaveBeenCalledWith(['removeAssignationProposal'], 'temp1');

    expect(result).toBe(true);
  });

  it('should call permission check for prescription intent', () => {
    const prescription = {
      intent: Intent.ORDER,
      status: RequestStatus.InProgress,
      templateCode: 'temp2',
    } as ReadRequestResource;

    const task = {
      taskType: 'PerformerTaskResource',
      status: FhirR4TaskStatus.Ready,
      careGiverSsin: caregiverUser.ssin,
      careGiver: {
        healthcarePerson: { ssin: caregiverUser.ssin },
        id: { profession: caregiverUser.discipline },
      },
    } as PerformerTaskResource;

    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const result = pipe.transform(prescription, task, patient.ssin, caregiverUser);

    expect(mockAccessMatrixState.hasAtLeastOnePermission).toHaveBeenCalledWith(
      ['removeAssignationPrescription'],
      'temp2'
    );

    expect(result).toBe(true);
  });

  it('should return true if current user is the patient', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const prescription = {
      intent: Intent.ORDER,
      status: RequestStatus.Open,
    } as ReadRequestResource;

    const task = {
      taskType: 'PerformerTaskResource',
      status: FhirR4TaskStatus.Ready,
      careGiverSsin: caregiverUser.ssin,
      careGiver: {
        healthcarePerson: { ssin: caregiverUser.ssin },
        id: { profession: Discipline.Nurse },
      },
    } as PerformerTaskResource;

    const patientUser = { ...patient };

    expect(pipe.transform(prescription, task, patient.ssin, patientUser)).toBe(true);
  });

  it('should return false when caregiver info is missing', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const prescription = {
      intent: Intent.ORDER,
      status: RequestStatus.Open,
    } as ReadRequestResource;

    const task = {
      taskType: 'PerformerTaskResource',
      status: FhirR4TaskStatus.Ready,
      careGiver: {},
    } as PerformerTaskResource;

    expect(pipe.transform(prescription, task, patient.ssin, caregiverUser)).toBe(false);
  });

  it('should return false when caregiver is assigned to an organization', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const prescription = {
      intent: Intent.ORDER,
      status: RequestStatus.Open,
    } as ReadRequestResource;

    const task = {
      taskType: 'PerformerTaskResource',
      status: FhirR4TaskStatus.Ready,
      careGiver: {},
    } as PerformerTaskResource;

    expect(pipe.transform(prescription, task, patient.ssin, caregiverUserAssignedToOrganization)).toBe(false);
  });

  describe('Organization', () => {
    it('should return true when logged-in organization matches the task organization NIHII', () => {
      mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

      const prescription = {
        intent: Intent.ORDER,
        status: RequestStatus.Open,
      } as ReadRequestResource;

      const task = {
        taskType: 'OrganizationTaskResource',
        status: FhirR4TaskStatus.Ready,
        organizationNihii: '21045678210',
      } as OrganizationTaskResource;

      const result = pipe.transform(prescription, task, patient.ssin, organizationUser);
      expect(result).toBe(true);
    });

    it('should return false when logged-in organization NIHII does not match the task organization NIHII', () => {
      mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

      const prescription = {
        intent: Intent.ORDER,
        status: RequestStatus.Open,
      } as ReadRequestResource;

      const task = {
        taskType: 'OrganizationTaskResource',
        status: FhirR4TaskStatus.Ready,
        organizationNihii: '99999999999',
      } as OrganizationTaskResource;

      const result = pipe.transform(prescription, task, patient.ssin, organizationUser);
      expect(result).toBe(false);
    });

    it('should return false when logged-in organization lacks a nihii number', () => {
      mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

      const prescription = {
        intent: Intent.ORDER,
        status: RequestStatus.Open,
      } as ReadRequestResource;

      const task = {
        taskType: 'OrganizationTaskResource',
        status: FhirR4TaskStatus.Ready,
        organizationNihii: '21045678210',
      } as OrganizationTaskResource;

      const brokenOrgUser = {
        nihii11: '12345678901',
        organizations: [
          {
            otdpharmacy: {
              name: 'Test Hospital',
            },
          },
        ],
      } as UserInfo;

      const result = pipe.transform(prescription, task, patient.ssin, brokenOrgUser);
      expect(result).toBe(false);
    });
  });
});
