import { CanRejectAssignationPipe } from './can-reject-assignation.pipe';
import { AccessMatrixState } from '../states/api/access-matrix.state';
import { Intent, UserInfo } from '../interfaces';
import {
  Discipline,
  FhirR4TaskStatus,
  PerformerTaskResource,
  ReadRequestResource,
  RequestStatus,
  Role,
} from '../openapi';

const patient: UserInfo = {
  discipline: Discipline.Patient,
  firstName: '',
  lastName: '',
  professional: true,
  ssin: '123',
  role: Role.Patient,
};
const currentUser: UserInfo = {
  discipline: Discipline.Nurse,
  firstName: '',
  lastName: '',
  professional: true,
  ssin: '456',
  role: Role.Prescriber,
};

const caregiverSsin = '789';

describe('CanRejectAssignationPipe', () => {
  let pipe: CanRejectAssignationPipe;
  let mockAccessMatrixState: jest.Mocked<AccessMatrixState>;

  beforeEach(() => {
    mockAccessMatrixState = {
      hasAtLeastOnePermission: jest.fn(),
    } as unknown as jest.Mocked<AccessMatrixState>;

    pipe = new CanRejectAssignationPipe(mockAccessMatrixState);
  });

  it('should return false if currentUser is not provided', () => {
    const prescription = {} as ReadRequestResource;
    const task = {} as PerformerTaskResource;
    const result = pipe.transform(prescription, task, patient.ssin);
    expect(result).toBe(false);
  });

  it('should return false if the prescription status is not OPEN nor PENDING nor IN_PROGRESS', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    const prescription = {status: RequestStatus.Blacklisted} as ReadRequestResource;
    const task = {
      status: FhirR4TaskStatus.Ready,
      careGiverSsin: caregiverSsin,
      careGiver: {
        healthcarePerson: {
          ssin: caregiverSsin,
        },
      },
    } as PerformerTaskResource;

    const result = pipe.transform(prescription, task, patient.ssin, currentUser);
    expect(result).toBe(false);
  });

  it('should return false if the task status is not READY', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    const prescription = {status: RequestStatus.Open} as ReadRequestResource;
    const task = {
      status: FhirR4TaskStatus.Completed,
      careGiverSsin: caregiverSsin,
      careGiver: {
        healthcarePerson: {
          ssin: caregiverSsin,
        },
      },
    } as PerformerTaskResource;

    const result = pipe.transform(prescription, task, patient.ssin, currentUser);
    expect(result).toBe(false);
  });

  it('should return false if currentUser is not the patient nor the caregiver', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    const prescription = {status: RequestStatus.Open} as ReadRequestResource;
    const task = {
      status: FhirR4TaskStatus.Ready,
      careGiverSsin: caregiverSsin,
      careGiver: {
        id: {ssin: caregiverSsin},
      },
    } as PerformerTaskResource;

    const anotherUser = {...currentUser, ssin: 'anotherSsin'};

    const result = pipe.transform(prescription, task, patient.ssin, anotherUser);
    expect(result).toBe(false);
  });

  it('should call hasAssignPermissions with the correct arguments for "proposal" intent', () => {
    const prescription = {
      intent: Intent.PROPOSAL,
      templateCode: 'template1',
      status: RequestStatus.Open,
    } as ReadRequestResource;

    const task = {
      status: FhirR4TaskStatus.Ready,
      careGiverSsin: currentUser.ssin,
      careGiver: {
        healthcarePerson: {
          ssin: currentUser.ssin,
        },
        id: {
          profession: Discipline.Nurse
        }
      },
    } as PerformerTaskResource;
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const result = pipe.transform(prescription, task, patient.ssin, currentUser);

    expect(mockAccessMatrixState.hasAtLeastOnePermission).toHaveBeenCalledWith(
      ['removeAssignationProposal'],
      'template1'
    );
    expect(result).toBe(true);
  });

  it('should call hasAssignPermissions with the correct arguments for "prescription" intent', () => {
    const prescription = {
      intent: Intent.ORDER,
      templateCode: 'template2',
      status: RequestStatus.InProgress,
    } as ReadRequestResource;

    const task = {
      status: FhirR4TaskStatus.Ready,
      careGiverSsin: currentUser.ssin,
      careGiver: {
        healthcarePerson: {
          ssin: currentUser.ssin,
        },
        id: {
          profession: Discipline.Nurse
        }
      },
    } as PerformerTaskResource;
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const result = pipe.transform(prescription, task, patient.ssin, currentUser);
    expect(mockAccessMatrixState.hasAtLeastOnePermission).toHaveBeenCalledWith(
      ['removeAssignationPrescription'],
      'template2'
    );
    expect(result).toBe(true);
  });

  it('should return true if all conditions are met', () => {
    const prescription = {
      intent: Intent.ORDER,
      templateCode: 'template2',
      status: RequestStatus.Open,
    } as ReadRequestResource;

    const task = {
      status: FhirR4TaskStatus.Ready,
      careGiverSsin: currentUser.ssin,
      careGiver: {
        healthcarePerson: {
          ssin: currentUser.ssin,
        },
        id: {
          profession: Discipline.Nurse
        }
      },
    } as PerformerTaskResource;

    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const result = pipe.transform(prescription, task, patient.ssin, currentUser);
    expect(result).toBe(true);
  });

  it('should return false if currentUser is logged in as a nurse but has the same ssin as the patient', () => {
    const prescription = {
      intent: Intent.ORDER,
      templateCode: 'template2',
      status: RequestStatus.Open,
    } as ReadRequestResource;

    const task = {
      status: FhirR4TaskStatus.Ready,
      careGiverSsin: currentUser.ssin,
      careGiver: {
        healthcarePerson: {
          ssin: currentUser.ssin,
        },
      },
    } as PerformerTaskResource;
    const nurse = {...currentUser, ssin: patient.ssin};

    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const result = pipe.transform(prescription, task, patient.ssin, nurse);
    expect(result).toBe(false);
  });

  it('should return false if permissions are not granted', () => {
    const prescription = {
      intent: Intent.PROPOSAL,
      templateCode: 'template3',
      status: RequestStatus.Open,
    } as ReadRequestResource;

    const task = {
      status: FhirR4TaskStatus.Ready,
      careGiverSsin: currentUser.ssin,
      careGiver: {
        healthcarePerson: {
          ssin: currentUser.ssin,
        },
      },
    } as PerformerTaskResource;

    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(false);

    const result = pipe.transform(prescription, task, patient.ssin, currentUser);
    expect(result).toBe(false);
  });

  it('should return false if patientSsin is not provided', () => {
    const prescription = {status: RequestStatus.Open} as ReadRequestResource;
    const task = {status: FhirR4TaskStatus.Ready} as PerformerTaskResource;
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const result = pipe.transform(prescription, task, undefined as any, currentUser);
    expect(result).toBe(false);
  });

  it('should return false if caregiverSsin is missing', () => {
    const prescription = {
      status: RequestStatus.Open,
      intent: Intent.ORDER,
    } as ReadRequestResource;

    const task = {
      status: FhirR4TaskStatus.Ready,
      careGiver: {},
    } as PerformerTaskResource;

    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const result = pipe.transform(prescription, task, patient.ssin, currentUser);
    expect(result).toBe(false);
  });

  it('should return true if current user is the patient themselves', () => {
    const prescription = {
      intent: Intent.ORDER,
      templateCode: 'template2',
      status: RequestStatus.InProgress,
    } as ReadRequestResource;

    const task = {
      status: FhirR4TaskStatus.Ready,
      careGiverSsin: caregiverSsin,
      careGiver: {
        healthcarePerson: {
          ssin: caregiverSsin,
        },
        id: {
          profession: Discipline.Patient
        }
      },
    } as PerformerTaskResource;

    const patientUser = {...patient, ssin: patient.ssin, role: Role.Patient};
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const result = pipe.transform(prescription, task, patient.ssin, patientUser);
    expect(result).toBe(true);
  });

  it('should handle null prescription status safely and return false', () => {
    const prescription = {
      status: null,
      intent: Intent.ORDER,
    } as unknown as ReadRequestResource;

    const task = {
      status: FhirR4TaskStatus.Ready,
      careGiverSsin: caregiverSsin,
      careGiver: {
        healthcarePerson: {
          ssin: caregiverSsin,
        },
      },
    } as PerformerTaskResource;

    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const result = pipe.transform(prescription, task, patient.ssin, currentUser);
    expect(result).toBe(false);
  });

  it('should call removeAssignationPrescription when intent is not proposal', () => {
    const prescription = {
      intent: Intent.ORDER,
      templateCode: 'tCode',
      status: RequestStatus.Open,
    } as ReadRequestResource;

    const task = {
      status: FhirR4TaskStatus.Ready,
      careGiverSsin: currentUser.ssin,
      careGiver: {
        healthcarePerson: {
          ssin: currentUser.ssin,
        },
      },
    } as PerformerTaskResource;

    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    pipe.transform(prescription, task, patient.ssin, currentUser);
    expect(mockAccessMatrixState.hasAtLeastOnePermission).toHaveBeenCalledWith(
      ['removeAssignationPrescription'],
      'tCode'
    );
  });
});
