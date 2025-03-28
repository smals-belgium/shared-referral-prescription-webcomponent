import {inject} from '@angular/core';
import {HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest} from '@angular/common/http';
import {mergeMap, Observable} from 'rxjs';
import {AuthService} from './auth.service';
import {ConfigurationService} from './configuration.service';
import { Buffer } from 'buffer';

export const apiUrlInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const configService = inject(ConfigurationService);
  const authService = inject(AuthService);
  const exchangeToClientId = configService.getEnvironmentVariable('fhirGatewayClientId');

  const fhirGatewayUrl = configService.getEnvironmentVariable('fhirGatewayUrl');
  const apiUrl = configService.getEnvironmentVariable('apiUrl');

  if (req.url.includes('assets/')) {
    return next(req);
  }
  if (req.url.includes('pseudo/')) {
    return authService.getAccessToken().pipe(
      mergeMap((accessToken) => next(req.clone({
        url: req.url.startsWith('http') ? req.url : `${apiUrl}${req.url}`,
        headers: req.headers.set('Authorization', `Bearer ${accessToken}`).set('Content-Type', 'application/json; charset=utf-8'),
      })))
    );
  }
  return authService.getAccessToken(exchangeToClientId).pipe(
    mergeMap((accessToken) =>{
      const token = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString());
      const authUrl = token.iss;

      if(req.url.includes(authUrl)) {
        return next(req);
      }

      return next(req.clone({
        url: req.url.startsWith('fhir://')
          ? req.url.replace('fhir:/', fhirGatewayUrl)
          : apiUrl + req.url,
        headers: req.headers.set('Authorization', `Bearer ${accessToken}`),
      }))
    })
  );
}
