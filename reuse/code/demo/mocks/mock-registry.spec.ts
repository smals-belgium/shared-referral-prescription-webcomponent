import { HttpRequest } from '@angular/common/http';
import { DEMO_MOCKS, DemoMockEntry } from '@reuse/code/demo/mocks/mock-registry';

function findMockByUrl(pattern: RegExp): DemoMockEntry {
  const mock = DEMO_MOCKS.find(m => m.url.toString() === pattern.toString());
  if (!mock) throw new Error(`Mock not found for ${pattern}`);
  return mock;
}

function createHttpRequest(
  url: string,
  params: Record<string, string> = {}
): HttpRequest<unknown> {
  return new HttpRequest<unknown>('GET', url, null, {
    params: new URLSearchParams(params) as any,
  });
}

it('should contain all required mock entries', () => {
  const urls = DEMO_MOCKS.map(m => m.url.source);
  expect(urls).toEqual(
    expect.arrayContaining([
      '\\/accessMatrix$',
      '\\/prescriptions\\/summary',
      '\\/proposals\\/summary',
      '\\/templates$',
    ])
  );
});

it('should return the accessMatrix data', () => {
  const mock = findMockByUrl(/\/accessMatrix$/);
  const req = createHttpRequest('/accessMatrix');
  const result = mock.handler!(req, null);

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

it('should return paginated organizations when institutionType is set', () => {
  const mock = findMockByUrl(/\/healthCareProviders/);
  const params = new URLSearchParams({ institutionType: 'HOSPITAL', page: '1', pageSize: '5' }) as any;
  const req = new HttpRequest('GET', '/healthCareProviders', { params });

  const result = mock.handler!(req, null);

  expect(result).toHaveProperty('healthcareOrganizations');
  expect(result).toHaveProperty('total');
  expect(Array.isArray(result.healthcareOrganizations)).toBe(true);
});

it('should return filtered professionals when discipline is set', () => {
  const mock = findMockByUrl(/\/healthCareProviders/);
  const params = new URLSearchParams({ discipline: 'ALL', page: '1', pageSize: '5' }) as any;
  const req = new HttpRequest('GET', '/healthCareProviders', { params });

  const result = mock.handler!(req, null);

  expect(result).toHaveProperty('healthcareProfessionals');
  expect(result).toHaveProperty('total');
  expect(Array.isArray(result.healthcareProfessionals)).toBe(true);
});

it('should return default resource when no params are provided', () => {
  const mock = findMockByUrl(/\/healthCareProviders/);
  const params = new URLSearchParams() as any;
  const req = new HttpRequest('GET', '/healthCareProviders', { params });

  const result = mock.handler!(req, null);

  expect(result).toHaveProperty('healthcareOrganizations');
  expect(result).toHaveProperty('healthcareProfessionals');
});

it('should return templateVersionsLatest body', () => {
  const mock = findMockByUrl(/\/templates\/READ_[A-Z0-9_]+\/versions\/latest$/);
  expect(mock.body).toBeDefined();
  expect(typeof mock.body).toBe('object');
});

it('should return an id when assigning a prescription', () => {
  const mock = findMockByUrl(/\/prescriptions\/[a-z0-9-]+\/assign\/[a-z0-9-]+$/i);
  const req = new HttpRequest('POST', '/prescriptions/123/assign/456', null);
  const result = typeof mock.body === 'function' ? mock.body(req, null) : mock.body;

  expect(result).toHaveProperty('id');
});

it('should return an id when assigning a proposal', () => {
  const mock = findMockByUrl(/\/proposals\/[a-z0-9-]+\/assign\/[a-z0-9-]+$/i);
  const req = new HttpRequest('POST', '/proposals/123/assign/456', null);
  const result = typeof mock.body === 'function' ? mock.body(req, null) : mock.body;

  expect(result).toHaveProperty('id');
});

it('should return an id when assigning an organization to a prescription', () => {
  const mock = findMockByUrl(/\/prescriptions\/[a-z0-9-]+\/assignOrganization\/[a-z0-9-]+$/i);
  const req = new HttpRequest('POST', '/prescriptions/123/assignOrganization/456', null);
  const result = typeof mock.body === 'function' ? mock.body(req, null) : mock.body;

  expect(result).toHaveProperty('id');
});

it('should return an id when assigning an organization to a proposal', () => {
  const mock = findMockByUrl(/\/proposals\/[a-z0-9-]+\/assignOrganization\/[a-z0-9-]+$/i);
  const req = new HttpRequest('POST', '/proposals/123/assignOrganization/456', null);
  const result = typeof mock.body === 'function' ? mock.body(req, null) : mock.body;

  expect(result).toHaveProperty('id');
});

describe('Prescriptions mock', () => {

  it('should return prescription body', () => {
    const mock = findMockByUrl(/\/prescriptions\/[a-z0-9-]+$/i);
    expect(mock.body).toBeDefined();
    expect(typeof mock.body).toBe('object');
  });

  it('should return only OPEN and IN_PROGRESS prescriptions when historical=false', () => {
    const mock = findMockByUrl(/\/prescriptions\/summary/);
    const req = createHttpRequest('/prescriptions/summary', {
      historical: 'false',
      page: '1',
      pageSize: '10',
    });

    const result = mock.handler!(req, null);
    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('total');
    expect(Array.isArray(result.items)).toBe(true);

    result.items.forEach((p: any) => {
      expect(['OPEN', 'IN_PROGRESS']).toContain(p.status);
    });
  });

  it('should paginate the results correctly', () => {
    const mock = findMockByUrl(/\/prescriptions\/summary/);
    const req = createHttpRequest('/prescriptions/summary', {
      historical: 'true',
      page: '2',
      pageSize: '5',
    });

    const result = mock.handler!(req, null);

    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('total');
    expect(result.items.length).toBeLessThanOrEqual(5);
    expect(result.total).toBeGreaterThanOrEqual(result.items.length);
  });
});

describe('Proposals mock', () => {


  it('should return proposal body', () => {
    const mock = findMockByUrl(/\/proposals\/[a-z0-9-]+$/i);
    expect(mock.body).toBeDefined();
    expect(typeof mock.body).toBe('object');
  });

  it('should filter out non-OPEN/IN_PROGRESS proposals when historical=false', () => {
    const mock = findMockByUrl(/\/proposals\/summary/);
    const req = createHttpRequest('/proposals/summary', {
      historical: 'false',
      page: '1',
      pageSize: '10',
    });

    const result = mock.handler!(req, null);

    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('total');
    expect(Array.isArray(result.items)).toBe(true);

    result.items.forEach((p: any) => {
      expect(['OPEN', 'IN_PROGRESS']).toContain(p.status);
    });
  });

  it('should apply pagination based on page and pageSize', () => {
    const mock = findMockByUrl(/\/proposals\/summary/);
    const req = createHttpRequest('/proposals/summary', {
      historical: 'true',
      page: '3',
      pageSize: '2',
    });

    const result = mock.handler!(req, null);

    expect(result.items.length).toBeLessThanOrEqual(2);
    expect(result.total).toBeGreaterThanOrEqual(result.items.length);
  });
});
