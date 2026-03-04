import { fakeAsync, flush, TestBed } from '@angular/core/testing';
import { RequestProfessionalDataService } from '@reuse/code/services/helpers/request-professional-data.service';
import { HealthcareProviderService } from '@reuse/code/services/api/healthcareProvider.service';
import { provideHttpClient } from '@angular/common/http';
import { DeviceService } from '@reuse/code/services/helpers/device.service';
import { SearchProfessionalCriteria } from '@reuse/code/interfaces';
import { HealthcareOrganizationResource, HealthcareProResource, ProviderType } from '@reuse/code/openapi';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

const mockCriteria: SearchProfessionalCriteria = {
  query: 'doctor',
  zipCodes: [75001],
  disciplines: ['cardiology'],
  prescriptionId: 'rx-1',
  intent: 'search',
  providerType: 'PROFESSIONAL',
};

const mockProfessional: HealthcareProResource[] = [
  {
    id: { ssin: 'ssin-123' },
    type: 'Professional',
    healthcarePerson: { firstName: 'John Doe' },
  },
];

const mockOrganization: HealthcareOrganizationResource[] = [
  {
    id: { organizationId: 'organizationid-1' },
    cbe: 'test-cbe',
  },
];

const mockApiResponse = ({
  professionals = [],
  organizations = [],
  total = professionals.length + organizations.length,
}: {
  professionals?: HealthcareProResource[];
  organizations?: HealthcareOrganizationResource[];
  total?: number;
} = {}) => ({
  healthcareProfessionals: professionals,
  healthcareOrganizations: organizations,
  total,
});

const mockHealthcareProviderService = {
  findAll: jest.fn(),
};

const mockDeviceService = {
  isDesktop: signal(false),
};

describe('RequestProfessionalDataService', () => {
  let service: RequestProfessionalDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        RequestProfessionalDataService,
        { provide: DeviceService, useValue: mockDeviceService },
        { provide: HealthcareProviderService, useValue: mockHealthcareProviderService },
      ],
    });

    service = TestBed.inject(RequestProfessionalDataService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initializeCardsDataStream', () => {
    it('should set initial data immediately and subscribe to the cards stream', () => {
      const dataSpy = jest.spyOn(service['_data'], 'set');

      service.initializeCardsDataStream(mockProfessional, mockCriteria);

      expect(dataSpy).toHaveBeenCalledTimes(2);
      expect(service.data()).toEqual(mockProfessional);
    });

    it('should call handleStreamError when an error occurs', () => {
      const error = new Error('Stream failure');

      const handleErrorSpy = jest.spyOn(service as any, 'handleStreamError');

      jest.spyOn(service as any, 'createCardsDataStream').mockReturnValue(throwError(() => error));

      service.initializeCardsDataStream([], {} as any);

      expect(handleErrorSpy).toHaveBeenCalledTimes(1);
      expect(handleErrorSpy).toHaveBeenCalledWith(error);
    });
  });

  describe('initializeTableDataStream', () => {
    it('should fetch all pages sequentially until the total count is reached', () => {
      const mockData = { data: mockOrganization, total: 2 };

      service.initializeTableDataStream(mockData, mockCriteria);

      expect(service.data().length).toBeGreaterThanOrEqual(1);
      expect(mockHealthcareProviderService.findAll).toHaveBeenCalled();
    });

    it('should call handleStreamError when an error occurs', () => {
      const error = new Error('Stream failure');

      const handleErrorSpy = jest.spyOn(service as any, 'handleStreamError');

      jest.spyOn(service as any, 'createTableDataStream').mockReturnValue(throwError(() => error));

      service.initializeTableDataStream({ data: [], total: 0 }, {} as any);

      expect(handleErrorSpy).toHaveBeenCalledTimes(1);
      expect(handleErrorSpy).toHaveBeenCalledWith(error);
    });
  });

  describe('triggerLoad', () => {
    it('should set loading to true and emit with load trigger subject', () => {
      const nextSpy = jest.spyOn(service['loadTrigger'], 'next');

      service.triggerLoad();

      expect(service.loading()).toBe(true);
      expect(nextSpy).toHaveBeenCalled();
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

  describe('createCardsDataStream', () => {});

  describe('fetchRawItems', () => {
    it('should merge healthcareProfessionals and healthcareOrganizations into a single newItems array', done => {
      mockHealthcareProviderService.findAll.mockReturnValue(
        of(mockApiResponse({ professionals: mockProfessional, organizations: mockOrganization, total: 2 }))
      );

      service['fetchRawItems'](1, mockCriteria).subscribe(result => {
        expect(result.newItems).toHaveLength(2);
        expect(result.total).toBe(2);
        expect(result.newItems).toEqual([...mockProfessional, ...mockOrganization]);
        done();
      });
    });

    it('should return empty items and reset loading to false when the API call fails', done => {
      mockHealthcareProviderService.findAll.mockReturnValue(throwError(() => new Error('API error')));

      service['fetchRawItems'](1, mockCriteria).subscribe(result => {
        expect(result.newItems).toEqual([]);
        expect(result.total).toBe(0);
        expect(service.loading()).toBe(false);
        done();
      });
    });
  });

  describe('callServiceMethod', () => {
    it('should forward all criteria fields and the correct page number to findAll', () => {
      service['callServiceMethod'](mockCriteria, 0).subscribe();

      expect(mockHealthcareProviderService.findAll).toHaveBeenCalledWith(
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

  describe('createTableDataStream', () => {
    it('should return empty array immediately if total is 0', () => {
      const initialTableData = { data: [], total: 0 };

      service.initializeTableDataStream(initialTableData, mockCriteria);

      expect(service.data()).toEqual([]);
      expect(mockHealthcareProviderService.findAll).not.toHaveBeenCalled();
    });

    it('should expand and load all pages sequentially until total is reached', fakeAsync(() => {
      const initialTableData = {
        data: [{ id: '1' }],
        total: 3,
      } as any;

      const page2Response = {
        healthcareProfessionals: [{ id: '2' }],
        total: 3,
      };
      const page3Response = {
        healthcareProfessionals: [{ id: '3' }],
        total: 3,
      };

      mockHealthcareProviderService.findAll
        .mockReturnValueOnce(of(page2Response))
        .mockReturnValueOnce(of(page3Response));

      service.initializeTableDataStream(initialTableData, mockCriteria);

      flush();

      expect(service.data().length).toBe(3);
      expect(service.data()).toEqual([{ id: '1' }, { id: '2' }, { id: '3' }]);
      expect(mockHealthcareProviderService.findAll).toHaveBeenCalledTimes(2);
    }));
  });

  describe('createCardsDataStream', () => {
    it('should initialize with initial data and append new data on triggerLoad', () => {
      const initialData = [...mockProfessional];
      const apiResponse = mockApiResponse({ organizations: mockOrganization, total: 2 });

      mockHealthcareProviderService.findAll.mockReturnValue(of(apiResponse));

      service.initializeCardsDataStream(initialData, mockCriteria);
      expect(service.data()).toEqual(initialData);

      service.triggerLoad();
      expect(service.data()).toEqual([...mockProfessional, ...mockOrganization]);

      expect(mockHealthcareProviderService.findAll).toHaveBeenCalledWith(
        mockCriteria.query,
        mockCriteria.zipCodes,
        mockCriteria.disciplines,
        [],
        ProviderType.Professional,
        mockCriteria.prescriptionId,
        mockCriteria.intent,
        2,
        10
      );
    });
  });
});
