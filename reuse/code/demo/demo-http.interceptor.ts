import { inject } from '@angular/core';
import {
    HttpErrorResponse,
    HttpEvent,
    HttpHandlerFn,
    HttpInterceptorFn,
    HttpRequest,
    HttpResponse
} from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { DEMO_MOCKS, HttpMethod } from '@reuse/code/demo/mocks/mock-registry';
import { WcConfigurationService } from '@reuse/code/services/config/wc-configuration.service';

export const demoHttpInterceptor: HttpInterceptorFn = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
    const config = inject(WcConfigurationService);

    if (config.getEnvironment() !== 'demo' || req.url.includes('assets/i18n/')) {
        return next(req);
    }

    const cleanUrl = req.url.split('?')[0];
    const match = DEMO_MOCKS.find(m =>
        m.method.includes(req.method as HttpMethod) && m.url.test(cleanUrl)
    );

    if (!match) {
        return throwError(() => new HttpErrorResponse({
            status: 501,
            statusText: 'Mock not found',
            url: req.url
        }));
    }

    const body = match.handler
        ? match.handler(req, cleanUrl.match(match.url))
        : match.body;

    return of(new HttpResponse({ status: match.status ?? 200, body }));
};
