import {
  getAssignableOrganizationInstitutionTypes,
  getAssignableProfessionalDisciplines,
  isProfessional,
} from './assignment-disciplines.utils';
import { Intent } from '@reuse/code/interfaces';
import { isProposal } from '@reuse/code/utils/utils';
import { HealthcareOrganizationResource, HealthcareProResource } from '@reuse/code/openapi';

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

      expect(result).toEqual(['NURSE']);
    });

    it('should return PHYSICIAN and DENTIST for physiotherapy + proposal', () => {
      mockIsProposal.mockReturnValue(true);

      const result = getAssignableProfessionalDisciplines('physiotherapy', Intent.PROPOSAL);

      expect(result).toEqual(['PHYSICIAN', 'DENTIST']);
    });

    it('should return PHYSIOTHERAPIST for physiotherapy + prescription', () => {
      mockIsProposal.mockReturnValue(false);

      const result = getAssignableProfessionalDisciplines('physiotherapy', Intent.ORDER);

      expect(result).toEqual(['PHYSIOTHERAPIST']);
    });

    it('should return PHYSICIAN and DENTIST for diagnosticImagingl', () => {
      mockIsProposal.mockReturnValue(true);

      const result = getAssignableProfessionalDisciplines('diagnosticImaging', Intent.PROPOSAL);

      expect(result).toEqual(['PHYSICIAN', 'DENTIST']);
    });

    it('should return empty array for unknown category', () => {
      mockIsProposal.mockReturnValue(true);

      const result = getAssignableProfessionalDisciplines('unknown-category', Intent.PROPOSAL);

      expect(result).toEqual([]);
    });
  });

  describe('getAssignableOrganizationInstitutionTypes', () => {
    it('should return empty array for nursing + proposal', () => {
      mockIsProposal.mockReturnValue(true);

      const result = getAssignableOrganizationInstitutionTypes('nursing', Intent.PROPOSAL);

      expect(result).toEqual([]);
    });

    it('should return institution types for nursing + prescription', () => {
      mockIsProposal.mockReturnValue(false);

      const result = getAssignableOrganizationInstitutionTypes('nursing', Intent.ORDER);

      expect(result).toEqual([
        'THIRD_PARTY_PAYING_GROUP',
        'GUARD_POST',
        'MEDICAL_HOUSE',
        'HOME_SERVICES',
      ]);
    });

    it('should return empty array for physiotherapy + proposal', () => {
      mockIsProposal.mockReturnValue(true);

      const result = getAssignableOrganizationInstitutionTypes('physiotherapy', Intent.PROPOSAL);

      expect(result).toEqual([]);
    });

    it('should return MEDICAL_HOUSE for physiotherapy + prescription', () => {
      mockIsProposal.mockReturnValue(false);

      const result = getAssignableOrganizationInstitutionTypes('physiotherapy', Intent.ORDER);

      expect(result).toEqual(['MEDICAL_HOUSE']);
    });

    it('should return institution types for diagnosticImaging + proposal', () => {
      mockIsProposal.mockReturnValue(true);

      const result = getAssignableOrganizationInstitutionTypes('diagnosticImaging', Intent.PROPOSAL);

      expect(result).toEqual([
        'THIRD_PARTY_PAYING_GROUP',
        'GUARD_POST',
        'MEDICAL_HOUSE',
        'HOME_SERVICES',
      ]);
    });

    it('should return MEDICAL_HOUSE for diagnosticImaging + prescription', () => {
      mockIsProposal.mockReturnValue(false);

      const result = getAssignableOrganizationInstitutionTypes('diagnosticImaging', Intent.ORDER);

      expect(result).toEqual(['MEDICAL_HOUSE']);
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
        type: 'Professional',
        id: '123',
      } as any;

      const result = isProfessional(professional);

      expect(result).toBe(true);
    });

    it('should be type guard - narrow type to HealthcareProResource', () => {
      const object: HealthcareProResource | HealthcareOrganizationResource = {
        type: 'Professional',
      } as any;

      if (isProfessional(object)) {
        expect(object.type).toBe('Professional');
      }
    });
  });
});
