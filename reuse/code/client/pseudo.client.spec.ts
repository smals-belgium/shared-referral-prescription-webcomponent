import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ConfigurationService } from '../services/configuration.service';
import { PseudoClient } from './pseudo.client';
import { PseudonymisationHelper } from '@smals-belgium-shared/pseudo-helper/dist';

const env: Record<string, any> = {
  enablePseudo: true,
  pseudoApiUrl: 'http://pseudo.com'
}

const mockConfigService = {
  getEnvironmentVariable: jest.fn(key => (env)[key])
}

describe('PseudoClient', () => {
    let service: PseudoClient;
    let httpMock: HttpTestingController;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          PseudoClient,
          { provide: ConfigurationService, useValue: mockConfigService }],
      });
      service = TestBed.inject(PseudoClient);
      httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
      httpMock.verify();
    });

  afterAll(() => {
    mockConfigService.getEnvironmentVariable.mockReset()
  })

  it('should get the domain', () => {
    service.getDomain('uhmep').then((response) => {
      expect(response).toEqual("domain");
    });

    const req = httpMock.expectOne('http://pseudo.com/domains/uhmep');
    expect(req.request.method).toBe('GET');
    req.flush("domain");
  })

  it('should get the identify', () => {
    service.identify('uhmep', 'payload').then((response) => {
      expect(response).toEqual("identify");
    });

    const req = httpMock.expectOne('http://pseudo.com/domains/uhmep/identify');
    expect(req.request.method).toBe('POST');
    req.flush("identify");
  })

  it('should get the identifyMultiple', () => {
    service.identifyMultiple('uhmep', 'payload').then((response) => {
      expect(response).toEqual("identify");
    });

    const req = httpMock.expectOne('http://pseudo.com/domains/uhmep/identifyMultiple');
    expect(req.request.method).toBe('POST');
    req.flush("identify");
  })

  it('should get the pseudomize', () => {
    service.pseudonymize('uhmep', 'payload').then((response) => {
      expect(response).toEqual("pseudomize");
    });

    const req = httpMock.expectOne('http://pseudo.com/domains/uhmep/pseudonymize');
    expect(req.request.method).toBe('POST');
    req.flush("pseudomize");
  })

  it('should get the pseudomizeMultiple', () => {
    service.pseudonymizeMultiple('uhmep', 'payload').then((response) => {
      expect(response).toEqual("pseudomize");
    });

    const req = httpMock.expectOne('http://pseudo.com/domains/uhmep/pseudonymizeMultiple');
    expect(req.request.method).toBe('POST');
    req.flush("pseudomize");
  })
})
