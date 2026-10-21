import {
  getAssignableOrganizationInstitutionTypes,
  getAssignableProfessionalDisciplines,
  isProfessional,
} from './assignment-disciplines.utils';
import { Intent } from '@reuse/code/interfaces';
import { isProposal } from '@reuse/code/utils/utils';
import { Discipline, HealthcareOrganizationResource, HealthcareProResource, ProviderType } from '@reuse/code/openapi';

jest.mock('@reuse/code/utils/utils');

describe('assignment-disciplines.utils', () => {
  const mockIsProposal = isProposal as jest.MockedFunction<typeof isProposal>;

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAssignableProfessionalDisciplines', () => {
    it('should return PHYSICIAN for nursing + proposal', () => {
      mockIsProposal.mockReturnValue(true);

      const result = getAssignableProfessionalDisciplines('nursing', Intent.PROPOSAL);

      expect(result).toEqual(['PHYSICIAN']);
      expect(mockIsProposal).toHaveBeenCalledWith(Intent.PROPOSAL);
    });

    it('should return NURSE for nursing + prescription', () => {
      mockIsProposal.mockReturnValue(false);

      const result = getAssignableProfessionalDisciplines('nursing', Intent.ORDER);

      expect(result).toEqual([Discipline.Nurse]);
    });

    it('should return empty array for physiotherapy + proposal (NOT DEVELOPED)', () => {
      mockIsProposal.mockReturnValue(true);

      const result = getAssignableProfessionalDisciplines('physiotherapy', Intent.PROPOSAL);

      expect(result).toEqual([]);
    });

    it('should return EMPTY ARRAY for physiotherapy + prescription (NOT DEVELOPED)', () => {
      mockIsProposal.mockReturnValue(false);

      const result = getAssignableProfessionalDisciplines('physiotherapy', Intent.ORDER);

      expect(result).toEqual([]);
    });

    it('should return Physician for diagnosticImaging + proposal', () => {
      mockIsProposal.mockReturnValue(true);

      const result = getAssignableProfessionalDisciplines('diagnosticImaging', Intent.PROPOSAL);

      expect(result).toEqual([Discipline.Physician]);
    });

    it('should return empty array for unknown category', () => {
      mockIsProposal.mockReturnValue(true);

      const result = getAssignableProfessionalDisciplines('unknown-category', Intent.PROPOSAL);

      expect(result).toEqual([]);
    });
  });

  describe('getAssignableOrganizationInstitutionTypes', () => {
    it('should return GROUPOFNURSES, OTD_PHARMACY, HOSPITAL, REEDUCATION and HOME_SERVICES for nursing + proposal', () => {
      mockIsProposal.mockReturnValue(true);

      const result = getAssignableOrganizationInstitutionTypes('nursing', Intent.PROPOSAL);

      expect(result).toEqual(['GROUPOFNURSES', 'OTD_PHARMACY', 'HOSPITAL', 'REEDUCATION', 'HOME_SERVICES']);
    });

    it('should return OFFICE_DOCTORS, GROUPOFDOCTORS, GUARD_POST and MEDICAL_HOUSE for nursing + prescription', () => {
      mockIsProposal.mockReturnValue(false);

      const result = getAssignableOrganizationInstitutionTypes('nursing', Intent.ORDER);

      expect(result).toEqual(['OFFICE_DOCTORS', 'GROUPOFDOCTORS', 'GUARD_POST', 'MEDICAL_HOUSE']);
    });

    it('should return empty array for physiotherapy + proposal', () => {
      mockIsProposal.mockReturnValue(true);

      const result = getAssignableOrganizationInstitutionTypes('physiotherapy', Intent.PROPOSAL);

      expect(result).toEqual([]);
    });

    it('should return empty array for physiotherapy + prescription (NOT DEVELOPED)', () => {
      mockIsProposal.mockReturnValue(false);

      const result = getAssignableOrganizationInstitutionTypes('physiotherapy', Intent.ORDER);

      expect(result).toEqual([]);
    });

    it('should return OFFICE_DOCTORS, GROUPOFDOCTORS, GUARD_POST, MEDICAL_HOUSE and HOSPITAL for diagnosticImaging + proposal', () => {
      mockIsProposal.mockReturnValue(true);

      const result = getAssignableOrganizationInstitutionTypes('diagnosticImaging', Intent.PROPOSAL);

      expect(result).toEqual(['OFFICE_DOCTORS', 'GROUPOFDOCTORS', 'GUARD_POST', 'MEDICAL_HOUSE', 'HOSPITAL']);
    });

    it('should return OFFICE_DOCTORS, GROUPOFDOCTORS, GUARD_POST, MEDICAL_HOUSE and HOSPITAL for diagnosticImaging + prescription', () => {
      mockIsProposal.mockReturnValue(false);

      const result = getAssignableOrganizationInstitutionTypes('diagnosticImaging', Intent.ORDER);

      expect(result).toEqual(['OFFICE_DOCTORS', 'GROUPOFDOCTORS', 'GUARD_POST', 'MEDICAL_HOUSE', 'HOSPITAL']);
    });

    it('should return empty array for unknown category', () => {
      mockIsProposal.mockReturnValue(true);

      const result = getAssignableOrganizationInstitutionTypes('unknown-category', Intent.PROPOSAL);

      expect(result).toEqual([]);
    });
  });

  describe('isProfessional', () => {
    it('should return true for HealthcareProResource', () => {
      const professional: HealthcareProResource = {
        type: ProviderType.Professional,
        id: '123',
      } as any;

      const result = isProfessional(professional);

      expect(result).toBe(true);
    });

    it('should be type guard - narrow type to HealthcareProResource', () => {
      const object: HealthcareProResource | HealthcareOrganizationResource = {
        type: ProviderType.Professional,
      } as any;

      if (isProfessional(object)) {
        expect(object.type).toBe(ProviderType.Professional);
      }
    });
  });
});
