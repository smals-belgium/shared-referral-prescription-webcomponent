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

export function getAssignableOrganizationInstitutionTypes(category: string): string[] {
  switch (category) {
    case 'nursing':
      return [
        'OTD_PHARMACY',
        'OFFICE_DOCTORS',
        'GROUPOFDOCTORS',
        'GUARD_POST',
        'MEDICAL_HOUSE',
        'HOSPITAL',
        'REEDUCATION',
        'GROUPOFNURSES',
        'HOME_SERVICES',
      ];
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

export function getProviderTypeFilter(intent: string | undefined): ProviderType[] | undefined {
  if (intent === Intent.PROPOSAL) {
    return [ProviderType.Professional];
  }
  return undefined;
}
