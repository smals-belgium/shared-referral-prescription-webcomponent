import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { USER_PROFILE_CLAIM_KEY } from '@reuse/code/services/auth/auth-constants';
import { impersonationHeaderInterceptor } from './impersonation-header.interceptor';
import { ConfigurationService } from '@reuse/code/services/config/configuration.service';

const organizationClaims = {
  [USER_PROFILE_CLAIM_KEY]: {
    ssin: '80222700153',
  },
};

const patientClaims = {
  [USER_PROFILE_CLAIM_KEY]: {
    ssin: '80222700153',
    firstName: 'Jane',
    lastName: 'Doe',
  },
};

const API_URL = 'http://localhost:3000/api';

describe('impersonationHeaderInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let mockAuthService: Pick<jest.Mocked<AuthService>, 'isOrganization' | 'getClaims' | 'discipline'>;
  let mockConfigurationService: Pick<jest.Mocked<ConfigurationService>, 'getEnvironmentVariable'>;

  beforeEach(() => {
    mockAuthService = {
      isOrganization: jest.fn(),
      getClaims: jest.fn(),
      discipline: jest.fn(),
    };

    mockConfigurationService = {
      getEnvironmentVariable: jest.fn().mockReturnValue(API_URL),
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigurationService, useValue: mockConfigurationService },
        provideHttpClient(withInterceptors([impersonationHeaderInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    jest.clearAllMocks();
  });

  it('should add the impersonation context header when user is organization', async () => {
    mockAuthService.isOrganization.mockReturnValue(of(true));
    mockAuthService.getClaims.mockReturnValue(of(organizationClaims as never));
    mockAuthService.discipline.mockReturnValue(of('PHYSICIAN'));

    const responsePromise = firstValueFrom(httpClient.get(`${API_URL}/api/test`));
    const req = httpMock.expectOne(`${API_URL}/api/test`);

    expect(req.request.headers.has('X-Impersonation-Context')).toBe(true);
    expect(req.request.headers.get('X-Impersonation-Context')).toBe(
      btoa(JSON.stringify({ ssin: '80222700153', discipline: 'PHYSICIAN' }))
    );

    req.flush({ ok: true });
    await responsePromise;

    expect(mockAuthService.isOrganization).toHaveBeenCalledTimes(1);
    expect(mockAuthService.getClaims).toHaveBeenCalledTimes(1);
    expect(mockAuthService.discipline).toHaveBeenCalledTimes(1);
  });

  it('should not add the impersonation context header for non-organization users', async () => {
    mockAuthService.isOrganization.mockReturnValue(of(false));
    mockAuthService.getClaims.mockReturnValue(of(patientClaims as never));

    const responsePromise = firstValueFrom(httpClient.get(`${API_URL}/api/test`));
    const req = httpMock.expectOne(`${API_URL}/api/test`);

    expect(req.request.headers.has('X-Impersonation-Context')).toBe(false);

    req.flush({ ok: true });
    await responsePromise;

    expect(mockAuthService.isOrganization).toHaveBeenCalledTimes(1);
    expect(mockAuthService.getClaims).not.toHaveBeenCalled();
    expect(mockAuthService.discipline).not.toHaveBeenCalled();
  });

  it('should handle different discipline types', async () => {
    mockAuthService.isOrganization.mockReturnValue(of(true));
    mockAuthService.getClaims.mockReturnValue(of(organizationClaims as never));
    mockAuthService.discipline.mockReturnValue(of('NURSE'));

    const responsePromise = firstValueFrom(httpClient.get(`${API_URL}/api/test`));
    const req = httpMock.expectOne(`${API_URL}/api/test`);

    expect(req.request.headers.has('X-Impersonation-Context')).toBe(true);
    expect(req.request.headers.get('X-Impersonation-Context')).toBe(
      btoa(JSON.stringify({ ssin: '80222700153', discipline: 'NURSE' }))
    );

    req.flush({ ok: true });
    await responsePromise;
  });

  it('should not add impersonation header to pseudo API endpoints', async () => {
    mockAuthService.isOrganization.mockReturnValue(of(true));
    mockAuthService.getClaims.mockReturnValue(of(organizationClaims as never));
    mockAuthService.discipline.mockReturnValue(of('PHYSICIAN'));

    const responsePromise = firstValueFrom(
      httpClient.post('https://pseudo-url/pseudo/v1/domains/test/pseudonymize', {})
    );
    const req = httpMock.expectOne('https://pseudo-url/pseudo/v1/domains/test/pseudonymize');

    expect(req.request.headers.has('X-Impersonation-Context')).toBe(false);

    req.flush({ ok: true });
    await responsePromise;

    expect(mockAuthService.isOrganization).not.toHaveBeenCalled();
    expect(mockAuthService.getClaims).not.toHaveBeenCalled();
    expect(mockAuthService.discipline).not.toHaveBeenCalled();
  });
});
