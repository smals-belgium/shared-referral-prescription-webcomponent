import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ApiErrorService } from '../services/helpers/api-error.service';
import { AlertService } from '../services/helpers/alert.service';
import { catchError, throwError } from 'rxjs';
import { SKIP_ERROR_HANDLING } from '../constants/error';

export const globalErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const apiErrorService = inject(ApiErrorService);
  const alertService = inject(AlertService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (req.context.get(SKIP_ERROR_HANDLING)) {
        return throwError(() => error);
      }

      const resolved = apiErrorService.resolve(error, req.body);
      alertService.showCurrentActiveAlert(resolved);

      return throwError(() => error); // rethrow so callers can still react if needed
    })
  );
};
