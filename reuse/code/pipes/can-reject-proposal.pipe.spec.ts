import { CanRejectProposalPipe } from './can-reject-proposal.pipe';
import { ReadRequestResource, RequestStatus } from '@reuse/code/openapi';

describe('CanRejectProposalPipe', () => {
  let pipe: CanRejectProposalPipe;
  let accessMatrixStateMock: { hasAtLeastOnePermission: jest.Mock };

  beforeEach(() => {
    accessMatrixStateMock = {
      hasAtLeastOnePermission: jest.fn()
    };

    pipe = new CanRejectProposalPipe(accessMatrixStateMock as any);
  });

  const basePrescription = {
    templateCode: 'templateCode'
  } as ReadRequestResource;

  it('should return true when status is allowed and permission is granted', () => {
    accessMatrixStateMock.hasAtLeastOnePermission.mockReturnValue(true);

    const prescription = {
      ...basePrescription,
      status: RequestStatus.Draft
    } as ReadRequestResource;

    expect(pipe.transform(prescription)).toBe(true);
    expect(accessMatrixStateMock.hasAtLeastOnePermission)
      .toHaveBeenCalledWith(['evaluateProposal'], 'templateCode');
  });

  it('should return false when status is NOT allowed', () => {
    accessMatrixStateMock.hasAtLeastOnePermission.mockReturnValue(true);

    const prescription = {
      ...basePrescription,
      status: RequestStatus.Done
    } as ReadRequestResource;

    expect(pipe.transform(prescription)).toBe(false);
  });

  it('should return false when permission is missing', () => {
    accessMatrixStateMock.hasAtLeastOnePermission.mockReturnValue(false);

    const prescription = {
      ...basePrescription,
      status: RequestStatus.Open
    } as ReadRequestResource;

    expect(pipe.transform(prescription)).toBe(false);
  });

  it('should return false when status is null or undefined', () => {
    accessMatrixStateMock.hasAtLeastOnePermission.mockReturnValue(true);

    const prescription = {
      ...basePrescription,
      status: undefined
    } as ReadRequestResource;

    expect(pipe.transform(prescription)).toBe(false);
  });
});
