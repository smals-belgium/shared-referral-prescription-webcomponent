import {inject} from '@angular/core';
import {HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest} from '@angular/common/http';
import {mergeMap, Observable} from 'rxjs';
import {AuthService} from './auth.service';
import {KeycloakConfig} from 'keycloak-js';
import {ConfigurationService} from './configuration.service';

export const apiUrlInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const configService = inject(ConfigurationService);
  const authService = inject(AuthService);
  const keycloak = configService.getEnvironmentVariable('keycloak') as KeycloakConfig;
  const exchangeToClientId = configService.getEnvironmentVariable('fhirGatewayClientId');

  const fhirGatewayUrl = configService.getEnvironmentVariable('fhirGatewayUrl');
  const apiUrl = configService.getEnvironmentVariable('apiUrl');

  if (req.url.includes('assets/') || keycloak.url && req.url.includes(keycloak.url)) {
    return next(req);
  }
  if (req.url.includes('pseudo/')) {
    return authService.getAccessToken().pipe(
      mergeMap((accessToken) => next(req.clone({
        url: req.url.startsWith('http') ? req.url : `${apiUrl}${req.url}`,
        headers: req.headers.set('Authorization', `Bearer ${accessToken}`),
      })))
    );
  }
  return authService.getAccessToken(exchangeToClientId).pipe(
    mergeMap((accessToken) => next(req.clone({
      url: req.url.startsWith('fhir://')
        ? req.url.replace('fhir:/', fhirGatewayUrl)
        : apiUrl + req.url,
      headers: req.headers.set('Authorization', `Bearer ${accessToken}`),
    })))
  );
}
