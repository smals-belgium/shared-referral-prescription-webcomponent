import {Professional} from "./professional.interface";
import {Organization} from "./organization.interface";

export interface HealthcareProvider {
  address: {
    municipality: Municipality;
    zipCode: string;
    street: Street;
    houseNumber: string;
    box: string;
  };

  nihii8?: string;
  nihii11?: string;
  type: 'Professional' | 'Organization';
}

export interface Municipality {
  municipalityDe: string;
  municipalityFr: string;
  municipalityNl: string;
}

export interface Street{
  streetDe: string;
  streetFr: string;
  streetNl: string;
}

export interface HealthcareProviderList {
  total: number;
  healthcareOrganizations: Organization[]
  healthcareProfessionals: Professional[]
  page?: number;
  pageSize?: number;
}

export interface SearchHealthcareProviderCriteria {
  query: string
  zipCodes: string[]
}
