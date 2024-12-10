import { CanCancelPrescriptionOrProposalPipe } from './can-cancel-prescription-or-proposal.pipe';
import { ReadPrescription, Status } from '../interfaces';
import { AccessMatrixState } from '../states/access-matrix.state';

const requesterSsin = '123';
const patientSsin = '456';
const currentUserSsin = '789';

describe('CanCancelPrescriptionOrProposal', () => {
  let pipe: CanCancelPrescriptionOrProposalPipe;
  let mockAccessMatrixState: jest.Mocked<AccessMatrixState>;

  beforeEach(() => {
    mockAccessMatrixState = {
      hasAtLeastOnePermission: jest.fn(),
    } as unknown as jest.Mocked<AccessMatrixState>;

    pipe = new CanCancelPrescriptionOrProposalPipe(mockAccessMatrixState);
  });

  it('should return false if currentUserSsin is not provided', () => {
    const result = pipe.transform({} as ReadPrescription, patientSsin);
    expect(result).toBe(false);
  });

  it('should return false if the prescription has no status', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    const prescription = {} as ReadPrescription;
    const result = pipe.transform(prescription, patientSsin, patientSsin);
    expect(result).toBe(false);
  });

  it('should return false if prescription status is not OPEN', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    const prescription = { status: Status.BLACKLISTED } as ReadPrescription;
    const result = pipe.transform(prescription, patientSsin, patientSsin);
    expect(result).toBe(false);
  });


  it('should call hasCancelPermissions with correct arguments for proposal', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    const prescription = { intent: 'proposal', status: Status.OPEN , templateCode: 'template1' } as ReadPrescription;

    pipe.transform(prescription, patientSsin, currentUserSsin);

    expect(mockAccessMatrixState.hasAtLeastOnePermission).toHaveBeenCalledWith(['cancelProposal'], 'template1');
  });

  it('should call hasCancelPermissions with correct arguments for prescription', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    const prescription = { intent: 'prescription',status: Status.OPEN, templateCode: 'template2' } as ReadPrescription;

    pipe.transform(prescription, patientSsin, currentUserSsin);

    expect(mockAccessMatrixState.hasAtLeastOnePermission).toHaveBeenCalledWith(['cancelPrescription'], 'template2');
  });

  it('should return false if currentUserSsin is neither the patient nor the caregiver', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const prescription = {
      status: Status.OPEN,
      requester: { ssin: requesterSsin },
    } as ReadPrescription;

    const result = pipe.transform(prescription, patientSsin, currentUserSsin);
    expect(result).toBe(false);
  });

  it('should return true if all conditions are met', () => {
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const prescription = {
      intent: 'prescription',
      status: Status.OPEN,
      templateCode: 'template1',
      requester: { ssin: requesterSsin },
    } as ReadPrescription;

    const result = pipe.transform(prescription, patientSsin, requesterSsin);
    expect(result).toBe(true);
  });

});
