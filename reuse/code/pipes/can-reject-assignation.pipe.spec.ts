import { CanRejectAssignationPipe } from './can-reject-assignation.pipe';
import { AccessMatrixState } from '../states/access-matrix.state';
import { PerformerTask, ReadPrescription, Status, TaskStatus } from '../interfaces';

const patientSsin = '123';
const currentUserSsin = '456';
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

  it('should return false if currentUserSsin is not provided', () => {
    const prescription = {} as ReadPrescription;
    const task = {} as PerformerTask;
    const result = pipe.transform(prescription, task, patientSsin);
    expect(result).toBe(false);
  });

  it('should return false if the prescription status is not OPEN nor PENDING nor IN_PROGRESS', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    const prescription = { status: Status.BLACKLISTED } as ReadPrescription;
    const task = { careGiver: { ssin: caregiverSsin } } as PerformerTask;

    const result = pipe.transform(prescription, task, patientSsin, currentUserSsin);
    expect(result).toBe(false);
  });

  it('should return false if currentUserSsin is not the patient nor the caregiver', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    const prescription = { status: Status.OPEN } as ReadPrescription;
    const task = { careGiver: { ssin: caregiverSsin } } as PerformerTask;

    const result = pipe.transform(prescription, task, patientSsin, 'anotherSsin');
    expect(result).toBe(false);
  });

  it('should call hasAssignPermissions with the correct arguments for "proposal" intent', () => {
    const prescription = {
      intent: 'proposal',
      templateCode: 'template1',
      status: Status.OPEN,
    } as ReadPrescription;

    const task = {careGiver: { ssin: currentUserSsin } } as PerformerTask;
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const result = pipe.transform(prescription, task, patientSsin, currentUserSsin);
    expect(mockAccessMatrixState.hasAtLeastOnePermission).toHaveBeenCalledWith(['removeAssignationProposal'], 'template1');
    expect(result).toBe(true);
  });

  it('should call hasAssignPermissions with the correct arguments for "prescription" intent', () => {
    const prescription = {
      intent: 'prescription',
      templateCode: 'template2',
      status: Status.IN_PROGRESS,
    } as ReadPrescription;

    const task = { careGiver: { ssin: currentUserSsin } } as PerformerTask;
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const result = pipe.transform(prescription, task, patientSsin, currentUserSsin);
    expect(mockAccessMatrixState.hasAtLeastOnePermission).toHaveBeenCalledWith(['removeAssignationPrescription'], 'template2');
    expect(result).toBe(true);
  });

  it('should return true if all conditions are met', () => {
    const prescription = {
      intent: 'prescription',
      templateCode: 'template2',
      status: Status.OPEN,
    } as ReadPrescription;

    const task = { careGiver: { ssin: currentUserSsin } } as PerformerTask;

    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const result = pipe.transform(prescription, task, patientSsin, currentUserSsin);
    expect(result).toBe(true);
  });

  it('should return false if permissions are not granted', () => {
    const prescription = {
      intent: 'proposal',
      templateCode: 'template3',
      status: Status.OPEN,
    } as ReadPrescription;

    const task = { careGiver: { ssin: currentUserSsin } } as PerformerTask;

    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(false);

    const result = pipe.transform(prescription, task, patientSsin, currentUserSsin);
    expect(result).toBe(false);
  });

});
