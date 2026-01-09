import { CanTransferAssignationPipe } from './can-transfer-assignation.pipe';
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

const currentUser: UserInfo = {
  discipline: Discipline.Nurse,
  firstName: '',
  lastName: '',
  professional: true,
  ssin: '123',
  role: Role.Prescriber,
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
    const prescription = {} as ReadRequestResource;
    const result = pipe.transform(prescription);
    expect(result).toBe(false);
  });

  it('should return false if prescription status is not OPEN, nor PENDING, nor IN_PROGRESS', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    const prescription = { status: RequestStatus.Blacklisted } as ReadRequestResource;
    const task = {
      status: FhirR4TaskStatus.Ready,
      careGiverSsin: currentUser.ssin
    } as PerformerTaskResource;

    const result = pipe.transform(prescription, task, currentUser);
    expect(result).toBe(false);
  });

  it('should return false if task is null or undefined', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    const prescription = { status: RequestStatus.Open } as ReadRequestResource;
    const result = pipe.transform(prescription, undefined, currentUser);
    expect(result).toBe(false);
  });

  it('should return false if task status is not READY nor INPROGRESS', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    const prescription = { status: RequestStatus.Open } as ReadRequestResource;
    const task = {
      status: FhirR4TaskStatus.Completed,
      careGiverSsin: currentUser.ssin
    } as PerformerTaskResource;

    const result = pipe.transform(prescription, task, currentUser);
    expect(result).toBe(false);
  });

  it('should return false if task.careGiverSsin does not match currentUser', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    const prescription = { status: RequestStatus.InProgress } as ReadRequestResource;
    const task = {
      status: FhirR4TaskStatus.Ready,
      careGiverSsin: careGiverSsin
    } as PerformerTaskResource;

    const result = pipe.transform(prescription, task, currentUser);
    expect(result).toBe(false);
  });

  it('should call hasAssignPermissions with correct arguments for "proposal" intent', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    const prescription = {
      intent: Intent.PROPOSAL,
      templateCode: 'template1',
      status: RequestStatus.Open,
    } as ReadRequestResource;

    const task = {
      status: FhirR4TaskStatus.Ready,
      careGiverSsin: currentUser.ssin,
      careGiver: {
        id: {
          profession: Discipline.Nurse
        }
      }
    } as PerformerTaskResource;
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const result = pipe.transform(prescription, task, currentUser);

    expect(mockAccessMatrixState.hasAtLeastOnePermission).toHaveBeenCalledWith(['assignProposal'], 'template1');
    expect(result).toBe(true);
  });

  it('should call hasAssignPermissions with correct arguments for "prescription" intent', () => {
    const prescription = {
      intent: Intent.ORDER,
      templateCode: 'template2',
      status: RequestStatus.InProgress,
    } as ReadRequestResource;

    const task = {
      status: FhirR4TaskStatus.Inprogress,
      careGiverSsin: currentUser.ssin,
      careGiver: {
        id: {
          profession: Discipline.Nurse
        }
      }
    } as PerformerTaskResource;
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const result = pipe.transform(prescription, task, currentUser);

    expect(mockAccessMatrixState.hasAtLeastOnePermission).toHaveBeenCalledWith(['assignPrescription'], 'template2');
    expect(result).toBe(true);
  });

  it('should return true if all conditions are met', () => {
    const prescription = {
      intent: Intent.ORDER,
      templateCode: 'template3',
      status: RequestStatus.Open,
    } as ReadRequestResource;

    const task = {
      status: FhirR4TaskStatus.Ready,
      careGiverSsin: currentUser.ssin,
      careGiver: {
        id: {
          profession: Discipline.Nurse
        }
      }

    } as PerformerTaskResource;

    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const result = pipe.transform(prescription, task, currentUser);
    expect(result).toBe(true);
  });

  it('should return false if permissions are not granted', () => {
    const prescription = {
      intent: Intent.PROPOSAL,
      templateCode: 'template4',
      status: RequestStatus.Open,
    } as ReadRequestResource;

    const task = {
      status: FhirR4TaskStatus.Inprogress,
      careGiverSsin: currentUser.ssin
    } as PerformerTaskResource;

    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(false);

    const result = pipe.transform(prescription, task, currentUser);
    expect(result).toBe(false);
  });

  it('should return false if currentUser is not a professional', () => {
    const nonProfessionalUser = { ...currentUser, role: Role.Patient };

    const prescription = {
      intent: Intent.ORDER,
      templateCode: 'template3',
      status: RequestStatus.Open,
    } as ReadRequestResource;

    const task = {
      status: FhirR4TaskStatus.Ready,
      careGiverSsin: nonProfessionalUser.ssin
    } as PerformerTaskResource;

    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const result = pipe.transform(prescription, task, currentUser);
    expect(result).toBe(false);
  });


});
