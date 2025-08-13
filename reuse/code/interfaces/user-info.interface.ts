export interface UserInfo {
  lastName: string;
  firstName: string;
  ssin: string;
  professional: true;
  role: Role;
  discipline: Discipline;
  nihii11?: string;
}

export enum Role {
  patient = 'patient',
  professional = 'professional'
}

export enum Discipline {
  PHYSICIAN = 'PHYSICIAN',
  PHARMACIST = 'PHARMACIST',
  DENTIST = 'DENTIST',
  NURSE = 'NURSE',
  PHYSIOTHERAPIST = 'PHYSIOTHERAPIST',
  MIDWIFE = 'MIDWIFE',
  PATIENT = 'PATIENT',
}

// Create a type that converts the enum keys to lowercase
type LowercaseEnumKeys<T> = {
  [K in keyof T as K extends string ? Lowercase<K> : never]: T[K]
}

// Generate a lowercase interface from the enum Discipline
type LowercaseDiscipline = LowercaseEnumKeys<typeof Discipline>;

type Professional = {
  [key in keyof LowercaseDiscipline]?: {
    recognised: boolean
    nihii11: string
  }
}

interface Personal {
  lastName: string
  firstName: string
  ssin: string
}

type UserProfile = Personal & Professional;

export interface IdToken {
  UserProfile: UserProfile
}

export interface Token {
  accessToken: string,
  idToken: IdToken
  getAuthExchangeToken: Promise<string>
}
