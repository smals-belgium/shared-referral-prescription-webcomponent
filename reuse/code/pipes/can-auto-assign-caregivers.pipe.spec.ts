import { AccessMatrixState } from '@reuse/code/states/api/access-matrix.state';
import { CanAssignCaregiverPipe } from '@reuse/code/pipes/can-assign-caregiver.pipe';
import { Discipline, ReadRequestResource, RequestStatus, Role } from '@reuse/code/openapi';
import { Intent, UserInfo } from '@reuse/code/interfaces';
import { CanAutoAssignCaregiversPipe } from '@reuse/code/pipes/can-auto-assign-caregivers.pipe';
import * as utils from '@reuse/code/utils/utils';

const basePrescription: ReadRequestResource = {
  templateCode: 'TEMPLATE_1',
  status: RequestStatus.Draft,
  intent: Intent.ORDER, // normal prescription by default
} as ReadRequestResource;

const currentUser: UserInfo = {
  discipline: Discipline.Nurse,
  firstName: '',
  lastName: '',
  professional: true,
  ssin: '789',
  role: Role.Organization,
};

describe('CanAutoAssignCaregiversPipe', () => {
  let accessMatrixState: jest.Mocked<AccessMatrixState>;
  let pipe: CanAutoAssignCaregiversPipe;

  beforeEach(() => {
    accessMatrixState = {
      hasAtLeastOnePermission: jest.fn(),
    } as unknown as jest.Mocked<AccessMatrixState>;

    pipe = new CanAutoAssignCaregiversPipe(accessMatrixState);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('current user', () => {
    beforeEach(() => {
      accessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);
    });

    it('should return false when user is not an organization', () => {
      const prescription = { ...basePrescription, status: RequestStatus.Draft };

      const userIsPatient = { ...currentUser, role: Role.Patient };
      const resultIsPatient = pipe.transform(prescription, userIsPatient);
      expect(resultIsPatient).toBe(false);

      const userIsProfessional = { ...currentUser, role: Role.Prescriber };
      const resultIsProfessional = pipe.transform(prescription, userIsProfessional);
      expect(resultIsProfessional).toBe(false);
    });

    it('should return true when user is an organization', () => {
      const organizationUser = { ...currentUser, role: Role.Organization };
      const prescription = { ...basePrescription, status: RequestStatus.Draft };

      const result = pipe.transform(prescription, organizationUser);

      expect(result).toBe(true);
    });
  });

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
    ])('should return %p for status %p when user is organization', (status, expected) => {
      const prescription = { ...basePrescription, status } as ReadRequestResource;

      accessMatrixState.hasAtLeastOnePermission.mockReturnValue(expected);

      const result = pipe.transform(prescription, currentUser);

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

    it('should call assignProposal permission for proposals when user is organization', () => {
      const prescription: ReadRequestResource = {
        ...basePrescription,
        intent: Intent.PROPOSAL,
        status: RequestStatus.Pending,
      };

      accessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

      const result = pipe.transform(prescription, currentUser);

      expect(result).toBe(true);
      expect(accessMatrixState.hasAtLeastOnePermission).toHaveBeenCalledWith(
        ['assignProposal'],
        prescription.templateCode
      );
    });

    it('should return false if permission denied when user is organization', () => {
      const prescription: ReadRequestResource = {
        ...basePrescription,
        intent: Intent.PROPOSAL,
        status: RequestStatus.Pending,
      };

      accessMatrixState.hasAtLeastOnePermission.mockReturnValue(false);

      const result = pipe.transform(prescription, currentUser);

      expect(result).toBe(false);
    });
  });
});
