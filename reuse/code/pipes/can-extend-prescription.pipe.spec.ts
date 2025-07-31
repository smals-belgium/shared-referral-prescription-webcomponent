import { Intent, ReadPrescription, Role, Status } from '../interfaces';
import { AccessMatrixState } from '../states/access-matrix.state';
import { CanExtendPrescriptionPipe } from './can-extend-prescription.pipe';

const start = new Date().toISOString()
const end = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();

describe('canExtendPrescription', () => {
  let pipe: CanExtendPrescriptionPipe;
  let mockAccessMatrixState: jest.Mocked<AccessMatrixState>;

  beforeEach(() => {
    mockAccessMatrixState = {
      hasAtLeastOnePermission: jest.fn(),
    } as unknown as jest.Mocked<AccessMatrixState>;

    pipe = new CanExtendPrescriptionPipe(mockAccessMatrixState);
  });

  it('should return true if all conditions are met', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    const prescription: ReadPrescription = {
      period: { start: start, end: end },
      status: Status.OPEN,
      templateCode: 'template-code',
    } as ReadPrescription;
    const currentUser = { role: Role.professional } as any;

    const result = pipe.transform(prescription, currentUser);

    expect(result).toBeTruthy();
    expect(mockAccessMatrixState.hasAtLeastOnePermission).toHaveBeenCalledWith(['createPrescription'], 'template-code');
  });

  it('should return false if currentUser is not a professional', () => {
    const prescription = { templateCode: 'template1', intent: 'order' } as any;
    const currentUser = { role: Role.patient } as any;
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const result = pipe.transform(prescription, currentUser);
    expect(result).toBe(false);
  });

  it('should return false if accessMatrixState hasAtLeastOnePermission returns false', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(false);
    const prescription: ReadPrescription = {
      period: { start: start, end: end },
      status: Status.OPEN,
      templateCode: 'template-code',
    } as ReadPrescription;
    const currentUser = { role: Role.professional } as any;

    const result = pipe.transform(prescription, currentUser);

    expect(result).toBeFalsy();
  });

  it('should return false if prescription intent is "proposal"', () => {
    const prescription = { templateCode: 'template1', intent: Intent.PROPOSAL } as any;
    const currentUser = { role: Role.professional } as any;
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const result = pipe.transform(prescription, currentUser);
    expect(result).toBe(false);
  });

  it('should return false if the prescription status is not OPEN nor IN_PROGRESS', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    const prescription: ReadPrescription = {
      period: { start: start, end: end },
      status: Status.BLACKLISTED,
      templateCode: 'template-code',
    } as ReadPrescription;
    const currentUser = { role: Role.professional } as any;

    const result = pipe.transform(prescription, currentUser);

    expect(result).toBeFalsy();
  });

  it('should return false if the end date is in the past', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    const prescription: ReadPrescription = {
      period: { start: start, end: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
      status: Status.OPEN,
      templateCode: 'template-code',
    } as ReadPrescription;
    const currentUser = { role: Role.professional } as any;

    const result = pipe.transform(prescription, currentUser);

    expect(result).toBeFalsy();
  });

  it('should return false if the end date is not provided', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    const prescription: ReadPrescription = {
      period: {},
      status: Status.OPEN,
      templateCode: 'template-code',
    } as ReadPrescription;
    const currentUser = { role: Role.professional } as any;

    const result = pipe.transform(prescription, currentUser);

    expect(result).toBeFalsy();
  });

  it('should return false if the status is undefined', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    const prescription: ReadPrescription = {
      period: { start: start, end: end },
      status: undefined,
      templateCode: 'template-code',
    } as ReadPrescription;
    const currentUser = { role: Role.professional } as any;

    const result = pipe.transform(prescription, currentUser);

    expect(result).toBeFalsy();
  });
});
