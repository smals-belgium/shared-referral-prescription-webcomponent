import { HealthcareProvider } from './healthcareProvider.interface';

export interface Organization extends HealthcareProvider{
  name: string;
  institutionTypeCode: string;
  cbe: string;
  type: 'Organization';
}
