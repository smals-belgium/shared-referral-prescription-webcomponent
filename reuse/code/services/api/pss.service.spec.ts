import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpParams } from '@angular/common/http';
import { PssService } from './pss.service';
import { PssService as ApiPssService, ControlRequest } from '@reuse/code/openapi';
import { AutocompleteOption } from '@smals/vas-evaluation-form-ui-core';
import { of, skip } from 'rxjs';

describe('PssService', () => {
  let service: PssService;
  let apiPssServiceMock: any;
  let httpClientMock: any;
  let sessionStorageMock: any;

  beforeEach(() => {
    sessionStorageMock = {
      setItem: jest.fn(),
      getItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };

    Object.defineProperty(window, 'sessionStorage', {
      value: sessionStorageMock,
      writable: true,
    });

    apiPssServiceMock = {
      findAllIndicationsRadiology: jest.fn().mockReturnValue(of([])),
      findAllProcedures: jest.fn().mockReturnValue(of([])),
      checkStatusRadiology: jest.fn().mockReturnValue(of({})),
      control: jest.fn().mockReturnValue(of({})),
      controlByPssExchangeId: jest.fn().mockReturnValue(of({})),
    };

    httpClientMock = {
      get: jest.fn().mockReturnValue(of([])),
    };

    TestBed.configureTestingModule({
      providers: [
        PssService,
        { provide: ApiPssService, useValue: apiPssServiceMock },
        { provide: HttpClient, useValue: httpClientMock },
      ],
    });

    service = TestBed.inject(PssService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('status$', () => {
    it('should initialize status$ with false', () => {
      expect(service.status$.getValue()).toBe(false);
    });

    it('should get status from BehaviorSubject', () => {
      service.status$.next(true);
      expect(service.getStatus()).toBe(true);
    });

    it('should emit the new status after setStatus(false)', (done) => {
      service.status$.pipe(skip(1)).subscribe(value => {
        expect(value).toBe(false);
        done();
      });

      service.setStatus(false);
    });

    it('should get status immediately after setStatus', () => {
      service.setStatus(true);
      expect(service.getStatus()).toBe(true);
    });
  });

  describe('sessionStorage management', () => {
    it('should set pssSessionId in sessionStorage', () => {
      const sessionId = 'session-123';
      service.setPssSessionId(sessionId);
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith('pssSessionId', sessionId);
    });

    it('should get pssSessionId from sessionStorage', () => {
      const sessionId = 'session-456';
      sessionStorageMock.getItem.mockReturnValue(sessionId);

      const result = service.getPssSessionId();
      expect(sessionStorageMock.getItem).toHaveBeenCalledWith('pssSessionId');
      expect(result).toBe(sessionId);
    });

    it('should return null when pssSessionId does not exist', () => {
      sessionStorageMock.getItem.mockReturnValue(null);
      expect(service.getPssSessionId()).toBeNull();
    });

    it('should preserve sessionId after multiple operations', () => {
      const sessionId = 'final-session';

      service.setPssSessionId('initial-session');
      service.setPssSessionId(sessionId);

      sessionStorageMock.getItem.mockReturnValue(sessionId);
      expect(service.getPssSessionId()).toBe(sessionId);
    });
  });

  describe('geDefault', () => {
    it('should return observable from geDefault', (done) => {
      const url = 'http://example.com/api';
      const params = new HttpParams();
      const mockResponse: AutocompleteOption[] = [{ label: 'Option 1', value: '1' }] as any;

      httpClientMock.get.mockReturnValue(of(mockResponse));

      service.geDefault(url, params).subscribe(result => {
        expect(result).toEqual(mockResponse);
        done();
      });
    });
  });

  describe('PSS API calls', () => {
    it('should call api.control with ControlRequest', () => {
      const controlRequest: ControlRequest = { id: '123' } as any;
      service.getPssRecommendations(controlRequest);
      expect(apiPssServiceMock.control).toHaveBeenCalledWith(controlRequest);
    });

    it('should call api.controlByPssExchangeId with exchangeId', () => {
      const exchangeId = 'exchange-789';
      service.getPssRecommendationsByExchangeId(exchangeId);
      expect(apiPssServiceMock.controlByPssExchangeId).toHaveBeenCalledWith(exchangeId);
    });
  });

  describe('Radiology API calls', () => {
    it('should call api.findAllIndicationsRadiology with params', () => {
      const params = ['param1', 'param2'];
      service.getIndications(params);
      expect(apiPssServiceMock.findAllIndicationsRadiology).toHaveBeenCalledWith(params);
    });

    it('should call api.findAllProcedures with params', () => {
      const params = 'procedure-123';
      service.getIntentions(params);
      expect(apiPssServiceMock.findAllProcedures).toHaveBeenCalledWith(params);
    });
  });
});
