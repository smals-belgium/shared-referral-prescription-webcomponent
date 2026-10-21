import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpParams } from '@angular/common/http';
import { PssService } from './pss.service';
import {
  PssService as ApiPssService,
  CodedValueItem,
  ControlRequest,
  RequestIndicationsRadiology,
  LanguageCode,
} from '@reuse/code/openapi';
import { AutocompleteOption } from '@smals-belgium-shared/vas-evaluation-form-ui-core';
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

    it('should emit the new status after setStatus(false)', done => {
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

  describe('geDefault', () => {
    it('should return observable from geDefault', done => {
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

  describe('Radiology API calls', () => {
    it('should call api.findAllIndicationsRadiology with params', () => {
      const codedValueItem1: CodedValueItem = {
        system: 'snomed',
        code: 'param1',
      };
      const codedValueItem2: CodedValueItem = {
        system: 'snomed',
        code: 'param2',
      };

      const params: RequestIndicationsRadiology = {
        age: 30,
        gender: 'female',
        indicationProposal: [codedValueItem1, codedValueItem2],
        intention: codedValueItem1,
      };
      service.getIndications(params);
      expect(apiPssServiceMock.findAllIndicationsRadiology).toHaveBeenCalledWith(params);
    });
  });
});
