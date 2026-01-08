import { HttpRequest } from '@angular/common/http';
import { DEMO_MOCKS, DemoMockEntry, ReadRequestResourceExtended } from '@reuse/code/demo/mocks/mock-registry';
import {
  CitiesResource,
  CityResource,
  HealthcarePersonResource,
  RequestSummaryListResource,
  TemplateVersion,
} from '@reuse/code/openapi';
import { demoStorage } from '../helpers/demoStorage';

function findMockByUrl(pattern: RegExp): DemoMockEntry {
  const mock = DEMO_MOCKS.find(m => m.url.toString() === pattern.toString());
  if (!mock) throw new Error(`Mock not found for ${pattern}`);
  return mock;
}

function createHttpRequest(url: string, params: Record<string, string> = {}): HttpRequest<unknown> {
  return new HttpRequest<unknown>('GET', url, null, {
    params: new URLSearchParams(params) as any,
  });
}

describe('Demo mode', () => {
  it('should contain all required mock entries', () => {
    const urls = DEMO_MOCKS.map(m => m.url.source);
    expect(urls).toEqual(
      expect.arrayContaining([
        '\\/persons\\/[^/]+',
        '\\/accessMatrix$',
        '\\/prescriptions\\/summary(\\?.*)?$',
        '\\/proposals\\/summary(\\?.*)?$',
        '\\/prescriptions\\/[a-z0-9-]+$',
        '\\/proposals\\/[a-z0-9-]+$',
        '\\/templates$',
        '\\/templates\\/READ_[A-Z0-9_]+\\/versions\\/latest$',
        '\\/healthCareProviders',
        '\\/prescriptions\\/[a-z0-9-]+\\/assign\\/[a-z0-9-]+$',
      ])
    );
  });

  it('should return the accessMatrix data', () => {
    const mock = findMockByUrl(/\/accessMatrix$/);
    const result = mock.body;

    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
    expect(mock.method).toContain('GET');
  });

  it('should expose templates in the body property', () => {
    const mock = findMockByUrl(/\/templates$/);

    expect(mock).toBeDefined();
    expect(mock.method).toContain('GET');
    expect(mock.body).toBeDefined();
    expect(typeof mock.body).toBe('object');
  });

  describe('Prescriptions  summary mock', () => {
    it('should return only OPEN and IN_PROGRESS prescriptions when historical=false', () => {
      const mock = findMockByUrl(/\/prescriptions\/summary(\?.*)?$/);
      const req = createHttpRequest('/prescriptions/summary', {
        historical: 'false',
        page: '1',
        pageSize: '10',
      });

      const result = mock.handler!(req, null) as RequestSummaryListResource;
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.items)).toBe(true);

      result.items!.forEach((p: any) => {
        expect(['OPEN', 'IN_PROGRESS']).toContain(p.status);
      });
    });

    it('should paginate the results correctly', () => {
      const mock = findMockByUrl(/\/prescriptions\/summary(\?.*)?$/);
      const req = createHttpRequest('/prescriptions/summary', {
        historical: 'true',
        page: '2',
        pageSize: '5',
      });

      const result = mock.handler!(req, null) as RequestSummaryListResource;

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');

      expect(result.items!.length).toBeLessThanOrEqual(5);
      expect(result.total).toBeGreaterThanOrEqual(result.items!.length);
    });
  });

  describe('Proposals summary mock', () => {
    it('should filter out non-OPEN/IN_PROGRESS proposals when historical=false', () => {
      const mock = findMockByUrl(/\/proposals\/summary(\?.*)?$/);
      const req = createHttpRequest('/proposals/summary', {
        historical: 'false',
        page: '1',
        pageSize: '10',
      });

      const result = mock.handler!(req, null) as RequestSummaryListResource;

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.items)).toBe(true);

      result.items!.forEach((p: any) => {
        expect(['OPEN', 'IN_PROGRESS']).toContain(p.status);
      });
    });

    it('should apply pagination based on page and pageSize', () => {
      const mock = findMockByUrl(/\/proposals\/summary(\?.*)?$/);
      const req = createHttpRequest('/proposals/summary', {
        historical: 'true',
        page: '3',
        pageSize: '2',
      });

      const result = mock.handler!(req, null) as RequestSummaryListResource;
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.items)).toBe(true);

      expect(result.items!.length).toBeLessThanOrEqual(2);
      expect(result.total).toBeGreaterThanOrEqual(result.items!.length);
    });
  });

  describe('Persons mock', () => {
    it('should return the first person', () => {
      const mock = findMockByUrl(/\/persons\/[^/]+/);
      const result = typeof mock.body === 'function' ? mock.body() : mock.body;

      expect(result).toBeDefined();
      expect(mock.method).toContain('GET');
    });
  });

  describe('Prescription detail mock', () => {
    it('should return prescription by id', () => {
      const id = 'DEAD0000-0000-4000-A000-000000000004';
      const mock = findMockByUrl(/\/prescriptions\/[a-z0-9-]+$/i);
      const req = createHttpRequest(`/prescriptions/${id}`);

      const result = mock.handler!(req, null) as ReadRequestResourceExtended;

      expect(result).toBeDefined();
      expect(mock.method).toContain('GET');
      expect(result.id).toBe(id);
    });

    it('should attach requester to prescription', () => {
      const id = 'DEAD0000-0000-4000-A000-000000000003';
      const mock = findMockByUrl(/\/prescriptions\/[a-z0-9-]+$/i);
      const req = createHttpRequest(`/prescriptions/${id}`);

      const result = mock.handler!(req, null) as ReadRequestResourceExtended;

      if (result && typeof result === 'object' && 'requester' in result) {
        expect(result.requester).toBeDefined();
        const healthcarePerson = result.requester!.healthcarePerson as HealthcarePersonResource;
        expect(healthcarePerson.ssin).toBe('10000000007');
        expect(healthcarePerson.firstName).toBe('Thomas');
        expect(healthcarePerson.lastName).toBe('Verhofstadt');
        expect(healthcarePerson.deceased).toBeFalsy();
      }
    });

    it('should attach careGiver to performerTasks', () => {
      const id = 'DEAD0000-0000-4000-A000-000000000002';

      const mock = findMockByUrl(/\/prescriptions\/[a-z0-9-]+$/i);
      const req = createHttpRequest(`/prescriptions/${id}`);

      const result = mock.handler!(req, null) as ReadRequestResourceExtended;

      if (result && result.performerTasks && result.performerTasks.length > 0) {
        result.performerTasks.forEach((task: any) => {
          if (task.careGiverIndex != null) {
            expect(task.careGiver).toBeDefined();

            const healthcarePerson = task.careGiver.healthcarePerson as HealthcarePersonResource;
            expect(healthcarePerson.ssin).toBe('10000000009');
            expect(healthcarePerson.firstName).toBe('Robin');
            expect(healthcarePerson.lastName).toBe('Dupont');
            expect(healthcarePerson.deceased).toBeFalsy();
          }
        });
      }
    });
  });

  describe('Proposal detail mock', () => {
    it('should return proposal by id', () => {
      const id = 'DEAD0000-0000-4000-A000-000000000021';

      const mock = findMockByUrl(/\/proposals\/[a-z0-9-]+$/i);
      const req = createHttpRequest(`/proposals/${id}`);

      const result = mock.handler!(req, null) as ReadRequestResourceExtended;

      expect(result).toBeDefined();
      expect(mock.method).toContain('GET');
      expect(result.id).toBe(id);
    });

    it('should attach requester to proposal', () => {
      const id = 'DEAD0000-0000-4000-A000-000000000022';

      const mock = findMockByUrl(/\/proposals\/[a-z0-9-]+$/i);
      const req = createHttpRequest(`/proposals/${id}`);

      const result = mock.handler!(req, null) as ReadRequestResourceExtended;

      if (result && typeof result === 'object' && 'requester' in result) {
        expect(result.requester).toBeDefined();
        const healthcarePerson = result.requester!.healthcarePerson as HealthcarePersonResource;
        expect(healthcarePerson.ssin).toBe('10000000008');
        expect(healthcarePerson.firstName).toBe('Anke');
        expect(healthcarePerson.lastName).toBe('Dubois');
        expect(healthcarePerson.deceased).toBeFalsy();
      }
    });
  });

  describe('Template versions latest mock', () => {
    it('should return template by name', () => {
      const mock = findMockByUrl(/\/templates\/READ_[A-Z0-9_]+\/versions\/latest$/);
      const req = createHttpRequest('/templates/READ_ANNEX_81/versions/latest');

      const result = mock.handler!(req, null) as TemplateVersion;

      expect(result).toBeDefined();
      expect(mock.method).toContain('GET');
      expect(result.id).toBe('ANNEX_81');
    });

    it('should merge commonTranslations into template', () => {
      const mock = findMockByUrl(/\/templates\/READ_[A-Z0-9_]+\/versions\/latest$/);
      const req = createHttpRequest('/templates/READ_BLEEDING/versions/latest');

      const result = mock.handler!(req, null) as TemplateVersion;

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result.commonTranslations).toBeDefined();
    });

    it('should return error when template not found', () => {
      const mock = findMockByUrl(/\/templates\/READ_[A-Z0-9_]+\/versions\/latest$/);
      const req = createHttpRequest('/templates/READ_NONEXISTENT/versions/latest');

      const result = mock.handler!(req, null) as Error;

      expect(result).toBeDefined();
      expect(result.message).toContain('No template found');
    });
  });

  describe('HealthCare Providers mock', () => {
    it('should return healthcare organizations when institutionType is provided', () => {
      const mock = findMockByUrl(/\/healthCareProviders/);
      const req = createHttpRequest('/healthCareProviders', {
        institutionType: 'HOSPITAL',
        page: '1',
        pageSize: '10',
      });

      const result = mock.handler!(req, null) as any;

      expect(result).toHaveProperty('healthcareOrganizations');
      expect(result).toHaveProperty('healthcareProfessionals');
      expect(result).toHaveProperty('total');

      expect(Array.isArray(result.healthcareOrganizations)).toBe(true);
      expect(result.healthcareOrganizations.length).toBe(2);

      expect(Array.isArray(result.healthcareProfessionals)).toBe(true);
      expect(result.healthcareProfessionals.length).toBe(0);

      expect(result.total).toBe(2);
    });

    it('should filter organizations by query', () => {
      const mock = findMockByUrl(/\/healthCareProviders/);
      const req = createHttpRequest('/healthCareProviders', {
        institutionType: 'HOSPITAL',
        query: 'Group of doctors',
        page: '1',
        pageSize: '10',
      });

      const result = mock.handler!(req, null) as any;

      expect(Array.isArray(result.healthcareOrganizations)).toBe(true);
      expect(result.healthcareOrganizations.length).toBe(1);

      expect(Array.isArray(result.healthcareProfessionals)).toBe(true);
      expect(result.healthcareProfessionals.length).toBe(0);

      expect(result.total).toBe(1);
    });

    it('should filter organizations by zipCode', () => {
      const mock = findMockByUrl(/\/healthCareProviders/);
      const req = createHttpRequest('/healthCareProviders', {
        institutionType: 'HOSPITAL',
        zipCode: '1000',
        page: '1',
        pageSize: '10',
      });

      const result = mock.handler!(req, null) as any;

      expect(Array.isArray(result.healthcareOrganizations)).toBe(true);
      expect(result.healthcareOrganizations.length).toBe(2);

      expect(Array.isArray(result.healthcareProfessionals)).toBe(true);
      expect(result.healthcareProfessionals.length).toBe(0);

      expect(result.total).toBe(2);
    });

    it('should return healthcare professionals when discipline is provided', () => {
      const mock = findMockByUrl(/\/healthCareProviders/);
      const req = createHttpRequest('/healthCareProviders', {
        discipline: 'NURSE',
        page: '1',
        pageSize: '10',
      });

      const result = mock.handler!(req, null) as any;

      expect(result).toHaveProperty('healthcareProfessionals');
      expect(result).toHaveProperty('healthcareOrganizations');
      expect(result).toHaveProperty('total');

      expect(Array.isArray(result.healthcareOrganizations)).toBe(true);
      expect(result.healthcareOrganizations.length).toBe(0);

      expect(Array.isArray(result.healthcareProfessionals)).toBe(true);
      expect(result.healthcareProfessionals.length).toBe(3);

      expect(result.total).toBe(3);
    });

    it('should return all professionals when discipline is ALL', () => {
      const mock = findMockByUrl(/\/healthCareProviders/);
      const req = createHttpRequest('/healthCareProviders', {
        discipline: 'ALL',
        page: '1',
        pageSize: '10',
      });

      const result = mock.handler!(req, null) as any;

      expect(Array.isArray(result.healthcareOrganizations)).toBe(true);
      expect(result.healthcareOrganizations.length).toBe(0);

      expect(Array.isArray(result.healthcareProfessionals)).toBe(true);
      expect(result.healthcareProfessionals.length).toBe(3);

      expect(result.total).toBe(3);
    });

    it('should filter professionals by query', () => {
      const mock = findMockByUrl(/\/healthCareProviders/);
      const req = createHttpRequest('/healthCareProviders', {
        discipline: 'NURSE',
        query: 'Ank',
        page: '1',
        pageSize: '10',
      });

      const result = mock.handler!(req, null) as any;

      expect(result).toHaveProperty('healthcareProfessionals');
      expect(Array.isArray(result.healthcareOrganizations)).toBe(true);
      expect(result.healthcareOrganizations.length).toBe(0);

      expect(Array.isArray(result.healthcareProfessionals)).toBe(true);
      expect(result.healthcareProfessionals.length).toBe(1);

      expect(result.total).toBe(1);
    });

    it('should filter professionals by zipCode', () => {
      const mock = findMockByUrl(/\/healthCareProviders/);
      const req = createHttpRequest('/healthCareProviders', {
        discipline: 'NURSE',
        zipCode: '1050',
        page: '1',
        pageSize: '10',
      });

      const result = mock.handler!(req, null) as any;

      expect(result).toHaveProperty('healthcareProfessionals');
      expect(Array.isArray(result.healthcareOrganizations)).toBe(true);
      expect(result.healthcareOrganizations.length).toBe(0);

      expect(Array.isArray(result.healthcareProfessionals)).toBe(true);
      expect(result.healthcareProfessionals.length).toBe(1);

      expect(result.total).toBe(1);
    });

    it('should paginate organization results', () => {
      const mock = findMockByUrl(/\/healthCareProviders/);
      const req = createHttpRequest('/healthCareProviders', {
        institutionType: 'HOSPITAL',
        page: '2',
        pageSize: '2',
      });

      const result = mock.handler!(req, null) as any;

      expect(result.healthcareOrganizations.length).toBeLessThanOrEqual(2);
    });

    it('should paginate professional results', () => {
      const mock = findMockByUrl(/\/healthCareProviders/);
      const req = createHttpRequest('/healthCareProviders', {
        discipline: 'NURSE',
        page: '2',
        pageSize: '2',
      });

      const result = mock.handler!(req, null) as any;

      expect(result.healthcareProfessionals.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Assign caregiver to prescription mock', () => {
    beforeEach(() => {
      demoStorage.clear();
    });

    it('should assign professional to prescription', () => {
      const id = 'DEAD0000-0000-4000-A000-000000000004';
      const mock = findMockByUrl(/\/prescriptions\/[a-z0-9-]+\/assign\/[a-z0-9-]+$/i);
      const req = new HttpRequest<unknown>('POST', `/prescriptions/${id}/assign/task-id`, { ssin: '12345678901' });

      const result = mock.handler!(req, null);

      expect(result).toBeDefined();
      expect(mock.method).toContain('POST');
    });

    it('should add performerTask to prescription', () => {
      const id = 'DEAD0000-0000-4000-A000-000000000004';

      const mockPrescription = {
        id: id,
        status: 'OPEN',
        performerTasks: [],
      };
      demoStorage.set('demoPrescription', mockPrescription);

      const assignMock = findMockByUrl(/\/prescriptions\/[a-z0-9-]+\/assign\/[a-z0-9-]+$/i);
      const assignReq = new HttpRequest<unknown>('POST', `/prescriptions/${id}/assign/task-id`, {
        ssin: '10000000009',
      });

      assignMock.handler!(assignReq, null);

      const savedPrescription = demoStorage.get('demoPrescription') as ReadRequestResourceExtended;
      expect(savedPrescription).toBeDefined();
      expect(savedPrescription.performerTasks).toBeDefined();
      expect(Array.isArray(savedPrescription.performerTasks)).toBe(true);
      expect(savedPrescription.performerTasks?.length).toBe(1);
    });
  });

  describe('Assign caregiver to proposal mock', () => {
    beforeEach(() => {
      demoStorage.clear();
    });

    it('should assign professional to proposal', () => {
      const mock = findMockByUrl(/\/proposals\/[a-z0-9-]+\/assign\/[a-z0-9-]+$/i);
      const req = new HttpRequest<unknown>('POST', '/proposals/test-id/assign/task-id', { ssin: '12345678901' });

      const result = mock.handler!(req, null);

      expect(result).toBeDefined();
      expect(mock.method).toContain('POST');
    });
  });

  describe('Assign organization to prescription mock', () => {
    beforeEach(() => {
      demoStorage.clear();
    });

    it('should assign organization to prescription', () => {
      const id = 'DEAD0000-0000-4000-A000-000000000004';

      const mock = findMockByUrl(/\/prescriptions\/[a-z0-9-]+\/assignOrganization\/[a-z0-9-]+$/i);
      const req = new HttpRequest<unknown>('POST', `/prescriptions/${id}/assignOrganization/org-id`, {
        nihii: '12345678',
        institutionTypeCode: 'HOSPITAL',
      });

      const result = mock.handler!(req, null);

      expect(result).toBeDefined();
      expect(mock.method).toContain('POST');
    });

    it('should add organizationTask to prescription', () => {
      const id = 'DEAD0000-0000-4000-A000-000000000004';

      const mock = findMockByUrl(/\/prescriptions\/[a-z0-9-]+\/assignOrganization\/[a-z0-9-]+$/i);
      const req = new HttpRequest<unknown>('POST', `/prescriptions/${id}/assignOrganization/org-id`, {
        nihii: '00000009940',
        institutionTypeCode: '940',
      });

      mock.handler!(req, null);

      const saved = demoStorage.get('demoPrescription') as ReadRequestResourceExtended;
      if (saved && saved.organizationTasks) {
        expect(Array.isArray(saved.organizationTasks)).toBe(true);
        expect(saved.organizationTasks.length).toBe(1);
      }
    });
  });

  describe('Assign organization to proposal mock', () => {
    it('should assign organization to proposal', () => {
      const id = 'DEAD0000-0000-4000-A000-000000000004';

      const mock = findMockByUrl(/\/proposals\/[a-z0-9-]+\/assignOrganization\/[a-z0-9-]+$/i);
      const req = new HttpRequest<unknown>('POST', `/proposals/${id}/assignOrganization/org-id`, {
        nihii: '12345678',
        institutionTypeCode: 'HOSPITAL',
      });

      const result = mock.handler!(req, null);

      expect(result).toBeDefined();
      expect(mock.method).toContain('POST');
    });
  });

  describe('Geography cities mock', () => {
    it('should return all cities when no query provided', () => {
      const mock = findMockByUrl(/\/geography\/cities(\?.*)?$/);
      const req = createHttpRequest('/geography/cities');

      const result = mock.handler!(req, null) as CitiesResource;

      expect(result).toHaveProperty('items');
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.items!.length).toBe(51);
      expect(mock.method).toContain('GET');
    });

    it('should filter cities by name query', () => {
      const mock = findMockByUrl(/\/geography\/cities(\?.*)?$/);
      const req = createHttpRequest('/geography/cities', {
        query: 'brussels',
      });

      const result = mock.handler!(req, null) as CitiesResource;

      expect(result).toHaveProperty('items');
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.items!.length).toBe(1);
    });

    it('should filter cities by zipCode', () => {
      const mock = findMockByUrl(/\/geography\/cities(\?.*)?$/);
      const req = createHttpRequest('/geography/cities', {
        query: '1000',
      });

      const result = mock.handler!(req, null) as CitiesResource;

      expect(result).toHaveProperty('items');
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.items!.length).toBe(1);
    });

    it('should handle case-insensitive search', () => {
      const mock = findMockByUrl(/\/geography\/cities(\?.*)?$/);
      const req = createHttpRequest('/geography/cities', {
        query: 'BRUssELS',
      });

      const result = mock.handler!(req, null) as CitiesResource;

      expect(result).toHaveProperty('items');
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.items!.length).toBe(1);
    });

    it('should search across all language fields', () => {
      const mock = findMockByUrl(/\/geography\/cities(\?.*)?$/);
      const req = createHttpRequest('/geography/cities', {
        query: 'Ixelles',
      });

      const result = mock.handler!(req, null) as CitiesResource;

      expect(result).toHaveProperty('items');
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.items!.length).toBe(1);
    });
  });
});
