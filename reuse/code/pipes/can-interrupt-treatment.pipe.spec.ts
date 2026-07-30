import { CanInterruptTreatmentPipe } from './can-interrupt-treatment.pipe';
import { AccessMatrixState } from '../states/api/access-matrix.state';
import { Discipline, FhirR4TaskStatus, ReadRequestResource, RequestTaskResource, Role } from '../openapi';
import { UserInfo } from '@reuse/code/interfaces';

describe('CanInterruptTreatmentPipe', () => {
  let pipe: CanInterruptTreatmentPipe;
  let mockAccessMatrixState: jest.Mocked<AccessMatrixState>;

  beforeEach(() => {
    mockAccessMatrixState = {
      hasAtLeastOnePermission: jest.fn(),
    } as unknown as jest.Mocked<AccessMatrixState>;

    pipe = new CanInterruptTreatmentPipe(mockAccessMatrixState);
  });

  const prescription = { templateCode: 'TEMPLATE_1' } as ReadRequestResource;

  it('should return false when currentUser is undefined', () => {
    expect(pipe.transform(prescription, {} as RequestTaskResource, undefined)).toBe(false);
  });

  it('should return false when user is not professional', () => {
    const task = { careGiverSsin: '10022500123', taskType: 'PerformerTaskResource' } as RequestTaskResource;
    const user = { role: Role.Patient, ssin: '10022500123' } as Partial<UserInfo>;

    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    expect(pipe.transform(prescription, task, user)).toBe(false);
  });

  it('should return false when caregiver SSIN does not match currentUser', () => {
    const task = { careGiverSsin: '10022500123' } as RequestTaskResource;
    const user = { role: Role.Prescriber, ssin: '456', discipline: Discipline.Nurse } as Partial<UserInfo>;

    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    expect(pipe.transform(prescription, task, user)).toBe(false);
  });

  it('should return false when caregiver discipline does not match currentUser', () => {
    const task = {
      careGiverSsin: '10022500123',
      careGiver: { id: { profession: 'doctor' } },
      taskType: 'PerformerTaskResource',
    } as RequestTaskResource;

    const user = { role: Role.Prescriber, ssin: '10022500123', discipline: Discipline.Nurse } as Partial<UserInfo>;

    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    expect(pipe.transform(prescription, task, user)).toBe(false);
  });

  it('should return false when permission interruptTreatment is denied', () => {
    const task = {
      careGiverSsin: '10022500123',
      careGiver: { id: { profession: Discipline.Nurse } },
      status: FhirR4TaskStatus.Inprogress,
      taskType: 'PerformerTaskResource',
    } as RequestTaskResource;

    const user = {
      role: Role.Prescriber,
      ssin: '10022500123',
      discipline: Discipline.Nurse,
    } as Partial<UserInfo>;

    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(false);

    const result = pipe.transform(prescription, task, user);

    expect(result).toBe(false);
    expect(mockAccessMatrixState.hasAtLeastOnePermission).toHaveBeenCalledWith(['interruptTreatment'], 'TEMPLATE_1');
  });

  it('should return false when task status is not INPROGRESS', () => {
    const task = {
      careGiverSsin: '10022500123',
      status: FhirR4TaskStatus.Completed,
      taskType: 'PerformerTaskResource',
    } as RequestTaskResource;
    const user = { role: Role.Prescriber, ssin: '10022500123', discipline: Discipline.Nurse } as Partial<UserInfo>;

    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    expect(pipe.transform(prescription, task, user)).toBe(false);
  });

  it('should return false when task is an organizationTask', () => {
    const task = {
      careGiverSsin: '10022500123',
      status: FhirR4TaskStatus.Inprogress,
      taskType: 'OrganizationTaskResource',
    } as RequestTaskResource;
    const user = { role: Role.Prescriber, ssin: '10022500123', discipline: Discipline.Nurse } as Partial<UserInfo>;

    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    expect(pipe.transform(prescription, task, user)).toBe(false);
  });

  it('should return true when all conditions are met', () => {
    const task = {
      careGiverSsin: '10022500123',
      careGiver: { id: { profession: Discipline.Nurse } },
      status: FhirR4TaskStatus.Inprogress,
      taskType: 'PerformerTaskResource',
    } as RequestTaskResource;

    const user = { role: Role.Prescriber, ssin: '10022500123', discipline: Discipline.Nurse } as Partial<UserInfo>;

    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    expect(pipe.transform(prescription, task, user)).toBe(true);
    expect(mockAccessMatrixState.hasAtLeastOnePermission).toHaveBeenCalledWith(['interruptTreatment'], 'TEMPLATE_1');
  });
});
