import { Intent } from '@reuse/code/interfaces';
import { Discipline, HealthcareProResource, HealthCareProviderResource, ProviderType } from '@reuse/code/openapi';
import { isProposal } from '@reuse/code/utils/utils';

export function getAssignableProfessionalDisciplines(category: string, intent: Intent): string[] {
  switch (category) {
    case 'nursing':
      if (isProposal(intent)) {
        return [Discipline.Physician];
      } else {
        return [Discipline.Nurse];
      }
    case 'diagnosticImaging':
    case 'radiology':
      return [Discipline.Physician];
    default:
      return [];
  }
}

export function getAssignableOrganizationInstitutionTypes(category: string, intent: Intent): string[] {
  switch (category) {
    case 'nursing':
      if (isProposal(intent)) {
        return ['GROUPOFNURSES', 'OTD_PHARMACY', 'HOSPITAL', 'REEDUCATION', 'HOME_SERVICES'];
      } else {
        return ['OFFICE_DOCTORS', 'GROUPOFDOCTORS', 'GUARD_POST', 'MEDICAL_HOUSE'];
      }
    case 'diagnosticImaging':
    case 'radiology':
      return ['OFFICE_DOCTORS', 'GROUPOFDOCTORS', 'GUARD_POST', 'MEDICAL_HOUSE', 'HOSPITAL'];
    default:
      return [];
  }
}

export function isProfessional(object: HealthCareProviderResource): object is HealthcareProResource {
  return object.type?.toLowerCase() === ProviderType.Professional.toLowerCase();
}
