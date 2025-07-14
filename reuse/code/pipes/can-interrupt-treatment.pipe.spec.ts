import { PerformerTask, ReadPrescription, Role, TaskStatus, UserInfo } from '../interfaces';
import { CanInterruptTreatmentPipe } from './can-interrupt-treatment.pipe';
import { AccessMatrixState } from '../states/access-matrix.state';

describe('CanInterruptTreatmentPipe', () => {
  let pipe: CanInterruptTreatmentPipe;
  let mockAccessMatrixState: jest.Mocked<AccessMatrixState>;

  beforeEach(() => {
    mockAccessMatrixState = {
      hasAtLeastOnePermission: jest.fn(),
    } as unknown as jest.Mocked<AccessMatrixState>;

    pipe = new CanInterruptTreatmentPipe(mockAccessMatrixState);
  });

  it('should return false if currentUser is undefined', () => {
    const prescription = {} as ReadPrescription;
    const task = {} as PerformerTask;

    const result = pipe.transform(prescription, task, undefined);

    expect(result).toBe(false);
  });

  it('should return false if currentUser role is not professional', () => {
    const prescription = {} as ReadPrescription;
    const task = { careGiverSsin: '123' } as PerformerTask;
    const currentUser = { role: Role.patient, ssin: '123' } as UserInfo;

    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const result = pipe.transform(prescription, task, currentUser);

    expect(result).toBe(false);
  });

  it('should return false if task careGiver does not match currentUser', () => {
    const prescription = {} as ReadPrescription;
    const task = { careGiverSsin: '123' } as PerformerTask;
    const currentUser = { role: Role.professional, ssin: '456' } as UserInfo;

    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const result = pipe.transform(prescription, task, currentUser);

    expect(result).toBe(false);
  });

  it('should return false if user lacks required permission to interrupt treatment', () => {
    const prescription = { templateCode: 'TEMPLATE_1' } as ReadPrescription;
    const task = { careGiverSsin: '123', status: TaskStatus.INPROGRESS } as PerformerTask;
    const currentUser = { role: Role.professional, ssin: '123' } as UserInfo;

    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(false); // Permission denied

    const result = pipe.transform(prescription, task, currentUser);

    expect(result).toBe(false);
    expect(mockAccessMatrixState.hasAtLeastOnePermission).toHaveBeenCalledWith(
      ['interruptTreatment'],
      prescription.templateCode
    );
  });

  it('should return false if task status is not INPROGRESS', () => {
    const prescription = { templateCode: 'TEMPLATE_1' } as ReadPrescription;
    const task = { careGiverSsin: '123', status: TaskStatus.COMPLETED } as PerformerTask; // Status not INPROGRESS
    const currentUser = { role: Role.professional, ssin: '123' } as UserInfo;

    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const result = pipe.transform(prescription, task, currentUser);

    expect(result).toBe(false);
  });

  it('should return true if all conditions are satisfied', () => {
    const prescription = { templateCode: 'TEMPLATE_1' } as ReadPrescription;
    const task = { careGiverSsin: '123', status: TaskStatus.INPROGRESS } as PerformerTask;
    const currentUser = { role: Role.professional, ssin: '123' } as UserInfo;

    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const result = pipe.transform(prescription, task, currentUser);

    expect(result).toBe(true);
    expect(mockAccessMatrixState.hasAtLeastOnePermission).toHaveBeenCalledWith(
      ['interruptTreatment'],
      prescription.templateCode
    );
  });
});
