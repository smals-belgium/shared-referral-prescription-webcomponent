export interface UserInfo {
  lastName: string;
  firstName: string;
  ssin: string;
  professional: true;
  role: Role;
  discipline: Discipline;
  nihii11?: string;
}

export enum Discipline {
  PHYSICIAN = 'PHYSICIAN',
  PHARMACIST = 'PHARMACIST',
  DENTIST = 'DENTIST',
  NURSE = 'NURSE',
  MIDWIFE = 'MIDWIFE',
  PATIENT = 'PATIENT',
}

export enum Role {
  patient = 'patient',
  professional = 'professional'
}
