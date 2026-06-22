import { TestBed } from '@angular/core/testing';
import { RequestProfessionalDataService } from '@reuse/code/services/helpers/request-professional-data.service';
import { HealthcareProviderService } from '@reuse/code/services/api/healthcareProvider.service';
import { provideHttpClient } from '@angular/common/http';
import { SearchProfessionalCriteria } from '@reuse/code/interfaces';
import { HealthcareProResource, ProviderType } from '@reuse/code/openapi';
import { of, skip, throwError } from 'rxjs';
import { take } from 'rxjs/operators';

const mockCriteria: SearchProfessionalCriteria = {
  query: 'doctor',
  zipCodes: [75001],
  disciplines: ['cardiology'],
  prescriptionId: 'rx-1',
  intent: 'search',
  providerType: ProviderType.Professional,
};

const mockProfessional: HealthcareProResource[] = [
  {
    id: { ssin: 'ssin-123' },
    type: ProviderType.Professional,
    healthcarePerson: { firstName: 'John Doe' },
  },
];

const mockProfessional2: HealthcareProResource[] = [
  {
    id: { ssin: 'ssin-245' },
    type: ProviderType.Professional,
    healthcarePerson: { firstName: 'Jane Doe' },
  },
];

describe('RequestProfessionalDataService', () => {
  let service: RequestProfessionalDataService;
  let healthcareProviderService: jest.Mocked<any>;

  beforeEach(() => {
    const mockService = {
      findAll: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        RequestProfessionalDataService,
        { provide: HealthcareProviderService, useValue: mockService },
      ],
    });

    service = TestBed.inject(RequestProfessionalDataService);
    healthcareProviderService = TestBed.inject(HealthcareProviderService) as any;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initializeDataStream', () => {
    it('should set initial data immediately', done => {
      // We skip(1) to ignore the initial BehaviorSubject value ([])
      service.data$.pipe(skip(1), take(1)).subscribe(data => {
        expect(data).toEqual(mockProfessional);
        done();
      });

      service.initializeDataStream(mockProfessional, mockCriteria);
    });

    it('should call handleStreamError when an error occurs in the stream', () => {
      const error = new Error('Stream failure');
      const handleErrorSpy = jest.spyOn(service as any, 'handleStreamError');

      // Force error on the creation logic
      jest.spyOn(service as any, 'createDataStream').mockReturnValue(throwError(() => error));

      service.initializeDataStream([], mockCriteria);

      expect(handleErrorSpy).toHaveBeenCalledWith(error);
    });
  });

  describe('retryLoad', () => {
    it('should throw INITIAL_RETRY_REQUIRED error when count <= PAGE_SIZE', () => {
      expect(() => service.retryLoad(5)).toThrow('INITIAL_RETRY_REQUIRED');
    });

    it('should call triggerLoad when count > PAGE_SIZE', () => {
      const triggerLoadSpy = jest.spyOn(service, 'triggerLoad');
      service.retryLoad(15);
      expect(triggerLoadSpy).toHaveBeenCalled();
    });
  });

  describe('Data Accumulation (createDataStream)', () => {
    it('should append new data to accumulated data when triggerLoad is called', done => {
      const apiResponse = {
        healthcareProfessionals: mockProfessional2,
        total: 2,
      };

      healthcareProviderService.findAll.mockReturnValue(of(apiResponse));

      service.initializeDataStream(mockProfessional, mockCriteria);

      // Trigger second page load
      service.triggerLoad();

      // Check accumulated results
      service.data$.subscribe(data => {
        if (data.length === 2) {
          expect(data).toEqual([...mockProfessional, ...mockProfessional2]);
          done();
        }
      });
    });
  });

  describe('callServiceMethod', () => {
    it('should forward all criteria fields and increment page by 1', () => {
      healthcareProviderService.findAll.mockReturnValue(of({}));

      service['callServiceMethod'](mockCriteria, 0).subscribe();

      expect(healthcareProviderService.findAll).toHaveBeenCalledWith(
        mockCriteria.query,
        mockCriteria.zipCodes,
        mockCriteria.disciplines,
        [],
        ProviderType.Professional,
        mockCriteria.prescriptionId,
        mockCriteria.intent,
        1,
        10
      );
    });
  });

  describe('reset', () => {
    it('should clear data and set loading to false', done => {
      service.reset();

      service.data$.subscribe(data => {
        expect(data).toEqual([]);
        service.loading$.subscribe(loading => {
          expect(loading).toBe(false);
          done();
        });
      });
    });
  });
});
