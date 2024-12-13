import { CanTransferAssignationPipe } from './can-transfer-assignation.pipe';
import { AccessMatrixState } from '../states/access-matrix.state';
import { PerformerTask, ReadPrescription, Status, TaskStatus } from '../interfaces';

const currentUserSsin = '123';
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

  it('should return false if currentUserSsin is undefined', () => {
    const prescription = {} as ReadPrescription;
    const result = pipe.transform(prescription);
    expect(result).toBe(false);
  });

  it('should return false if prescription status is not OPEN, nor PENDING, nor IN_PROGRESS', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    const prescription = { status: Status.BLACKLISTED } as ReadPrescription;
    const task = { careGiverSsin: currentUserSsin } as PerformerTask;

    const result = pipe.transform(prescription, task, currentUserSsin);
    expect(result).toBe(false);
  });

  it('should return false if task is null or undefined', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    const prescription = { status: Status.OPEN } as ReadPrescription;
    const result = pipe.transform(prescription, undefined, currentUserSsin);
    expect(result).toBe(false);
  });

  it('should return false if task.careGiverSsin does not match currentUserSsin', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    const prescription = { status: Status.IN_PROGRESS } as ReadPrescription;
    const task = { careGiverSsin: careGiverSsin } as PerformerTask;

    const result = pipe.transform(prescription, task, currentUserSsin);
    expect(result).toBe(false);
  });

  it('should call hasAssignPermissions with correct arguments for "proposal" intent', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    const prescription = {
      intent: 'proposal',
      templateCode: 'template1',
      status: Status.OPEN,
    } as ReadPrescription;

    const task = { careGiverSsin: currentUserSsin } as PerformerTask;
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const result = pipe.transform(prescription, task, currentUserSsin);

    expect(mockAccessMatrixState.hasAtLeastOnePermission).toHaveBeenCalledWith(['assignProposal'], 'template1');
    expect(result).toBe(true);
  });

  it('should call hasAssignPermissions with correct arguments for "prescription" intent', () => {
    const prescription = {
      intent: 'prescription',
      templateCode: 'template2',
      status: Status.IN_PROGRESS,
    } as ReadPrescription;

    const task = { careGiverSsin: currentUserSsin } as PerformerTask;
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const result = pipe.transform(prescription, task, currentUserSsin);

    expect(mockAccessMatrixState.hasAtLeastOnePermission).toHaveBeenCalledWith(['assignPrescription'], 'template2');
    expect(result).toBe(true);
  });

  it('should return true if all conditions are met', () => {
    const prescription = {
      intent: 'prescription',
      templateCode: 'template3',
      status: Status.OPEN,
    } as ReadPrescription;

    const task = { careGiverSsin: currentUserSsin } as PerformerTask;

    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const result = pipe.transform(prescription, task, currentUserSsin);
    expect(result).toBe(true);
  });

  it('should return false if permissions are not granted', () => {
    const prescription = {
      intent: 'proposal',
      templateCode: 'template4',
      status: Status.OPEN,
    } as ReadPrescription;

    const task = { careGiverSsin: currentUserSsin } as PerformerTask;

    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(false);

    const result = pipe.transform(prescription, task, currentUserSsin);
    expect(result).toBe(false);
  });
});
