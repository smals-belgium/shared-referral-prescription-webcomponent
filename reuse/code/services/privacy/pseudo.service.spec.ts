import { PseudoService } from './pseudo.service';
import { ConfigurationService } from '../config/configuration.service';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PseudonymisationHelper } from '@smals-belgium-shared/pseudo-helper';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

const env: Record<string, any> = {
  enablePseudo: true,
  pseudoApiUrl: 'http://pseudo.com',
};

const mockConfigService = {
  getEnvironmentVariable: jest.fn(key => env[key]),
  getEnvironment: jest.fn(() => 'jest'),
};

const mockValue = {
  pseudonymize: jest.fn(),
};

const mockMultipleValue = {
  pushPoint: jest.fn(),
  pseudonymize: jest.fn(() =>
    mockValue.pseudonymize().then((result: unknown) => ({
      lengthPoints: () => 1,
      getPoint: () => result,
    }))
  ),
};

const mockPseudonymInTransit = {
  identify: jest.fn(),
};

const mockMultiplePseudonymInTransit = {
  pushPoint: jest.fn(),
  identify: jest.fn(() =>
    mockPseudonymInTransit.identify().then((result: unknown) => ({
      lengthPoints: () => 1,
      getPoint: () => result,
    }))
  ),
};

const mockDomain = {
  valueFactory: {
    fromString: jest.fn(() => mockValue),
    multiple: jest.fn(() => mockMultipleValue),
  },
  pseudonymInTransitFactory: {
    fromSec1AndTransitInfo: jest.fn(() => mockPseudonymInTransit),
    multiple: jest.fn(() => mockMultiplePseudonymInTransit),
  },
};

const mockPseudoHelper = {
  createDomain: jest.fn(() => mockDomain),
};

describe('PseudoService', () => {
  let pseudoService: PseudoService;
  let httpMock: HttpTestingController;

  const configureTestingModule = () => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        PseudoService,
        { provide: ConfigurationService, useValue: mockConfigService },
        {
          provide: PseudonymisationHelper,
          useValue: mockPseudoHelper,
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    pseudoService = TestBed.inject(PseudoService);
    httpMock = TestBed.inject(HttpTestingController);
  };

  beforeEach(() => {
    env.enablePseudo = true;
    jest.clearAllMocks();
    mockConfigService.getEnvironmentVariable.mockImplementation(key => env[key]);
    configureTestingModule();
  });

  afterEach(() => {
    httpMock.verify();
  });

  afterAll(() => {
    mockConfigService.getEnvironmentVariable.mockReset();
  });

  it('service should have created successfully', () => {
    expect(pseudoService).toBeTruthy();
    expect(mockConfigService.getEnvironmentVariable).toHaveBeenCalled();
  });

  it('should call the pseudomized client function', async () => {
    const mockResponse = 'pseudomized result';

    mockValue.pseudonymize.mockResolvedValueOnce({ asShortString: () => mockResponse });
    await expect(pseudoService.pseudonymize('123')).resolves.toEqual(mockResponse);

    expect(mockDomain.valueFactory.fromString).toHaveBeenCalledWith('123');
    expect(mockValue.pseudonymize).toHaveBeenCalled();
  });

  it('return value when pseudo is not enabled for pseudomize', async () => {
    TestBed.resetTestingModule();
    env.enablePseudo = false;
    configureTestingModule();

    await expect(pseudoService.pseudonymize('123')).resolves.toEqual('123');
    httpMock.expectNone('http://pseudo.com/domains/uhmep_v1/pseudonymize');
  });

  it('should call the identify client function', async () => {
    const mockResponse = 'ssin';

    mockPseudonymInTransit.identify.mockResolvedValueOnce({ asString: () => mockResponse });

    const sec1 =
      'BAF1ncUFJahnSmnejBbenW7WFrC-YV-DnTenET-wuqfzls9fFq9bQ0PWLobWex7sSV_Gf_PzyG1xqGnhv1sXNTIC8QAyjtOCFbIesQtHGpw-hb26XtuLTZOBmH9dV3qDiVvUveOlWCrv_yp_gYudS7zi0ludPlylVdYgDGDbEUSCzKAnHw:eyJhdWQiOiJ1aG1lcF92MSIsImVuYyI6IkEyNTZHQ00iLCJleHAiOjE3MjY1NTc4NTgsImlhdCI6MTcyNjU1NzI1OCwiYWxnIjoiZGlyIiwia2lkIjoiYWMwNWIzMjktMzhhOS00NTE0LThlMGMtMjI0NTcyOTI4ZWI5In0..0Flm2GNKaEeYXTIx.VdBxZdgsUz70wZBqEOZEpr91cpmkFBWbZ7jNi44o20FEnn1n6CPqJxM9Wx667LPC5AhBB0Fe1l1PeyB6BNQugUGP8V2DMREuPVxAh7ZEDCEQplMyHEQKAj-JLwV6ksoXqgoOyCh7W9zmCTaEXsfXcjgVF4SeQfejudCMk05z51iWvxrtnMP-.X9oXqrX_M6qHUwPD3afHBA';
    await expect(pseudoService.identify(sec1)).resolves.toEqual(mockResponse);
    expect(mockDomain.pseudonymInTransitFactory.fromSec1AndTransitInfo).toHaveBeenCalledWith(sec1);
  });

  it('should NOT call the identify endpoint when value is not sec1', async () => {
    const falseSec1 = '123';
    mockDomain.pseudonymInTransitFactory.fromSec1AndTransitInfo.mockImplementationOnce(() => {
      throw new Error(
        'Missing `:` in the pseudonym in transit string. Format must be {sec1InBase64Url}:{transitInfoInBase64Url}'
      );
    });

    await expect(pseudoService.identify(falseSec1)).rejects.toThrow(
      'Missing `:` in the pseudonym in transit string. Format must be {sec1InBase64Url}:{transitInfoInBase64Url}'
    );
    httpMock.expectNone('http://pseudo.com/domains/uhmep_v1/identify');
  });

  it('return value when pseudo is not enabled for identify', async () => {
    TestBed.resetTestingModule();
    env.enablePseudo = false;
    configureTestingModule();

    await expect(pseudoService.identify('123')).resolves.toEqual('123');
    httpMock.expectNone('http://pseudo.com/domains/uhmep_v1/identify');
  });
});
