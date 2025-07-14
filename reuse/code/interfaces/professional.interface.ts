import { HealthcareProvider } from './healthcareProvider.interface';

export interface Professional extends HealthcareProvider {
  id: {
    profession: string;
    qualificationCode: string;
    ssin: string;
  }
  healthcarePerson: {
    lastName: string;
    firstName: string;
  }
  healthcareQualification: Description
  healthcareStatus: {
    code: string;
  } & Description;
  type: 'Professional';
  licenseToPractice: boolean;
  subscriptionEndDate: string;
  visaActive: boolean;
  visaEndDate: string;
  phoneNumbers?:  {
    mobileNumber?: string;
    telephoneNumbers?: { [s: string]: string; };
  };
}

export interface Description {
  descriptionFr: string;
  descriptionNl: string;
  descriptionDe: string;
}
