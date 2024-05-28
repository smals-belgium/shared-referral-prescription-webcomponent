export interface HealthcareProvider{
  nihdi?: string;
  address?: {
    city?: string;
    zipCode?: string;
    streetName?: string;
    houseNumber?: string;
  };
  type: 'Professional' | 'Organization';
}
