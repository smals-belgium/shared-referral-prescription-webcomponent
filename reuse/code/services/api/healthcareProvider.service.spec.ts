import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { HealthcareProviderService } from './healthcareProvider.service';
import { HealthCareProviderService as ApiHealthCareProviderService, ProviderType } from '@reuse/code/openapi';

describe('HealthcareProviderService', () => {
  let service: HealthcareProviderService;
  let apiMock: jest.Mocked<ApiHealthCareProviderService>;

  beforeEach(() => {
    apiMock = {
      findHealthCareProviders: jest.fn(),
    } as unknown as jest.Mocked<ApiHealthCareProviderService>;

    TestBed.configureTestingModule({
      providers: [HealthcareProviderService, { provide: ApiHealthCareProviderService, useValue: apiMock }],
    });

    service = TestBed.inject(HealthcareProviderService);
  });

  it('should call API with mapped zip codes and default providerType', () => {
    apiMock.findHealthCareProviders.mockReturnValue(of({} as any));

    service.findAll('dentist', [12345, 67890], ['CARDIO']);

    expect(apiMock.findHealthCareProviders).toHaveBeenCalledWith(
      undefined,
      'dentist',
      ['12345', '67890'], // mapped to string
      ProviderType.All, // default value
      ['CARDIO'],
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    );
  });

  it('should pass all parameters correctly when provided', () => {
    apiMock.findHealthCareProviders.mockReturnValue(of({} as any));

    service.findAll(
      'dentist',
      [12345],
      ['CARDIO'],
      ['HOSPITAL'],
      ProviderType.Professional,
      'presc-1',
      'search',
      1,
      20
    );

    expect(apiMock.findHealthCareProviders).toHaveBeenCalledWith(
      undefined,
      'dentist',
      ['12345'],
      ProviderType.Professional,
      ['CARDIO'],
      ['HOSPITAL'],
      'presc-1',
      'search',
      1,
      20
    );
  });

  it('should pass undefined for disciplines when null', () => {
    apiMock.findHealthCareProviders.mockReturnValue(of({} as any));

    service.findAll('dentist', [12345], null as any);

    expect(apiMock.findHealthCareProviders).toHaveBeenCalledWith(
      undefined,
      'dentist',
      ['12345'],
      ProviderType.All,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    );
  });
});
