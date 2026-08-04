import { TestBed } from '@angular/core/testing';
import { HttpContext, HttpErrorResponse, HttpRequest, HttpResponse, HttpHandlerFn } from '@angular/common/http';
import { lastValueFrom, of, throwError } from 'rxjs';
import { globalErrorInterceptor } from './global-error.interceptor';
import { ApiErrorService } from '../services/helpers/api-error.service';
import { AlertService } from '../services/helpers/alert.service';
import { SKIP_ERROR_HANDLING } from '../constants/error';

describe('globalErrorInterceptor', () => {
  let apiErrorService: jest.Mocked<ApiErrorService>;
  let alertService: jest.Mocked<AlertService>;

  beforeEach(() => {
    apiErrorService = { resolve: jest.fn() } as unknown as jest.Mocked<ApiErrorService>;
    alertService = { showCurrentActiveAlert: jest.fn() } as unknown as jest.Mocked<AlertService>;

    TestBed.configureTestingModule({
      providers: [
        { provide: ApiErrorService, useValue: apiErrorService },
        { provide: AlertService, useValue: alertService },
      ],
    });
  });

  function runInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
    return TestBed.runInInjectionContext(() => globalErrorInterceptor(req, next));
  }

  it('should resolve the error and show it in the active alert when a request fails', async () => {
    const resolved = { message: 'errors.api.unknown', severity: 'error', dismissible: true, retry: false };
    apiErrorService.resolve.mockReturnValue(resolved as any);

    const httpError = new HttpErrorResponse({ status: 500, error: { code: 'BOOM' } });
    const req = new HttpRequest('POST', '/api/request', { id: 1 });
    const next: HttpHandlerFn = () => throwError(() => httpError);

    await expect(lastValueFrom(runInterceptor(req, next))).rejects.toBe(httpError);

    expect(apiErrorService.resolve).toHaveBeenCalledWith(httpError, { id: 1 });
    expect(alertService.showCurrentActiveAlert).toHaveBeenCalledWith(resolved);
  });

  it('should skip alert display when SKIP_ERROR_HANDLING is set on the request context', async () => {
    const httpError = new HttpErrorResponse({ status: 500 });
    const context = new HttpContext().set(SKIP_ERROR_HANDLING, true);
    const req = new HttpRequest('GET', '/api/silent', null, { context });
    const next: HttpHandlerFn = () => throwError(() => httpError);

    await expect(lastValueFrom(runInterceptor(req, next))).rejects.toBe(httpError);

    expect(apiErrorService.resolve).not.toHaveBeenCalled();
    expect(alertService.showCurrentActiveAlert).not.toHaveBeenCalled();
  });

  it('should pass successful responses through untouched', async () => {
    const response = new HttpResponse({ status: 200, body: { ok: true } });
    const req = new HttpRequest('GET', '/api/ok');
    const next: HttpHandlerFn = () => of(response);

    await expect(lastValueFrom(runInterceptor(req, next))).resolves.toBe(response);

    expect(apiErrorService.resolve).not.toHaveBeenCalled();
    expect(alertService.showCurrentActiveAlert).not.toHaveBeenCalled();
  });
});
