import {
  Discipline,
  FhirR4TaskStatus,
  OIDC,
  OrganizationTaskResource,
  PerformerTaskResource,
  ReadRequestResource,
  RequestTaskResource,
  Role,
  TemplateVersion,
} from '@reuse/code/openapi';
import { TranslateLoader } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { PseudonymisationHelper } from '@smals-belgium-shared/pseudo-helper';
import { UserInfo } from '@reuse/code/interfaces';
import { signal } from '@angular/core';
import {
  asOrganizationTask,
  asPerformerTask,
  isOrganizationTask,
  isPerformerTask,
} from '@reuse/code/utils/task-type.util';
import TaskTypeEnum = RequestTaskResource.TaskTypeEnum;

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
  id: 'performerTask',
  status: FhirR4TaskStatus.Ready,
  careGiverSsin: '10000000005',
  careGiver: {
    address: {},
    id: {
      profession: 'NURSE',
    },
  },
  taskType: TaskTypeEnum.PerformerTaskResource,
};

export const mockOrganisationTask: OrganizationTaskResource = {
  organizationNihii: '10000000009',
  status: FhirR4TaskStatus.Ready,
  taskType: TaskTypeEnum.OrganizationTaskResource,
};

export const referralTask = {
  id: '455',
};

export const id = 'DEAD0000-0000-4000-A000-000000000021';

export function prescriptionResponse(
  referralTask: any = null,
  performerTask: RequestTaskResource[] | null = null
): ReadRequestResource {
  const performerTasks: Record<string, PerformerTaskResource[]> = {};

  performerTask?.forEach(p => {
    if (isPerformerTask(p)) {
      const task = asPerformerTask(p);
      if (!task?.careGiverSsin) return;

      performerTasks[task.careGiverSsin] ??= [];
      performerTasks[task.careGiverSsin].push(p);
    }
    if (isOrganizationTask(p)) {
      const task = asOrganizationTask(p);
      if (!task?.organizationNihii) return;

      performerTasks[task.organizationNihii] ??= [];

      performerTasks[task.organizationNihii].push(p);
    }
  });

  return {
    id: id,
    pseudonymizedKey: 'pseudo-key',
    patientIdentifier: mockPerson.ssin,
    referralTask: referralTask,
    performerTasks: performerTasks,
    templateCode: 'GENERIC',
    authoredOn: '2024-09-04T22:00:00.000+00:00',
    requester: {},
    status: 'OPEN',
    period: {
      start: '2024-09-04T22:00:00.000+00:00',
      end: '2025-09-03T22:00:00.000+00:00',
      hideEndDate: false,
    },
    responses: {},
    intent: undefined,
    category: 'nursing',
    shortCode: 'CAF4FE',
  };
}

export class FakeLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<any> {
    return of({});
  }
}

export const mockTemplate = {} as TemplateVersion;

export const mockConfigService = {
  getEnvironment: jest.fn().mockReturnValue('test'),
  getEnvironmentVariable: jest.fn().mockImplementation((key: string) => {
    switch (key) {
      case 'pseudoApiUrl':
        return 'https://pseudo-api.test';

      case 'enablePseudo':
        return false;

      default:
        return false;
    }
  }),
};

export const mockAuthService = {
  init: jest.fn(),
  getClaims: jest.fn(() =>
    of({
      userProfile: mockPerson,
    })
  ),
  isProfessional: jest.fn(() => of(false)),
  isOrganization: jest.fn(() => of(false)),
  discipline: jest.fn(() => of(Discipline.Nurse)),
  role: jest.fn(() => of(Role.Prescriber)),
  oidc: jest.fn(() => of(OIDC.Homecareservices)),
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
  getRequestTask: jest.fn().mockReturnValue({
    data: {},
  }),
  getAllConnectedUserPerformerTasks: jest.fn().mockReturnValue({
    data: [{}],
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

export const markdownServiceMock = {
  parse: jest.fn((src: string) => src),
  compile: jest.fn((src: string) => src),
  render: jest.fn(),
  reload$: of(void 0),
};

export const mockEnvironmentVariables = (mockConfigService: any) => {
  mockConfigService.getEnvironment?.mockReturnValue?.('test');
  mockConfigService.getEnvironmentVariable.mockImplementation((key: string) => {
    switch (key) {
      case 'pseudoApiUrl':
        return 'https://pseudo-api.test';

      case 'enablePseudo':
        return false;

      default:
        return false;
    }
  });
};
