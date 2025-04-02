import { HealthcareProvider } from './healthcareProvider.interface';

export interface Organization extends HealthcareProvider {
  id: {
    organizationId: string;
    authenticSource: string;
  }
  cbe: string;
  organizationName: OrganizationName;
  typeCode: string;
  typeDescription: TypeDescription;
  qualificationCode: string;
  situationCode: string;
  SituationCodeStartDate: string;
  cot: string;
  cotStartDate: string;
  cotEndDate: string;
  addressType: string;
  type: 'Organization'
}

export interface OrganizationName {
  nameDe: string;
  nameFr: string;
  nameNl: string;
}

export interface TypeDescription {
  typeDescFr: string;
  typeDescNl: string;
  typeDescDe: string;
}

export type Group = {
  name: string;
  code: string;
};

