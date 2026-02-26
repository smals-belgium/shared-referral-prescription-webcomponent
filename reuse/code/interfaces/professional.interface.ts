import { ProviderType } from '@reuse/code/openapi';

export interface SearchProfessionalCriteria {
  query: string;
  zipCodes: number[];
  disciplines: string[];
  institutionTypes?: string[];
  providerType: ProviderType;
  prescriptionId: string;
  intent: string;
}
