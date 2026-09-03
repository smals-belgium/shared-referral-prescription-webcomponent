import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { combineLatest, map, Observable, of, switchMap } from 'rxjs';
import { USER_PROFILE_CLAIM_KEY } from '@reuse/code/services/auth/auth-constants';
import { ConfigurationService } from '@reuse/code/services/config/configuration.service';

export const impersonationHeaderInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const configService = inject(ConfigurationService);
  const apiUrl = configService.getEnvironmentVariable('apiUrl') as string;

  if (!req.url.startsWith(apiUrl)) {
    return next(req);
  }

  return authService.isOrganization().pipe(
    switchMap(isOrganization => (isOrganization ? getImpersonationContext(authService) : of(null))),
    map(impersonationContext =>
      impersonationContext
        ? req.clone({ headers: req.headers.set('X-Impersonation-Context', btoa(JSON.stringify(impersonationContext))) })
        : req
    ),
    switchMap(modifiedReq => next(modifiedReq))
  );
};

function getImpersonationContext(authService: AuthService): Observable<{ ssin?: string; discipline?: string } | null> {
  return combineLatest({
    ssin: authService.getClaims().pipe(map(claims => claims?.[USER_PROFILE_CLAIM_KEY].ssin)),
    discipline: authService.discipline(),
  });
}
