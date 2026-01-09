import { Discipline, Role } from '@reuse/code/openapi';

export interface UserInfo extends UserProfile {
  lastName: string;
  firstName: string;
  ssin: string;
  professional: true;
  role: Role;
  discipline: Discipline;
  nihii11?: string;
}

// Create a type that converts the enum keys to lowercase
type LowercaseEnumKeys<T> = {
  [K in keyof T as K extends string ? Lowercase<K> : never]: T[K];
};

// Generate a lowercase interface from the enum Discipline
type LowercaseDiscipline = LowercaseEnumKeys<typeof Discipline>;

type Professional = {
  [key in keyof LowercaseDiscipline]?: {
    recognised: boolean;
    nihii11: string;
  };
};

interface Personal {
  lastName: string;
  firstName: string;
  ssin: string;
}

export type UserProfile = Personal & Professional;

export interface IdToken {
  userProfile: UserProfile;
}

export interface AccessToken {
  resource_access: ResourceAccess;
  iss: string;
}

export interface Token {
  accessToken: string;
  idToken: IdToken;
  getAuthExchangeToken: Promise<string>;
}

export interface ResourceAccess {
  [clientId: string]: {
    roles?: string[];
  };
}
