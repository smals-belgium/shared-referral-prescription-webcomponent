import { Intent } from '@reuse/code/interfaces';
import { isProposal } from '@reuse/code/utils/utils';
import { HealthcareOrganizationResource, HealthcareProResource } from '@reuse/code/openapi';

export function getAssignableProfessionalDisciplines(category: string, intent: Intent): string[] {
  switch (category) {
    case 'nursing':
      if (isProposal(intent)) {
        return ['PHYSICIAN'];
      } else {
        return ['NURSE'];
      }
    case 'physiotherapy':
      if (isProposal(intent)) {
        return ['PHYSICIAN', 'DENTIST'];
      } else {
        return ['PHYSIOTHERAPIST'];
      }
    case 'diagnosticImaging':
      if (isProposal(intent)) {
        return ['PHYSICIAN', 'DENTIST'];
      } else {
        return ['PHYSICIAN', 'DENTIST'];
      }
    default:
      return [];
  }
}

export function getAssignableOrganizationInstitutionTypes(category: string, intent: Intent): string[] {
  switch (category) {
    case 'nursing':
      if (isProposal(intent)) {
        return [];
      } else {
        return ['THIRD_PARTY_PAYING_GROUP', 'GUARD_POST', 'MEDICAL_HOUSE', 'HOME_SERVICES'];
      }
    case 'physiotherapy':
      if (isProposal(intent)) {
        return [];
      } else {
        return ['MEDICAL_HOUSE'];
      }
    case 'diagnosticImaging':
      if (isProposal(intent)) {
        return ['THIRD_PARTY_PAYING_GROUP', 'GUARD_POST', 'MEDICAL_HOUSE', 'HOME_SERVICES'];
      } else {
        return ['MEDICAL_HOUSE'];
      }
    default:
      return [];
  }
}

export function isProfessional(
  object: HealthcareProResource | HealthcareOrganizationResource
): object is HealthcareProResource {
  return object.type === 'Professional';
}
