import { ErrorHandler } from '@angular/core';
import * as Sentry from '@sentry/angular';
import { ConfigurationService } from './configuration.service';

export function getErrorHandlerFromConfiguration(configurationService: ConfigurationService): ErrorHandler {
  if (configurationService.getEnvironmentVariable('enableSentry')) {
    Sentry.init({
      dsn: 'https://678a42e391e74c3cbacb323f10b1f4db@o452936.ingest.sentry.io/4504009911238656',
      tracesSampleRate: 0.1,
      environment: configurationService.getEnvironment(),
      release: '1.0.0'
    });
    return Sentry.createErrorHandler({showDialog: false});
  }
  return new ErrorHandler();
}
