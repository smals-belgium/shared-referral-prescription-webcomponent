import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ConfigurationService } from '../services/config/configuration.service';
import { PseudoClient } from './pseudo.client';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

const env: Record<string, any> = {
  enablePseudo: true,
  pseudoApiUrl: 'http://pseudo.com',
};

const mockConfigService = {
  getEnvironmentVariable: jest.fn(key => env[key]),
};

describe('PseudoClient', () => {
  let service: PseudoClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        PseudoClient,
        { provide: ConfigurationService, useValue: mockConfigService },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(PseudoClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  afterAll(() => {
    mockConfigService.getEnvironmentVariable.mockReset();
  });

  it('should get the domain', async () => {
    const responsePromise = service.getDomain('uhmep');

    const req = httpMock.expectOne('http://pseudo.com/domains/uhmep');
    expect(req.request.method).toBe('GET');
    req.flush('domain');
    await expect(responsePromise).resolves.toEqual('domain');
  });

  it('should get the identify', async () => {
    const responsePromise = service.identify('uhmep', 'payload');

    const req = httpMock.expectOne('http://pseudo.com/domains/uhmep/identify');
    expect(req.request.method).toBe('POST');
    req.flush('identify');
    await expect(responsePromise).resolves.toEqual('identify');
  });

  it('should get the identifyMultiple', async () => {
    const responsePromise = service.identifyMultiple('uhmep', 'payload');

    const req = httpMock.expectOne('http://pseudo.com/domains/uhmep/identifyMultiple');
    expect(req.request.method).toBe('POST');
    req.flush('identify');
    await expect(responsePromise).resolves.toEqual('identify');
  });

  it('should get the pseudomize', async () => {
    const responsePromise = service.pseudonymize('uhmep', 'payload');

    const req = httpMock.expectOne('http://pseudo.com/domains/uhmep/pseudonymize');
    expect(req.request.method).toBe('POST');
    req.flush('pseudomize');
    await expect(responsePromise).resolves.toEqual('pseudomize');
  });

  it('should get the pseudomizeMultiple', async () => {
    const responsePromise = service.pseudonymizeMultiple('uhmep', 'payload');

    const req = httpMock.expectOne('http://pseudo.com/domains/uhmep/pseudonymizeMultiple');
    expect(req.request.method).toBe('POST');
    req.flush('pseudomize');
    await expect(responsePromise).resolves.toEqual('pseudomize');
  });
});
