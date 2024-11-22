import { PseudoService } from './pseudo.service';
import { ConfigurationService } from './configuration.service';
import {HttpClientTestingModule, HttpTestingController} from "@angular/common/http/testing";
import {TestBed} from "@angular/core/testing";
import { PseudonymisationHelper } from '@smals-belgium-shared/pseudo-helper/dist';

const env: Record<string, any> = {
  enablePseudo: true,
  pseudoApiUrl: 'http://pseudo.com'
}

const mockConfigService = {
  getEnvironmentVariable: jest.fn(key => (env)[key])
}

const mockPseudoClient = {
  getDomain: jest.fn(),
  identify: jest.fn(),
  identifyMultiple: jest.fn(),
  pseudonymize: jest.fn(),
  pseudonymizeMultiple: jest.fn()
}

function MockPseudoHelperFactory() { return new PseudonymisationHelper(mockPseudoClient) }

describe('PseudoService', () => {
  let pseudoService: PseudoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PseudoService, { provide: ConfigurationService, useValue: mockConfigService },
        {provide: PseudonymisationHelper, useValue: MockPseudoHelperFactory()}],
    });
    pseudoService = TestBed.inject(PseudoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  afterAll(() => {
    mockConfigService.getEnvironmentVariable.mockReset()
  })

  it('service should have created successfully', () => {
    expect(pseudoService).toBeTruthy();
    expect(mockConfigService.getEnvironmentVariable).toHaveBeenCalled()
  });

  it('should call the pseudomized client function', () => {
    const mockResponse = 'pseudomized result';

    mockPseudoClient.pseudonymize.mockImplementationOnce(() => mockResponse)
    pseudoService.pseudonymize("123").then((response) => {
      expect(response).toEqual(mockResponse);
    });

    expect(mockPseudoClient.pseudonymize).toHaveBeenCalled()
  });

  it('return value when pseudo is not enabled for pseudomize', () => {
    mockConfigService.getEnvironmentVariable.mockImplementationOnce(() => false)

    pseudoService.pseudonymize("123").then((response) => {
      expect(response).toEqual("123");
    });
    httpMock.expectNone('http://pseudo.com/domains/uhmep_v1/pseudonymize');
  });

  it('should call the identify client function', () => {
    const mockResponse = 'ssin';

    mockPseudoClient.identify.mockImplementationOnce(() => mockResponse)

    const sec1 = "BAF1ncUFJahnSmnejBbenW7WFrC-YV-DnTenET-wuqfzls9fFq9bQ0PWLobWex7sSV_Gf_PzyG1xqGnhv1sXNTIC8QAyjtOCFbIesQtHGpw-hb26XtuLTZOBmH9dV3qDiVvUveOlWCrv_yp_gYudS7zi0ludPlylVdYgDGDbEUSCzKAnHw:eyJhdWQiOiJ1aG1lcF92MSIsImVuYyI6IkEyNTZHQ00iLCJleHAiOjE3MjY1NTc4NTgsImlhdCI6MTcyNjU1NzI1OCwiYWxnIjoiZGlyIiwia2lkIjoiYWMwNWIzMjktMzhhOS00NTE0LThlMGMtMjI0NTcyOTI4ZWI5In0..0Flm2GNKaEeYXTIx.VdBxZdgsUz70wZBqEOZEpr91cpmkFBWbZ7jNi44o20FEnn1n6CPqJxM9Wx667LPC5AhBB0Fe1l1PeyB6BNQugUGP8V2DMREuPVxAh7ZEDCEQplMyHEQKAj-JLwV6ksoXqgoOyCh7W9zmCTaEXsfXcjgVF4SeQfejudCMk05z51iWvxrtnMP-.X9oXqrX_M6qHUwPD3afHBA"
    pseudoService.identify(sec1).then((response) => {
      expect(response).toEqual(mockResponse);
    });
  });

  it('should NOT call the identify endpoint when value is not sec1', async () => {
    const falseSec1 = "123"
    await expect(pseudoService.identify(falseSec1)).rejects.toThrow(
      "Missing `:` in the pseudonym in transit string. Format must be {sec1InBase64Url}:{transitInfoInBase64Url}",
    );
    httpMock.expectNone('http://pseudo.com/domains/uhmep_v1/identify');
  });

  it('return value when pseudo is not enabled for identify', () => {
    mockConfigService.getEnvironmentVariable.mockImplementationOnce(() => false)

    pseudoService.identify("123").then((response) => {
      expect(response).toEqual("123");
    });
    httpMock.expectNone('http://pseudo.com/domains/uhmep_v1/identify');
  });
});
