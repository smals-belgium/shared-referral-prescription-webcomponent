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

describe('Prescriptions  summary mock', () => {
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

describe('Proposals summary mock', () => {
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

