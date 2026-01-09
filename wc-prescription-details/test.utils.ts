import { Discipline, FhirR4TaskStatus, PerformerTaskResource, Role } from '@reuse/code/openapi';
import { TranslateLoader } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { PseudonymisationHelper } from '@smals-belgium-shared/pseudo-helper';
import { UserInfo } from '@reuse/code/interfaces';
import { signal } from '@angular/core';

export const mockPro: UserInfo = {
  ssin: '10000000003',
  discipline: Discipline.Nurse,
  nihii11: '12345678910',
  lastName: 'pro',
  firstName: 'name',
  professional: true,
  role: Role.Prescriber,
};

export const mockPerson = {
  ssin: '10000000003',
  name: 'name of patient',
};

export const mockPerformerTask: PerformerTaskResource = {
  status: FhirR4TaskStatus.Ready,
  careGiverSsin: '10000000005',
  careGiver: {
    address: {},
    id: {
      profession: 'NURSE',
    },
  },
};

export const organisationTask = { organizationNihii: '10000000009' };

export const referralTask = {
  id: '455',
};

export const id = 'DEAD0000-0000-4000-A000-000000000021';

export function prescriptionResponse(
  organisationTasks: any = null,
  referralTask: any = null,
  performerTask: PerformerTaskResource[] | null = null
) {
  return {
    id: id,
    pseudonymizedKey: 'pseudo-key',
    patientIdentifier: mockPerson.ssin,
    referralTask: referralTask,
    performerTasks: performerTask,
    organizationTasks: organisationTasks,
    templateCode: 'GENERIC',
    authoredOn: '2024-09-04T22:00:00.000+00:00',
    requester: {},
    status: 'OPEN',
    period: {
      start: '2024-09-04T22:00:00.000+00:00',
      end: '2025-09-03T22:00:00.000+00:00',
    },
    responses: {},
    intent: null,
    category: 'nursing',
    shortCode: 'CAF4FE',
  };
}

export class FakeLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<any> {
    return of({});
  }
}

export const mockTemplate = {};

export const mockConfigService = {
  getEnvironment: jest.fn(),
  getEnvironmentVariable: jest.fn(),
};

export const mockAuthService = {
  init: jest.fn(),
  getClaims: jest.fn(() =>
    of({
      userProfile: mockPerson,
    })
  ),
  isProfessional: jest.fn(() => of(false)),
  discipline: jest.fn(() => of(Discipline.Nurse)),
  role: jest.fn(() => of(Role.Prescriber)),
};

export const mockPersonService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
};

export const prescriptionDetailsSecondaryMockService = {
  getPrescription: jest.fn().mockReturnValue({
    data: {},
  }),
  getCurrentUser: jest.fn().mockReturnValue({
    data: {},
  }),
  getPerformerTask: jest.fn().mockReturnValue({
    data: {},
  }),
  getTemplateVersion: jest.fn().mockReturnValue({
    data: {},
  }),
  getPatient: jest.fn().mockReturnValue({
    data: {},
  }),
  getDecryptedResponses: jest.fn().mockReturnValue({
    data: {},
  }),
  loading: signal(false),
  generatedUUID: jest.fn().mockReturnValue('generated-uuid'),
  currentLang: jest.fn().mockReturnValue('BE-fr'),
  pssStatus: jest.fn(),
  isProfessional$: jest.fn(),
};

export const mockPseudoClient = {
  getDomain: jest.fn(),
  identify: jest.fn(),
  identifyMultiple: jest.fn(),
  pseudonymize: jest.fn(),
  pseudonymizeMultiple: jest.fn(),
};

export const MockPseudoHelperFactory = () => {
  return new PseudonymisationHelper(mockPseudoClient);
};

export const encryptionStateService = {
  loadCryptoKey: jest.fn(),
  state: jest.fn().mockReturnValue({
    data: of('mockCryptoKey'),
  }),
  resetCryptoKey: jest.fn(),
  setCryptoKeyError: jest.fn(),
};

export const mockUuid = (returnValue: string = 'mock-uuid-123') => {
  jest.mock('uuid', () => ({
    v4: jest.fn(() => returnValue),
  }));
};

export class MockDateAdapter {
  setLocale = jest.fn();
}

export const BASE_URL = 'http://localhost';
