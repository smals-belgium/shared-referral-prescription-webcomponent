import { Discipline, OIDC, Role } from '@reuse/code/openapi';

export interface UserInfo extends UserProfile {
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
type LowercaseDisciplineKeys = keyof LowercaseEnumKeys<typeof Discipline>;

type Professional = {
  [key in LowercaseDisciplineKeys]?: {
    recognised: boolean;
    nihii11: string;
  };
};

interface Personal {
  lastName: string;
  firstName: string;
  ssin: string;
}

// Generate a lowercase interface from the enum OIDC
type LowercaseOIDCKeys = keyof LowercaseEnumKeys<typeof OIDC>;

type Organization = {
  [K in LowercaseOIDCKeys]?: {
    nihii: string;
    name?: string;
  };
};

interface Organizations {
  organizations?: Organization[];
}

export type UserProfile = Personal & Professional & Organizations;

export interface IdToken {
  userProfile: UserProfile;
}

export interface AccessToken {
  resource_access: ResourceAccess;
  iss: string;
}

export interface ResourceAccess {
  [clientId: string]: {
    roles?: string[];
  };
}
