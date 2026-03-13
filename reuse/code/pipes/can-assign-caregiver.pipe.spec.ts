import { CanAssignCaregiverPipe } from './can-assign-caregiver.pipe';
import { AccessMatrixState } from '@reuse/code/states/api/access-matrix.state';
import { ReadRequestResource, RequestStatus } from '@reuse/code/openapi';
import * as utils from '@reuse/code/utils/utils';
import { Intent } from '@reuse/code/interfaces';

describe('CanAssignCaregiverPipe', () => {
  let accessMatrixState: jest.Mocked<AccessMatrixState>;
  let pipe: CanAssignCaregiverPipe;

  beforeEach(() => {
    accessMatrixState = {
      hasAtLeastOnePermission: jest.fn(),
    } as unknown as jest.Mocked<AccessMatrixState>;

    pipe = new CanAssignCaregiverPipe(accessMatrixState);
  });

  const basePrescription: ReadRequestResource = {
    templateCode: 'TEMPLATE_1',
    status: RequestStatus.Draft,
    intent: Intent.ORDER, // normal prescription by default
  } as ReadRequestResource;

  describe('non-proposal prescriptions', () => {
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
    ])('should return %p for status %p', (status, expected) => {
      const prescription = { ...basePrescription, status } as ReadRequestResource;

      accessMatrixState.hasAtLeastOnePermission.mockReturnValue(expected);

      const result = pipe.transform(prescription);

      // AllowedStatuses AND permission
      const allowedStatuses: string[] = [
        RequestStatus.Draft,
        RequestStatus.Pending,
        RequestStatus.Open,
        RequestStatus.InProgress,
      ];
      const statusCheck = prescription.status != null && allowedStatuses.includes(prescription.status);

      expect(result).toBe(statusCheck && accessMatrixState.hasAtLeastOnePermission.mock.results[0].value);

      // Verify correct permission called
      expect(accessMatrixState.hasAtLeastOnePermission).toHaveBeenCalledWith(
        ['assignPrescription'],
        prescription.templateCode
      );
    });
  });

  describe('proposal prescriptions', () => {
    beforeEach(() => {
      jest.spyOn(utils, 'isProposal').mockImplementation(intent => intent === Intent.PROPOSAL);
    });

    it('should call assignProposal permission for proposals', () => {
      const prescription: ReadRequestResource = {
        ...basePrescription,
        intent: Intent.PROPOSAL,
        status: RequestStatus.Pending,
      };

      accessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

      const result = pipe.transform(prescription);

      expect(result).toBe(true);
      expect(accessMatrixState.hasAtLeastOnePermission).toHaveBeenCalledWith(
        ['assignProposal'],
        prescription.templateCode
      );
    });

    it('should return false if permission denied', () => {
      const prescription: ReadRequestResource = {
        ...basePrescription,
        intent: Intent.PROPOSAL,
        status: RequestStatus.Pending,
      };

      accessMatrixState.hasAtLeastOnePermission.mockReturnValue(false);

      const result = pipe.transform(prescription);

      expect(result).toBe(false);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});
