import { inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { DEMO_MOCKS, HttpMethod } from '@reuse/code/demo/mocks/mock-registry';
import { WcConfigurationService } from '@reuse/code/services/config/wc-configuration.service';

interface Body {
  patientIdentifier?: string;
  identifiedValue?: number[];
  [key: string]: unknown;
}

export const demoHttpInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const config = inject(WcConfigurationService);

  const isDemoMode = config.getEnvironment() === 'demo';
  if (!isDemoMode || req.url.includes('assets/i18n/')) {
    return next(req);
  }

  const urlWithoutParams = req.url.split('?')[0];
  const shortCodeUrl = /\/prescription\?ssin=[^&]+&shortCode=[^&]+$/i.test(req.urlWithParams);

  // Find matching mock
  const matches = DEMO_MOCKS.filter(m => {
    const methodMatch = m.method.includes(req.method as HttpMethod);
    const urlMatch = shortCodeUrl ? m.url.test(req.urlWithParams) : m.url.test(urlWithoutParams);
    return methodMatch && urlMatch;
  });

  const match = matches.sort((a, b) => {
    const lengthDiff = b.url.toString().length - a.url.toString().length;
    if (lengthDiff !== 0) return lengthDiff;
    return DEMO_MOCKS.indexOf(a) - DEMO_MOCKS.indexOf(b);
  })[0];

  if (!match) {
    return throwError(
      () =>
        new HttpErrorResponse({
          status: 501,
          statusText: 'Demo mock not found',
          url: req.url,
          error: {
            message: `Demo mock not found for: ${req.url}`,
            availablePatterns: DEMO_MOCKS.map(m => m.url.toString()),
          },
        })
    );
  }

  type BodyOrFunction = Body | ((matchResult: RegExpMatchArray | null) => Body);

  let body = (match.body ?? {}) as BodyOrFunction;

  const matchResult = shortCodeUrl ? req.urlWithParams.match(match.url) : urlWithoutParams.match(match.url);

  try {
    if (match.handler) {
      body = match.handler(req, matchResult) as Body;
    } else if (typeof body === 'function') {
      body = body(matchResult);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return throwError(
      () =>
        new HttpErrorResponse({
          status: 500,
          statusText: 'Mock handler error',
          url: req.url,
          error: { message: `Error in mock handler: ${message}` },
        })
    );
  }

  // Convert identifiedValue array to Uint8Array if needed
  if (Array.isArray(body.identifiedValue)) {
    body = new Uint8Array(body.identifiedValue) as unknown as Body;
  }

  return of(new HttpResponse({ status: match.status ?? 200, body }));
};
