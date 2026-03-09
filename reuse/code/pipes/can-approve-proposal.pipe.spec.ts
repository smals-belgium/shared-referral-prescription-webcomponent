import { CanApproveProposalPipe } from './can-approve-proposal.pipe';
import { AccessMatrixState } from '@reuse/code/states/api/access-matrix.state';
import { ReadRequestResource, RequestStatus } from '@reuse/code/openapi';

describe('CanApproveProposalPipe', () => {
  let accessMatrixState: jest.Mocked<AccessMatrixState>;
  let pipe: CanApproveProposalPipe;

  beforeEach(() => {
    accessMatrixState = {
      hasAtLeastOnePermission: jest.fn(),
    } as unknown as jest.Mocked<AccessMatrixState>;

    pipe = new CanApproveProposalPipe(accessMatrixState);
  });

  const basePrescription: ReadRequestResource = {
    templateCode: 'TEMPLATE_1',
    status: RequestStatus.Draft,
  } as ReadRequestResource;

  it.each([
    [RequestStatus.Draft, true],
    [RequestStatus.Pending, true],
    [RequestStatus.Open, true],
    [RequestStatus.InProgress, true],
    [RequestStatus.Blacklisted, false],
    [RequestStatus.Cancelled, false],
    [RequestStatus.Expired, false],
    [RequestStatus.Approved, false],
    [RequestStatus.Rejected, false],
    [RequestStatus.Done, false],
    [null, false],
    [undefined, false],
  ])('should return correct value for status %p', (status, expectedStatusCheck) => {
    const prescription = { ...basePrescription, status } as ReadRequestResource;

    // Mock permission: true for testing allowed, false for disallowed
    accessMatrixState.hasAtLeastOnePermission.mockReturnValue(expectedStatusCheck);

    const result = pipe.transform(prescription);

    const allowedStatuses: RequestStatus[] = [
      RequestStatus.Draft,
      RequestStatus.Pending,
      RequestStatus.Open,
      RequestStatus.InProgress,
    ];
    const statusCheck = prescription.status != null && allowedStatuses.includes(prescription.status);

    expect(result).toBe(statusCheck && accessMatrixState.hasAtLeastOnePermission.mock.results[0].value);

    if (statusCheck) {
      // Ensure delegation to AccessMatrixState
      expect(accessMatrixState.hasAtLeastOnePermission).toHaveBeenCalledWith(
        ['evaluateProposal'],
        prescription.templateCode
      );
    }
  });

  it('should return false if permission denied even for allowed status', () => {
    const prescription = { ...basePrescription, status: RequestStatus.Draft } as ReadRequestResource;

    accessMatrixState.hasAtLeastOnePermission.mockReturnValue(false);

    const result = pipe.transform(prescription);

    expect(result).toBe(false);
    expect(accessMatrixState.hasAtLeastOnePermission).toHaveBeenCalledWith(
      ['evaluateProposal'],
      prescription.templateCode
    );
  });
});
