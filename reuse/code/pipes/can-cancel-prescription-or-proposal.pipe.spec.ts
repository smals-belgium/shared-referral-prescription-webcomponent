import { CanCancelPrescriptionOrProposalPipe } from './can-cancel-prescription-or-proposal.pipe';
import { Intent, UserInfo } from '../interfaces';
import { AccessMatrixState } from '../states/api/access-matrix.state';
import { Discipline, FhirR4TaskStatus, ReadRequestResource, RequestStatus, Role } from '@reuse/code/openapi';

const requester: UserInfo = {
  discipline: Discipline.Nurse,
  firstName: '',
  lastName: '',
  professional: true,
  ssin: '123',
  role: Role.Prescriber,
};
const patient: UserInfo = {
  discipline: Discipline.Patient,
  firstName: '',
  lastName: '',
  professional: true,
  ssin: '456',
  role: Role.Patient,
};
const currentUser: UserInfo = {
  discipline: Discipline.Nurse,
  firstName: '',
  lastName: '',
  professional: true,
  ssin: '789',
  role: Role.Prescriber,
};

describe('CanCancelPrescriptionOrProposal', () => {
  let pipe: CanCancelPrescriptionOrProposalPipe;
  let mockAccessMatrixState: jest.Mocked<AccessMatrixState>;

  beforeEach(() => {
    mockAccessMatrixState = {
      hasAtLeastOnePermission: jest.fn(),
    } as unknown as jest.Mocked<AccessMatrixState>;

    pipe = new CanCancelPrescriptionOrProposalPipe(mockAccessMatrixState);
  });

  it('should return false if currentUser is not provided', () => {
    const result = pipe.transform({} as ReadRequestResource, patient.ssin);
    expect(result).toBe(false);
  });

  it('should return false if the prescription has no status', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    const prescription = {} as ReadRequestResource;
    const result = pipe.transform(prescription, patient.ssin, patient);
    expect(result).toBe(false);
  });

  it('should return false if prescription status is not OPEN', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    const prescription = { status: RequestStatus.Blacklisted } as ReadRequestResource;
    const result = pipe.transform(prescription, patient.ssin, patient);
    expect(result).toBe(false);
  });

  it('should call hasCancelPermissions with correct arguments for proposal', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    const prescription = {
      intent: Intent.PROPOSAL,
      status: RequestStatus.Open,
      templateCode: 'template1',
    } as ReadRequestResource;

    pipe.transform(prescription, patient.ssin, currentUser);

    expect(mockAccessMatrixState.hasAtLeastOnePermission).toHaveBeenCalledWith(['cancelProposal'], 'template1');
  });

  it('should call hasCancelPermissions with correct arguments for prescription', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    const prescription = {
      intent: Intent.ORDER,
      status: RequestStatus.Open,
      templateCode: 'template2',
    } as ReadRequestResource;

    pipe.transform(prescription, patient.ssin, currentUser);

    expect(mockAccessMatrixState.hasAtLeastOnePermission).toHaveBeenCalledWith(['cancelPrescription'], 'template2');
  });

  it('should return false if currentUser is neither the patient nor the caregiver', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const prescription = {
      status: RequestStatus.Open,
      requester: {
        healthcarePerson: {
          ssin: requester.ssin,
        },
      },
    } as ReadRequestResource;

    const result = pipe.transform(prescription, patient.ssin, currentUser);
    expect(result).toBe(false);
  });

  it('should return false if currentUser is logged in as a nurse but has the same ssin as the patient', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const nurse = { ...currentUser, ssin: patient.ssin };

    const prescription = {
      status: RequestStatus.Open,
      requester: {
        healthcarePerson: {
          ssin: requester.ssin,
        },
      },
    } as ReadRequestResource;

    const result = pipe.transform(prescription, patient.ssin, nurse);
    expect(result).toBe(false);
  });

  it('should return true if all conditions are met', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const prescription = {
      intent: Intent.ORDER,
      status: RequestStatus.Open,
      templateCode: 'template1',
      requester: {
        healthcarePerson: {
          ssin: requester.ssin,
        },
      },
    } as ReadRequestResource;

    const result = pipe.transform(prescription, patient.ssin, requester);
    expect(result).toBe(true);
  });

  it('should return false if performerTasks contain a completed execution (FHIR status)', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const prescription = {
      intent: Intent.ORDER,
      status: RequestStatus.Open,
      performerTasks: [
        { status: FhirR4TaskStatus.Completed },
      ],
      requester: {
        healthcarePerson: {
          ssin: requester.ssin,
        },
      },
    } as unknown as ReadRequestResource;

    const result = pipe.transform(prescription, patient.ssin, requester);
    expect(result).toBe(false);
  });

  it('should return false if performerTasks is an empty array', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const prescription = {
      intent: Intent.ORDER,
      status: RequestStatus.Open,
      performerTasks: [],
      requester: {
        healthcarePerson: {
          ssin: requester.ssin,
        },
      },
    } as unknown as ReadRequestResource;

    const result = pipe.transform(prescription, patient.ssin, requester);
    expect(result).toBe(true);
  });

  it('should return false if caregiverSsin or patientSsin is missing', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const result = pipe['checkIfCurrentUserIsPatientOrAssignedCaregiver'](requester, undefined, requester.ssin);
    expect(result).toBe(false);
  });

  it('should return true when currentUser is caregiver (not patient) with matching ssin', () => {
    const caregiverUser = { ...currentUser, ssin: requester.ssin, role: Role.Prescriber };
    const result = pipe['checkIfCurrentUserIsPatientOrAssignedCaregiver'](caregiverUser, patient.ssin, requester.ssin);
    expect(result).toBe(true);
  });

  it('should return false when currentUser has no permissions', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(false);

    const prescription = {
      intent: Intent.ORDER,
      status: RequestStatus.Open,
      requester: {
        healthcarePerson: {
          ssin: requester.ssin,
        },
      },
      templateCode: 'temp',
    } as unknown as ReadRequestResource;

    const result = pipe.transform(prescription, patient.ssin, requester);
    expect(result).toBe(false);
  });

  it('should call hasCancelPermissions with cancelProposal when intent is proposal', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    const prescription = {
      intent: Intent.PROPOSAL,
      status: RequestStatus.Open,
      templateCode: 'template-proposal',
      requester: {
        healthcarePerson: { ssin: requester.ssin },
      },
    } as unknown as ReadRequestResource;

    pipe.transform(prescription, patient.ssin, requester);
    expect(mockAccessMatrixState.hasAtLeastOnePermission).toHaveBeenCalledWith(['cancelProposal'], 'template-proposal');
  });

  it('should handle undefined performerTasks gracefully (no errors)', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const prescription = {
      intent: Intent.ORDER,
      status: RequestStatus.Open,
      requester: {
        healthcarePerson: {
          ssin: requester.ssin,
        },
      },
    } as unknown as ReadRequestResource;

    const result = pipe.transform(prescription, patient.ssin, requester);
    expect(result).toBe(true);
  });
});
