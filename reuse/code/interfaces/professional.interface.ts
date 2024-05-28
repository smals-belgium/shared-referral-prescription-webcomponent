import { HealthcareProvider } from './healthcareProvider.interface';

export interface Professional extends HealthcareProvider {
  lastName: string;
  firstName: string;
  profession: string;
  ssin: string;
  type: 'Professional';
}
