import { inject } from '@angular/core';
import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { filter, mergeMap, Observable } from 'rxjs';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { ConfigurationService } from '@reuse/code/services/config/configuration.service';
import { Buffer } from 'buffer';
import { AccessToken } from '../interfaces';

export const apiUrlInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const configService = inject(ConfigurationService);
  const authService = inject(AuthService);
  const currentEnv = configService.getEnvironment();

  const exchangeToClientId = configService.getEnvironmentVariable('fhirGatewayClientId') as string;
  const fhirGatewayUrl = configService.getEnvironmentVariable('fhirGatewayUrl') as string;

  if (req.url.includes('assets/') || currentEnv === 'demo') {
    return next(req);
  }
  if (req.url.includes('pseudo/')) {
    return authService.getAccessToken().pipe(
      mergeMap(accessToken =>
        next(
          req.clone({
            url: req.url,
            headers: req.headers
              .set('Authorization', `Bearer ${accessToken}`)
              .set('Content-Type', 'application/json; charset=utf-8'),
          })
        )
      )
    );
  }
  return authService.getAccessToken(exchangeToClientId).pipe(
    filter(token => token !== null),
    mergeMap(accessToken => {
      const token = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString()) as AccessToken;
      const authUrl = token.iss;

      if (req.url.includes(authUrl)) {
        return next(req);
      }

      return next(
        req.clone({
          url: req.url.startsWith('fhir://') ? req.url.replace('fhir:/', fhirGatewayUrl) : req.url,
          headers: req.headers.set('Authorization', `Bearer ${accessToken}`),
        })
      );
    })
  );
};
