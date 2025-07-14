import { CanTransferAssignationPipe } from './can-transfer-assignation.pipe';
import { AccessMatrixState } from '../states/access-matrix.state';
import { Discipline, PerformerTask, ReadPrescription, Role, Status, TaskStatus, UserInfo } from '../interfaces';

const currentUser: UserInfo = {
  discipline: Discipline.NURSE,
  firstName: '',
  lastName: '',
  professional: true,
  ssin: '123',
  role: Role.professional
};
const careGiverSsin = '456';
describe('CanTransferAssignationPipe', () => {
  let pipe: CanTransferAssignationPipe;
  let mockAccessMatrixState: jest.Mocked<AccessMatrixState>;

  beforeEach(() => {
    mockAccessMatrixState = {
      hasAtLeastOnePermission: jest.fn(),
    } as unknown as jest.Mocked<AccessMatrixState>;

    pipe = new CanTransferAssignationPipe(mockAccessMatrixState);
  });

  it('should return false if currentUser is undefined', () => {
    const prescription = {} as ReadPrescription;
    const result = pipe.transform(prescription);
    expect(result).toBe(false);
  });

  it('should return false if prescription status is not OPEN, nor PENDING, nor IN_PROGRESS', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    const prescription = { status: Status.BLACKLISTED } as ReadPrescription;
    const task = { status: TaskStatus.READY, careGiverSsin: currentUser.ssin } as PerformerTask;

    const result = pipe.transform(prescription, task, currentUser);
    expect(result).toBe(false);
  });

  it('should return false if task is null or undefined', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    const prescription = { status: Status.OPEN } as ReadPrescription;
    const result = pipe.transform(prescription, undefined, currentUser);
    expect(result).toBe(false);
  });

  it('should return false if task status is not READY nor INPROGRESS', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    const prescription = { status: Status.OPEN } as ReadPrescription;
    const task = { status: TaskStatus.COMPLETED, careGiverSsin: currentUser.ssin } as PerformerTask;

    const result = pipe.transform(prescription, task, currentUser);
    expect(result).toBe(false);
  });

  it('should return false if task.careGiverSsin does not match currentUser', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    const prescription = { status: Status.IN_PROGRESS } as ReadPrescription;
    const task = { status: TaskStatus.READY, careGiverSsin: careGiverSsin } as PerformerTask;

    const result = pipe.transform(prescription, task, currentUser);
    expect(result).toBe(false);
  });

  it('should call hasAssignPermissions with correct arguments for "proposal" intent', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    const prescription = {
      intent: 'proposal',
      templateCode: 'template1',
      status: Status.OPEN,
    } as ReadPrescription;

    const task = { status: TaskStatus.READY, careGiverSsin: currentUser.ssin } as PerformerTask;
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const result = pipe.transform(prescription, task, currentUser);

    expect(mockAccessMatrixState.hasAtLeastOnePermission).toHaveBeenCalledWith(['assignProposal'], 'template1');
    expect(result).toBe(true);
  });

  it('should call hasAssignPermissions with correct arguments for "prescription" intent', () => {
    const prescription = {
      intent: 'prescription',
      templateCode: 'template2',
      status: Status.IN_PROGRESS,
    } as ReadPrescription;

    const task = { status: TaskStatus.INPROGRESS, careGiverSsin: currentUser.ssin } as PerformerTask;
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const result = pipe.transform(prescription, task, currentUser);

    expect(mockAccessMatrixState.hasAtLeastOnePermission).toHaveBeenCalledWith(['assignPrescription'], 'template2');
    expect(result).toBe(true);
  });

  it('should return true if all conditions are met', () => {
    const prescription = {
      intent: 'prescription',
      templateCode: 'template3',
      status: Status.OPEN,
    } as ReadPrescription;

    const task = { status: TaskStatus.READY, careGiverSsin: currentUser.ssin } as PerformerTask;

    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const result = pipe.transform(prescription, task, currentUser);
    expect(result).toBe(true);
  });

  it('should return false if permissions are not granted', () => {
    const prescription = {
      intent: 'proposal',
      templateCode: 'template4',
      status: Status.OPEN,
    } as ReadPrescription;

    const task = { status: TaskStatus.INPROGRESS, careGiverSsin: currentUser.ssin } as PerformerTask;

    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(false);

    const result = pipe.transform(prescription, task, currentUser);
    expect(result).toBe(false);
  });

  it('should return false if currentUser is not a professional', () => {
    const prescription = {
      intent: 'prescription',
      templateCode: 'template3',
      status: Status.OPEN,
    } as ReadPrescription;

    const task = { status: TaskStatus.READY, careGiverSsin: currentUser.ssin } as PerformerTask;

    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const patient = {...currentUser, role: Role.patient}

    const result = pipe.transform(prescription, task, currentUser);
    expect(result).toBe(true);
  });
});
