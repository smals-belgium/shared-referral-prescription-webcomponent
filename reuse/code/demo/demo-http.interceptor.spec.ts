import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { HttpClientTestingModule, HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptors, HttpErrorResponse } from '@angular/common/http';
import { demoHttpInterceptor } from './demo-http.interceptor';
import { WcConfigurationService } from '@reuse/code/services/config/wc-configuration.service';

describe('DemoHttpInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;

  function setupTestBed(environment: string) {
    (window as any).referralPrescriptionEnv = environment;

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        WcConfigurationService,
        provideHttpClient(withInterceptors([demoHttpInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  }

  afterEach(() => {
    httpMock.verify();
  });

  it('should pass through requests when not in demo mode', async () => {
    setupTestBed('local');

    const responsePromise = firstValueFrom(httpClient.get('/api/test'));
    const req = httpMock.expectOne('/api/test');
    req.flush({ success: true });

    const response = await responsePromise;
    expect(response).toEqual({ success: true });
  });

  it('should return 501 when mock not found in demo mode', async () => {
    setupTestBed('demo');

    try {
      await firstValueFrom(httpClient.get('/api/unknown-endpoint'));
      fail('Expected an HttpErrorResponse to be thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpErrorResponse);
      const httpError = err as HttpErrorResponse;
      expect(httpError.status).toBe(501);
      expect(httpError.statusText).toBe('Demo mock not found');
      httpMock.expectNone('/api/unknown-endpoint');
    }
  });

  it('should return mock data when mock found in demo mode', async () => {
    setupTestBed('demo');

    const response = await firstValueFrom(httpClient.get('/accessMatrix'));

    expect(response).toBeDefined();
    expect(typeof response).toBe('object');
    httpMock.expectNone('/accessMatrix');
  });
});
