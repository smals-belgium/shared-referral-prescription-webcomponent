import { CanRejectAssignationPipe } from './can-reject-assignation.pipe';
import { AccessMatrixState } from '../states/access-matrix.state';
import { Discipline, PerformerTask, ReadPrescription, Role, Status, TaskStatus, UserInfo } from '../interfaces';

const patient: UserInfo = {
  discipline: Discipline.PATIENT,
  firstName: '',
  lastName: '',
  professional: true,
  ssin: '123',
  role: Role.patient
};
const currentUser: UserInfo = {
  discipline: Discipline.NURSE,
  firstName: '',
  lastName: '',
  professional: true,
  ssin: '456',
  role: Role.professional
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
    const prescription = {} as ReadPrescription;
    const task = {} as PerformerTask;
    const result = pipe.transform(prescription, task, patient.ssin);
    expect(result).toBe(false);
  });

  it('should return false if the prescription status is not OPEN nor PENDING nor IN_PROGRESS', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    const prescription = { status: Status.BLACKLISTED } as ReadPrescription;
    const task = { status: TaskStatus.READY, careGiver: { ssin: caregiverSsin } } as PerformerTask;

    const result = pipe.transform(prescription, task, patient.ssin, currentUser);
    expect(result).toBe(false);
  });

  it('should return false if the task status is not READY', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    const prescription = { status: Status.OPEN } as ReadPrescription;
    const task = { status: TaskStatus.COMPLETED, careGiver: { ssin: caregiverSsin } } as PerformerTask;

    const result = pipe.transform(prescription, task, patient.ssin, currentUser);
    expect(result).toBe(false);
  });

  it('should return false if currentUser is not the patient nor the caregiver', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    const prescription = { status: Status.OPEN } as ReadPrescription;
    const task = { status: TaskStatus.READY, careGiver: { ssin: caregiverSsin } } as PerformerTask;

    const anotherUser = {...currentUser, ssin: 'anotherSsin'}

    const result = pipe.transform(prescription, task, patient.ssin, anotherUser);
    expect(result).toBe(false);
  });

  it('should call hasAssignPermissions with the correct arguments for "proposal" intent', () => {
    const prescription = {
      intent: 'proposal',
      templateCode: 'template1',
      status: Status.OPEN,
    } as ReadPrescription;

    const task = { status: TaskStatus.READY, careGiver: { ssin: currentUser.ssin } } as PerformerTask;
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const result = pipe.transform(prescription, task, patient.ssin, currentUser);
    expect(mockAccessMatrixState.hasAtLeastOnePermission).toHaveBeenCalledWith(['removeAssignationProposal'], 'template1');
    expect(result).toBe(true);
  });

  it('should call hasAssignPermissions with the correct arguments for "prescription" intent', () => {
    const prescription = {
      intent: 'prescription',
      templateCode: 'template2',
      status: Status.IN_PROGRESS,
    } as ReadPrescription;

    const task = { status: TaskStatus.READY, careGiver: { ssin: currentUser.ssin } } as PerformerTask;
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const result = pipe.transform(prescription, task, patient.ssin, currentUser);
    expect(mockAccessMatrixState.hasAtLeastOnePermission).toHaveBeenCalledWith(['removeAssignationPrescription'], 'template2');
    expect(result).toBe(true);
  });

  it('should return true if all conditions are met', () => {
    const prescription = {
      intent: 'prescription',
      templateCode: 'template2',
      status: Status.OPEN,
    } as ReadPrescription;

    const task = { status: TaskStatus.READY, careGiver: { ssin: currentUser.ssin } } as PerformerTask;

    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const result = pipe.transform(prescription, task, patient.ssin, currentUser);
    expect(result).toBe(true);
  });

  it('should return false if currentUser is logged in as a nurse but has the same ssin as the patient', () => {
    const prescription = {
      intent: 'prescription',
      templateCode: 'template2',
      status: Status.OPEN,
    } as ReadPrescription;

    const task = { status: TaskStatus.READY, careGiver: { ssin: currentUser.ssin } } as PerformerTask;
    const nurse = {...currentUser, ssin: patient.ssin}

    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const result = pipe.transform(prescription, task, patient.ssin, nurse);
    expect(result).toBe(false);
  });

  it('should return false if permissions are not granted', () => {
    const prescription = {
      intent: 'proposal',
      templateCode: 'template3',
      status: Status.OPEN,
    } as ReadPrescription;

    const task = { status: TaskStatus.READY, careGiver: { ssin: currentUser.ssin } } as PerformerTask;

    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(false);

    const result = pipe.transform(prescription, task, patient.ssin, currentUser);
    expect(result).toBe(false);
  });

});
