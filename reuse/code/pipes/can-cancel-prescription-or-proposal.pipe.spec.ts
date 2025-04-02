import { CanCancelPrescriptionOrProposalPipe } from './can-cancel-prescription-or-proposal.pipe';
import { Discipline, ReadPrescription, Role, Status, UserInfo } from '../interfaces';
import { AccessMatrixState } from '../states/access-matrix.state';

const requester: UserInfo = {
  discipline: Discipline.NURSE,
  firstName: '',
  lastName: '',
  professional: true,
  ssin: '123',
  role: Role.professional
};
const patient: UserInfo = {
  discipline: Discipline.PATIENT,
  firstName: '',
  lastName: '',
  professional: true,
  ssin: '456',
  role: Role.patient
};
const currentUser: UserInfo = {
  discipline: Discipline.NURSE,
  firstName: '',
  lastName: '',
  professional: true,
  ssin: '789',
  role: Role.professional
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
    const result = pipe.transform({} as ReadPrescription, patient.ssin);
    expect(result).toBe(false);
  });

  it('should return false if the prescription has no status', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    const prescription = {} as ReadPrescription;
    const result = pipe.transform(prescription, patient.ssin, patient);
    expect(result).toBe(false);
  });

  it('should return false if prescription status is not OPEN', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    const prescription = { status: Status.BLACKLISTED } as ReadPrescription;
    const result = pipe.transform(prescription, patient.ssin, patient);
    expect(result).toBe(false);
  });


  it('should call hasCancelPermissions with correct arguments for proposal', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    const prescription = { intent: 'proposal', status: Status.OPEN , templateCode: 'template1' } as ReadPrescription;

    pipe.transform(prescription, patient.ssin, currentUser);

    expect(mockAccessMatrixState.hasAtLeastOnePermission).toHaveBeenCalledWith(['cancelProposal'], 'template1');
  });

  it('should call hasCancelPermissions with correct arguments for prescription', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    const prescription = { intent: 'prescription',status: Status.OPEN, templateCode: 'template2' } as ReadPrescription;

    pipe.transform(prescription, patient.ssin, currentUser);

    expect(mockAccessMatrixState.hasAtLeastOnePermission).toHaveBeenCalledWith(['cancelPrescription'], 'template2');
  });

  it('should return false if currentUser is neither the patient nor the caregiver', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const prescription = {
      status: Status.OPEN,
      requester: {
        id: { ssin: requester.ssin }
      }
    } as ReadPrescription;

    const result = pipe.transform(prescription, patient.ssin, currentUser);
    expect(result).toBe(false);
  });

  it('should return false if currentUser is logged in as a nurse but has the same ssin as the patient', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const nurse = {...currentUser, ssin: patient.ssin}

    const prescription = {
      status: Status.OPEN,
      requester: {
        id: { ssin: requester.ssin }
      }
    } as ReadPrescription;

    const result = pipe.transform(prescription, patient.ssin, nurse);
    expect(result).toBe(false);
  });

  it('should return true if all conditions are met', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const prescription = {
      intent: 'prescription',
      status: Status.OPEN,
      templateCode: 'template1',
      requester: {
        id: { ssin: requester.ssin }
      }
    } as ReadPrescription;

    const result = pipe.transform(prescription, patient.ssin, requester);
    expect(result).toBe(true);
  });

});
